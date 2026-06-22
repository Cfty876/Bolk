'use server'
import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()
const TELEGRAM_BOT_TOKEN = '8857940684:AAEK35WbZYpP73GWpUWiuC_9gpiSbCYVuUA';

export async function broadcastTelegramNotification(message: string) {
  try {
    const users = await prisma.user.findMany({
      where: { isTmaEnabled: true, tmaNotifications: true },
      include: { employees: true }
    });
    
    for (const user of users) {
      for (const emp of user.employees) {
        if (emp.telegramId) {
          await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: emp.telegramId,
              text: message,
              parse_mode: 'HTML'
            })
          }).catch(e => console.error('Telegram API error:', e));
        }
      }
    }
  } catch (error) {
    console.error('Broadcast error:', error);
  }
}

// Cages
export async function getCages() {
  return await prisma.cage.findMany({ 
    include: { 
      fishes: true, 
      sensors: {
        include: {
          telemetry: {
            orderBy: { createdAt: 'desc' },
            take: 500
          }
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  })
}

export async function createCage(name: string, fishType: string) {
  const result = await prisma.cage.create({ 
    data: { name, fishType, status: 'В норме' } 
  })
  
  await broadcastTelegramNotification(`🌊 <b>Новый садок создан</b>\n\nНазвание: ${name}\nРыба: ${fishType}`);
  
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/cages')
  return result
}

export async function deleteCage(id: string) {
  await prisma.journalEntry.deleteMany({ where: { cageId: id } })
  await prisma.fishBatch.deleteMany({ where: { cageId: id } })
  await prisma.sensor.deleteMany({ where: { cageId: id } })
  
  const result = await prisma.cage.delete({ where: { id } })
  
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/cages')
  return result
}

// Sensors
export async function getSensors() {
  return await prisma.sensor.findMany({
    include: { cage: true },
    orderBy: { createdAt: 'desc' }
  })
}

import { randomUUID } from 'crypto'

export async function addSensor(cageId: string, type: string) {
  const secretToken = randomUUID()
  const result = await prisma.sensor.create({
    data: { cageId, type, value: 0.0, secretToken }
  })
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/sensors')
  return result
}

// Fishes
export async function getFishes() {
  return await prisma.fishBatch.findMany({ 
    include: { cage: true, weightLogs: { orderBy: { date: 'desc' }, take: 1 } },
    orderBy: { plantedAt: 'desc' }
  })
}

export async function createFish(cageId: string, species: string, quantity: number, avgWeight: number) {
  const result = await prisma.fishBatch.create({ 
    data: { cageId, species, quantity, avgWeight } 
  })
  revalidatePath('/dashboard/fish')
  revalidatePath('/dashboard/cages')
  return result
}

export async function updateFishBatch(id: string, cageId: string, species: string, quantity: number, mortalityReason?: string, isCorrection?: boolean) {
  const currentBatch = await prisma.fishBatch.findUnique({ where: { id } });
  
  const result = await prisma.fishBatch.update({
    where: { id },
    data: { cageId, species, quantity }
  })

  // Check if quantity decreased and it's not just a typo correction
  if (currentBatch && currentBatch.quantity > quantity && !isCorrection) {
    const diff = currentBatch.quantity - quantity;
    await prisma.journalEntry.create({
      data: {
        type: 'MORTALITY',
        title: 'Падеж зафиксирован при инвентаризации',
        description: `Падеж: ${diff} шт. Причина: ${mortalityReason || 'Не указана'}`,
        cageId: currentBatch.cageId
      }
    });
    
    await broadcastTelegramNotification(`⚠️ <b>Зафиксирован падеж рыбы!</b>\n\nСадок: ${currentBatch.cageId} (batch ${currentBatch.id})\nКоличество: ${diff} шт.\nПричина: ${mortalityReason || 'Не указана'}`);
  }

  revalidatePath('/dashboard/fish')
  revalidatePath('/dashboard/cages')
  return result
}

export async function deleteFishBatch(id: string) {
  await prisma.weightLog.deleteMany({ where: { batchId: id } })
  const result = await prisma.fishBatch.delete({ where: { id } })
  revalidatePath('/dashboard/fish')
  revalidatePath('/dashboard/cages')
  return result
}

export async function releaseFishBatch(id: string, releaseRiver: string, riverTemp: number, tagSequence: string) {
  const result = await prisma.fishBatch.update({
    where: { id },
    data: {
      status: 'RELEASED',
      releasedAt: new Date(),
      releaseRiver,
      riverTemp,
      tagSequence
    }
  })
  
  // Создаем системную запись в журнале о выпуске
  const cage = await prisma.cage.findUnique({ where: { id: result.cageId } })
  await prisma.journalEntry.create({
    data: {
      type: 'INSPECTION',
      title: 'Выпуск в природу (Conservation)',
      description: `Партия ${result.species} (${result.quantity} шт) выпущена в ${releaseRiver}. Температура реки: ${riverTemp}°C. Серия меток: ${tagSequence || 'Нет'}.`,
      cageId: cage?.id
    }
  })
  
  revalidatePath('/dashboard/fish')
  revalidatePath('/dashboard')
  return result
}

// Journal
export async function getJournalEntries() {
  return await prisma.journalEntry.findMany({ 
    include: { cage: true }, 
    orderBy: { createdAt: 'desc' } 
  })
}

export async function deleteJournalEntry(id: string) {
  await prisma.journalEntry.delete({ where: { id } })
  revalidatePath('/dashboard/journal')
  return { success: true }
}

export async function createJournalEntry(
  cageId: string | null, 
  type: string, 
  title: string, 
  description: string,
  foodType?: string,
  amountKg?: number,
  mortalityQty?: number
) {
  let finalTitle = title;
  let finalDesc = description;

  if (type === 'FEEDING' && foodType && amountKg) {
    finalTitle = `Кормление: ${foodType}`;
    finalDesc = `Выдано: ${amountKg} кг.\n${description}`;
    
    if (cageId && amountKg > 0) {
      await prisma.feedLog.create({
        data: { cageId, amountKg: Number(amountKg) }
      });
    }
  }

  if (mortalityQty && mortalityQty > 0) {
    finalDesc += `\nПадеж: ${mortalityQty} шт.`;
  }

  const result = await prisma.journalEntry.create({ 
    data: { 
      cageId: cageId || undefined, 
      type, 
      title: finalTitle, 
      description: finalDesc 
    } 
  })
  revalidatePath('/dashboard/journal')
  return result
}

// Reports
export async function saveReportToServer(base64Data: string, filename: string) {
  const reportsDir = path.join(process.cwd(), 'public', 'reports')
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true })
  }
  const filePath = path.join(reportsDir, filename)
  const buffer = Buffer.from(base64Data.split(',')[1] || base64Data, 'base64')
  fs.writeFileSync(filePath, buffer)
  return { success: true, url: `/reports/${filename}` }
}

export async function getSavedReports() {
  const reportsDir = path.join(process.cwd(), 'public', 'reports')
  if (!fs.existsSync(reportsDir)) {
    return []
  }
  const files = fs.readdirSync(reportsDir)
  const reports = files.filter(f => f.endsWith('.pdf')).map(f => {
    const stat = fs.statSync(path.join(reportsDir, f))
    return {
      name: f,
      date: stat.mtime.toLocaleString('ru-RU'),
      timestamp: stat.mtimeMs,
      url: `/reports/${f}`
    }
  })
  return reports.sort((a, b) => b.timestamp - a.timestamp)
}

export async function deleteReport(filename: string) {
  const reportsDir = path.join(process.cwd(), 'public', 'reports')
  const filePath = path.join(reportsDir, filename)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
  return { success: true }
}

// Task Scheduler & Records
export async function createTaskSchedule(
  cageId: string, type: string, frequency: string, time: string, 
  date: string | null, dayOfWeek: number | null, 
  title: string | null, desc: string | null, 
  foodType: string | null, amountKg: number | null
) {
  let parsedDate = null
  if (date) {
    const [y, m, d] = date.split('-').map(Number)
    parsedDate = new Date(Date.UTC(y, m - 1, d))
  }

  const result = await prisma.taskSchedule.create({
    data: { 
      cageId, type, frequency, time, 
      date: parsedDate, dayOfWeek, 
      title, desc, foodType, amountKg 
    }
  })
  
  const typeText = type === 'FEEDING' ? 'Кормление' : type === 'VET' ? 'Вет. осмотр' : 'Инспекция';
  await broadcastTelegramNotification(`📅 <b>Новая задача запланирована</b>\n\nТип: ${typeText}\nВремя: ${time}\nСадок: ${cageId}`);
  
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/journal')
  return result
}

export async function deleteTaskSchedule(scheduleId: string) {
  await prisma.feedLog.deleteMany({ where: { scheduleId } })
  await prisma.taskSchedule.delete({ where: { id: scheduleId } })
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/journal')
  return { success: true }
}

export async function getTodayTasks() {
  const schedules = await prisma.taskSchedule.findMany({
    include: { cage: true, records: true } // Fetch all records to properly check status
  })

  const now = new Date()
  
  // Date boundary safely in UTC format
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const todayDateOnlyStr = `${y}-${m}-${d}`

  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const currentDayOfWeek = now.getDay() // 0-6 (Sun-Sat)

  const todayTasks = schedules.filter(s => {
    // Check if there is a record for today with status CANCELLED
    const cancelledToday = s.records.some(r => {
      const recDate = new Date(r.date)
      return r.status === 'CANCELLED' && recDate.toISOString().split('T')[0] === todayDateOnlyStr
    })
    if (cancelledToday) return false // Skip if cancelled

    if (s.frequency === 'DAILY') return true
    if (s.frequency === 'WEEKLY' && s.dayOfWeek === currentDayOfWeek) return true
    if (s.frequency === 'ONCE' && s.date) {
      return s.date.toISOString().split('T')[0] === todayDateOnlyStr
    }
    return false
  })

  return todayTasks.map(s => {
    const isCompletedToday = s.records.some(r => {
      const recDate = new Date(r.date)
      return r.status === 'COMPLETED' && recDate.toISOString().split('T')[0] === todayDateOnlyStr
    })
    
    const [h, min] = s.time.split(':').map(Number)
    const scheduleMinutes = h * 60 + min

    let status = 'PENDING'
    if (isCompletedToday) {
      status = 'COMPLETED'
    } else if (currentMinutes > scheduleMinutes + 60) {
      status = 'MISSED' // Missed by more than 60 minutes
    }

    return {
      id: s.id,
      cageId: s.cageId,
      cageName: s.cage.name,
      type: s.type,
      frequency: s.frequency,
      time: s.time,
      title: s.title,
      desc: s.desc,
      foodType: s.foodType,
      amountKg: s.amountKg,
      status
    }
  }).sort((a, b) => a.time.localeCompare(b.time))
}

export async function markTaskComplete(scheduleId: string, mortalityQty?: number, mortalityReason?: string) {
  const now = new Date()
  
  const schedule = await prisma.taskSchedule.findUnique({ where: { id: scheduleId } })
  if (!schedule) throw new Error("Задача не найдена")

  const todayRecords = await prisma.taskRecord.findMany({
    where: { scheduleId }
  })
  const dateOnlyStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const alreadyCompleted = todayRecords.some(r => {
    const recDate = new Date(r.date)
    return recDate.toISOString().split('T')[0] === dateOnlyStr
  })

  if (alreadyCompleted) throw new Error("Эта задача уже отмечена на сегодня")

  const dateOnly = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))

  await prisma.taskRecord.create({
    data: {
      scheduleId,
      date: dateOnly,
      status: 'COMPLETED'
    }
  })

  let jTitle = schedule.title || 'Выполнение задачи'
  let jDesc = schedule.desc || ''
  
  if (schedule.type === 'FEEDING') {
    jTitle = 'Кормление по расписанию'
    jDesc = `Покормлено: ${schedule.foodType}, ${schedule.amountKg} кг.`
    
    if (schedule.amountKg && schedule.amountKg > 0) {
      await addFeedLog(schedule.cageId, schedule.amountKg, schedule.id);
    }
  }

  await prisma.journalEntry.create({
    data: {
      type: schedule.type,
      title: jTitle,
      description: jDesc,
      cageId: schedule.cageId
    }
  })

  if (mortalityQty && mortalityQty > 0) {
    await prisma.journalEntry.create({
      data: {
        type: 'MORTALITY',
        title: 'Падеж при осмотре',
        description: `Падеж: ${mortalityQty} шт. Причина: ${mortalityReason || 'Не указана'}`,
        cageId: schedule.cageId
      }
    });
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/calendar')
  revalidatePath('/dashboard/journal')
  return true
}

export async function cancelTaskForDay(scheduleId: string, dateStr: string) {
  // dateStr format: YYYY-MM-DD
  const [y, m, d] = dateStr.split('-').map(Number)
  const dateOnly = new Date(Date.UTC(y, m - 1, d))

  await prisma.taskRecord.upsert({
    where: {
      scheduleId_date: {
        scheduleId,
        date: dateOnly
      }
    },
    update: {
      status: 'CANCELLED'
    },
    create: {
      scheduleId,
      date: dateOnly,
      status: 'CANCELLED'
    }
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/journal')
  revalidatePath('/dashboard/calendar')
  return { success: true }
}

export async function getTasksForMonth(year: number, month: number) {
  // month is 1-indexed (1 = Jan, 12 = Dec)
  const schedules = await prisma.taskSchedule.findMany({
    include: { cage: true, records: true }
  })

  const daysInMonth = new Date(year, month, 0).getDate()
  const days = []

  const now = new Date()
  const currentY = now.getFullYear()
  const currentM = now.getMonth() + 1
  const currentD = now.getDate()
  const todayStr = `${currentY}-${String(currentM).padStart(2, '0')}-${String(currentD).padStart(2, '0')}`

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month - 1, d)
    const dayOfWeek = dateObj.getDay()
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`

    // Determine tasks for this day
    const tasksForDay = schedules.filter(s => {
      if (s.frequency === 'DAILY') return true
      if (s.frequency === 'WEEKLY' && s.dayOfWeek === dayOfWeek) return true
      if (s.frequency === 'ONCE' && s.date) {
        return s.date.toISOString().split('T')[0] === dateStr
      }
      return false
    }).map(s => {
      // Check records
      const record = s.records.find(r => new Date(r.date).toISOString().split('T')[0] === dateStr)
      let status = 'PENDING'
      if (record) {
        status = record.status // COMPLETED or CANCELLED
      } else {
        // If it's a past date and no record -> MISSED
        // Compare dates purely by string YYYY-MM-DD
        if (dateStr < todayStr) {
          status = 'MISSED'
        }
      }

      return {
        id: s.id,
        cageId: s.cageId,
        cageName: s.cage.name,
        type: s.type,
        time: s.time,
        title: s.title,
        desc: s.desc,
        foodType: s.foodType,
        amountKg: s.amountKg,
        status,
        dateStr
      }
    }).sort((a, b) => a.time.localeCompare(b.time))

    days.push({
      dateStr,
      day: d,
      tasks: tasksForDay
    })
  }

  return days
}

// Alerts
export async function getAlerts() {
  return await prisma.alert.findMany({
    where: { resolved: false },
    orderBy: { createdAt: 'desc' }
  })
}

export async function resolveAlert(id: string) {
  await prisma.alert.update({
    where: { id },
    data: { resolved: true }
  })
}

// User Settings
export async function getUserSettings(email: string) {
  if (!email) return null;
  return await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      isTmaEnabled: true,
      notifyO2: true,
      allowAiVideo: true,
      autoWeeklyReport: true,
      ecoTargetRelease: true,
      ecoReleasedCount: true,
      isEcoPublic: true,
      minO2Threshold: true,
      minTempThreshold: true,
      maxTempThreshold: true,
      tmaNotifications: true,
      tmaAllowJournals: true,
      tmaAllowCages: true,
      tmaAllowSchedule: true,
      tmaToken: true
    }
  });
}

export async function updateUserSettings(email: string, data: any) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw new Error('Пользователь не найден')
  
  return await prisma.user.update({
    where: { email },
    data: {
      name: data.name ?? user.name,
      notifyO2: data.notifyO2 ?? user.notifyO2,
      allowAiVideo: data.allowAiVideo ?? user.allowAiVideo,
      autoWeeklyReport: data.autoWeeklyReport ?? user.autoWeeklyReport,
      ecoTargetRelease: data.ecoTargetRelease ?? user.ecoTargetRelease,
      ecoReleasedCount: data.ecoReleasedCount ?? user.ecoReleasedCount,
      isEcoPublic: data.isEcoPublic ?? user.isEcoPublic,
      minO2Threshold: data.minO2Threshold ?? user.minO2Threshold,
      minTempThreshold: data.minTempThreshold ?? user.minTempThreshold,
      maxTempThreshold: data.maxTempThreshold ?? user.maxTempThreshold,
      isTmaEnabled: data.isTmaEnabled ?? user.isTmaEnabled,
      tmaAllowJournals: data.tmaAllowJournals ?? user.tmaAllowJournals,
      tmaAllowCages: data.tmaAllowCages ?? user.tmaAllowCages,
      tmaAllowSchedule: data.tmaAllowSchedule ?? user.tmaAllowSchedule,
      tmaNotifications: data.tmaNotifications ?? user.tmaNotifications
    }
  });
}

// Public Eco-Widget
export async function getPublicEcoWidgetData(id: string) {
  if (!id) return null;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      name: true,
      ecoTargetRelease: true,
      ecoReleasedCount: true,
      isEcoPublic: true
    }
  });
  
  if (!user || !user.isEcoPublic) return null;
  return user;
}

// Analytics: Mortality for the week
export async function getMortalityForWeek(cageId?: string) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0,0,0,0);

  const whereClause: any = {
    type: 'MORTALITY',
    createdAt: { gte: sevenDaysAgo }
  };
  
  if (cageId && cageId !== 'all') {
    whereClause.cageId = cageId;
  }

  const logs = await prisma.journalEntry.findMany({
    where: whereClause
  });

  const daysOfWeek = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const resultMap = new Map();
  
  // Initialize last 7 days
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    resultMap.set(daysOfWeek[d.getDay()], 0);
  }

  logs.forEach(log => {
    // Parse quantity from description e.g., "Падеж: 15 шт."
    const match = log.description.match(/(\d+)/);
    const qty = match ? parseInt(match[1]) : 1;
    const dayName = daysOfWeek[log.createdAt.getDay()];
    if (resultMap.has(dayName)) {
      resultMap.set(dayName, resultMap.get(dayName) + qty);
    }
  });

  // Convert Map to ordered array matching initialized sequence
  const resultData = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const dayName = daysOfWeek[d.getDay()];
    resultData.push({ day: dayName, value: resultMap.get(dayName) });
  }

  return resultData;
}

// OpenRouter AI Reporting
export async function generateAIReport(topic: string = 'general', modelName: string = "google/gemma-4-31b-it:free") {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
  if (!OPENROUTER_API_KEY) throw new Error('API ключ OpenRouter не настроен')

  const [cages, journals, alerts, todayTasks] = await Promise.all([
    prisma.cage.findMany({
      include: { fishes: true, sensors: { include: { telemetry: { orderBy: { createdAt: 'desc' }, take: 20 } } } }
    }),
    getJournalEntries(),
    getAlerts(),
    getTodayTasks()
  ]);

  const missedTasks = todayTasks.filter(t => t.status === 'MISSED')
  
  let missedTasksAlert = ''
  if (missedTasks.length > 0) {
    missedTasksAlert = `\n[ВНИМАНИЕ! КРИТИЧЕСКОЕ НАРУШЕНИЕ РАСПИСАНИЯ]
Сегодня пропущено выполнение следующих задач (просрочено более чем на 1 час):
${missedTasks.map(t => `- Садок: ${t.cageName}, Тип: ${t.type}, Время: ${t.time}`).join('\n')}
ОБЯЗАТЕЛЬНО упомяните это в отчете и сгенерируйте CRITICAL Alert для персонала!\n`
  }

  // Ограничиваем контекст в зависимости от темы, чтобы ИИ физически не мог отвлекаться
  const context: any = {};
  
  if (topic === 'general') {
    context.cages = cages.map(c => ({
      name: c.name,
      status: c.status,
      fish: c.fishes.map(f => ({ species: f.species, qty: f.quantity, avgWeight: f.avgWeight, status: f.status, plantedAt: f.plantedAt, releasedAt: f.releasedAt, riverTemp: f.riverTemp })),
      sensors: c.sensors.map(s => ({ 
        type: s.type, 
        lastValue: s.value,
        recentTrend: s.telemetry?.map((t:any) => t.value).join(', ') || 'Нет данных'
      }))
    }));
    context.recentJournals = journals.slice(0, 5).map(j => ({ type: j.type, title: j.title, desc: j.description }));
    context.tasksScheduleToday = todayTasks.map(t => ({
      cage: t.cageName,
      time: t.time,
      type: t.type,
      status: t.status === 'MISSED' ? 'ПРОПУЩЕНО!' : t.status === 'COMPLETED' ? 'Выполнено' : 'Ожидает'
    }));
    context.activeAlerts = alerts;
    if (missedTasksAlert) context.missedTasksAlert = missedTasksAlert;
  } else if (topic === 'Биомасса и Кормление') {
    context.cages = cages.map(c => ({
      name: c.name,
      fish: c.fishes.map(f => ({ species: f.species, qty: f.quantity, avgWeight: f.avgWeight }))
    }));
    context.recentJournals = journals.filter(j => j.type === 'FEEDING').map(j => ({ type: j.type, title: j.title, desc: j.description }));
  } else if (topic === 'Ветеринария и Здоровье') {
    context.cages = cages.map(c => ({ name: c.name, status: c.status }));
    context.recentJournals = journals.filter(j => j.type === 'VET').map(j => ({ type: j.type, title: j.title, desc: j.description }));
    context.activeAlerts = alerts;
  } else if (topic === 'Качество воды') {
    context.cages = cages.map(c => ({
      name: c.name,
      sensors: c.sensors.map(s => ({ type: s.type, lastValue: s.value }))
    }));
    context.activeAlerts = alerts.filter(a => a.message.includes('Температура') || a.message.includes('O2') || a.message.includes('pH'));
  } else if (topic === 'Оценка работы персонала') {
    context.tasksScheduleToday = todayTasks.map(t => ({
      cage: t.cageName,
      time: t.time,
      type: t.type,
      status: t.status === 'MISSED' ? 'ПРОПУЩЕНО!' : t.status === 'COMPLETED' ? 'Выполнено' : 'Ожидает'
    }));
    context.recentJournals = journals.map(j => ({ type: j.type, title: j.title, desc: j.description }));
    if (missedTasksAlert) context.missedTasksAlert = missedTasksAlert;
  }

  let topicInstruction = "Сделай общий комплексный анализ всей фермы.";
  let specificRequirements = "Выведи общую информацию по всем направлениям: биомасса, вода, персонал.";
  let isGeneral = true;
  
  if (topic === 'Биомасса и Кормление') {
    isGeneral = false;
    topicInstruction = "СТРОГО ТОЛЬКО Биомасса, рост рыбы и эффективность кормления. Игнорируй другие темы.";
    specificRequirements = "Рассчитай примерный кормовой коэффициент (FCR). Оцени плотность посадки и темпы роста.";
  } else if (topic === 'Ветеринария и Здоровье') {
    isGeneral = false;
    topicInstruction = "СТРОГО ТОЛЬКО здоровье рыбы, ветеринарные записи и качество воды. Игнорируй кормление.";
    specificRequirements = "Проанализируй риски заболеваний, стресса и смертности исходя из параметров воды и журнала.";
  } else if (topic === 'Качество воды') {
    isGeneral = false;
    topicInstruction = "СТРОГО ТОЛЬКО показания датчиков (O2, Temp, pH).";
    specificRequirements = "Проверь, соответствуют ли показатели норме для лососевых/осетровых. Выяви потенциальные угрозы заморных явлений.";
  } else if (topic === 'Оценка работы персонала') {
    isGeneral = false;
    topicInstruction = "СТРОГО ТОЛЬКО выполнение расписания и дисциплина персонала.";
    specificRequirements = "Жестко проанализируй пропущенные задачи (MISSED) и соблюдение графика. Если есть пропуски - критикуй персонал.";
  }

  let lengthInstruction = isGeneral 
    ? "ОЧЕНЬ ДЛИННЫЙ текст (минимум 2-3 больших абзаца). Развернутая аналитика, конкретные цифры из ДАННЫХ, детальные выводы и четкие рекомендации. Не скупись на слова, пиши профессионально и объемно."
    : "КРАТКИЙ И ЕМКИЙ текст (1-2 небольших абзаца). Только самая суть по выбранной узкой теме без лишней воды.";

  let sectionRules = isGeneral
    ? "1. В массиве `sections` должно быть ровно 4 или 5 блоков.\n2. В каждом блоке `content` должно быть ОЧЕНЬ МНОГО текста (не менее 600 символов на блок), расписывай каждую мелочь из данных."
    : `1. В массиве \`sections\` должно быть ровно 2 или 3 блока.\n2. ЖЕСТКОЕ ПРАВИЛО: Ты НЕ ИМЕЕШЬ ПРАВА упоминать другие темы. Если тема — персонал, не пиши про воду. Если тема — вода, не пиши про персонал.\n3. В каждом блоке \`content\` пиши строго по указанной узкой теме.`;

  const prompt = `Ты — Главный ИИ-Аналитик рыбного хозяйства.
Твоя задача — провести анализ сырых данных и выдать отчет в формате JSON.

ОСОБЫЕ ПРАВИЛА СОЦИАЛЬНОЙ ПРОГРАММЫ (Conservation Aquaculture):
1. **Мониторинг готовности к выпуску (Smoltification):** Внимательно смотри на статус партий (fish.status). Если статус "RELEASED", проверь разницу между \`releasedAt\` and \`plantedAt\`. Для "Нерка" если разница меньше 90 дней или вес меньше 20 грамм — это КРИТИЧЕСКАЯ ошибка (аномально ранний выпуск). Обязательно сгенерируй CRITICAL alert: "Малек не готов к дикой природе!".
2. **Температурный шок:** Если при выпуске указана \`riverTemp\`, проверь, отличается ли она от температуры садка (последнее значение датчика Temp) более чем на 3 градуса. Если да — это температурный шок.
3. **Строгий Контроль Смертности:** Если в журнале есть записи с типом "MORTALITY", ВНИМАТЕЛЬНО изучи причину в описании (description). Ищи паттерны (например, повторение одной и той же причины). Если причина связана с инфекцией или температурой — генерируй CRITICAL Alert с ветеринарными рекомендациями. Это супер важно для выживания популяции нерки.

АБСОЛЮТНЫЙ ПРИОРИТЕТ ТЕМЫ: ${topicInstruction}
СПЕЦИФИЧЕСКИЕ ТРЕБОВАНИЯ: ${specificRequirements}

ДАННЫЕ: 
${JSON.stringify(context)}

ТРЕБОВАНИЯ К ФОРМАТУ JSON:
{
  "executiveSummary": "Выжимка (1-2 предложения).",
  "sections": [
    {
      "title": "Название блока",
      "icon": "Lucide icon name (напр. 'Activity', 'AlertTriangle', 'Fish', 'Droplets', 'UserCheck')",
      "content": "${lengthInstruction}"
    }
  ],
  "chartData": [
    {"name": "Показатель 1", "value": 1500},
    {"name": "Показатель 2", "value": 2200}
  ],
  "chartLabel": "Название графика",
  "alerts": [
    {"message": "Текст критической проблемы (если есть)", "severity": "WARNING или CRITICAL"}
  ]
}

ПРАВИЛА (СТРОГО):
${sectionRules}
3. Верни ТОЛЬКО валидный JSON без маркдауна и других текстов. Проверь чтобы не было лишних запятых и закрывающих скобок внутри текста.`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 seconds timeout

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Vetlog Aqua AI Analyst"
      },
      body: JSON.stringify({
        "model": modelName,
        "response_format": { "type": "json_object" },
        "messages": [
          {"role": "user", "content": prompt}
        ]
      })
    });

    clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Модель недоступна: ${errText}`);
      }

      const resJson = await response.json();
      
      if (!resJson.choices || resJson.choices.length === 0) {
        throw new Error("Пустой ответ от нейросети (перегрузка)");
      }

      const textContent = resJson.choices[0].message.content;
      
      let cleanedText = textContent.replace(/```json/gi, '').replace(/```/g, '').trim();
      
      // Найти начало и конец JSON-объекта, если модель добавила лишний текст
      const firstBrace = cleanedText.indexOf('{');
      const lastBrace = cleanedText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
      }
      
      let parsed = JSON.parse(cleanedText);
      
      if (!parsed.sections && parsed.report) parsed = parsed.report;
      if (!parsed.sections && parsed.response) parsed = parsed.response;
      if (!parsed.sections && parsed.data) parsed = parsed.data;

      if (!parsed.sections || !Array.isArray(parsed.sections) || parsed.sections.length === 0) {
        throw new Error("Нейросеть вернула неверный формат (нет секций)");
      }
      
      const finalData = {
        executiveSummary: parsed.executiveSummary || parsed.summary || parsed.reportText || "Выводы отсутствуют",
        sections: parsed.sections,
        chartData: parsed.chartData || parsed.chart_data || [],
        chartLabel: parsed.chartLabel || parsed.chart_label || "Аналитика",
        alerts: parsed.alerts || []
      };
      
      // Save any generated alerts to DB automatically
      if (finalData.alerts && finalData.alerts.length > 0) {
        for (const alert of finalData.alerts) {
          await prisma.alert.create({
            data: {
              message: alert.message || "Неизвестная проблема",
              severity: alert.severity || 'WARNING'
            }
          })
        }
        revalidatePath('/dashboard') // Update notifications globally
      }
      
      return finalData;

  } catch (err: any) {
    console.warn(`[OpenRouter] Ошибка при запросе к ${modelName}:`, err.message);
    return { error: err.message };
  }
}

// Global Search
export async function globalSearch(query: string) {
  if (!query || query.trim().length === 0) return { cages: [], fishes: [], journals: [], pages: [] };
  
  const q = query.toLowerCase();

  // Pages
  const pages = [
    { name: 'Главная', path: '/dashboard' },
    { name: 'Садки', path: '/dashboard/cages' },
    { name: 'Рыба', path: '/dashboard/fish' },
    { name: 'Аналитика', path: '/dashboard/analytics' },
    { name: 'Датчики', path: '/dashboard/sensors' },
    { name: 'Журнал', path: '/dashboard/journal' },
    { name: 'Отчёты', path: '/dashboard/reports' },
    { name: 'Настройки', path: '/dashboard/settings' },
  ].filter(p => p.name.toLowerCase().includes(q));

  // Cages
  const cages = await prisma.cage.findMany({
    where: { name: { contains: query, mode: 'insensitive' } },
    take: 3,
    select: { id: true, name: true, status: true }
  });

  // Fishes
  const fishes = await prisma.fishBatch.findMany({
    where: { species: { contains: query, mode: 'insensitive' } },
    take: 3,
    select: { id: true, species: true, quantity: true, cage: { select: { name: true } } }
  });

  // Journals
  const journals = await prisma.journalEntry.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ]
    },
    take: 3,
    select: { id: true, title: true, type: true }
  });

  return { cages, fishes, journals, pages };
}

// Feed & Weight Logs
export async function addFeedLog(cageId: string, amountKg: number, scheduleId?: string) {
  const result = await prisma.feedLog.create({ data: { cageId, amountKg, scheduleId } });
  
  // Create a journal entry automatically
  const cage = await prisma.cage.findUnique({where: {id: cageId}});
  if (cage) {
     await prisma.journalEntry.create({
       data: {
         type: 'FEEDING',
         title: `Кормление (${amountKg} кг)`,
         description: `Внесено ${amountKg} кг корма в садок ${cage.name}`,
         cageId: cage.id
       }
     });
  }
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/fish');
  return result;
}

export async function addWeightLog(batchId: string, avgWeight: number) {
  const result = await prisma.weightLog.create({ data: { batchId, avgWeight } });
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/fish');
  return result;
}

export async function getFCRData() {
  const cages = await prisma.cage.findMany({
    include: {
      fishes: {
        include: { weightLogs: { orderBy: { date: 'desc' }, take: 1 } }
      },
      feedLogs: true
    }
  });

  let totalFCR = 0;
  let cagesWithFCR = 0;

  for (const cage of cages) {
    if (cage.fishes.length === 0) continue;
    const batch = cage.fishes[0];
    const initialBiomass = (batch.avgWeight * batch.quantity) / 1000;
    
    let currentBiomass = initialBiomass;
    if (batch.weightLogs && batch.weightLogs.length > 0) {
      currentBiomass = (batch.weightLogs[0].avgWeight * batch.quantity) / 1000;
    }
    
    const weightGain = currentBiomass - initialBiomass;
    const totalFeed = cage.feedLogs.reduce((sum, log) => sum + log.amountKg, 0);

    if (weightGain > 0 && totalFeed > 0) {
       totalFCR += (totalFeed / weightGain);
       cagesWithFCR++;
    }
  }

  if (cagesWithFCR === 0) return null;
  return (totalFCR / cagesWithFCR).toFixed(2);
}

export async function getBatchFCR(batchId: string) {
   const batch = await prisma.fishBatch.findUnique({
      where: { id: batchId },
      include: { weightLogs: { orderBy: { date: 'desc' }, take: 1 }, cage: { include: { feedLogs: true } } }
   });
   
   if (!batch) return "-";
   
   const initialBiomass = (batch.avgWeight * batch.quantity) / 1000;
   let currentBiomass = initialBiomass;
   if (batch.weightLogs && batch.weightLogs.length > 0) {
     currentBiomass = (batch.weightLogs[0].avgWeight * batch.quantity) / 1000;
   }
   
   const weightGain = currentBiomass - initialBiomass;
   const totalFeed = batch.cage?.feedLogs.filter(log => new Date(log.date) >= new Date(batch.plantedAt)).reduce((sum, log) => sum + log.amountKg, 0) || 0;
   
   if (weightGain > 0 && totalFeed > 0) {
      return (totalFeed / weightGain).toFixed(2);
   }
   
   return "-";
}

// --- TMA AUTHORIZATION ---
export async function generateTmaToken(email: string) {
  const token = Math.random().toString(36).substring(2, 8).toUpperCase();
  await prisma.user.update({
    where: { email },
    data: { tmaToken: token }
  });
  revalidatePath('/dashboard/settings');
  return token;
}

export async function getTmaUsers() {
  try {
    return await prisma.employee.findMany({
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error("Error fetching TMA users:", error);
    return [];
  }
}

export async function deleteTmaUser(id: string) {
  try {
    await prisma.employee.delete({ where: { id } });
    revalidatePath('/dashboard/settings');
  } catch (error) {
    console.error("Error deleting TMA user:", error);
    throw new Error('Failed to delete user');
  }
}
