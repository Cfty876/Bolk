const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function startSimulation() {
  console.log("Начинаем симуляцию показаний 3-х тестовых датчиков...");
  
  // Создадим специальный тестовый садок для пользователя, если его нет
  let demoCage = await prisma.cage.findFirst({
    where: { name: "Садок (Мониторинг)" }
  });

  if (!demoCage) {
    demoCage = await prisma.cage.create({
      data: {
        name: "Садок (Мониторинг)",
        status: "GOOD",
        fishCount: 0,
        fishType: "Нерка",
        sensors: {
          create: [
            { type: "TEMP", value: 14.0 },
            { type: "O2", value: 8.5 },
            { type: "PH", value: 7.2 }
          ]
        }
      }
    });
  }

  const sensors = await prisma.sensor.findMany({
    where: { cageId: demoCage.id }
  });

  console.log("Датчики подключены. Генерируем данные...");

  // Бесконечный цикл генерации (или до остановки процесса)
  setInterval(async () => {
    for (const sensor of sensors) {
      // Генерируем небольшое колебание значения
      const jitter = (Math.random() - 0.5) * 0.4;
      const newValue = Math.max(0, sensor.value + jitter);
      
      await prisma.sensor.update({
        where: { id: sensor.id },
        data: { value: parseFloat(newValue.toFixed(2)) }
      });

      // Сохраняем историю
      await prisma.telemetry.create({
        data: {
          sensorId: sensor.id,
          value: parseFloat(newValue.toFixed(2))
        }
      });
    }
    console.log(`Обновлены показания датчиков: ${new Date().toLocaleTimeString()}`);
  }, 3000); // каждые 3 секунды
}

startSimulation().catch(console.error);
