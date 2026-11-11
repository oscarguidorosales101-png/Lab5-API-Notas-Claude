import api from './api';
import { API_ENDPOINTS } from '../config/api.config';

export const periodosService = {
  obtenerTodos: () => api.get(API_ENDPOINTS.PERIODOS),
  obtenerPorId: (id) => api.get(`${API_ENDPOINTS.PERIODOS}/${id}`),
  crear: (data) => api.post(API_ENDPOINTS.PERIODOS, data),
  actualizar: (id, data) => api.put(`${API_ENDPOINTS.PERIODOS}/${id}`, data),
  eliminar: (id) => api.delete(`${API_ENDPOINTS.PERIODOS}/${id}`)
};

export default periodosService;

