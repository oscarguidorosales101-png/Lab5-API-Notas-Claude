import api from './api';
import { API_ENDPOINTS } from '../config/api.config';

export const iaService = {
  preguntar: (pregunta) => api.post(API_ENDPOINTS.IA_PREGUNTAR, { pregunta }),
  conversar: (mensaje, conversacionId = null) => 
    api.post(API_ENDPOINTS.IA_CONVERSAR, { mensaje, conversacionId }),
  obtenerUso: (params = {}) => api.get(API_ENDPOINTS.IA_USO, params),
  obtenerUsoHoy: (timezone) => api.get(API_ENDPOINTS.IA_USO_HOY, timezone ? { timezone } : {}),
  obtenerUsoResumen: () => api.get(API_ENDPOINTS.IA_USO_RESUMEN)
};

export default iaService;

