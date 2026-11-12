import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import ToastContainer from '../components/ToastContainer';
import LoadingSpinner from '../components/LoadingSpinner';

// Páginas
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import MateriasPage from '../pages/MateriasPage';
import MatriculasPage from '../pages/MatriculasPage';
import CalificacionesPage from '../pages/CalificacionesPage';
import NotasPage from '../pages/NotasPage';
import TemasPage from '../pages/TemasPage';
import PeriodosPage from '../pages/PeriodosPage';
import IAPage from '../pages/IAPage';
import ConsumoIAPage from '../pages/ConsumoIAPage';
import UsuariosPage from '../pages/UsuariosPage';

const Layout = ({ children }) => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-wrapper">
        <Header />
        <main className="content-container">
          {children}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
};

const AccesoDenegado = ({ rolesPermitidos = [] }) => {
  const { usuario, cambiarCuentaDemo } = useApp();
  return (
    <div className="panel" style={{ maxWidth: 640, margin: '2rem auto', textAlign: 'center', padding: '2.5rem' }}>
      <h2 style={{ color: '#0f172a', marginBottom: '0.5rem' }}>Módulo Restringido</h2>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
        Tu rol actual (<strong>{usuario?.rol}</strong>) no tiene los permisos requeridos para acceder a esta vista.
      </p>
      <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 8, marginBottom: '1.5rem', fontSize: '0.85rem' }}>
        Roles requeridos: <strong>{rolesPermitidos.join(', ')}</strong>
      </div>
      <button
        className="btn btn-primary"
        onClick={() => cambiarCuentaDemo('admin@universidad.test')}
      >
        Cambiar a Cuenta de Administrador (1 Clic)
      </button>
    </div>
  );
};

const RutaProtegida = ({ children, roles = [] }) => {
  const { isAuth, loadingAuth, usuario } = useApp();

  if (loadingAuth) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(usuario?.rol)) {
    return <AccesoDenegado rolesPermitidos={roles} />;
  }

  return children;
};

export const AppRoutes = () => {
  const { isAuth, loadingAuth } = useApp();

  return (
    <Routes>
      {/* Ruta pública de Login */}
      <Route
        path="/login"
        element={!loadingAuth && isAuth ? <Navigate to="/" replace /> : <LoginPage />}
      />

      {/* Rutas protegidas con Layout principal */}
      <Route
        path="/*"
        element={
          <RutaProtegida>
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/materias" element={<MateriasPage />} />
                <Route path="/matriculas" element={<RutaProtegida roles={['ADMIN', 'DOCENTE']}><MatriculasPage /></RutaProtegida>} />
                <Route path="/calificaciones" element={<CalificacionesPage />} />
                <Route path="/notas" element={<NotasPage />} />
                <Route path="/temas" element={<RutaProtegida roles={['ADMIN', 'DOCENTE']}><TemasPage /></RutaProtegida>} />
                <Route path="/periodos" element={<RutaProtegida roles={['ADMIN']}><PeriodosPage /></RutaProtegida>} />
                <Route path="/ia" element={<IAPage />} />
                <Route path="/consumo" element={<RutaProtegida roles={['ADMIN']}><ConsumoIAPage /></RutaProtegida>} />
                <Route path="/usuarios" element={<RutaProtegida roles={['ADMIN']}><UsuariosPage /></RutaProtegida>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </RutaProtegida>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
