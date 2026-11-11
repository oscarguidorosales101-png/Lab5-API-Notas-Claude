import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import matriculasService from '../services/matriculas.service';
import { useApp } from '../context/AppContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import Badge from '../components/Badge';
import {
  Award,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Layers
} from 'lucide-react';

export const CalificacionesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { notifySuccess, notifyError } = useApp();

  const [matriculas, setMatriculas] = useState([]);
  const [matriculaSeleccionadaId, setMatriculaSeleccionadaId] = useState(
    searchParams.get('matriculaId') || ''
  );
  const [matriculaActual, setMatriculaActual] = useState(null);
  const [resultadoFinal, setResultadoFinal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMatricula, setLoadingMatricula] = useState(false);
  const [error, setError] = useState(null);

  // Modales
  const [modalCrearOpen, setModalCrearOpen] = useState(false);
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [modalEliminarOpen, setModalEliminarOpen] = useState(false);

  const [evaluacionSeleccionada, setEvaluacionSeleccionada] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);

  const [formData, setFormData] = useState({
    nombreEvaluacion: '',
    puntajeObtenido: '',
    puntajeMaximo: 100,
    porcentaje: '',
    fechaEvaluacion: new Date().toISOString().split('T')[0],
    observaciones: ''
  });

  // Cargar lista de matrículas para el selector
  const cargarMatriculas = async () => {
    try {
      setLoading(true);
      setError(null);
      const mats = await matriculasService.obtenerTodas();
      setMatriculas(mats || []);

      // Si no hay id seleccionado y hay matrículas, seleccionar la primera
      if (!matriculaSeleccionadaId && mats && mats.length > 0) {
        setMatriculaSeleccionadaId(String(mats[0].id));
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMatriculas();
  }, []);

  // Cargar detalle y resultado final de la matrícula seleccionada
  const cargarDetalleMatricula = async (id) => {
    if (!id) return;
    try {
      setLoadingMatricula(true);
      const [mat, resFinal] = await Promise.all([
        matriculasService.obtenerPorId(id),
        matriculasService.obtenerResultadoFinal(id).catch(() => null)
      ]);
      setMatriculaActual(mat);
      setResultadoFinal(resFinal);
      setSearchParams({ matriculaId: id });
    } catch (err) {
      notifyError('No se pudo cargar la información de la matrícula');
    } finally {
      setLoadingMatricula(false);
    }
  };

  useEffect(() => {
    if (matriculaSeleccionadaId) {
      cargarDetalleMatricula(matriculaSeleccionadaId);
    }
  }, [matriculaSeleccionadaId]);

  const handleCrearEvaluacionSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoadingAction(true);
      await matriculasService.agregarCalificacion(Number(matriculaSeleccionadaId), {
        nombreEvaluacion: formData.nombreEvaluacion,
        puntajeObtenido: Number(formData.puntajeObtenido),
        puntajeMaximo: Number(formData.puntajeMaximo),
        porcentaje: Number(formData.porcentaje),
        fechaEvaluacion: formData.fechaEvaluacion,
        observaciones: formData.observaciones || undefined
      });
      notifySuccess('Evaluación agregada y nota final recalculada');
      setModalCrearOpen(false);
      setFormData({
        nombreEvaluacion: '',
        puntajeObtenido: '',
        puntajeMaximo: 100,
        porcentaje: '',
        fechaEvaluacion: new Date().toISOString().split('T')[0],
        observaciones: ''
      });
      await cargarDetalleMatricula(matriculaSeleccionadaId);
      await cargarMatriculas();
    } catch (err) {
      notifyError(err.message || 'Error al registrar evaluación');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleEditarEvaluacionSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoadingAction(true);
      await matriculasService.actualizarCalificacion(evaluacionSeleccionada.id, {
        nombreEvaluacion: formData.nombreEvaluacion,
        puntajeObtenido: Number(formData.puntajeObtenido),
        puntajeMaximo: Number(formData.puntajeMaximo),
        porcentaje: Number(formData.porcentaje),
        fechaEvaluacion: formData.fechaEvaluacion,
        observaciones: formData.observaciones || undefined
      });
      notifySuccess('Evaluación actualizada y nota final recalculada');
      setModalEditarOpen(false);
      await cargarDetalleMatricula(matriculaSeleccionadaId);
      await cargarMatriculas();
    } catch (err) {
      notifyError(err.message || 'Error al actualizar evaluación');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleEliminarEvaluacionConfirm = async () => {
    try {
      setLoadingAction(true);
      await matriculasService.eliminarCalificacion(evaluacionSeleccionada.id);
      notifySuccess('Evaluación eliminada correctamente');
      setModalEliminarOpen(false);
      await cargarDetalleMatricula(matriculaSeleccionadaId);
      await cargarMatriculas();
    } catch (err) {
      notifyError(err.message || 'Error al eliminar evaluación');
    } finally {
      setLoadingAction(false);
    }
  };

  const openEditarModal = (grade) => {
    setEvaluacionSeleccionada(grade);
    setFormData({
      nombreEvaluacion: grade.nombreEvaluacion,
      puntajeObtenido: grade.puntajeObtenido,
      puntajeMaximo: grade.puntajeMaximo,
      porcentaje: grade.porcentaje,
      fechaEvaluacion: grade.fechaEvaluacion
        ? new Date(grade.fechaEvaluacion).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      observaciones: grade.observaciones || ''
    });
    setModalEditarOpen(true);
  };

  const totalPonderacion = matriculaActual?.grades?.reduce((sum, g) => sum + g.porcentaje, 0) || 0;
  const notaMinima = matriculaActual?.subject?.notaMinimaAprobatoria || 70;

  return (
    <div className="calificaciones-page">
      <div className="card-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h2>Calificaciones Ponderadas</h2>
          <p>Registro de evaluaciones, control de ponderación hasta 100% y recálculo automático de nota final</p>
        </div>
        {matriculaActual && (
          <button
            onClick={() => {
              setFormData({
                nombreEvaluacion: '',
                puntajeObtenido: '',
                puntajeMaximo: 100,
                porcentaje: Math.max(0, 100 - totalPonderacion),
                fechaEvaluacion: new Date().toISOString().split('T')[0],
                observaciones: ''
              });
              setModalCrearOpen(true);
            }}
            className="btn btn-primary"
            disabled={totalPonderacion >= 100}
            title={totalPonderacion >= 100 ? 'Se ha completado el 100% de la ponderación' : 'Registrar nueva evaluación'}
          >
            <Plus size={16} />
            <span>Agregar Evaluación</span>
          </button>
        )}
      </div>

      <ErrorBanner error={error} onRetry={cargarMatriculas} />

      {/* Selector de Matrícula */}
      <div className="card selector-card">
        <label className="form-label" style={{ marginBottom: 0 }}>
          Seleccionar Matrícula a Evaluar:
        </label>
        <select
          className="form-select"
          style={{ maxWidth: '480px' }}
          value={matriculaSeleccionadaId}
          onChange={(e) => setMatriculaSeleccionadaId(e.target.value)}
        >
          {matriculas.map((m) => (
            <option key={m.id} value={m.id}>
              {m.user?.nombre} {m.user?.apellidos} — {m.subject?.codigo} {m.subject?.nombre} ({m.estado})
            </option>
          ))}
        </select>
      </div>

      {loadingMatricula ? (
        <LoadingSpinner mensaje="Calculando calificaciones ponderadas..." />
      ) : !matriculaActual ? (
        <EmptyState
          icon={Award}
          titulo="No hay matrícula seleccionada"
          descripcion="Seleccione o registre una matrícula para gestionar sus evaluaciones académicas."
        />
      ) : (
        <div className="calificaciones-content">
          {/* Tarjeta de Resumen de la Matrícula */}
          <div className="card summary-banner">
            <div className="summary-col">
              <span className="summary-label">Estudiante</span>
              <strong className="summary-value">{matriculaActual.user?.nombre} {matriculaActual.user?.apellidos}</strong>
              <span className="summary-sub">{matriculaActual.user?.email}</span>
            </div>
            <div className="summary-col">
              <span className="summary-label">Materia</span>
              <strong className="summary-value">{matriculaActual.subject?.codigo} — {matriculaActual.subject?.nombre}</strong>
              <span className="summary-sub">
                {matriculaActual.subject?.creditos} Créditos | Mínimo para aprobar: {notaMinima} pts
              </span>
            </div>
            <div className="summary-col">
              <span className="summary-label">Ponderación Evaluada</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong className="summary-value">{totalPonderacion.toFixed(1)}% / 100%</strong>
              </div>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${Math.min(100, totalPonderacion)}%`,
                    backgroundColor: totalPonderacion >= 100 ? '#10b981' : 'var(--primary-600)'
                  }}
                />
              </div>
            </div>
            <div className="summary-col">
              <span className="summary-label">Nota Final Acumulada</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong className="summary-value" style={{ fontSize: '1.5rem', color: matriculaActual.notaFinal >= notaMinima ? '#059669' : '#dc2626' }}>
                  {matriculaActual.notaFinal !== null ? `${matriculaActual.notaFinal} pts` : '0.0 pts'}
                </strong>
                <Badge status={matriculaActual.estado} />
              </div>
            </div>
          </div>

          {/* Tabla de Evaluaciones Parciales */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <FileCheck2 size={20} className="text-primary" />
                <span>Desglose de Evaluaciones</span>
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {matriculaActual.grades?.length || 0} evaluaciones registradas
              </span>
            </div>

            {(!matriculaActual.grades || matriculaActual.grades.length === 0) ? (
              <EmptyState
                icon={Award}
                titulo="Sin evaluaciones registradas"
                descripcion="Agregue exámenes, tareas o proyectos para calcular la calificación final."
                actionText="Agregar Primera Evaluación"
                onAction={() => setModalCrearOpen(true)}
              />
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Evaluación</th>
                      <th>Puntaje Obtenido</th>
                      <th>Puntaje Máximo</th>
                      <th>Ponderación</th>
                      <th>Aporte a Nota Final</th>
                      <th>Fecha</th>
                      <th>Observaciones</th>
                      <th style={{ textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matriculaActual.grades.map((g) => {
                      const aporte = ((g.puntajeObtenido / g.puntajeMaximo) * g.porcentaje).toFixed(2);
                      const rendimiento = ((g.puntajeObtenido / g.puntajeMaximo) * 100).toFixed(1);

                      return (
                        <tr key={g.id}>
                          <td>
                            <strong>{g.nombreEvaluacion}</strong>
                          </td>
                          <td>
                            <span style={{ fontWeight: 700 }}>{g.puntajeObtenido}</span> pts
                          </td>
                          <td>{g.puntajeMaximo} pts</td>
                          <td>
                            <span className="badge badge-info">{g.porcentaje}%</span>
                          </td>
                          <td>
                            <strong style={{ color: 'var(--primary-800)' }}>+{aporte} pts</strong>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginLeft: '0.35rem' }}>
                              ({rendimiento}%)
                            </span>
                          </td>
                          <td>
                            {g.fechaEvaluacion
                              ? new Date(g.fechaEvaluacion).toLocaleDateString('es-CR')
                              : 'N/A'}
                          </td>
                          <td>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {g.observaciones || '—'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.25rem' }}>
                              <button
                                onClick={() => openEditarModal(g)}
                                className="btn btn-ghost btn-icon btn-sm"
                                title="Editar evaluación"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => {
                                  setEvaluacionSeleccionada(g);
                                  setModalEliminarOpen(true);
                                }}
                                className="btn btn-ghost btn-icon btn-sm text-danger"
                                title="Eliminar evaluación"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Panel de Resultado Final Oficial */}
          {resultadoFinal && (
            <div className="card result-card">
              <div className="result-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {resultadoFinal.aprobada ? (
                    <CheckCircle2 size={26} className="text-success" />
                  ) : (
                    <AlertCircle size={26} className="text-danger" />
                  )}
                  <div>
                    <h3 style={{ margin: 0 }}>
                      Resultado Académico Oficial: {resultadoFinal.aprobada ? 'APROBADA' : totalPonderacion >= 100 ? 'REPROBADA' : 'EN PROCESO'}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.825rem' }}>
                      Cálculo ponderado certificado por la API REST
                    </p>
                  </div>
                </div>
                <div className="result-score-box">
                  <span className="result-score">{resultadoFinal.notaFinal}</span>
                  <span className="result-score-max">/ 100</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Agregar Evaluación */}
      <Modal isOpen={modalCrearOpen} onClose={() => setModalCrearOpen(false)} title="Registrar Calificación de Evaluación">
        <form onSubmit={handleCrearEvaluacionSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre de la Evaluación *</label>
            <input
              type="text"
              className="form-input"
              required
              value={formData.nombreEvaluacion}
              onChange={(e) => setFormData({ ...formData, nombreEvaluacion: e.target.value })}
              placeholder="Ej. Examen Parcial 1, Tarea 2, Proyecto Final..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Puntaje Obtenido *</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                required
                min={0}
                value={formData.puntajeObtenido}
                onChange={(e) => setFormData({ ...formData, puntajeObtenido: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Puntaje Máximo *</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                required
                min={0.01}
                value={formData.puntajeMaximo}
                onChange={(e) => setFormData({ ...formData, puntajeMaximo: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Ponderación (%) *</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                required
                min={0.01}
                max={Math.max(0.01, 100 - totalPonderacion)}
                value={formData.porcentaje}
                onChange={(e) => setFormData({ ...formData, porcentaje: e.target.value })}
                placeholder={`Máx ${100 - totalPonderacion}%`}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Fecha de Evaluación</label>
            <input
              type="date"
              className="form-input"
              value={formData.fechaEvaluacion}
              onChange={(e) => setFormData({ ...formData, fechaEvaluacion: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Observaciones Docentes</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              placeholder="Retroalimentación opcional..."
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
              {loadingAction ? 'Calculando y guardando...' : 'Guardar Evaluación'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Editar Evaluación */}
      <Modal isOpen={modalEditarOpen} onClose={() => setModalEditarOpen(false)} title="Modificar Evaluación">
        <form onSubmit={handleEditarEvaluacionSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre de la Evaluación</label>
            <input
              type="text"
              className="form-input"
              required
              value={formData.nombreEvaluacion}
              onChange={(e) => setFormData({ ...formData, nombreEvaluacion: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Puntaje Obtenido</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                required
                min={0}
                value={formData.puntajeObtenido}
                onChange={(e) => setFormData({ ...formData, puntajeObtenido: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Puntaje Máximo</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                required
                min={0.01}
                value={formData.puntajeMaximo}
                onChange={(e) => setFormData({ ...formData, puntajeMaximo: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Ponderación (%)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                required
                min={0.01}
                max={100}
                value={formData.porcentaje}
                onChange={(e) => setFormData({ ...formData, porcentaje: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Fecha de Evaluación</label>
            <input
              type="date"
              className="form-input"
              value={formData.fechaEvaluacion}
              onChange={(e) => setFormData({ ...formData, fechaEvaluacion: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Observaciones</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
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
        onConfirm={handleEliminarEvaluacionConfirm}
        title="Eliminar Evaluación"
        mensaje={`¿Confirma que desea eliminar la evaluación '${evaluacionSeleccionada?.nombreEvaluacion}'? La nota final y el estado de la matrícula serán recalculados automáticamente en una transacción atómica.`}
        confirmText="Eliminar Evaluación"
        loading={loadingAction}
      />

      <style>{`
        .selector-card {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          padding: 1rem 1.25rem;
          margin-bottom: 1.25rem;
          background: #ffffff;
        }
        .calificaciones-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .summary-banner {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);
          border-left: 4px solid var(--primary-600);
        }
        .summary-col {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .summary-label {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .summary-value {
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--text-main);
        }
        .summary-sub {
          font-size: 0.78rem;
          color: var(--text-light);
        }
        .progress-bar-bg {
          width: 100%;
          height: 8px;
          background: #e2e8f0;
          border-radius: var(--radius-full);
          overflow: hidden;
          margin-top: 0.35rem;
        }
        .progress-bar-fill {
          height: 100%;
          border-radius: var(--radius-full);
          transition: width 0.3s ease;
        }
        .result-card {
          padding: 1.25rem 1.75rem;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
        }
        .result-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .result-score-box {
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
        }
        .result-score {
          font-size: 2rem;
          font-weight: 800;
          color: var(--text-main);
        }
        .result-score-max {
          font-size: 1rem;
          color: var(--text-muted);
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default CalificacionesPage;

