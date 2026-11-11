const { randomUUID } = require('node:crypto');
const deepseek = require('./deepseek.service');
const { AppError, NotFoundError } = require('../utils/errors');

// Historial temporal en memoria: hasta 100 conversaciones y 10 turnos por cada una.
// El identificador aleatorio es privado: quien lo conoce puede continuar la conversación.
const conversaciones = new Map();
const TTL = 30 * 60 * 1000;

async function conversar(pregunta, conversacionId) {
  const ahora = Date.now();
  for (const [id, conversacion] of conversaciones) {
    if (!conversacion.ocupada && ahora - conversacion.actualizada >= TTL) conversaciones.delete(id);
  }
  let conversacion;
  let nueva = false;
  if (conversacionId) {
    conversacion = conversaciones.get(conversacionId);
    if (!conversacion) throw new NotFoundError('Conversación no encontrada o expirada');
  } else {
    if (conversaciones.size >= 100) throw new AppError('Demasiadas conversaciones activas', 429);
    conversacionId = randomUUID();
    conversacion = { mensajes: [], actualizada: ahora, ocupada: false };
    conversaciones.set(conversacionId, conversacion);
    nueva = true;
  }
  if (conversacion.ocupada) throw new AppError('La conversación tiene una solicitud en curso', 409);
  conversacion.ocupada = true;
  try {
    const resultado = await deepseek.preguntar(pregunta, undefined, conversacion.mensajes);
    conversacion.mensajes = [...conversacion.mensajes,
      { role: 'user', content: pregunta },
      { role: 'assistant', content: resultado.respuesta }
    ].slice(-20);
    conversacion.actualizada = Date.now();
    return { conversacionId, ...resultado };
  } catch (error) {
    if (nueva) conversaciones.delete(conversacionId);
    throw error;
  } finally {
    conversacion.ocupada = false;
  }
}

module.exports = { conversar };
