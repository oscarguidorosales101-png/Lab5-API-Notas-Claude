import api from './api';
import { API_ENDPOINTS } from '../config/api.config';

export const notasService = {
  obtenerTodas: (filtros = {}) => api.get(API_ENDPOINTS.NOTAS, filtros),
  obtenerPorId: (id) => api.get(`${API_ENDPOINTS.NOTAS}/${id}`),
  crear: (data) => api.post(API_ENDPOINTS.NOTAS, data),
  eliminar: (id) => api.delete(`${API_ENDPOINTS.NOTAS}/${id}`),
  resumir: (id) => api.post(API_ENDPOINTS.NOTA_RESUMEN(id), {})
};

export default notasService;

