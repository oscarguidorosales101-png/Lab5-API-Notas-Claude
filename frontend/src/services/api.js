import { API_BASE_URL } from '../config/api.config';

/**
 * Cliente HTTP centralizado para comunicación con la API Express
 */
class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers
    };

    const config = {
      ...options,
      headers
    };

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);

      // Si la respuesta es 204 (No Content), devolver éxito vacío
      if (response.status === 204) {
        return null;
      }

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const error = new Error(
          (data && data.error) ? data.error : `Error en la solicitud HTTP ${response.status}`
        );
        error.status = response.status;
        error.detalles = (data && data.detalles) ? data.detalles : null;
        error.rawData = data;
        throw error;
      }

      return data;
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        const connError = new Error('No se pudo establecer conexión con el servidor backend (puerto 3000). Verifique que esté en ejecución.');
        connError.status = 0;
        connError.isConnectionError = true;
        throw connError;
      }
      throw err;
    }
  }

  get(endpoint, params = {}) {
    let query = '';
    const cleanParams = Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '');
    if (cleanParams.length > 0) {
      const searchParams = new URLSearchParams();
      cleanParams.forEach(([k, v]) => searchParams.append(k, v));
      query = `?${searchParams.toString()}`;
    }
    return this.request(`${endpoint}${query}`, { method: 'GET' });
  }

  post(endpoint, body = {}) {
    return this.request(endpoint, { method: 'POST', body });
  }

  put(endpoint, body = {}) {
    return this.request(endpoint, { method: 'PUT', body });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient(API_BASE_URL);
export default api;

