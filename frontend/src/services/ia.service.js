import api from './api';
import { API_ENDPOINTS } from '../config/api.config';

export const iaService = {
  preguntar: (pregunta) => api.post(API_ENDPOINTS.IA_PREGUNTAR, { pregunta }),

  conversar: (pregunta, conversacionId = null) => {
    const payload = { pregunta };
    if (conversacionId && typeof conversacionId === 'string' && conversacionId.trim()) {
      payload.conversacionId = conversacionId.trim();
    }
    return api.post(API_ENDPOINTS.IA_CONVERSAR, payload);
  },

  chat: (pregunta, conversacionId = null) => {
    const payload = { pregunta };
    if (conversacionId && typeof conversacionId === 'string' && conversacionId.trim()) {
      payload.conversacionId = conversacionId.trim();
    }
    return api.post('/ia/chat', payload);
  },

  listarConversaciones: () => api.get('/ia/conversaciones'),
  obtenerConversacion: (id) => api.get(`/ia/conversaciones/${id}`),
  crearConversacion: (titulo = 'Nueva conversación') => api.post('/ia/conversaciones', { titulo }),
  eliminarConversacion: (id) => api.delete(`/ia/conversaciones/${id}`),

  obtenerUso: (params = {}) => api.get(API_ENDPOINTS.IA_USO, params),
  obtenerUsoHoy: (timezone) => api.get(API_ENDPOINTS.IA_USO_HOY, timezone ? { timezone } : {}),
  obtenerUsoResumen: () => api.get(API_ENDPOINTS.IA_USO_RESUMEN)
};

export default iaService;
