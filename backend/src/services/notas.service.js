/**
 * Servicio de gestión de notas con persistencia en base de datos SQLite utilizando Prisma ORM.
 * Reemplaza el almacenamiento volátil en memoria y conserva la compatibilidad con rutas existentes y futuras.
 */

const prisma = require('../config/prisma');

/**
 * Obtiene todas las notas almacenadas en la base de datos.
 * @returns {Promise<Array<{id: number, titulo: string, contenido: string, createdAt: Date, updatedAt: Date}>>} Lista de notas
 */
const obtenerTodas = async () => {
  return await prisma.note.findMany({
    orderBy: { id: 'asc' }
  });
};

/**
 * Busca una nota por su identificador único.
 * @param {number|string} id - Identificador de la nota
 * @returns {Promise<{id: number, titulo: string, contenido: string, createdAt: Date, updatedAt: Date}|null>} La nota encontrada o null
 */
const buscarPorId = async (id) => {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return null;
  }

  return await prisma.note.findUnique({
    where: { id: numericId }
  });
};

/**
 * Crea y almacena una nueva nota en la base de datos con un ID autoincremental único.
 * @param {Object} datos - Datos de la nota
 * @param {string} datos.titulo - Título de la nota
 * @param {string} datos.contenido - Contenido de la nota
 * @returns {Promise<{id: number, titulo: string, contenido: string, createdAt: Date, updatedAt: Date}>} La nota creada
 */
const crearNota = async ({ titulo, contenido }) => {
  return await prisma.note.create({
    data: {
      titulo: titulo.trim(),
      contenido: contenido.trim()
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
  eliminarNota
};
