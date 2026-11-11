import React, { useState, useEffect } from 'react';
import usuariosService from '../services/usuarios.service';
import { useApp } from '../context/AppContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import Badge from '../components/Badge';
import { Users, UserPlus, Search, Edit2, Trash2, Eye, Shield, Mail } from 'lucide-react';

export const UsuariosPage = () => {
  const { notifySuccess, notifyError, cargarUsuarios } = useApp();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  // Modales
  const [modalCrearOpen, setModalCrearOpen] = useState(false);
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [modalEliminarOpen, setModalEliminarOpen] = useState(false);

  // Estados de formularios
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [detalleUsuario, setDetalleUsuario] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    password: '',
    rol: 'ESTUDIANTE'
  });

  const cargarLista = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await usuariosService.obtenerTodos();
      setUsuarios(data || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarLista();
  }, []);

  const handleCrearSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoadingAction(true);
      await usuariosService.crear(formData);
      notifySuccess(`Usuario ${formData.nombre} ${formData.apellidos} creado exitosamente`);
      setModalCrearOpen(false);
      setFormData({ nombre: '', apellidos: '', email: '', password: '', rol: 'ESTUDIANTE' });
      await cargarLista();
      await cargarUsuarios();
    } catch (err) {
      notifyError(err.message || 'Error al crear usuario');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleEditarSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoadingAction(true);
      const dataToUpdate = {
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        email: formData.email,
        rol: formData.rol
      };
      if (formData.password && formData.password.trim().length > 0) {
        dataToUpdate.password = formData.password.trim();
      }
      await usuariosService.actualizar(usuarioSeleccionado.id, dataToUpdate);
      notifySuccess('Usuario actualizado correctamente');
      setModalEditarOpen(false);
      await cargarLista();
      await cargarUsuarios();
    } catch (err) {
      notifyError(err.message || 'Error al actualizar usuario');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleEliminarConfirm = async () => {
    try {
      setLoadingAction(true);
      await usuariosService.eliminar(usuarioSeleccionado.id);
      notifySuccess('Usuario eliminado exitosamente');
      setModalEliminarOpen(false);
      await cargarLista();
      await cargarUsuarios();
    } catch (err) {
      notifyError(err.message || 'Error al eliminar usuario');
    } finally {
      setLoadingAction(false);
    }
  };

  const openEditarModal = (u) => {
    setUsuarioSeleccionado(u);
    setFormData({
      nombre: u.nombre,
      apellidos: u.apellidos,
      email: u.email,
      password: '',
      rol: u.rol
    });
    setModalEditarOpen(true);
  };

  const openDetalleModal = async (u) => {
    try {
      setLoadingAction(true);
      const detalle = await usuariosService.obtenerPorId(u.id);
      setDetalleUsuario(detalle);
      setModalDetalleOpen(true);
    } catch (err) {
      notifyError('No se pudo cargar el detalle del usuario');
    } finally {
      setLoadingAction(false);
    }
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const texto = `${u.nombre} ${u.apellidos} ${u.email} ${u.rol}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  });

  return (
    <div className="usuarios-page">
      <div className="card-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h2>Directorio de Usuarios</h2>
          <p>Administración de estudiantes, docentes y administradores del sistema</p>
        </div>
        <button
          onClick={() => {
            setFormData({ nombre: '', apellidos: '', email: '', password: '', rol: 'ESTUDIANTE' });
            setModalCrearOpen(true);
          }}
          className="btn btn-primary"
        >
          <UserPlus size={16} />
          <span>Registrar Usuario</span>
        </button>
      </div>

      <ErrorBanner error={error} onRetry={cargarLista} />

      {/* Barra de Filtros y Búsqueda */}
      <div className="card search-card">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por nombre, apellidos, correo electrónico o rol..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <span className="results-count">
          {usuariosFiltrados.length} {usuariosFiltrados.length === 1 ? 'usuario' : 'usuarios'} encontrados
        </span>
      </div>

      {/* Listado de Usuarios */}
      {loading ? (
        <LoadingSpinner mensaje="Cargando catálogo de usuarios..." />
      ) : usuariosFiltrados.length === 0 ? (
        <EmptyState
          icon={Users}
          titulo="No se encontraron usuarios"
          descripcion={busqueda ? 'No hay usuarios que coincidan con la búsqueda.' : 'Aún no se han registrado usuarios en el sistema.'}
          actionText={busqueda ? 'Limpiar búsqueda' : 'Registrar primer usuario'}
          onAction={busqueda ? () => setBusqueda('') : () => setModalCrearOpen(true)}
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Correo Electrónico</th>
                <th>Rol</th>
                <th>Fecha de Registro</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <div className="avatar-circle">
                        {u.nombre.charAt(0)}{u.apellidos.charAt(0)}
                      </div>
                      <div>
                        <strong>{u.nombre} {u.apellidos}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>ID #{u.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <Mail size={14} className="text-muted" />
                      <span>{u.email}</span>
                    </div>
                  </td>
                  <td>
                    <Badge status={u.rol} />
                  </td>
                  <td>
                    {new Date(u.createdAt).toLocaleDateString('es-CR', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.375rem' }}>
                      <button
                        onClick={() => openDetalleModal(u)}
                        className="btn btn-ghost btn-icon btn-sm"
                        title="Ver detalle completo"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => openEditarModal(u)}
                        className="btn btn-ghost btn-icon btn-sm"
                        title="Editar usuario"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setUsuarioSeleccionado(u);
                          setModalEliminarOpen(true);
                        }}
                        className="btn btn-ghost btn-icon btn-sm text-danger"
                        title="Eliminar usuario"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Crear Usuario */}
      <Modal isOpen={modalCrearOpen} onClose={() => setModalCrearOpen(false)} title="Registrar Nuevo Usuario">
        <form onSubmit={handleCrearSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej. Carlos"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Apellidos *</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.apellidos}
                onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                placeholder="Ej. Soto Alvarado"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Correo Electrónico Institucional *</label>
            <input
              type="email"
              className="form-input"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="estudiante@universidad.test"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña de Acceso * (mínimo 6 caracteres)</label>
            <input
              type="password"
              className="form-input"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
              La contraseña se cifrará con SHA-256 antes de guardarse en MySQL.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Rol en el Sistema *</label>
            <select
              className="form-select"
              value={formData.rol}
              onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
            >
              <option value="ESTUDIANTE">ESTUDIANTE</option>
              <option value="DOCENTE">DOCENTE</option>
              <option value="ADMIN">ADMIN (Administrador)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={() => setModalCrearOpen(false)}
              className="btn btn-secondary"
              disabled={loadingAction}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loadingAction}>
              {loadingAction ? 'Guardando en MySQL...' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Editar Usuario */}
      <Modal isOpen={modalEditarOpen} onClose={() => setModalEditarOpen(false)} title="Editar Usuario">
        <form onSubmit={handleEditarSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Nombre</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Apellidos</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.apellidos}
                onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Correo Electrónico</label>
            <input
              type="email"
              className="form-input"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Nueva Contraseña (dejar vacío para mantener la actual)</label>
            <input
              type="password"
              className="form-input"
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Opcional..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Rol</label>
            <select
              className="form-select"
              value={formData.rol}
              onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
            >
              <option value="ESTUDIANTE">ESTUDIANTE</option>
              <option value="DOCENTE">DOCENTE</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={() => setModalEditarOpen(false)}
              className="btn btn-secondary"
              disabled={loadingAction}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loadingAction}>
              {loadingAction ? 'Actualizando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Detalle de Usuario */}
      <Modal isOpen={modalDetalleOpen} onClose={() => setModalDetalleOpen(false)} title="Ficha del Usuario" maxWidth="640px">
        {detalleUsuario && (
          <div className="user-detail-content">
            <div className="detail-header-card">
              <div className="avatar-circle-large">
                {detalleUsuario.nombre.charAt(0)}{detalleUsuario.apellidos.charAt(0)}
              </div>
              <div>
                <h3>{detalleUsuario.nombre} {detalleUsuario.apellidos}</h3>
                <p>{detalleUsuario.email}</p>
                <Badge status={detalleUsuario.rol} />
              </div>
            </div>

            <h4 style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>
              Historial de Matrículas ({detalleUsuario.enrollments?.length || 0})
            </h4>
            {detalleUsuario.enrollments?.length === 0 ? (
              <p className="no-data-text">El usuario no tiene matrículas registradas.</p>
            ) : (
              <div className="table-container" style={{ marginBottom: '1.5rem' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Materia</th>
                      <th>Período</th>
                      <th>Estado</th>
                      <th>Nota</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalleUsuario.enrollments.map((enr) => (
                      <tr key={enr.id}>
                        <td><strong>{enr.subject?.codigo}</strong> {enr.subject?.nombre}</td>
                        <td>{enr.academicPeriod?.nombre}</td>
                        <td><Badge status={enr.estado} /></td>
                        <td>{enr.notaFinal !== null ? `${enr.notaFinal} pts` : 'Pendiente'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <h4>Notas y Apuntes Propios ({detalleUsuario.notes?.length || 0})</h4>
            {detalleUsuario.notes?.length === 0 ? (
              <p className="no-data-text">No ha redactado notas en el sistema.</p>
            ) : (
              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                {detalleUsuario.notes.map((n) => (
                  <li key={n.id} style={{ marginBottom: '0.25rem' }}>
                    <strong>{n.titulo}</strong> — <span style={{ color: 'var(--text-muted)' }}>{new Date(n.createdAt).toLocaleDateString('es-CR')}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Modal>

      {/* Modal: Confirmar Eliminación */}
      <ConfirmModal
        isOpen={modalEliminarOpen}
        onClose={() => setModalEliminarOpen(false)}
        onConfirm={handleEliminarConfirm}
        title="Eliminar Usuario"
        mensaje={`¿Confirma que desea eliminar permanentemente al usuario ${usuarioSeleccionado?.nombre} ${usuarioSeleccionado?.apellidos}? Sus matrículas y relaciones serán eliminadas en cascada.`}
        confirmText="Sí, eliminar"
        loading={loadingAction}
      />

      <style>{`
        .search-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.875rem 1.25rem;
          margin-bottom: 1.25rem;
          gap: 1rem;
        }
        .search-box {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          flex: 1;
        }
        .search-input {
          border: none;
          outline: none;
          font-family: inherit;
          font-size: 0.9rem;
          width: 100%;
          color: var(--text-main);
          background: transparent;
        }
        .search-icon {
          color: var(--text-light);
        }
        .results-count {
          font-size: 0.8rem;
          color: var(--text-muted);
          font-weight: 600;
          white-space: nowrap;
        }
        .avatar-circle {
          width: 34px;
          height: 34px;
          border-radius: var(--radius-full);
          background: var(--primary-100);
          color: var(--primary-700);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.8rem;
        }
        .avatar-circle-large {
          width: 52px;
          height: 52px;
          border-radius: var(--radius-full);
          background: var(--primary-100);
          color: var(--primary-700);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.2rem;
        }
        .detail-header-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem;
          background: var(--surface-ground);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
        }
      `}</style>
    </div>
  );
};

export default UsuariosPage;

