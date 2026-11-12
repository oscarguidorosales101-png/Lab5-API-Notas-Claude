import React, { useState, useEffect } from 'react';
import materiasService from '../services/materias.service';
import { useApp } from '../context/AppContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import Badge from '../components/Badge';
import { BookOpen, Plus, Search, Edit2, Trash2, Eye, GitBranch, Tag, ArrowRight } from 'lucide-react';

export const MateriasPage = () => {
  const { notifySuccess, notifyError } = useApp();
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  // Modales
  const [modalCrearOpen, setModalCrearOpen] = useState(false);
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [modalPrereqOpen, setModalPrereqOpen] = useState(false);
  const [modalEliminarOpen, setModalEliminarOpen] = useState(false);

  // Estados de trabajo
  const [materiaSeleccionada, setMateriaSeleccionada] = useState(null);
  const [detalleMateria, setDetalleMateria] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [prereqIdSeleccionado, setPrereqIdSeleccionado] = useState('');

  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    creditos: 3,
    notaMinimaAprobatoria: 70.0
  });

  const cargarLista = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await materiasService.obtenerTodas();
      setMaterias(data || []);
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
      await materiasService.crear({
        ...formData,
        creditos: Number(formData.creditos),
        notaMinimaAprobatoria: Number(formData.notaMinimaAprobatoria)
      });
      notifySuccess(`Materia ${formData.codigo} - ${formData.nombre} creada exitosamente`);
      setModalCrearOpen(false);
      setFormData({ codigo: '', nombre: '', descripcion: '', creditos: 3, notaMinimaAprobatoria: 70.0 });
      await cargarLista();
    } catch (err) {
      notifyError(err.message || 'Error al crear materia');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleEditarSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoadingAction(true);
      await materiasService.actualizar(materiaSeleccionada.id, {
        codigo: formData.codigo,
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        creditos: Number(formData.creditos),
        notaMinimaAprobatoria: Number(formData.notaMinimaAprobatoria)
      });
      notifySuccess('Materia actualizada correctamente');
      setModalEditarOpen(false);
      await cargarLista();
    } catch (err) {
      notifyError(err.message || 'Error al actualizar materia');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleEliminarConfirm = async () => {
    try {
      setLoadingAction(true);
      await materiasService.eliminar(materiaSeleccionada.id);
      notifySuccess('Materia eliminada exitosamente');
      setModalEliminarOpen(false);
      await cargarLista();
    } catch (err) {
      notifyError(err.message || 'Error al eliminar materia');
    } finally {
      setLoadingAction(false);
    }
  };

  const openDetalleModal = async (m) => {
    try {
      setLoadingAction(true);
      const det = await materiasService.obtenerPorId(m.id);
      setDetalleMateria(det);
      setModalDetalleOpen(true);
    } catch (err) {
      notifyError('No se pudo cargar el detalle de la materia');
    } finally {
      setLoadingAction(false);
    }
  };

  const openEditarModal = (m) => {
    setMateriaSeleccionada(m);
    setFormData({
      codigo: m.codigo,
      nombre: m.nombre,
      descripcion: m.descripcion || '',
      creditos: m.creditos || 3,
      notaMinimaAprobatoria: m.notaMinimaAprobatoria || 70.0
    });
    setModalEditarOpen(true);
  };

  const openPrereqModal = (m) => {
    setMateriaSeleccionada(m);
    setPrereqIdSeleccionado('');
    setModalPrereqOpen(true);
  };

  const handleAgregarPrerrequisito = async (e) => {
    e.preventDefault();
    if (!prereqIdSeleccionado) return;
    try {
      setLoadingAction(true);
      await materiasService.agregarPrerrequisito(materiaSeleccionada.id, Number(prereqIdSeleccionado));
      notifySuccess('Prerrequisito académico asignado con éxito');
      setModalPrereqOpen(false);
      await cargarLista();
    } catch (err) {
      notifyError(err.message || 'Error al asignar prerrequisito');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleEliminarPrerrequisito = async (subjectId, prereqId) => {
    try {
      setLoadingAction(true);
      await materiasService.eliminarPrerrequisito(subjectId, prereqId);
      notifySuccess('Prerrequisito removido');
      // Actualizar vista de detalle y lista principal
      const updated = await materiasService.obtenerPorId(subjectId);
      setDetalleMateria(updated);
      await cargarLista();
    } catch (err) {
      notifyError(err.message || 'Error al eliminar prerrequisito');
    } finally {
      setLoadingAction(false);
    }
  };

  const materiasFiltradas = materias.filter((m) => {
    const texto = `${m.codigo} ${m.nombre} ${m.descripcion || ''}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  });

  return (
    <div className="materias-page">
      <div className="card-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h2>Catálogo de Asignaturas</h2>
          <p>Malla curricular, créditos universitarios y relaciones de prerrequisitos</p>
        </div>
        <button
          onClick={() => {
            setFormData({ codigo: '', nombre: '', descripcion: '', creditos: 3, notaMinimaAprobatoria: 70.0 });
            setModalCrearOpen(true);
          }}
          className="btn btn-primary"
        >
          <Plus size={16} />
          <span>Registrar Materia</span>
        </button>
      </div>

      <ErrorBanner error={error} onRetry={cargarLista} />

      {/* Barra de Filtros y Búsqueda en Tiempo Real */}
      <div className="card search-card">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por código de asignatura, nombre o descripción..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => setBusqueda('')}
              className="btn-clear-search"
              title="Limpiar búsqueda"
            >
              &times;
            </button>
          )}
        </div>
        <span className="results-count">
          {materiasFiltradas.length} {materiasFiltradas.length === 1 ? 'materia' : 'materias'} disponibles
        </span>
      </div>

      {/* Grid de Materias */}
      {loading ? (
        <LoadingSpinner mensaje="Cargando asignaturas académicas..." />
      ) : materiasFiltradas.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          titulo="No se encontraron materias"
          descripcion={busqueda ? 'No hay materias que coincidan con la búsqueda.' : 'Aún no se han configurado materias en la malla curricular.'}
          actionText={busqueda ? 'Limpiar filtro' : 'Registrar primera materia'}
          onAction={busqueda ? () => setBusqueda('') : () => setModalCrearOpen(true)}
        />
      ) : (
        <div className="materias-grid">
          {materiasFiltradas.map((m) => {
            const numPrereqs = m.prerrequisitos?.length || 0;
            const numTemas = m.temas?.length || 0;

            return (
              <div key={m.id} className="card materia-card">
                <div className="materia-card-top">
                  <div className="materia-code-badge">{m.codigo}</div>
                  <div className="materia-credits">{m.creditos} Créditos</div>
                </div>

                <h3 className="materia-card-title">{m.nombre}</h3>
                <p className="materia-card-desc">
                  {m.descripcion || 'Sin descripción detallada registrada para esta materia.'}
                </p>

                {/* Etiquetas de Prerrequisitos y Temas */}
                <div className="materia-tags-box">
                  <div className="materia-tag-item">
                    <GitBranch size={14} className="text-primary" />
                    <span>{numPrereqs} {numPrereqs === 1 ? 'Prerrequisito' : 'Prerrequisitos'}</span>
                  </div>
                  <div className="materia-tag-item">
                    <Tag size={14} className="text-primary" />
                    <span>{numTemas} {numTemas === 1 ? 'Tema' : 'Temas'}</span>
                  </div>
                  <div className="materia-tag-item">
                    <span>Mín: <strong>{m.notaMinimaAprobatoria || 70} pts</strong></span>
                  </div>
                </div>

                {/* Prerrequisitos listados visualmente si existen */}
                {numPrereqs > 0 && (
                  <div className="prereqs-pills-container">
                    <span className="prereq-label">Requiere:</span>
                    {m.prerrequisitos.map((p) => (
                      <span key={p.prerequisite.id} className="badge badge-warning" title={p.prerequisite.nombre}>
                        {p.prerequisite.codigo}
                      </span>
                    ))}
                  </div>
                )}

                {/* Acciones de Tarjeta */}
                <div className="materia-card-actions">
                  <button
                    onClick={() => openDetalleModal(m)}
                    className="btn btn-secondary btn-sm"
                    title="Ver detalle curricular"
                  >
                    <Eye size={15} />
                    <span>Detalle</span>
                  </button>
                  <button
                    onClick={() => openPrereqModal(m)}
                    className="btn btn-ghost btn-sm"
                    title="Vincular prerrequisito"
                  >
                    <GitBranch size={15} />
                    <span>Prerrequisitos</span>
                  </button>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.25rem' }}>
                    <button
                      onClick={() => openEditarModal(m)}
                      className="btn btn-ghost btn-icon btn-sm"
                      title="Editar materia"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => {
                        setMateriaSeleccionada(m);
                        setModalEliminarOpen(true);
                      }}
                      className="btn btn-ghost btn-icon btn-sm text-danger"
                      title="Eliminar materia"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Crear Materia */}
      <Modal isOpen={modalCrearOpen} onClose={() => setModalCrearOpen(false)} title="Registrar Materia en Catálogo">
        <form onSubmit={handleCrearSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Código Único *</label>
              <input
                type="text"
                className="form-input"
                required
                maxLength={20}
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                placeholder="Ej. QUI-201"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nombre de Asignatura *</label>
              <input
                type="text"
                className="form-input"
                required
                maxLength={150}
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej. Química General"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Descripción Académica</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Objetivos de aprendizaje, temario general y contenidos..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Créditos Académicos (1 a 30) *</label>
              <input
                type="number"
                className="form-input"
                required
                min={1}
                max={30}
                value={formData.creditos}
                onChange={(e) => setFormData({ ...formData, creditos: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nota Mínima Aprobatoria (0 a 100) *</label>
              <input
                type="number"
                step="0.1"
                className="form-input"
                required
                min={0}
                max={100}
                value={formData.notaMinimaAprobatoria}
                onChange={(e) => setFormData({ ...formData, notaMinimaAprobatoria: e.target.value })}
              />
            </div>
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
              {loadingAction ? 'Guardando...' : 'Crear Asignatura'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Editar Materia */}
      <Modal isOpen={modalEditarOpen} onClose={() => setModalEditarOpen(false)} title="Editar Materia">
        <form onSubmit={handleEditarSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Código</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
              />
            </div>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Créditos</label>
              <input
                type="number"
                className="form-input"
                required
                min={1}
                max={30}
                value={formData.creditos}
                onChange={(e) => setFormData({ ...formData, creditos: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nota Mínima Aprobatoria</label>
              <input
                type="number"
                step="0.1"
                className="form-input"
                required
                min={0}
                max={100}
                value={formData.notaMinimaAprobatoria}
                onChange={(e) => setFormData({ ...formData, notaMinimaAprobatoria: e.target.value })}
              />
            </div>
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

      {/* Modal: Administrar Prerrequisitos */}
      <Modal
        isOpen={modalPrereqOpen}
        onClose={() => setModalPrereqOpen(false)}
        title={`Prerrequisitos de ${materiaSeleccionada?.codigo} - ${materiaSeleccionada?.nombre}`}
        maxWidth="520px"
      >
        <form onSubmit={handleAgregarPrerrequisito}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Un estudiante deberá tener aprobada esta materia previa para poder matricularse en <strong>{materiaSeleccionada?.nombre}</strong>.
          </p>

          <div className="form-group">
            <label className="form-label">Seleccione la Materia Prerrequisito *</label>
            <select
              className="form-select"
              required
              value={prereqIdSeleccionado}
              onChange={(e) => setPrereqIdSeleccionado(e.target.value)}
            >
              <option value="">-- Seleccionar asignatura --</option>
              {materias
                .filter((m) => m.id !== materiaSeleccionada?.id)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.codigo} — {m.nombre} ({m.creditos} Créditos)
                  </option>
                ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={() => setModalPrereqOpen(false)}
              className="btn btn-secondary"
              disabled={loadingAction}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loadingAction}>
              {loadingAction ? 'Asignando...' : 'Asignar Prerrequisito'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Detalle Completo de Materia */}
      <Modal
        isOpen={modalDetalleOpen}
        onClose={() => setModalDetalleOpen(false)}
        title="Ficha Técnica Curricular"
        maxWidth="680px"
      >
        {detalleMateria && (
          <div className="materia-detail-container">
            <div className="detail-top-card">
              <span className="badge badge-info">{detalleMateria.codigo}</span>
              <h3>{detalleMateria.nombre}</h3>
              <p>{detalleMateria.descripcion || 'Sin descripción registrada.'}</p>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.85rem' }}>
                <span>Créditos: <strong>{detalleMateria.creditos}</strong></span>
                <span>Nota mínima: <strong>{detalleMateria.notaMinimaAprobatoria} pts</strong></span>
              </div>
            </div>

            {/* Prerrequisitos de la Materia */}
            <h4 style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>
              Prerrequisitos Obligatorios ({detalleMateria.prerrequisitos?.length || 0})
            </h4>
            {detalleMateria.prerrequisitos?.length === 0 ? (
              <p className="no-data-text">Esta materia no exige prerrequisitos de ingreso.</p>
            ) : (
              <div className="table-container" style={{ marginBottom: '1.25rem' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Asignatura Requisito</th>
                      <th>Nota Mínima Exigida</th>
                      <th style={{ textAlign: 'right' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalleMateria.prerrequisitos.map((p) => (
                      <tr key={p.id}>
                        <td><strong>{p.prerequisite.codigo}</strong></td>
                        <td>{p.prerequisite.nombre}</td>
                        <td>{p.prerequisite.notaMinimaAprobatoria} pts</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => handleEliminarPrerrequisito(detalleMateria.id, p.prerequisite.id)}
                            className="btn btn-ghost btn-sm text-danger"
                            title="Desvincular prerrequisito"
                          >
                            <Trash2 size={14} /> Desvincular
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Materias de las que es Prerrequisito */}
            <h4>Es Prerrequisito De ({detalleMateria.esPrerrequisitoDe?.length || 0})</h4>
            {detalleMateria.esPrerrequisitoDe?.length === 0 ? (
              <p className="no-data-text">No es requisito de asignaturas posteriores.</p>
            ) : (
              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', marginTop: '0.5rem', marginBottom: '1.25rem' }}>
                {detalleMateria.esPrerrequisitoDe.map((p) => (
                  <li key={p.id}>
                    <strong>{p.subject.codigo}</strong> — {p.subject.nombre}
                  </li>
                ))}
              </ul>
            )}

            {/* Temas Asociados */}
            <h4>Temas Académicos ({detalleMateria.temas?.length || 0})</h4>
            {detalleMateria.temas?.length === 0 ? (
              <p className="no-data-text">No hay temas clasificados para esta materia.</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                {detalleMateria.temas.map((t) => (
                  <span key={t.id} className="badge badge-neutral" style={{ textTransform: 'none', fontSize: '0.8rem' }}>
                    {t.nombre}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal: Confirmar Eliminación */}
      <ConfirmModal
        isOpen={modalEliminarOpen}
        onClose={() => setModalEliminarOpen(false)}
        onConfirm={handleEliminarConfirm}
        title="Eliminar Asignatura"
        mensaje={`¿Confirma que desea eliminar la asignatura ${materiaSeleccionada?.codigo} - ${materiaSeleccionada?.nombre}? Sus prerrequisitos y registros dependientes se actualizarán de forma atómica.`}
        confirmText="Sí, eliminar"
        loading={loadingAction}
      />

      <style>{`
        .materias-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.25rem;
        }
        .materia-card {
          display: flex;
          flex-direction: column;
          padding: 1.35rem;
          height: 100%;
        }
        .materia-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }
        .materia-code-badge {
          font-weight: 800;
          font-size: 0.85rem;
          color: var(--primary-800);
          background: var(--primary-100);
          padding: 0.25rem 0.625rem;
          border-radius: var(--radius-sm);
          letter-spacing: 0.03em;
        }
        .materia-credits {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-muted);
        }
        .materia-card-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 0.5rem;
          line-height: 1.3;
        }
        .materia-card-desc {
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.45;
          margin-bottom: 1rem;
          flex: 1;
        }
        .materia-tags-box {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 0.75rem;
          background: var(--surface-ground);
          border-radius: var(--radius-md);
          font-size: 0.78rem;
          color: var(--text-muted);
          margin-bottom: 0.875rem;
        }
        .materia-tag-item {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
        .prereqs-pills-container {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.375rem;
          margin-bottom: 1rem;
        }
        .prereq-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-light);
          text-transform: uppercase;
        }
        .materia-card-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border-top: 1px solid var(--border-light);
          padding-top: 0.875rem;
          margin-top: auto;
        }
        .detail-top-card {
          padding: 1.25rem;
          background: var(--surface-ground);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
        }
      `}</style>
    </div>
  );
};

export default MateriasPage;

