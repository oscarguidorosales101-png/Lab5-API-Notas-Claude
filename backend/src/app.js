const express = require('express');
const swaggerUi = require('swagger-ui-express');
const { swaggerSpec } = require('./config/swagger');
const prisma = require('./config/prisma');
const notasRoutes = require('./routes/notas.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const materiasRoutes = require('./routes/materias.routes');
const periodosRoutes = require('./routes/periodos.routes');
const matriculasRoutes = require('./routes/matriculas.routes');
const calificacionesRoutes = require('./routes/calificaciones.routes');
const temasRoutes = require('./routes/temas.routes');
const iaRoutes = require('./routes/ia.routes');
const errorHandler = require('./middlewares/errorHandler');
const { NotFoundError } = require('./utils/errors');

const app = express();

// Middleware para parsear cuerpos en formato JSON
app.use(express.json());

// Middleware de CORS para permitir comunicación fluida con el frontend (React / Vite)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Documentación de la API con Swagger UI y especificación en formato JSON
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Ruta raíz informativa
app.get('/', (req, res) => {
  res.status(200).json({
    nombre: 'Lab5 API de Notas',
    version: '1.0.0',
    estado: 'operativa',
    documentacion: '/api-docs',
    health: '/health'
  });
});

// Endpoint de verificación de salud del sistema
app.get('/health', async (req, res) => {
  let dbStatus = 'connected';
  let isDbOk = false;

  try {
    // Consulta real a MySQL mediante Prisma Client
    await prisma.$queryRaw`SELECT 1`;
    isDbOk = true;
    dbStatus = 'connected';
  } catch {
    isDbOk = false;
    dbStatus = 'disconnected';
  }

  const deepseekConfigured = Boolean(
    process.env.DEEPSEEK_API_KEY &&
    process.env.DEEPSEEK_API_KEY.trim() &&
    process.env.DEEPSEEK_MODEL &&
    process.env.DEEPSEEK_MODEL.trim()
  );

  const status = isDbOk ? 'ok' : 'degraded';
  const httpCode = isDbOk ? 200 : 503;

  return res.status(httpCode).json({
    status,
    services: {
      api: 'connected',
      database: dbStatus,
      deepseek: deepseekConfigured ? 'configured' : 'not_configured'
    }
  });
});

// Rutas académicas y del laboratorio
app.use('/api/notas', notasRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/materias', materiasRoutes);
app.use('/api/periodos', periodosRoutes);
app.use('/api/matriculas', matriculasRoutes);
app.use('/api/calificaciones', calificacionesRoutes);
app.use('/api/temas', temasRoutes);
app.use('/api/ia', iaRoutes);

// Manejo de rutas no encontradas (404)
app.use((req, res, next) => {
  next(new NotFoundError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`));
});

// Middleware centralizado de gestión de errores
app.use(errorHandler);

module.exports = app;
