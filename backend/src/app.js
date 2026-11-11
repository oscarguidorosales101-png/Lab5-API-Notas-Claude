const express = require('express');
const swaggerUi = require('swagger-ui-express');
const { swaggerSpec } = require('./config/swagger');
const notasRoutes = require('./routes/notas.routes');
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

// Rutas de la API
app.use('/api/notas', notasRoutes);
app.use('/api/ia', require('./routes/ia.routes'));

// Manejo de rutas no encontradas (404)
app.use((req, res, next) => {
  next(new NotFoundError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`));
});

// Middleware centralizado de gestión de errores
app.use(errorHandler);

module.exports = app;
