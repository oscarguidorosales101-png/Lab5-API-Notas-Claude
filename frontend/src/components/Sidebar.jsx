import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Award,
  FileText,
  Tag,
  Calendar,
  Bot,
  BarChart3,
  Users,
  ChevronLeft,
  ChevronRight,
  Database
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Inicio', icon: LayoutDashboard },
  { path: '/materias', label: 'Materias', icon: BookOpen },
  { path: '/matriculas', label: 'Matrículas', icon: GraduationCap },
  { path: '/calificaciones', label: 'Calificaciones', icon: Award },
  { path: '/notas', label: 'Notas y Apuntes', icon: FileText },
  { path: '/temas', label: 'Temas', icon: Tag },
  { path: '/periodos', label: 'Períodos', icon: Calendar },
  { path: '/ia', label: 'Asistente IA', icon: Bot },
  { path: '/consumo', label: 'Consumo IA', icon: BarChart3 },
  { path: '/usuarios', label: 'Usuarios', icon: Users }
];

export const Sidebar = () => {
  const { sidebarCollapsed, setSidebarCollapsed } = useApp();

  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Encabezado del Logo */}
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon-box">
            <GraduationCap size={24} className="logo-icon" />
          </div>
          {!sidebarCollapsed && (
            <div className="logo-text-box">
              <span className="logo-title">SGA Notas</span>
              <span className="logo-subtitle">Gestión Académica</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="collapse-btn"
          title={sidebarCollapsed ? 'Expandir menú' : 'Contraer menú'}
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Menú de Navegación */}
      <nav className="sidebar-nav">
        <div className="nav-group-label">{!sidebarCollapsed && 'ACADÉMICO'}</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
              title={sidebarCollapsed ? item.label : ''}
            >
              <Icon size={20} className="nav-icon" />
              {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Pie de navegación con estado del backend */}
      <div className="sidebar-footer">
        <div className="db-status-badge" title="Conectado a MySQL Notas_lab">
          <Database size={15} className="text-primary" />
          {!sidebarCollapsed && (
            <div className="db-status-text">
              <span className="db-name">MySQL: Notas_lab</span>
              <span className="db-badge">Activo</span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .sidebar {
          width: var(--sidebar-width);
          height: 100vh;
          background: #ffffff;
          border-right: 1px solid var(--border-light);
          display: flex;
          flex-direction: column;
          transition: width var(--transition-normal);
          flex-shrink: 0;
          z-index: 100;
        }
        .sidebar-collapsed {
          width: var(--sidebar-collapsed-width);
        }
        .sidebar-header {
          height: var(--header-height);
          padding: 0 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-light);
        }
        .logo-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          overflow: hidden;
        }
        .logo-icon-box {
          background: linear-gradient(135deg, var(--primary-600), var(--primary-700));
          color: white;
          padding: 0.5rem;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(2, 132, 199, 0.25);
        }
        .logo-text-box {
          display: flex;
          flex-direction: column;
          line-height: 1.15;
          white-space: nowrap;
        }
        .logo-title {
          font-weight: 800;
          font-size: 1.05rem;
          color: var(--text-main);
          letter-spacing: -0.02em;
        }
        .logo-subtitle {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--primary-600);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .collapse-btn {
          background: var(--surface-alt);
          border: 1px solid var(--border-light);
          color: var(--text-muted);
          width: 30px;
          height: 30px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .collapse-btn:hover {
          color: var(--text-main);
          background: #e2e8f0;
        }
        .sidebar-nav {
          flex: 1;
          padding: 1.25rem 0.75rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .nav-group-label {
          font-size: 0.6875rem;
          font-weight: 700;
          color: var(--text-light);
          padding: 0.5rem 0.75rem 0.25rem;
          letter-spacing: 0.06em;
        }
        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.625rem 0.875rem;
          border-radius: var(--radius-md);
          color: var(--text-muted);
          font-weight: 600;
          font-size: 0.9rem;
          transition: all var(--transition-fast);
          white-space: nowrap;
        }
        .nav-link:hover {
          background-color: var(--primary-50);
          color: var(--primary-700);
        }
        .nav-link-active {
          background-color: var(--primary-100);
          color: var(--primary-800);
          box-shadow: inset 3px 0 0 var(--primary-600);
        }
        .nav-icon {
          flex-shrink: 0;
        }
        .sidebar-footer {
          padding: 1rem 0.875rem;
          border-top: 1px solid var(--border-light);
          background: #f8fafc;
        }
        .db-status-badge {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.5rem 0.625rem;
          background: #ffffff;
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          overflow: hidden;
        }
        .db-status-text {
          display: flex;
          flex-direction: column;
          line-height: 1.2;
        }
        .db-name {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-main);
        }
        .db-badge {
          font-size: 0.65rem;
          color: #10b981;
          font-weight: 700;
          text-transform: uppercase;
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;

