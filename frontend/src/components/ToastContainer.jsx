import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContainer = () => {
  const { toasts, removeToast } = useApp();

  if (!toasts || toasts.length === 0) return null;

  const getIcon = (tipo) => {
    switch (tipo) {
      case 'success':
        return <CheckCircle2 className="toast-icon text-success" size={20} />;
      case 'error':
        return <AlertCircle className="toast-icon text-danger" size={20} />;
      case 'warning':
        return <AlertTriangle className="toast-icon text-warning" size={20} />;
      default:
        return <Info className="toast-icon text-info" size={20} />;
    }
  };

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.tipo}`}>
          <div className="toast-content">
            {getIcon(toast.tipo)}
            <span className="toast-message">{toast.mensaje}</span>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="toast-close"
            title="Cerrar notificación"
          >
            <X size={16} />
          </button>
        </div>
      ))}
      <style>{`
        .toast-container {
          position: fixed;
          top: 1.5rem;
          right: 1.5rem;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-width: 420px;
          pointer-events: none;
        }
        .toast {
          pointer-events: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          padding: 0.875rem 1.125rem;
          background: #ffffff;
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          border-left: 4px solid #0ea5e9;
          animation: slideIn 0.25s ease-out;
        }
        .toast-success { border-left-color: #10b981; }
        .toast-error { border-left-color: #ef4444; }
        .toast-warning { border-left-color: #f59e0b; }
        .toast-info { border-left-color: #0ea5e9; }
        .toast-content {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          font-size: 0.875rem;
          color: #0f172a;
          font-weight: 500;
        }
        .text-success { color: #10b981; }
        .text-danger { color: #ef4444; }
        .text-warning { color: #f59e0b; }
        .text-info { color: #0ea5e9; }
        .toast-close {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          padding: 0.25rem;
          border-radius: var(--radius-sm);
        }
        .toast-close:hover {
          color: #0f172a;
          background: #f1f5f9;
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ToastContainer;

