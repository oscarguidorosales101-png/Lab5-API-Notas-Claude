import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import ToastContainer from '../components/ToastContainer';

// Páginas
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

export const AppRoutes = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/materias" element={<MateriasPage />} />
        <Route path="/matriculas" element={<MatriculasPage />} />
        <Route path="/calificaciones" element={<CalificacionesPage />} />
        <Route path="/notas" element={<NotasPage />} />
        <Route path="/temas" element={<TemasPage />} />
        <Route path="/periodos" element={<PeriodosPage />} />
        <Route path="/ia" element={<IAPage />} />
        <Route path="/consumo" element={<ConsumoIAPage />} />
        <Route path="/usuarios" element={<UsuariosPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

export default AppRoutes;

