import React, { useState, useEffect } from 'react';
import temasService from '../services/temas.service';
import materiasService from '../services/materias.service';
import { useApp } from '../context/AppContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { Tag, Plus, Edit2, Trash2, BookOpen, Layers } from 'lucide-react';

export const TemasPage = () => {
  const { notifySuccess, notifyError } = useApp();
  const [temas, setTemas] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [filtroMateria, setFiltroMateria] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modales
  const [modalCrearOpen, setModalCrearOpen] = useState(false);
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [modalEliminarOpen, setModalEliminarOpen] = useState(false);

  const [temaSeleccionado, setTemaSeleccionado] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    subjectId: ''
  });

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      const [tms, mats] = await Promise.all([
        temasService.obtenerTodos(filtroMateria || null),
        materiasService.obtenerTodas().catch(() => [])
      ]);
      setTemas(tms || []);
      setMaterias(mats || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [filtroMateria]);

  const handleCrearSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoadingAction(true);
      const payload = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion?.trim() || undefined,
        subjectId: formData.subjectId ? Number(formData.subjectId) : undefined
      };
      await temasService.crear(payload);
      notifySuccess('Tema académico creado con éxito');
      setModalCrearOpen(false);
      setFormData({ nombre: '', descripcion: '', subjectId: '' });
      await cargarDatos();
    } catch (err) {
      notifyError(err.message || 'Error al crear tema');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleEditarSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoadingAction(true);
      const payload = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion?.trim() || undefined,
        subjectId: formData.subjectId ? Number(formData.subjectId) : null
      };
      await temasService.actualizar(temaSeleccionado.id, payload);
      notifySuccess('Tema actualizado exitosamente');
      setModalEditarOpen(false);
      await cargarDatos();
    } catch (err) {
      notifyError(err.message || 'Error al actualizar tema');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleEliminarConfirm = async () => {
    try {
      setLoadingAction(true);
      await temasService.eliminar(temaSeleccionado.id);
      notifySuccess('Tema académico eliminado');
      setModalEliminarOpen(false);
      await cargarDatos();
    } catch (err) {
      notifyError(err.message || 'Error al eliminar tema');
    } finally {
      setLoadingAction(false);
    }
  };

  const openEditarModal = (t) => {
    setTemaSeleccionado(t);
    setFormData({
      nombre: t.nombre,
      descripcion: t.descripcion || '',
      subjectId: t.subjectId ? String(t.subjectId) : ''
    });
    setModalEditarOpen(true);
  };

  return (
    <div className="temas-page">
      <div className="card-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h2>Temas Académicos</h2>
          <p>Clasificación de unidades temáticas para materias y apuntes de estudio</p>
        </div>
        <button
          onClick={() => {
            setFormData({ nombre: '', descripcion: '', subjectId: materias[0]?.id ? String(materias[0].id) : '' });
            setModalCrearOpen(true);
          }}
          className="btn btn-primary"
        >
          <Plus size={16} />
          <span>Nuevo Tema</span>
        </button>
      </div>

      <ErrorBanner error={error} onRetry={cargarDatos} />

      {/* Filtro por Materia */}
      <div className="card filter-card">
        <label className="form-label" style={{ marginBottom: 0 }}>Filtrar por Materia:</label>
        <select
          className="form-select"
          style={{ maxWidth: '380px' }}
          value={filtroMateria}
          onChange={(e) => setFiltroMateria(e.target.value)}
        >
          <option value="">-- Todos los Temas --</option>
          {materias.map((m) => (
            <option key={m.id} value={m.id}>
              {m.codigo} — {m.nombre}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner mensaje="Cargando temas académicos..." />
      ) : temas.length === 0 ? (
        <EmptyState
          icon={Tag}
          titulo="No hay temas registrados"
          descripcion="Organice sus asignaturas creando unidades temáticas como Álgebra, Enlaces o Cinética."
          actionText="Crear Primer Tema"
          onAction={() => setModalCrearOpen(true)}
        />
      ) : (
        <div className="temas-grid">
          {temas.map((t) => (
            <div key={t.id} className="card tema-card">
              <div className="tema-card-top">
                <div className="tema-icon-box">
                  <Tag size={18} />
                </div>
                {t.materia ? (
                  <span className="badge badge-info">{t.materia.codigo}</span>
                ) : (
                  <span className="badge badge-neutral">General</span>
                )}
              </div>

              <h3 className="tema-title">{t.nombre}</h3>
              <p className="tema-desc">{t.descripcion || 'Sin descripción temática.'}</p>

              {t.materia && (
                <div className="tema-materia-info">
                  <BookOpen size={14} className="text-muted" />
                  <span>{t.materia.nombre}</span>
                </div>
              )}

              <div className="tema-card-footer">
                <span className="tema-notes-count">
                  {t.notes?.length || 0} {(t.notes?.length === 1) ? 'apunte' : 'apuntes'}
                </span>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button
                    onClick={() => openEditarModal(t)}
                    className="btn btn-ghost btn-icon btn-sm"
                    title="Editar tema"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => {
                      setTemaSeleccionado(t);
                      setModalEliminarOpen(true);
                    }}
                    className="btn btn-ghost btn-icon btn-sm text-danger"
                    title="Eliminar tema"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Crear Tema */}
      <Modal isOpen={modalCrearOpen} onClose={() => setModalCrearOpen(false)} title="Crear Tema Académico">
        <form onSubmit={handleCrearSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre del Tema * (ej. Álgebra Lineal, Estequiometría...)</label>
            <input
              type="text"
              className="form-input"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Nombre del tema..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Materia Perteneciente (Opcional)</label>
            <select
              className="form-select"
              value={formData.subjectId}
              onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
            >
              <option value="">-- Sin materia asignada (General) --</option>
              {materias.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.codigo} — {m.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Descripción del Tema</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Objetivos o alcance conceptual de este tema..."
            />
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
              {loadingAction ? 'Guardando...' : 'Crear Tema'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Editar Tema */}
      <Modal isOpen={modalEditarOpen} onClose={() => setModalEditarOpen(false)} title="Modificar Tema Académico">
        <form onSubmit={handleEditarSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre del Tema</label>
            <input
              type="text"
              className="form-input"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Materia Perteneciente</label>
            <select
              className="form-select"
              value={formData.subjectId}
              onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
            >
              <option value="">-- Sin materia asignada (General) --</option>
              {materias.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.codigo} — {m.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            />
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

      {/* Modal: Confirmar Eliminación */}
      <ConfirmModal
        isOpen={modalEliminarOpen}
        onClose={() => setModalEliminarOpen(false)}
        onConfirm={handleEliminarConfirm}
        title="Eliminar Tema"
        mensaje={`¿Confirma que desea eliminar el tema '${temaSeleccionado?.nombre}'? Las notas asociadas mantendrán su contenido pero perderán este clasificador.`}
        confirmText="Eliminar Tema"
        loading={loadingAction}
      />

      <style>{`
        .filter-card {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          padding: 1rem 1.25rem;
          margin-bottom: 1.25rem;
        }
        .temas-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.25rem;
        }
        .tema-card {
          display: flex;
          flex-direction: column;
          padding: 1.25rem;
          height: 100%;
        }
        .tema-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }
        .tema-icon-box {
          padding: 0.5rem;
          background: var(--primary-50);
          color: var(--primary-600);
          border-radius: var(--radius-md);
          display: flex;
        }
        .tema-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 0.35rem;
        }
        .tema-desc {
          font-size: 0.825rem;
          color: var(--text-muted);
          line-height: 1.4;
          margin-bottom: 0.75rem;
          flex: 1;
        }
        .tema-materia-info {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.78rem;
          color: var(--primary-800);
          margin-bottom: 0.75rem;
        }
        .tema-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid var(--border-light);
          padding-top: 0.75rem;
          margin-top: auto;
        }
        .tema-notes-count {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-light);
        }
      `}</style>
    </div>
  );
};

export default TemasPage;

