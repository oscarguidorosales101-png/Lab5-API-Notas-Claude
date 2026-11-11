/**
 * Configuración centralizada de la API
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const API_ENDPOINTS = {
  // Usuarios
  USUARIOS: '/usuarios',
  USUARIO_MATRICULAS: (id) => `/usuarios/${id}/matriculas`,
  
  // Materias y Prerrequisitos
  MATERIAS: '/materias',
  MATERIA_PRERREQUISITOS: (id) => `/materias/${id}/prerrequisitos`,
  MATERIA_PRERREQUISITO_ITEM: (id, prereqId) => `/materias/${id}/prerrequisitos/${prereqId}`,
  MATERIA_TEMAS: (id) => `/materias/${id}/temas`,

  // Períodos
  PERIODOS: '/periodos',

  // Matrículas y Calificaciones
  MATRICULAS: '/matriculas',
  MATRICULA_CALIFICACIONES: (id) => `/matriculas/${id}/calificaciones`,
  MATRICULA_RESULTADO_FINAL: (id) => `/matriculas/${id}/resultado-final`,
  CALIFICACIONES: '/calificaciones',

  // Temas
  TEMAS: '/temas',

  // Notas
  NOTAS: '/notas',
  NOTA_RESUMEN: (id) => `/notas/${id}/resumen`,

  // Inteligencia Artificial y Costos
  IA_PREGUNTAR: '/ia/preguntar',
  IA_PREGUNTAR_STREAM: '/ia/preguntar/stream',
  IA_CONVERSAR: '/ia/conversar',
  IA_USO: '/ia/uso',
  IA_USO_HOY: '/ia/uso/hoy',
  IA_USO_RESUMEN: '/ia/uso/resumen'
};

