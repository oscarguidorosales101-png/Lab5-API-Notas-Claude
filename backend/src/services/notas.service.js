/**
 * Servicio de gestión de notas con persistencia en MySQL utilizando Prisma ORM.
 * Soporta relaciones académicas opcionales con usuarios, materias y temas,
 * además de filtros de búsqueda avanzados.
 */

const prisma = require('../config/prisma');

/**
 * Obtiene todas las notas almacenadas en la base de datos con filtros opcionales.
 * @param {Object} [filtros={}] - Filtros opcionales de búsqueda (userId, subjectId, topicId, search)
 * @returns {Promise<Array>} Lista de notas
 */
const obtenerTodas = async (filtros = {}) => {
  const where = {};

  if (filtros.userId) {
    where.userId = Number(filtros.userId);
  }
  if (filtros.subjectId) {
    where.subjectId = Number(filtros.subjectId);
  }
  if (filtros.topicId) {
    where.topicId = Number(filtros.topicId);
  }
  if (filtros.search) {
    where.OR = [
      { titulo: { contains: filtros.search } },
      { contenido: { contains: filtros.search } }
    ];
  }

  return await prisma.note.findMany({
    where,
    orderBy: { id: 'asc' },
    include: {
      user: {
        select: { id: true, nombre: true, apellidos: true, email: true }
      },
      subject: true,
      topic: true
    }
  });
};

/**
 * Busca una nota por su identificador único.
 * @param {number|string} id - Identificador de la nota
 * @returns {Promise<Object|null>} La nota encontrada o null
 */
const buscarPorId = async (id) => {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return null;
  }

  return await prisma.note.findUnique({
    where: { id: numericId },
    include: {
      user: {
        select: { id: true, nombre: true, apellidos: true, email: true }
      },
      subject: true,
      topic: true
    }
  });
};

/**
 * Crea y almacena una nueva nota en la base de datos con relaciones académicas opcionales.
 * @param {Object} datos - Datos de la nota
 * @param {string} datos.titulo - Título de la nota
 * @param {string} datos.contenido - Contenido de la nota
 * @param {number} [datos.userId] - ID opcional del usuario propietario
 * @param {number} [datos.subjectId] - ID opcional de la materia
 * @param {number} [datos.topicId] - ID opcional del tema
 * @returns {Promise<Object>} La nota creada
 */
const crearNota = async ({ titulo, contenido, userId, subjectId, topicId }) => {
  const data = {
    titulo: titulo.trim(),
    contenido: contenido.trim()
  };

  if (userId) data.userId = Number(userId);
  if (subjectId) data.subjectId = Number(subjectId);
  if (topicId) data.topicId = Number(topicId);

  return await prisma.note.create({
    data,
    include: {
      user: {
        select: { id: true, nombre: true, apellidos: true, email: true }
      },
      subject: true,
      topic: true
    }
  });
};

/**
 * Actualiza una nota existente por su identificador único.
 * @param {number|string} id - Identificador de la nota
 * @param {Object} datos - Campos a actualizar
 * @returns {Promise<Object|null>} Nota actualizada o null si no existe
 */
const actualizarNota = async (id, datos) => {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return null;
  }

  const existente = await buscarPorId(numericId);
  if (!existente) {
    return null;
  }

  const dataToUpdate = {};
  if (datos.titulo !== undefined) dataToUpdate.titulo = datos.titulo.trim();
  if (datos.contenido !== undefined) dataToUpdate.contenido = datos.contenido.trim();
  if (datos.userId !== undefined) dataToUpdate.userId = datos.userId ? Number(datos.userId) : null;
  if (datos.subjectId !== undefined) dataToUpdate.subjectId = datos.subjectId ? Number(datos.subjectId) : null;
  if (datos.topicId !== undefined) dataToUpdate.topicId = datos.topicId ? Number(datos.topicId) : null;

  return await prisma.note.update({
    where: { id: numericId },
    data: dataToUpdate,
    include: {
      user: {
        select: { id: true, nombre: true, apellidos: true, email: true }
      },
      subject: true,
      topic: true
    }
  });
};

/**
 * Elimina una nota por su identificador único.
 * @param {number|string} id - Identificador de la nota
 * @returns {Promise<boolean>} true si se eliminó con éxito, false si no se encontró
 */
const eliminarNota = async (id) => {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return false;
  }

  try {
    await prisma.note.delete({
      where: { id: numericId }
    });
    return true;
  } catch (error) {
    // Código de error Prisma P2025: "Record to delete does not exist."
    if (error.code === 'P2025') {
      return false;
    }
    throw error;
  }
};

module.exports = {
  obtenerTodas,
  buscarPorId,
  crearNota,
  actualizarNota,
  eliminarNota
};
