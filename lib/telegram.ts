import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const TELEGRAM_BOT_TOKEN = '8857940684:AAEK35WbZYpP73GWpUWiuC_9gpiSbCYVuUA'

export async function sendTelegramNotification(message: string) {
  try {
    // 1. Find all employees who have a linked Telegram ID
    const employees = await prisma.employee.findMany({
      where: { telegramId: { not: null } }
    })

    if (employees.length === 0) {
      console.log('No employees with Telegram ID linked.')
      return false
    }

    // 2. Send message to all of them
    const promises = employees.map(emp => {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
      return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: emp.telegramId,
          text: `🚨 <b>Уведомление AquaVisio:</b>\n\n${message}`,
          parse_mode: 'HTML'
        })
      }).then(res => res.json())
        .then(data => {
          if(!data.ok) console.error('Telegram API Error:', data.description)
        })
        .catch(err => console.error('Failed to send to Telegram:', err))
    })

    await Promise.all(promises)
    return true

  } catch (e) {
    console.error('sendTelegramNotification error:', e)
    return false
  }
}
