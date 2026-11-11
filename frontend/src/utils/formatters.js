/**
 * Utilidades de formateo para el Sistema Académico
 */

/**
 * Formatea fechas a formato legible en Costa Rica (es-CR)
 */
export const formatearFecha = (fechaStr, incluirHora = false) => {
  if (!fechaStr) return 'N/A';
  const fecha = new Date(fechaStr);
  if (isNaN(fecha.getTime())) return 'Fecha inválida';

  const opciones = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };

  if (incluirHora) {
    opciones.hour = '2-digit';
    opciones.minute = '2-digit';
  }

  return fecha.toLocaleDateString('es-CR', opciones);
};

/**
 * Formatea valores numéricos con separador de miles
 */
export const formatearNumero = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return Number(num).toLocaleString('es-CR');
};

/**
 * Formatea costos en dólares con alta precisión (6 decimales)
 */
export const formatearDolares = (costo) => {
  if (costo === null || costo === undefined || isNaN(costo)) return '$0.000000 USD';
  return `$${Number(costo).toFixed(6)} USD`;
};

/**
 * Determina si una nota es aprobatoria según la nota mínima de la materia
 */
export const esNotaAprobada = (nota, notaMinima = 70.0) => {
  if (nota === null || nota === undefined) return false;
  return Number(nota) >= Number(notaMinima);
};

