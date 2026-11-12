import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { GraduationCap, ShieldCheck, UserCheck, BookOpen, Key, Mail, ArrowRight, Sparkles } from 'lucide-react';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, cambiarCuentaDemo, cuentasDemo, loadingAuth } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Por favor complete todos los campos');
      return;
    }
    setErrorMsg('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setErrorMsg(err.message || 'Error al autenticar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoSelect = async (demoEmail) => {
    setErrorMsg('');
    setSubmitting(true);
    try {
      await cambiarCuentaDemo(demoEmail);
      navigate('/');
    } catch (err) {
      setErrorMsg(err.message || 'Error al iniciar sesión con cuenta demo');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-card-container">
        {/* Encabezado Institucional */}
        <div className="login-header">
          <div className="login-logo-box">
            <GraduationCap size={36} className="text-primary-600" />
          </div>
          <h1 className="login-title">Notas Lab</h1>
          <p className="login-subtitle">Sistema Universitario de Gestión Académica e Inteligencia Artificial</p>
        </div>

        {errorMsg && (
          <div className="login-error-alert">
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulario de Login Estándar */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              <Mail size={15} /> Correo Electrónico Institucional
            </label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="usuario@universidad.test"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting || loadingAuth}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">
              <Key size={15} /> Contraseña
            </label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting || loadingAuth}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={submitting || loadingAuth}
          >
            {submitting ? 'Autenticando...' : 'Iniciar Sesión'}
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Sección de Cuentas de Demostración para Evaluación en 1 Clic */}
        <div className="demo-accounts-section">
          <div className="demo-divider">
            <span className="demo-divider-text">
              <Sparkles size={14} className="text-primary-600" /> Cuentas de Evaluación Rápida (1 Clic)
            </span>
          </div>

          <p className="demo-help-text">
            Selecciona cualquiera de los roles institucionales preconfigurados para ingresar al sistema sin escribir credenciales:
          </p>

          <div className="demo-grid">
            {/* Administrador */}
            <button
              type="button"
              className="demo-card demo-card-admin"
              onClick={() => handleDemoSelect('admin@universidad.test')}
              disabled={submitting || loadingAuth}
            >
              <div className="demo-card-icon admin-icon">
                <ShieldCheck size={20} />
              </div>
              <div className="demo-card-details">
                <span className="demo-card-role">ADMINISTRADOR</span>
                <span className="demo-card-name">Admin Sistema</span>
                <span className="demo-card-email">admin@universidad.test</span>
                <span className="demo-card-desc">Control total: usuarios, materias, períodos y auditoría IA</span>
              </div>
            </button>

            {/* Docente */}
            <button
              type="button"
              className="demo-card demo-card-docente"
              onClick={() => handleDemoSelect('profesor.garcia@universidad.test')}
              disabled={submitting || loadingAuth}
            >
              <div className="demo-card-icon docente-icon">
                <BookOpen size={20} />
              </div>
              <div className="demo-card-details">
                <span className="demo-card-role">DOCENTE</span>
                <span className="demo-card-name">Prof. Carlos García</span>
                <span className="demo-card-email">profesor.garcia@universidad.test</span>
                <span className="demo-card-desc">Asignación de calificaciones, notas y pedagogía IA</span>
              </div>
            </button>

            {/* Estudiante Aprobado */}
            <button
              type="button"
              className="demo-card demo-card-estudiante"
              onClick={() => handleDemoSelect('estudiante.aprobado@universidad.test')}
              disabled={submitting || loadingAuth}
            >
              <div className="demo-card-icon estudiante-icon">
                <UserCheck size={20} />
              </div>
              <div className="demo-card-details">
                <span className="demo-card-role">ESTUDIANTE</span>
                <span className="demo-card-name">María Rodríguez</span>
                <span className="demo-card-email">estudiante.aprobado@universidad.test</span>
                <span className="demo-card-desc">Consultas de matrículas, notas, apuntes y tutoría IA</span>
              </div>
            </button>
          </div>
        </div>

        <div className="login-footer">
          <p>Conectado a base de datos real: <strong>MySQL Notas_lab</strong> (Puerto 3306)</p>
        </div>
      </div>

      <style>{`
        .login-page-wrapper {
          min-height: 100vh;
          width: 100%;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f8fafc 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2.5rem 1rem;
        }
        .login-card-container {
          width: 100%;
          max-width: 580px;
          background: #ffffff;
          border-radius: var(--radius-xl);
          border: 1px solid var(--border-light);
          box-shadow: var(--shadow-xl);
          padding: 2.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
        }
        .login-header {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .login-logo-box {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          background: var(--primary-50);
          border: 1px solid var(--primary-200);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
          box-shadow: var(--shadow-sm);
        }
        .login-title {
          font-size: 1.85rem;
          font-weight: 800;
          color: var(--navy-900);
          letter-spacing: -0.025em;
          margin-bottom: 0.35rem;
        }
        .login-subtitle {
          font-size: 0.925rem;
          color: var(--text-muted);
          max-width: 400px;
        }
        .login-error-alert {
          background: var(--danger-bg);
          border: 1px solid var(--danger-border);
          color: var(--danger-text);
          padding: 0.85rem 1rem;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: 500;
        }
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .form-label {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--navy-800);
        }
        .form-input {
          height: 44px;
          padding: 0 1rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-light);
          font-size: 0.95rem;
          color: var(--text-main);
          background: #ffffff;
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
        }
        .form-input:focus {
          border-color: var(--primary-500);
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15);
          outline: none;
        }
        .btn-block {
          width: 100%;
          justify-content: center;
        }
        .btn-lg {
          height: 48px;
          font-size: 1rem;
          font-weight: 600;
        }
        .demo-accounts-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding-top: 0.5rem;
        }
        .demo-divider {
          display: flex;
          align-items: center;
          justify-content: center;
          border-top: 1px solid var(--border-light);
          position: relative;
          margin-top: 0.5rem;
        }
        .demo-divider-text {
          position: absolute;
          background: #ffffff;
          padding: 0 0.85rem;
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--navy-800);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .demo-help-text {
          font-size: 0.825rem;
          color: var(--text-muted);
          text-align: center;
          margin-top: 0.5rem;
        }
        .demo-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.75rem;
        }
        .demo-card {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 0.85rem 1rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-light);
          background: #ffffff;
          cursor: pointer;
          text-align: left;
          transition: all var(--transition-fast);
        }
        .demo-card:hover:not(:disabled) {
          border-color: var(--primary-400);
          background: var(--primary-50);
          transform: translateY(-1px);
          box-shadow: var(--shadow-sm);
        }
        .demo-card-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .admin-icon {
          background: #fef3c7;
          color: #b45309;
        }
        .docente-icon {
          background: #ede9fe;
          color: #6d28d9;
        }
        .estudiante-icon {
          background: #e0f2fe;
          color: #0284c7;
        }
        .demo-card-details {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }
        .demo-card-role {
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          color: var(--primary-700);
        }
        .demo-card-name {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--navy-900);
        }
        .demo-card-email {
          font-size: 0.78rem;
          font-family: monospace;
          color: var(--text-muted);
        }
        .demo-card-desc {
          font-size: 0.75rem;
          color: var(--text-light);
          margin-top: 0.15rem;
        }
        .login-footer {
          text-align: center;
          font-size: 0.78rem;
          color: var(--text-light);
          border-top: 1px solid var(--border-light);
          padding-top: 1rem;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;

