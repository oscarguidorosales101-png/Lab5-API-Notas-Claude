require('dotenv').config();
const prisma = require('../src/config/prisma');

async function main() {
  const tables = await prisma.$queryRawUnsafe('SHOW TABLES');
  console.log('TABLES IN NOTAS_LAB:', tables);
  await prisma.$disconnect();
}

main().catch(console.error);

