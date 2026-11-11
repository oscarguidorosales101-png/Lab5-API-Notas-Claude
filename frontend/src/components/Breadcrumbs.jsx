import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const routeNames = {
  'materias': 'Materias',
  'matriculas': 'Matrículas',
  'calificaciones': 'Calificaciones',
  'notas': 'Notas y Apuntes',
  'temas': 'Temas Académicos',
  'periodos': 'Períodos',
  'ia': 'Asistente IA',
  'consumo': 'Consumo y Costos',
  'usuarios': 'Usuarios'
};

export const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <Link to="/" className="breadcrumb-item breadcrumb-home" title="Inicio">
        <Home size={15} />
      </Link>
      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const displayName = routeNames[value] || (isNaN(value) ? value : `#${value}`);

        return (
          <React.Fragment key={to}>
            <ChevronRight size={13} className="breadcrumb-separator" />
            {isLast ? (
              <span className="breadcrumb-item breadcrumb-active">{displayName}</span>
            ) : (
              <Link to={to} className="breadcrumb-item">
                {displayName}
              </Link>
            )}
          </React.Fragment>
        );
      })}
      <style>{`
        .breadcrumbs {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.8125rem;
          color: var(--text-muted);
        }
        .breadcrumb-item {
          display: inline-flex;
          align-items: center;
          color: var(--text-muted);
          font-weight: 500;
          transition: color var(--transition-fast);
        }
        .breadcrumb-item:hover {
          color: var(--primary-600);
        }
        .breadcrumb-active {
          color: var(--text-main);
          font-weight: 600;
          pointer-events: none;
        }
        .breadcrumb-separator {
          color: #cbd5e1;
          flex-shrink: 0;
        }
      `}</style>
    </nav>
  );
};

export default Breadcrumbs;

