import React from 'react';

export const Badge = ({ status, variant, children }) => {
  const value = children || status;
  let computedVariant = variant || 'neutral';

  if (!variant && status) {
    const s = String(status).toUpperCase();
    if (s === 'APROBADA' || s === 'ACTIVO' || s === 'COMPLETADO') {
      computedVariant = 'success';
    } else if (s === 'REPROBADA' || s === 'INACTIVO' || s === 'RECHAZADA') {
      computedVariant = 'danger';
    } else if (s === 'ACTIVA' || s === 'PENDIENTE') {
      computedVariant = 'info';
    } else if (s === 'ADMIN') {
      computedVariant = 'warning';
    } else if (s === 'DOCENTE') {
      computedVariant = 'info';
    } else if (s === 'ESTUDIANTE') {
      computedVariant = 'success';
    }
  }

  return (
    <span className={`badge badge-${computedVariant}`}>
      {value}
    </span>
  );
};

export default Badge;

