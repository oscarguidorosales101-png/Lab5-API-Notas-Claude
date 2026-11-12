import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Breadcrumbs from './Breadcrumbs';
import {
  UserCheck,
  ExternalLink,
  LogOut,
  ChevronDown,
  Shield,
  BookOpen,
  GraduationCap,
  Sparkles,
  Check
} from 'lucide-react';

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

const rolIconMap = {
  ADMIN: Shield,
  DOCENTE: BookOpen,
  ESTUDIANTE: GraduationCap
};

const rolClassMap = {
  ADMIN: 'badge-admin',
  DOCENTE: 'badge-docente',
  ESTUDIANTE: 'badge-estudiante'
};

export const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    usuario,
    cuentasDemo,
    cambiarCuentaDemo,
    logout,
    loadingAuth
  } = useApp();

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const title = titleMap[location.pathname] || 'Gestor Académico';

  const handleCambiarCuenta = async (email) => {
    try {
      await cambiarCuentaDemo(email);
      setDropdownOpen(false);
    } catch (err) {
      console.error('Error al cambiar de cuenta:', err);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const RolIcon = rolIconMap[usuario?.rol] || UserCheck;

  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="header-title">{title}</h1>
        <Breadcrumbs />
      </div>

      <div className="header-right">
        {/* Selector de Cuentas Demo e Identidad Activa */}
        <div className="user-profile-menu">
          <button
            className="user-profile-button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            title="Haga clic para cambiar de cuenta o rol"
          >
            <div className={`user-avatar-badge ${rolClassMap[usuario?.rol] || ''}`}>
              <RolIcon size={16} />
            </div>
            <div className="user-text-info">
              <span className="user-display-name">
                {usuario?.nombre ? `${usuario.nombre} ${usuario.apellidos}` : 'Usuario'}
              </span>
              <span className={`user-role-tag ${rolClassMap[usuario?.rol] || ''}`}>
                {usuario?.rol || 'ESTUDIANTE'}
              </span>
            </div>
            <ChevronDown size={14} className={`dropdown-chevron ${dropdownOpen ? 'rotated' : ''}`} />
          </button>

          {/* Menú desplegable para cambio rápido de rol */}
          {dropdownOpen && (
            <div className="user-dropdown-panel">
              <div className="dropdown-section-title">
                <Sparkles size={13} className="text-primary-600" />
                <span>Cambiar de Rol (Demostración)</span>
              </div>

              <div className="dropdown-accounts-list">
                {cuentasDemo.map((cuenta) => {
                  const isCurrent = usuario?.email === cuenta.email;
                  const Icon = rolIconMap[cuenta.rol] || UserCheck;
                  return (
                    <button
                      key={cuenta.email}
                      className={`dropdown-account-item ${isCurrent ? 'active' : ''}`}
                      onClick={() => handleCambiarCuenta(cuenta.email)}
                      disabled={loadingAuth}
                    >
                      <div className={`account-item-icon ${rolClassMap[cuenta.rol] || ''}`}>
                        <Icon size={15} />
                      </div>
                      <div className="account-item-info">
                        <span className="account-item-name">{cuenta.nombre}</span>
                        <span className="account-item-role">{cuenta.rol} &bull; {cuenta.email}</span>
                      </div>
                      {isCurrent && <Check size={16} className="text-primary-600 checkmark" />}
                    </button>
                  );
                })}
              </div>

              <div className="dropdown-footer">
                <button onClick={handleLogout} className="btn-logout-item">
                  <LogOut size={15} />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Acceso directo a documentación OpenAPI / Swagger en Express */}
        <a
          href="http://localhost:3000/api-docs"
          target="_blank"
          rel="noopener noreferrer"
          className="swagger-pill"
          title="Abrir documentación Swagger UI del backend en puerto 3000"
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
          position: sticky;
          top: 0;
        }
        .header-left {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }
        .header-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--navy-900);
          line-height: 1.2;
        }
        .header-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .user-profile-menu {
          position: relative;
        }
        .user-profile-button {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: var(--surface-ground);
          border: 1px solid var(--border-light);
          padding: 0.4rem 0.85rem;
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .user-profile-button:hover {
          background: var(--primary-50);
          border-color: var(--primary-200);
        }
        .user-avatar-badge {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #e2e8f0;
          color: #334155;
        }
        .badge-admin {
          background: #fef3c7 !important;
          color: #b45309 !important;
        }
        .badge-docente {
          background: #ede9fe !important;
          color: #6d28d9 !important;
        }
        .badge-estudiante {
          background: #e0f2fe !important;
          color: #0284c7 !important;
        }
        .user-text-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.1rem;
        }
        .user-display-name {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--navy-900);
          white-space: nowrap;
          max-width: 140px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .user-role-tag {
          font-size: 0.68rem;
          font-weight: 700;
          padding: 0.1rem 0.4rem;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .dropdown-chevron {
          color: var(--text-muted);
          transition: transform var(--transition-fast);
        }
        .dropdown-chevron.rotated {
          transform: rotate(180deg);
        }
        .user-dropdown-panel {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 300px;
          background: #ffffff;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-light);
          box-shadow: var(--shadow-xl);
          padding: 0.75rem;
          z-index: 100;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .dropdown-section-title {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--navy-800);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.4rem 0.5rem;
        }
        .dropdown-accounts-list {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .dropdown-account-item {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.5rem 0.65rem;
          border-radius: var(--radius-md);
          border: 1px solid transparent;
          background: transparent;
          cursor: pointer;
          text-align: left;
          width: 100%;
          transition: background var(--transition-fast);
        }
        .dropdown-account-item:hover {
          background: var(--surface-ground);
        }
        .dropdown-account-item.active {
          background: var(--primary-50);
          border-color: var(--primary-200);
        }
        .account-item-icon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .account-item-info {
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow: hidden;
        }
        .account-item-name {
          font-size: 0.825rem;
          font-weight: 600;
          color: var(--navy-900);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .account-item-role {
          font-size: 0.7rem;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .checkmark {
          flex-shrink: 0;
        }
        .dropdown-footer {
          border-top: 1px solid var(--border-light);
          padding-top: 0.5rem;
          margin-top: 0.25rem;
        }
        .btn-logout-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.5rem 0.65rem;
          font-size: 0.825rem;
          font-weight: 600;
          color: var(--danger-text);
          border-radius: var(--radius-md);
          border: none;
          background: transparent;
          cursor: pointer;
          transition: background var(--transition-fast);
        }
        .btn-logout-item:hover {
          background: var(--danger-bg);
        }
        .swagger-pill {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: #0284c7;
          color: #ffffff;
          padding: 0.4rem 0.75rem;
          border-radius: var(--radius-full);
          font-size: 0.8rem;
          font-weight: 600;
          text-decoration: none;
          transition: background var(--transition-fast);
        }
        .swagger-pill:hover {
          background: #0369a1;
        }
      `}</style>
    </header>
  );
};

export default Header;
