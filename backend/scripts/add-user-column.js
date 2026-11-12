require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function run() {
  const prismaDev = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
  const prismaTest = new PrismaClient({ datasources: { db: { url: process.env.TEST_DATABASE_URL } } });

  for (const [name, p] of [['Notas_lab', prismaDev], ['Notas_lab_test', prismaTest]]) {
    try {
      await p.$connect();
      // Comprobar si la columna ya existe
      const cols = await p.$queryRawUnsafe(`SHOW COLUMNS FROM aiusage LIKE 'userId'`);
      if (cols.length === 0) {
        await p.$executeRawUnsafe(`ALTER TABLE aiusage ADD COLUMN userId INT NULL, ADD INDEX idx_aiusage_userid (userId)`);
        console.log(`✅ Columna userId añadida a tabla aiusage en ${name}`);
      } else {
        console.log(`ℹ️ Columna userId ya existe en aiusage en ${name}`);
      }
    } catch (e) {
      console.error(`Error en ${name}:`, e.message);
    } finally {
      await p.$disconnect();
    }
  }
}

run();

