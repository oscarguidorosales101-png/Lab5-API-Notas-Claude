import React from 'react';

export const LoadingSpinner = ({ mensaje = 'Cargando datos...', size = 'normal' }) => {
  return (
    <div className="loading-container">
      <div className={`spinner ${size === 'small' ? 'spinner-sm' : ''}`}></div>
      {mensaje && <p className="loading-text">{mensaje}</p>}
      <style>{`
        .spinner-sm {
          width: 20px;
          height: 20px;
          border-width: 2px;
        }
        .loading-text {
          font-size: 0.875rem;
          color: var(--text-muted);
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;

