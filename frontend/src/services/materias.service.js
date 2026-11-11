import api from './api';
import { API_ENDPOINTS } from '../config/api.config';

export const materiasService = {
  obtenerTodas: () => api.get(API_ENDPOINTS.MATERIAS),
  obtenerPorId: (id) => api.get(`${API_ENDPOINTS.MATERIAS}/${id}`),
  crear: (data) => api.post(API_ENDPOINTS.MATERIAS, data),
  actualizar: (id, data) => api.put(`${API_ENDPOINTS.MATERIAS}/${id}`, data),
  eliminar: (id) => api.delete(`${API_ENDPOINTS.MATERIAS}/${id}`),
  obtenerPrerrequisitos: (id) => api.get(API_ENDPOINTS.MATERIA_PRERREQUISITOS(id)),
  agregarPrerrequisito: (id, prerequisiteId) => api.post(API_ENDPOINTS.MATERIA_PRERREQUISITOS(id), { prerequisiteId }),
  eliminarPrerrequisito: (id, prerequisiteId) => api.delete(API_ENDPOINTS.MATERIA_PRERREQUISITO_ITEM(id, prerequisiteId)),
  obtenerTemas: (id) => api.get(API_ENDPOINTS.MATERIA_TEMAS(id))
};

export default materiasService;

