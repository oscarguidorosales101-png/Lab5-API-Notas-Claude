const { PrismaClient } = require('@prisma/client');

// Determinar la URL de conexión según el entorno (base de desarrollo vs base aislada de pruebas)
const getDatabaseUrl = () => {
  if (process.env.NODE_ENV === 'test') {
    return process.env.TEST_DATABASE_URL || 'file:./test.db';
  }
  return process.env.DATABASE_URL || 'file:./dev.db';
};

let prisma;

if (!global.__prismaInstance) {
  global.__prismaInstance = new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl()
      }
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
  });
}

prisma = global.__prismaInstance;

module.exports = prisma;
