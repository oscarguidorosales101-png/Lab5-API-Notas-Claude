const { randomUUID } = require('node:crypto');
const deepseek = require('./deepseek.service');
const prisma = require('../config/prisma');
const { AppError, NotFoundError } = require('../utils/errors');

// Control de concurrencia y caché temporal en memoria
const conversaciones = new Map();
const TTL = 30 * 60 * 1000;

async function conversar(pregunta, conversacionId, opciones = {}) {
  const ahora = Date.now();
  for (const [id, conversacion] of conversaciones) {
    if (!conversacion.ocupada && ahora - conversacion.actualizada >= TTL) conversaciones.delete(id);
  }
  let conversacion;
  let nueva = false;
  const { system, userId } = opciones;

  if (conversacionId) {
    conversacion = conversaciones.get(conversacionId);
    if (!conversacion) {
      // Intentar recuperar de MySQL si sobrevivió a reinicio o recarga
      try {
        const dbConv = await prisma.conversation.findUnique({
          where: { id: conversacionId },
          include: { messages: { orderBy: { createdAt: 'asc' } } }
        });
        if (dbConv) {
          if (userId && dbConv.userId !== Number(userId)) {
            throw new NotFoundError('Conversación no encontrada o expirada');
          }
          conversacion = {
            mensajes: dbConv.messages.map((m) => ({ role: m.role, content: m.content })).slice(-20),
            actualizada: ahora,
            ocupada: false,
            userId: dbConv.userId
          };
          conversaciones.set(conversacionId, conversacion);
        }
      } catch (dbErr) {
        if (dbErr instanceof NotFoundError) throw dbErr;
      }
    }

    if (!conversacion) throw new NotFoundError('Conversación no encontrada o expirada');
    if (conversacion.userId && userId && conversacion.userId !== Number(userId)) {
      throw new NotFoundError('Conversación no encontrada o expirada');
    }
  } else {
    if (conversaciones.size >= 100) throw new AppError('Demasiadas conversaciones activas', 429);
    conversacionId = randomUUID();
    conversacion = {
      mensajes: [],
      actualizada: ahora,
      ocupada: false,
      userId: userId ? Number(userId) : null,
      system: system || null
    };
    conversaciones.set(conversacionId, conversacion);
    nueva = true;
  }

  if (conversacion.ocupada) throw new AppError('La conversación tiene una solicitud en curso', 409);
  conversacion.ocupada = true;

  try {
    const promptSistema = system || conversacion.system || undefined;
    const resultado = await deepseek.preguntar(pregunta, promptSistema, conversacion.mensajes);

    conversacion.mensajes = [
      ...conversacion.mensajes,
      { role: 'user', content: pregunta },
      { role: 'assistant', content: resultado.respuesta }
    ].slice(-20);
    conversacion.actualizada = Date.now();

    // Persistir de forma duradera en MySQL si existe un usuario autenticado
    if (userId) {
      try {
        const tituloGenerado = pregunta.length > 50 ? `${pregunta.slice(0, 47)}...` : pregunta;
        await prisma.conversation.upsert({
          where: { id: conversacionId },
          create: {
            id: conversacionId,
            userId: Number(userId),
            titulo: tituloGenerado
          },
          update: {
            updatedAt: new Date()
          }
        });

        await prisma.message.createMany({
          data: [
            {
              conversacionId,
              role: 'user',
              content: pregunta
            },
            {
              conversacionId,
              role: 'assistant',
              content: resultado.respuesta,
              tokens: resultado.uso?.total_tokens || null
            }
          ]
        });
      } catch (persistErr) {
        console.error('Error al persistir mensaje en base de datos:', persistErr.message);
      }
    }

    return { conversacionId, ...resultado };
  } catch (error) {
    if (nueva) conversaciones.delete(conversacionId);
    throw error;
  } finally {
    conversacion.ocupada = false;
  }
}

/**
 * Lista todas las conversaciones almacenadas para un usuario en MySQL.
 */
async function listarConversaciones(userId) {
  if (!userId) return [];
  const convs = await prisma.conversation.findMany({
    where: { userId: Number(userId) },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: {
        select: { messages: true }
      }
    }
  });

  return convs.map((c) => ({
    id: c.id,
    titulo: c.titulo,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    totalMensajes: c._count.messages
  }));
}

/**
 * Obtiene el detalle completo y todos los mensajes de una conversación.
 */
async function obtenerConversacion(conversacionId, userId) {
  const conv = await prisma.conversation.findUnique({
    where: { id: conversacionId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!conv || (userId && conv.userId !== Number(userId))) {
    throw new NotFoundError('Conversación no encontrada');
  }

  return conv;
}

/**
 * Crea una nueva conversación en MySQL.
 */
async function crearConversacion(userId, titulo = 'Nueva conversación') {
  const id = randomUUID();
  return await prisma.conversation.create({
    data: {
      id,
      userId: Number(userId),
      titulo: titulo?.trim() || 'Nueva conversación'
    }
  });
}

/**
 * Elimina una conversación y sus mensajes en cascada.
 */
async function eliminarConversacion(conversacionId, userId) {
  const conv = await prisma.conversation.findUnique({
    where: { id: conversacionId }
  });

  if (!conv || (userId && conv.userId !== Number(userId))) {
    throw new NotFoundError('Conversación no encontrada');
  }

  await prisma.conversation.delete({
    where: { id: conversacionId }
  });

  conversaciones.delete(conversacionId);
  return { mensaje: 'Conversación eliminada exitosamente' };
}

module.exports = {
  conversar,
  listarConversaciones,
  obtenerConversacion,
  crearConversacion,
  eliminarConversacion
};
