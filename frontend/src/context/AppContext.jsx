import React, { createContext, useContext, useState, useEffect } from 'react';
import usuariosService from '../services/usuarios.service';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Notificaciones Toast
  const [toasts, setToasts] = useState([]);
  // Sidebar colapsado o expandido
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Lista de usuarios y usuario activo seleccionado en la interfaz
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioActivo, setUsuarioActivo] = useState(null);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);

  const addToast = (mensaje, tipo = 'info', duracion = 4500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    setToasts((prev) => [...prev, { id, mensaje, tipo }]);

    if (duracion > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duracion);
    }
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const notifySuccess = (msg) => addToast(msg, 'success');
  const notifyError = (msg) => addToast(msg, 'error', 6000);
  const notifyWarning = (msg) => addToast(msg, 'warning');
  const notifyInfo = (msg) => addToast(msg, 'info');

  const cargarUsuarios = async () => {
    try {
      setLoadingUsuarios(true);
      const data = await usuariosService.obtenerTodos();
      setUsuarios(data || []);
      // Si no hay usuario activo seleccionado, seleccionar el primer estudiante o primer usuario
      if (!usuarioActivo && data && data.length > 0) {
        const estudiante = data.find((u) => u.rol === 'ESTUDIANTE') || data[0];
        setUsuarioActivo(estudiante);
      }
    } catch (err) {
      console.error('Error al cargar usuarios globales:', err);
    } finally {
      setLoadingUsuarios(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

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
        usuarios,
        usuarioActivo,
        setUsuarioActivo,
        cargarUsuarios,
        loadingUsuarios
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

