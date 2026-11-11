import React, { useState, useEffect } from 'react';
import periodosService from '../services/periodos.service';
import { useApp } from '../context/AppContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import Badge from '../components/Badge';
import { Calendar, Plus, Edit2, Trash2, CheckCircle2, XCircle } from 'lucide-react';

export const PeriodosPage = () => {
  const { notifySuccess, notifyError } = useApp();
  const [periodos, setPeriodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalCrearOpen, setModalCrearOpen] = useState(false);
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [modalEliminarOpen, setModalEliminarOpen] = useState(false);

  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    fechaInicio: '',
    fechaFin: '',
    anio: new Date().getFullYear(),
    periodo: '1C',
    activo: true
  });

  const cargarLista = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await periodosService.obtenerTodos();
      setPeriodos(data || []);
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
      await periodosService.crear({
        ...formData,
        anio: Number(formData.anio)
      });
      notifySuccess('Período académico creado exitosamente');
      setModalCrearOpen(false);
      await cargarLista();
    } catch (err) {
      notifyError(err.message || 'Error al crear período');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleEditarSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoadingAction(true);
      await periodosService.actualizar(periodoSeleccionado.id, {
        nombre: formData.nombre,
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin,
        anio: Number(formData.anio),
        periodo: formData.periodo,
        activo: Boolean(formData.activo)
      });
      notifySuccess('Período académico actualizado');
      setModalEditarOpen(false);
      await cargarLista();
    } catch (err) {
      notifyError(err.message || 'Error al actualizar período');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleEliminarConfirm = async () => {
    try {
      setLoadingAction(true);
      await periodosService.eliminar(periodoSeleccionado.id);
      notifySuccess('Período académico eliminado');
      setModalEliminarOpen(false);
      await cargarLista();
    } catch (err) {
      notifyError(err.message || 'Error al eliminar período');
    } finally {
      setLoadingAction(false);
    }
  };

  const openEditarModal = (p) => {
    setPeriodoSeleccionado(p);
    setFormData({
      nombre: p.nombre,
      fechaInicio: p.fechaInicio ? new Date(p.fechaInicio).toISOString().split('T')[0] : '',
      fechaFin: p.fechaFin ? new Date(p.fechaFin).toISOString().split('T')[0] : '',
      anio: p.anio,
      periodo: p.periodo,
      activo: p.activo
    });
    setModalEditarOpen(true);
  };

  return (
    <div className="periodos-page">
      <div className="card-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h2>Períodos y Ciclos Lectivos</h2>
          <p>Configuración de calendarios académicos y control de períodos activos para matrícula</p>
        </div>
        <button
          onClick={() => {
            const currentYear = new Date().getFullYear();
            setFormData({
              nombre: `Segundo Cuatrimestre ${currentYear}`,
              fechaInicio: `${currentYear}-05-15`,
              fechaFin: `${currentYear}-08-30`,
              anio: currentYear,
              periodo: '2C',
              activo: true
            });
            setModalCrearOpen(true);
          }}
          className="btn btn-primary"
        >
          <Plus size={16} />
          <span>Nuevo Período</span>
        </button>
      </div>

      <ErrorBanner error={error} onRetry={cargarLista} />

      {loading ? (
        <LoadingSpinner mensaje="Cargando períodos académicos..." />
      ) : periodos.length === 0 ? (
        <EmptyState
          icon={Calendar}
          titulo="No hay períodos configurados"
          descripcion="Configure los cuatrimestres o semestres lectivos para habilitar las matrículas."
          actionText="Crear Primer Período"
          onAction={() => setModalCrearOpen(true)}
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Período Académico</th>
                <th>Año / Ciclo</th>
                <th>Fecha Inicio</th>
                <th>Fecha Fin</th>
                <th>Estado</th>
                <th>Matrículas</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {periodos.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <div className="periodo-icon-box">
                        <Calendar size={18} />
                      </div>
                      <div>
                        <strong>{p.nombre}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>ID #{p.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-info">{p.anio} — {p.periodo}</span>
                  </td>
                  <td>
                    {p.fechaInicio ? new Date(p.fechaInicio).toLocaleDateString('es-CR') : 'N/A'}
                  </td>
                  <td>
                    {p.fechaFin ? new Date(p.fechaFin).toLocaleDateString('es-CR') : 'N/A'}
                  </td>
                  <td>
                    <Badge status={p.activo ? 'ACTIVO' : 'INACTIVO'} />
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{p._count?.enrollments || 0}</span> inscritas
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.25rem' }}>
                      <button
                        onClick={() => openEditarModal(p)}
                        className="btn btn-ghost btn-icon btn-sm"
                        title="Editar período"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => {
                          setPeriodoSeleccionado(p);
                          setModalEliminarOpen(true);
                        }}
                        className="btn btn-ghost btn-icon btn-sm text-danger"
                        title="Eliminar período"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Crear Período */}
      <Modal isOpen={modalCrearOpen} onClose={() => setModalCrearOpen(false)} title="Registrar Ciclo Lectivo">
        <form onSubmit={handleCrearSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre Descriptivo *</label>
            <input
              type="text"
              className="form-input"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej. Primer Cuatrimestre 2026"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Año Lectivo *</label>
              <input
                type="number"
                className="form-input"
                required
                min={2000}
                max={2100}
                value={formData.anio}
                onChange={(e) => setFormData({ ...formData, anio: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Código Ciclo * (ej. 1C, 2C, 1S...)</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.periodo}
                onChange={(e) => setFormData({ ...formData, periodo: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Fecha de Inicio *</label>
              <input
                type="date"
                className="form-input"
                required
                value={formData.fechaInicio}
                onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Fecha de Finalización *</label>
              <input
                type="date"
                className="form-input"
                required
                value={formData.fechaFin}
                onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.activo}
                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
              />
              <span className="form-label" style={{ margin: 0 }}>Habilitar período como activo para nuevas matrículas</span>
            </label>
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
              {loadingAction ? 'Guardando...' : 'Crear Período'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Editar Período */}
      <Modal isOpen={modalEditarOpen} onClose={() => setModalEditarOpen(false)} title="Modificar Ciclo Lectivo">
        <form onSubmit={handleEditarSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre Descriptivo</label>
            <input
              type="text"
              className="form-input"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Año</label>
              <input
                type="number"
                className="form-input"
                required
                min={2000}
                max={2100}
                value={formData.anio}
                onChange={(e) => setFormData({ ...formData, anio: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Ciclo</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.periodo}
                onChange={(e) => setFormData({ ...formData, periodo: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Fecha Inicio</label>
              <input
                type="date"
                className="form-input"
                required
                value={formData.fechaInicio}
                onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Fecha Fin</label>
              <input
                type="date"
                className="form-input"
                required
                value={formData.fechaFin}
                onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.activo}
                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
              />
              <span className="form-label" style={{ margin: 0 }}>Período activo para matrículas</span>
            </label>
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
        title="Eliminar Período"
        mensaje={`¿Confirma que desea eliminar el período '${periodoSeleccionado?.nombre}'?`}
        confirmText="Eliminar Período"
        loading={loadingAction}
      />

      <style>{`
        .periodo-icon-box {
          padding: 0.5rem;
          background: var(--primary-50);
          color: var(--primary-600);
          border-radius: var(--radius-md);
          display: flex;
        }
      `}</style>
    </div>
  );
};

export default PeriodosPage;

