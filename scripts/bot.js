const { Telegraf, session } = require('telegraf');
const { bin } = require('cloudflared');
const { spawn } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const token = '8857940684:AAEK35WbZYpP73GWpUWiuC_9gpiSbCYVuUA';

(async () => {
  console.log('🚀 Запуск Cloudflare Tunnel...');
  
  const tunnel = spawn(bin, ['tunnel', '--url', 'http://localhost:3000']);
  let webAppUrl = '';

  tunnel.stderr.on('data', (data) => {
    const output = data.toString();
    const match = output.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    if (match && !webAppUrl) {
      webAppUrl = match[0] + '/tma.html';
      console.log(`✅ Туннель Cloudflare открыт: ${match[0]}`);
      startBot(webAppUrl);
    }
  });

  tunnel.on('close', (code) => {
    console.log(`❌ Туннель закрылся с кодом ${code}`);
  });

  function startBot(url) {
    const bot = new Telegraf(token);
    bot.use(session());

    bot.use((ctx, next) => {
      if (!ctx.session) ctx.session = {};
      return next();
    });

    bot.start(async (ctx) => {
      const telegramId = ctx.from.id.toString();
      const existing = await prisma.employee.findUnique({ where: { telegramId } });
      
      if (existing) {
        ctx.session.step = 'AUTHORIZED';
        bot.telegram.setChatMenuButton({
          chat_id: ctx.chat.id,
          menu_button: { type: 'web_app', text: 'AquaVisio App', web_app: { url: url } }
        }).catch(e => console.error(e));

        return ctx.replyWithHTML(`👋 С возвращением, <b>${existing.name}</b>!\n\nВаше устройство уже авторизовано. Нажмите кнопку ниже для доступа к системе.`, {
          reply_markup: { inline_keyboard: [[{ text: "📱 Открыть Mini App", web_app: { url: url } }]] }
        });
      }

      ctx.session.step = 'AWAITING_TOKEN';
      ctx.reply('👋 Добро пожаловать в систему Бульк!\n\nПожалуйста, отправьте ваш персональный токен доступа для входа:');
    });

    bot.on('text', async (ctx) => {
      const text = ctx.message.text.trim();
      const telegramId = ctx.from.id.toString();

      if (ctx.session.step === 'AWAITING_TOKEN') {
        const user = await prisma.user.findFirst({
          where: { tmaToken: text, isTmaEnabled: true }
        });

        if (!user) {
          return ctx.reply('❌ Неверный токен или доступ отключен в панели управления. Пожалуйста, проверьте и попробуйте еще раз.');
        }

        ctx.session.step = 'AWAITING_NAME';
        ctx.session.validToken = text;
        return ctx.reply('✅ Токен принят!\n\nПожалуйста, введите ваше имя (оно будет отображаться в системе):');
      }

      if (ctx.session.step === 'AWAITING_NAME') {
        if (text.length < 2) {
          return ctx.reply('Имя слишком короткое. Введите корректное имя:');
        }

        const user = await prisma.user.findFirst({
          where: { tmaToken: ctx.session.validToken, isTmaEnabled: true }
        });

        if (!user) {
          ctx.session.step = 'AWAITING_TOKEN';
          return ctx.reply('❌ Срок действия токена истек или он был сброшен. Начните сначала: /start');
        }

        await prisma.employee.create({
          data: {
            telegramId,
            name: text,
            userId: user.id
          }
        });

        ctx.session.step = 'AUTHORIZED';
        bot.telegram.setChatMenuButton({
          chat_id: ctx.chat.id,
          menu_button: { type: 'web_app', text: 'AquaVisio App', web_app: { url: url } }
        }).catch(e => console.error(e));

        return ctx.replyWithHTML(`🎉 Отлично, <b>${text}</b>! Вы успешно авторизованы.\n\nТеперь вы можете открыть мини-приложение:`, {
          reply_markup: { inline_keyboard: [[{ text: "📱 Открыть Mini App", web_app: { url: url } }]] }
        });
      }

      const existing = await prisma.employee.findUnique({ where: { telegramId } });
      if (existing) {
        return ctx.replyWithHTML(`Ваше устройство авторизовано.\nНажмите кнопку ниже для доступа.`, {
          reply_markup: { inline_keyboard: [[{ text: "📱 Открыть Mini App", web_app: { url: url } }]] }
        });
      } else {
        return ctx.reply('Введите /start для начала авторизации.');
      }
    });

    bot.launch();
    console.log('🤖 Чат-бот запущен с новой системой авторизации...');

    process.once('SIGINT', () => { bot.stop('SIGINT'); tunnel.kill(); });
    process.once('SIGTERM', () => { bot.stop('SIGTERM'); tunnel.kill(); });
  }

})();
