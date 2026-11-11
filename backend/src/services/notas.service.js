/**
 * Servicio de gestión de notas con almacenamiento en memoria.
 * Proporciona métodos CRUD y permite su reutilización para futuras integraciones (ej. Claude AI).
 */

// Almacenamiento en memoria
const notas = [];
let nextId = 1;

/**
 * Obtiene todas las notas almacenadas.
 * @returns {Array<{id: number, titulo: string, contenido: string}>} Lista de notas
 */
const obtenerTodas = () => {
  return [...notas];
};

/**
 * Busca una nota por su identificador único.
 * @param {number|string} id - Identificador de la nota
 * @returns {{id: number, titulo: string, contenido: string}|null} La nota encontrada o null
 */
const buscarPorId = (id) => {
  const numericId = Number(id);
  const nota = notas.find((n) => n.id === numericId);
  return nota ? { ...nota } : null;
};

/**
 * Crea y almacena una nueva nota con un ID autoincremental único.
 * @param {Object} datos - Datos de la nota
 * @param {string} datos.titulo - Título de la nota
 * @param {string} datos.contenido - Contenido de la nota
 * @returns {{id: number, titulo: string, contenido: string}} La nota recién creada
 */
const crearNota = ({ titulo, contenido }) => {
  const nuevaNota = {
    id: nextId++,
    titulo: titulo.trim(),
    contenido: contenido.trim()
  };

  notas.push(nuevaNota);
  return { ...nuevaNota };
};

/**
 * Elimina una nota por su identificador único.
 * @param {number|string} id - Identificador de la nota
 * @returns {boolean} true si se eliminó con éxito, false si no se encontró
 */
const eliminarNota = (id) => {
  const numericId = Number(id);
  const index = notas.findIndex((n) => n.id === numericId);

  if (index === -1) {
    return false;
  }

  notas.splice(index, 1);
  return true;
};

module.exports = {
  obtenerTodas,
  buscarPorId,
  crearNota,
  eliminarNota
};
