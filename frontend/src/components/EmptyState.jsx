import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Inbox,
  titulo = 'No hay registros disponibles',
  descripcion = 'Aún no se han registrado datos para esta sección.',
  actionText,
  onAction
}) => {
  return (
    <div className="empty-state">
      <Icon className="empty-icon" />
      <h3 style={{ fontSize: '1.05rem', marginBottom: '0.375rem' }}>{titulo}</h3>
      <p style={{ maxWidth: '360px', marginBottom: onAction ? '1.25rem' : '0' }}>{descripcion}</p>
      {onAction && actionText && (
        <button onClick={onAction} className="btn btn-primary btn-sm">
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;

