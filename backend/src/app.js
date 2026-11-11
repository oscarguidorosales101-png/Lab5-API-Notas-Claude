const express = require('express');
const swaggerUi = require('swagger-ui-express');
const { swaggerSpec } = require('./config/swagger');
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

// Documentación de la API con Swagger UI y especificación en formato JSON
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
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
