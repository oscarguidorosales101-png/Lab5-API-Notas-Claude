import api from './api';
import { API_ENDPOINTS } from '../config/api.config';

export const temasService = {
  obtenerTodos: (materiaId) => api.get(API_ENDPOINTS.TEMAS, materiaId ? { materiaId } : {}),
  obtenerPorId: (id) => api.get(`${API_ENDPOINTS.TEMAS}/${id}`),
  crear: (data) => api.post(API_ENDPOINTS.TEMAS, data),
  actualizar: (id, data) => api.put(`${API_ENDPOINTS.TEMAS}/${id}`, data),
  eliminar: (id) => api.delete(`${API_ENDPOINTS.TEMAS}/${id}`)
};

export default temasService;

