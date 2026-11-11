const { ZodError } = require('zod');
const { AppError } = require('../utils/errors');
const OpenAI = require('openai');
const { IAError } = require('../services/deepseek.service');

/**
 * Middleware centralizado para el manejo de errores.
 * Captura excepciones operacionales, errores de validación y fallos inesperados,
 * devolviendo respuestas JSON consistentes y sin exponer información sensible.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err instanceof OpenAI.APIError || err instanceof IAError) {
    const status = err instanceof OpenAI.APIConnectionTimeoutError ? 504
      : err.status === 429 ? 429
      : err.status === 503 ? 503 : 502;
    // Solo el código de nuestra respuesta: sin mensajes, cabeceras ni objetos del SDK.
    console.error('DeepSeek: fallo de IA, HTTP', status);
    return res.status(status).json({ error: 'IA_NO_DISPONIBLE' });
  }

  // Manejo de errores de parseo de JSON en el cuerpo de la petición
  if (err.type === 'entity.parse.failed' || (err instanceof SyntaxError && err.status === 400 && 'body' in err)) {
    return res.status(400).json({
      error: 'Formato JSON inválido en el cuerpo de la solicitud'
    });
  }

  // Manejo de errores directos de Zod
  if (err instanceof ZodError) {
    const detalles = err.issues.map((issue) => ({
      campo: issue.path.join('.') || 'body',
      mensaje: issue.message
    }));

    return res.status(400).json({
      error: 'Error de validación',
      detalles
    });
  }

  // Manejo de errores operacionales conocidos (AppError, NotFoundError, BadRequestError, ValidationError)
  if (err instanceof AppError || err.isOperational) {
    const response = {
      error: err.message
    };

    if (err.detalles && Array.isArray(err.detalles) && err.detalles.length > 0) {
      response.detalles = err.detalles;
    }

    return res.status(err.statusCode || 400).json(response);
  }

  // Errores inesperados o de servidor (500)
  // Se registra en la consola del servidor pero no se filtran detalles al cliente
  console.error('[Error Interno no controlado]:', err);

  return res.status(500).json({
    error: 'Error interno del servidor'
  });
};

module.exports = errorHandler;
