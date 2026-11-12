import api from './api';

/**
 * Servicio de autenticación y cambio de cuentas para la interfaz de usuario.
 */
export const authService = {
  /**
   * Inicia sesión con credenciales de usuario.
   * @param {string} email
   * @param {string} password
   */
  async login(email, password) {
    const data = await api.post('/auth/login', { email, password });
    if (data?.token) {
      localStorage.setItem('auth_token', data.token);
    }
    return data;
  },

  /**
   * Obtiene el perfil del usuario autenticado actual desde el backend.
   */
  async obtenerPerfil() {
    return await api.get('/auth/me');
  },

  /**
   * Obtiene la lista de cuentas demo disponibles para pruebas rápidas.
   */
  async obtenerCuentasDemo() {
    return await api.get('/auth/cuentas-demo');
  },

  /**
   * Cambia de usuario activo inmediatamente a una de las cuentas demo.
   * @param {string} email
   */
  async cambiarCuentaDemo(email) {
    const data = await api.post('/auth/cambiar-cuenta', { email });
    if (data?.token) {
      localStorage.setItem('auth_token', data.token);
    }
    return data;
  },

  /**
   * Cierra la sesión activa y elimina el token de almacenamiento local.
   */
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignorar error si el token ya expiró
    } finally {
      localStorage.removeItem('auth_token');
    }
  }
};

export default authService;

