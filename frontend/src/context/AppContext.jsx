import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/auth.service';
import usuariosService from '../services/usuarios.service';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Notificaciones Toast
  const [toasts, setToasts] = useState([]);
  // Sidebar colapsado o expandido
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Estado de Autenticación Real
  const [usuario, setUsuario] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [cuentasDemo, setCuentasDemo] = useState([]);

  // Lista de usuarios (para vistas de administración)
  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);

  // Notificaciones Toast
  const addToast = useCallback((mensaje, tipo = 'info', duracion = 4500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    setToasts((prev) => [...prev, { id, mensaje, tipo }]);

    if (duracion > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duracion);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notifySuccess = useCallback((msg) => addToast(msg, 'success'), [addToast]);
  const notifyError = useCallback((msg) => addToast(msg, 'error', 6000), [addToast]);
  const notifyWarning = useCallback((msg) => addToast(msg, 'warning'), [addToast]);
  const notifyInfo = useCallback((msg) => addToast(msg, 'info'), [addToast]);

  // Cargar cuentas demo
  const cargarCuentasDemo = useCallback(async () => {
    try {
      const cuentas = await authService.obtenerCuentasDemo();
      setCuentasDemo(cuentas || []);
    } catch (err) {
      console.warn('No se pudieron cargar cuentas demo:', err.message);
    }
  }, []);

  // Restaurar sesión activa
  const restaurarSesion = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      // Si no hay token previo, iniciar con cuenta demo por defecto para evaluación inmediata
      try {
        const demoData = await authService.cambiarCuentaDemo('admin@universidad.test');
        setUsuario(demoData.usuario);
      } catch {
        setUsuario(null);
      } finally {
        setLoadingAuth(false);
      }
      return;
    }

    try {
      setLoadingAuth(true);
      const perfil = await authService.obtenerPerfil();
      setUsuario(perfil);
    } catch (err) {
      console.warn('Sesión previa inválida o expirada:', err.message);
      localStorage.removeItem('auth_token');
      // Fallback a login demo
      try {
        const demoData = await authService.cambiarCuentaDemo('admin@universidad.test');
        setUsuario(demoData.usuario);
      } catch {
        setUsuario(null);
      }
    } finally {
      setLoadingAuth(false);
    }
  }, []);

  // Inicio de sesión
  const login = async (email, password) => {
    try {
      setLoadingAuth(true);
      const data = await authService.login(email, password);
      setUsuario(data.usuario);
      notifySuccess(`¡Bienvenido/a, ${data.usuario.nombre}! (${data.usuario.rol})`);
      return data;
    } catch (err) {
      notifyError(err.message || 'Error al iniciar sesión');
      throw err;
    } finally {
      setLoadingAuth(false);
    }
  };

  // Cierre de sesión
  const logout = async () => {
    try {
      await authService.logout();
      setUsuario(null);
      notifyInfo('Has cerrado la sesión correctamente');
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  };

  // Cambio de cuenta demo en un clic
  const cambiarCuentaDemo = async (email) => {
    try {
      setLoadingAuth(true);
      const data = await authService.cambiarCuentaDemo(email);
      setUsuario(data.usuario);
      notifySuccess(`Cuenta cambiada a: ${data.usuario.nombre} ${data.usuario.apellidos} (${data.usuario.rol})`);
      return data;
    } catch (err) {
      notifyError(err.message || 'No se pudo cambiar de cuenta');
      throw err;
    } finally {
      setLoadingAuth(false);
    }
  };

  // Cargar usuarios globales (para administradores)
  const cargarUsuarios = useCallback(async () => {
    try {
      setLoadingUsuarios(true);
      const data = await usuariosService.obtenerTodos();
      setUsuarios(data || []);
    } catch (err) {
      // Si el rol no permite ver usuarios, silenciar error
      console.warn('Usuarios no disponibles para el rol actual:', err.message);
    } finally {
      setLoadingUsuarios(false);
    }
  }, []);

  useEffect(() => {
    cargarCuentasDemo();
    restaurarSesion();
  }, [cargarCuentasDemo, restaurarSesion]);

  useEffect(() => {
    if (usuario?.rol === 'ADMIN' || usuario?.rol === 'DOCENTE') {
      cargarUsuarios();
    }
  }, [usuario, cargarUsuarios]);

  // Roles calculados
  const isAuth = Boolean(usuario);
  const isAdmin = usuario?.rol === 'ADMIN';
  const isDocente = usuario?.rol === 'DOCENTE';
  const isEstudiante = usuario?.rol === 'ESTUDIANTE';

  return (
    <AppContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        notifySuccess,
        notifyError,
        notifyWarning,
        notifyInfo,
        sidebarCollapsed,
        setSidebarCollapsed,
        usuario,
        usuarioActivo: usuario, // Compatibilidad con componentes existentes
        setUsuarioActivo: setUsuario,
        isAuth,
        isAdmin,
        isDocente,
        isEstudiante,
        cuentasDemo,
        loadingAuth,
        login,
        logout,
        cambiarCuentaDemo,
        usuarios,
        loadingUsuarios,
        cargarUsuarios
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe ser utilizado dentro de un AppProvider');
  }
  return context;
};

export default AppContext;
