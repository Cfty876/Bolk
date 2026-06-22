const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('demo123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'demo@vetlog.aqua' },
    update: {},
    create: {
      email: 'demo@vetlog.aqua',
      name: 'Demo User',
      password: hashedPassword,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'cfif251010@mail.ru' },
    update: { password: hashedPassword },
    create: {
      email: 'cfif251010@mail.ru',
      name: 'cfif251010',
      password: hashedPassword,
    },
  });

  // Cleanup old data to avoid duplicates if ran multiple times
  await prisma.sensor.deleteMany();
  await prisma.cage.deleteMany();

  const cage1 = await prisma.cage.create({
    data: {
      name: 'Садок #1 (Форель)',
      status: 'GOOD',
      fishCount: 15000,
      fishType: 'Форель',
      sensors: {
        create: [
          { type: 'TEMP', value: 14.5 },
          { type: 'O2', value: 8.2 },
          { type: 'PH', value: 7.1 },
        ],
      },
    },
  });

  const cage2 = await prisma.cage.create({
    data: {
      name: 'Садок #2 (Осетр)',
      status: 'WARNING',
      fishCount: 5000,
      fishType: 'Осетр',
      sensors: {
        create: [
          { type: 'TEMP', value: 16.2 },
          { type: 'O2', value: 6.8 }, // Низковато
          { type: 'PH', value: 7.4 },
        ],
      },
    },
  });

  console.log('Database seeded with user:', user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
  