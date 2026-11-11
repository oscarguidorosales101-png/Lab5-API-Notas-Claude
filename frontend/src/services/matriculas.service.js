import api from './api';
import { API_ENDPOINTS } from '../config/api.config';

export const matriculasService = {
  obtenerTodas: () => api.get(API_ENDPOINTS.MATRICULAS),
  obtenerPorId: (id) => api.get(`${API_ENDPOINTS.MATRICULAS}/${id}`),
  crear: (data) => api.post(API_ENDPOINTS.MATRICULAS, data),
  obtenerCalificaciones: (id) => api.get(API_ENDPOINTS.MATRICULA_CALIFICACIONES(id)),
  agregarCalificacion: (id, data) => api.post(API_ENDPOINTS.MATRICULA_CALIFICACIONES(id), data),
  actualizarCalificacion: (gradeId, data) => api.put(`${API_ENDPOINTS.CALIFICACIONES}/${gradeId}`, data),
  eliminarCalificacion: (gradeId) => api.delete(`${API_ENDPOINTS.CALIFICACIONES}/${gradeId}`),
  obtenerResultadoFinal: (id) => api.get(API_ENDPOINTS.MATRICULA_RESULTADO_FINAL(id))
};

export default matriculasService;

