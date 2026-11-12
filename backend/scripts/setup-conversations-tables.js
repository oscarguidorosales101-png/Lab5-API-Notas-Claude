require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function createTablesFor(dbUrl, dbName) {
  console.log(`Configurando tablas de conversaciones en: ${dbName}...`);
  const prisma = new PrismaClient({
    datasources: { db: { url: dbUrl } }
  });

  try {
    await prisma.$connect();

    // 1. Crear tabla conversation
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`conversation\` (
        \`id\` VARCHAR(36) NOT NULL,
        \`titulo\` VARCHAR(150) NOT NULL DEFAULT 'Nueva conversación',
        \`userId\` INT NOT NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        INDEX \`idx_conversation_userid\` (\`userId\`),
        CONSTRAINT \`fk_conversation_user\` FOREIGN KEY (\`userId\`) REFERENCES \`user\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log(`  -> Tabla 'conversation' lista en ${dbName}`);

    // 2. Crear tabla message
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`message\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`conversacionId\` VARCHAR(36) NOT NULL,
        \`role\` VARCHAR(20) NOT NULL,
        \`content\` TEXT NOT NULL,
        \`tokens\` INT NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        INDEX \`idx_message_conversacionid\` (\`conversacionId\`),
        CONSTRAINT \`fk_message_conversation\` FOREIGN KEY (\`conversacionId\`) REFERENCES \`conversation\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log(`  -> Tabla 'message' lista en ${dbName}`);

  } catch (err) {
    console.error(`Error en ${dbName}:`, err.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const devUrl = process.env.DATABASE_URL || 'mysql://root:root@localhost:3306/Notas_lab';
  const testUrl = process.env.TEST_DATABASE_URL || 'mysql://root:root@localhost:3306/Notas_lab_test';

  await createTablesFor(devUrl, 'Notas_lab');
  await createTablesFor(testUrl, 'Notas_lab_test');
  console.log('Operación completada.');
}

main().catch(console.error);

