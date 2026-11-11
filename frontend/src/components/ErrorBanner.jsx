import React from 'react';
import { AlertCircle, XCircle } from 'lucide-react';

export const ErrorBanner = ({ error, onRetry }) => {
  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message || 'Ha ocurrido un error inesperado';
  const detalles = error.detalles || [];

  return (
    <div className="error-banner">
      <AlertCircle size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600 }}>{errorMessage}</div>
        {detalles.length > 0 && (
          <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', fontSize: '0.84rem' }}>
            {detalles.map((d, index) => (
              <li key={index}>
                {d.campo ? <strong>{d.campo}: </strong> : ''}
                {d.mensaje || (d.nombre ? `${d.nombre} (${d.codigo})` : JSON.stringify(d))}
              </li>
            ))}
          </ul>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className="btn btn-secondary btn-sm"
            style={{ marginTop: '0.75rem', borderColor: '#fca5a5' }}
          >
            Reintentar
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorBanner;

