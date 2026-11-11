const { rateLimit } = require('express-rate-limit');

// Mismo presupuesto para preguntas, conversación, streaming y resúmenes.
const crearLimiteIA = (options = {}) => rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'LIMITE_IA_EXCEDIDO' },
  ...options
});

module.exports = { limitarIA: crearLimiteIA(), crearLimiteIA };
