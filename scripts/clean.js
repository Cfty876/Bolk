const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.employee.deleteMany({});
  console.log('All employees deleted');
}

main().finally(() => prisma.$disconnect());
