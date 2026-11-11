const { PrismaClient } = require('@prisma/client');

// Determinar la URL de conexión según el entorno (base de desarrollo vs base aislada de pruebas)
const getDatabaseUrl = () => {
  if (process.env.NODE_ENV === 'test') {
    return process.env.TEST_DATABASE_URL || 'mysql://root@localhost:3306/Notas_lab_test';
  }
  return process.env.DATABASE_URL || 'mysql://root@localhost:3306/Notas_lab';
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
