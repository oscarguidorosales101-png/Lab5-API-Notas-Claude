import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar acción',
  mensaje = '¿Está seguro de que desea realizar esta acción? Esta operación no se puede deshacer.',
  confirmText = 'Eliminar',
  confirmVariant = 'danger',
  loading = false
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="460px">
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div style={{
          background: confirmVariant === 'danger' ? 'var(--danger-bg)' : 'var(--warning-bg)',
          color: confirmVariant === 'danger' ? 'var(--danger-text)' : 'var(--warning-text)',
          padding: '0.625rem',
          borderRadius: 'var(--radius-md)',
          display: 'flex'
        }}>
          <AlertTriangle size={24} />
        </div>
        <p style={{ margin: 0, color: 'var(--text-main)', fontSize: '0.925rem' }}>{mensaje}</p>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        <button
          onClick={onClose}
          className="btn btn-secondary"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          className={`btn btn-${confirmVariant}`}
          disabled={loading}
        >
          {loading ? 'Procesando...' : confirmText}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmModal;

