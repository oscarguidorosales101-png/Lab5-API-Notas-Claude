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
  Database,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

const allNavItems = [
  { path: '/', label: 'Inicio', icon: LayoutDashboard, roles: ['ADMIN', 'DOCENTE', 'ESTUDIANTE'] },
  { path: '/materias', label: 'Materias', icon: BookOpen, roles: ['ADMIN', 'DOCENTE', 'ESTUDIANTE'] },
  { path: '/matriculas', label: 'Matrículas', icon: GraduationCap, roles: ['ADMIN', 'DOCENTE'] },
  { path: '/calificaciones', label: 'Calificaciones', icon: Award, roles: ['ADMIN', 'DOCENTE', 'ESTUDIANTE'] },
  { path: '/notas', label: 'Notas y Apuntes', icon: FileText, roles: ['ADMIN', 'DOCENTE', 'ESTUDIANTE'] },
  { path: '/temas', label: 'Temas', icon: Tag, roles: ['ADMIN', 'DOCENTE'] },
  { path: '/periodos', label: 'Períodos', icon: Calendar, roles: ['ADMIN'] },
  { path: '/ia', label: 'Asistente IA', icon: Bot, roles: ['ADMIN', 'DOCENTE', 'ESTUDIANTE'] },
  { path: '/consumo', label: 'Consumo IA', icon: BarChart3, roles: ['ADMIN'] },
  { path: '/usuarios', label: 'Usuarios', icon: Users, roles: ['ADMIN'] }
];

export const Sidebar = () => {
  const { sidebarCollapsed, setSidebarCollapsed, usuario } = useApp();

  const userRole = usuario?.rol || 'ESTUDIANTE';
  const navItems = allNavItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Contenedor Limpio y Proporcional para el Logo */}
      <div className="sidebar-header">
        <div className="logo-container" title="Notas Lab — Gestión Académica">
          <div className="logo-icon-box">
            <GraduationCap size={22} className="logo-icon" />
          </div>
          {!sidebarCollapsed && (
            <div className="logo-text-box">
              <span className="logo-title">Notas Lab</span>
              <span className="logo-subtitle">Gestión Académica</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="collapse-btn"
          title={sidebarCollapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'}
        >
          {sidebarCollapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
        </button>
      </div>

      {/* Menú de Navegación adaptado al rol */}
      <nav className="sidebar-nav">
        <div className="nav-group-label">
          {!sidebarCollapsed && (
            <span>
              {userRole === 'ADMIN' ? 'ADMINISTRACIÓN' : userRole === 'DOCENTE' ? 'DOCENCIA' : 'ESTUDIANTIL'}
            </span>
          )}
        </div>

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
              <Icon size={19} className="nav-icon" />
              {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Pie de navegación con estado de Base de Datos y Rol */}
      <div className="sidebar-footer">
        <div className="db-status-badge" title="Conectado a MySQL Notas_lab">
          <Database size={15} className="text-primary-600" />
          {!sidebarCollapsed && (
            <div className="db-status-text">
              <span className="db-name">-__-</span>
              <span className="db-badge">En línea</span>
            </div>
          )}
        </div>

        {!sidebarCollapsed && (
          <div className="sidebar-role-indicator">
            <ShieldCheck size={13} className="text-primary-700" />
            <span className="role-text">Rol: <strong>{userRole}</strong></span>
          </div>
        )}
      </div>

      <style>{`
        .sidebar {
          width: var(--sidebar-width);
          height: 100vh;
          background: #ffffff;
          border-right: 1px solid var(--border-light);
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          transition: width var(--transition-normal);
          z-index: 60;
          flex-shrink: 0;
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
          text-decoration: none;
        }
        .logo-icon-box {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: var(--primary-50);
          border: 1px solid var(--primary-200);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .logo-icon {
          color: var(--primary-600);
        }
        .logo-text-box {
          display: flex;
          flex-direction: column;
          line-height: 1.15;
          overflow: hidden;
        }
        .logo-title {
          font-size: 1.05rem;
          font-weight: 800;
          color: var(--navy-900);
          letter-spacing: -0.02em;
        }
        .logo-subtitle {
          font-size: 0.72rem;
          color: var(--text-muted);
          font-weight: 500;
        }
        .collapse-btn {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          border: 1px solid var(--border-light);
          background: var(--surface-ground);
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .collapse-btn:hover {
          background: var(--primary-50);
          color: var(--primary-700);
          border-color: var(--primary-200);
        }
        .sidebar-nav {
          flex: 1;
          padding: 1.25rem 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          overflow-y: auto;
        }
        .nav-group-label {
          font-size: 0.68rem;
          font-weight: 800;
          color: var(--text-light);
          letter-spacing: 0.08em;
          padding: 0 0.65rem 0.5rem 0.65rem;
        }
        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.6rem 0.75rem;
          border-radius: var(--radius-md);
          color: var(--text-muted);
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 600;
          transition: all var(--transition-fast);
        }
        .nav-link:hover {
          background: var(--surface-ground);
          color: var(--navy-900);
        }
        .nav-link-active {
          background: var(--primary-50);
          color: var(--primary-700);
          font-weight: 700;
        }
        .nav-link-active .nav-icon {
          color: var(--primary-600);
        }
        .nav-icon {
          flex-shrink: 0;
        }
        .sidebar-footer {
          padding: 1rem 0.75rem;
          border-top: 1px solid var(--border-light);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .db-status-badge {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.45rem 0.65rem;
          background: var(--surface-ground);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-light);
        }
        .db-status-text {
          display: flex;
          flex-direction: column;
          line-height: 1.1;
        }
        .db-name {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--navy-900);
        }
        .db-badge {
          font-size: 0.65rem;
          color: #059669;
          font-weight: 600;
        }
        .sidebar-role-indicator {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0 0.5rem;
          font-size: 0.72rem;
          color: var(--text-muted);
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
