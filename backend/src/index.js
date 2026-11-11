require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚀 Servidor ejecutándose en: http://localhost:${PORT}`);
  console.log(`📚 Documentación Swagger en: http://localhost:${PORT}/api-docs`);
  console.log('====================================================');
});

// Manejo de señales de terminación para cierre ordenado
process.on('SIGTERM', () => {
  console.log('Cerrando servidor HTTP...');
  server.close(() => {
    console.log('Servidor cerrado.');
  });
});
