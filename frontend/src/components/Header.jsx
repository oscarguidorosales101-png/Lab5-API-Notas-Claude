import React from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Breadcrumbs from './Breadcrumbs';
import { UserCheck, ExternalLink, RefreshCw } from 'lucide-react';

const titleMap = {
  '/': 'Tablero de Control Académico',
  '/materias': 'Gestión del Catálogo de Materias',
  '/matriculas': 'Matrículas de Estudiantes',
  '/calificaciones': 'Calificaciones Ponderadas y Resultados',
  '/notas': 'Notas y Cuaderno de Apuntes',
  '/temas': 'Clasificación Temática de Asignaturas',
  '/periodos': 'Períodos y Ciclos Lectivos',
  '/ia': 'Asistente Académico DeepSeek',
  '/consumo': 'Métricas de Consumo y Costos de IA',
  '/usuarios': 'Directorio de Usuarios del Sistema'
};

export const Header = () => {
  const location = useLocation();
  const { usuarios, usuarioActivo, setUsuarioActivo, cargarUsuarios, loadingUsuarios } = useApp();

  const title = titleMap[location.pathname] || 'Gestor Académico';

  const handleUsuarioChange = (e) => {
    const selectedId = Number(e.target.value);
    const selected = usuarios.find((u) => u.id === selectedId);
    if (selected) {
      setUsuarioActivo(selected);
    }
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="header-title">{title}</h1>
        <Breadcrumbs />
      </div>

      <div className="header-right">
        {/* Selector de Usuario Activo para Simular Roles/Estudiantes */}
        <div className="user-switcher-container">
          <div className="user-avatar" title={`Rol: ${usuarioActivo?.rol || 'ESTUDIANTE'}`}>
            <UserCheck size={18} />
          </div>
          <div className="user-switcher-info">
            <span className="user-switcher-label">Usuario Activo:</span>
            <select
              className="user-select"
              value={usuarioActivo?.id || ''}
              onChange={handleUsuarioChange}
              disabled={loadingUsuarios || usuarios.length === 0}
            >
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre} {u.apellidos} ({u.rol})
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={cargarUsuarios}
            className="btn btn-ghost btn-icon"
            title="Recargar usuarios"
          >
            <RefreshCw size={14} className={loadingUsuarios ? 'spin' : ''} />
          </button>
        </div>

        {/* Acceso directo a documentación Swagger del Backend */}
        <a
          href="http://localhost:3000/api-docs"
          target="_blank"
          rel="noopener noreferrer"
          className="swagger-pill"
          title="Abrir documentación OpenAPI / Swagger en Express (puerto 3000)"
        >
          <span>Swagger UI</span>
          <ExternalLink size={13} />
        </a>
      </div>

      <style>{`
        .app-header {
          height: var(--header-height);
          background: #ffffff;
          border-bottom: 1px solid var(--border-light);
          padding: 0 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
          z-index: 50;
        }
        .header-left {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }
        .header-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-main);
          letter-spacing: -0.02em;
        }
        .header-right {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }
        .user-switcher-container {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.375rem 0.75rem;
          background: var(--surface-ground);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
        }
        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-full);
          background: var(--primary-100);
          color: var(--primary-700);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .user-switcher-info {
          display: flex;
          flex-direction: column;
          line-height: 1.1;
        }
        .user-switcher-label {
          font-size: 0.6875rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        .user-select {
          border: none;
          background: transparent;
          font-size: 0.825rem;
          font-weight: 600;
          color: var(--text-main);
          outline: none;
          cursor: pointer;
          font-family: inherit;
        }
        .swagger-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.45rem 0.75rem;
          border-radius: var(--radius-full);
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          transition: all var(--transition-fast);
        }
        .swagger-pill:hover {
          background: #dcfce7;
          color: #14532d;
        }
        .spin {
          animation: spin 0.8s linear infinite;
        }
      `}</style>
    </header>
  );
};

export default Header;

