import api from './api';
import { API_ENDPOINTS } from '../config/api.config';

export const usuariosService = {
  obtenerTodos: () => api.get(API_ENDPOINTS.USUARIOS),
  obtenerPorId: (id) => api.get(`${API_ENDPOINTS.USUARIOS}/${id}`),
  crear: (data) => api.post(API_ENDPOINTS.USUARIOS, data),
  actualizar: (id, data) => api.put(`${API_ENDPOINTS.USUARIOS}/${id}`, data),
  eliminar: (id) => api.delete(`${API_ENDPOINTS.USUARIOS}/${id}`),
  obtenerMatriculas: (id) => api.get(API_ENDPOINTS.USUARIO_MATRICULAS(id))
};

export default usuariosService;

