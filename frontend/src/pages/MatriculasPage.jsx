import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import matriculasService from '../services/matriculas.service';
import usuariosService from '../services/usuarios.service';
import materiasService from '../services/materias.service';
import periodosService from '../services/periodos.service';
import { useApp } from '../context/AppContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { GraduationCap, Plus, Search, Filter, Award, AlertCircle, CheckCircle2 } from 'lucide-react';

export const MatriculasPage = () => {
  const { notifySuccess, notifyError, usuarioActivo } = useApp();
  const [matriculas, setMatriculas] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [filtroEstudiante, setFiltroEstudiante] = useState('');
  const [filtroPeriodo, setFiltroPeriodo] = useState('');

  // Modal Crear Matrícula
  const [modalCrearOpen, setModalCrearOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [formError, setFormError] = useState(null);

  const [formData, setFormData] = useState({
    userId: '',
    subjectId: '',
    academicPeriodId: ''
  });

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      const [mats, usrs, matsList, pers] = await Promise.all([
        matriculasService.obtenerTodas(),
        usuariosService.obtenerTodos(),
        materiasService.obtenerTodas(),
        periodosService.obtenerTodos()
      ]);

      setMatriculas(mats || []);
      // Filtrar únicamente usuarios con rol ESTUDIANTE para la lista de matrícula
      setEstudiantes((usrs || []).filter((u) => u.rol === 'ESTUDIANTE'));
      setMaterias(matsList || []);
      setPeriodos(pers || []);

      // Si hay un usuario activo con rol estudiante, pre-filtrar
      if (usuarioActivo?.rol === 'ESTUDIANTE') {
        setFiltroEstudiante(String(usuarioActivo.id));
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleCrearMatriculaSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    try {
      setLoadingAction(true);
      const res = await matriculasService.crear({
        userId: Number(formData.userId),
        subjectId: Number(formData.subjectId),
        academicPeriodId: Number(formData.academicPeriodId)
      });
      notifySuccess(`Matrícula registrada exitosamente`);
      setModalCrearOpen(false);
      setFormData({ userId: '', subjectId: '', academicPeriodId: '' });
      await cargarDatos();
    } catch (err) {
      // Si el backend devuelve 409 por prerrequisito no aprobado o duplicidad, mostrarlo en el banner del formulario
      setFormError(err);
      notifyError(err.message || 'No se pudo completar la matrícula');
    } finally {
      setLoadingAction(false);
    }
  };

  const matriculasFiltradas = matriculas.filter((m) => {
    let coincide = true;
    if (filtroEstudiante) {
      coincide = coincide && m.userId === Number(filtroEstudiante);
    }
    if (filtroPeriodo) {
      coincide = coincide && m.academicPeriodId === Number(filtroPeriodo);
    }
    return coincide;
  });

  return (
    <div className="matriculas-page">
      <div className="card-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h2>Matrículas Académicas</h2>
          <p>Inscripciones de estudiantes por período académico con control de prerrequisitos</p>
        </div>
        <button
          onClick={() => {
            setFormError(null);
            setFormData({
              userId: usuarioActivo?.rol === 'ESTUDIANTE' ? String(usuarioActivo.id) : (estudiantes[0]?.id ? String(estudiantes[0].id) : ''),
              subjectId: materias[0]?.id ? String(materias[0].id) : '',
              academicPeriodId: periodos.find((p) => p.activo)?.id ? String(periodos.find((p) => p.activo).id) : (periodos[0]?.id ? String(periodos[0].id) : '')
            });
            setModalCrearOpen(true);
          }}
          className="btn btn-primary"
        >
          <Plus size={16} />
          <span>Nueva Matrícula</span>
        </button>
      </div>

      <ErrorBanner error={error} onRetry={cargarDatos} />

      {/* Barra de Filtros */}
      <div className="card filters-card">
        <div className="filters-group">
          <div className="filter-item">
            <label className="filter-label">Estudiante:</label>
            <select
              className="form-select"
              value={filtroEstudiante}
              onChange={(e) => setFiltroEstudiante(e.target.value)}
            >
              <option value="">-- Todos los Estudiantes --</option>
              {estudiantes.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre} {e.apellidos} ({e.email})
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label className="filter-label">Período Académico:</label>
            <select
              className="form-select"
              value={filtroPeriodo}
              onChange={(e) => setFiltroPeriodo(e.target.value)}
            >
              <option value="">-- Todos los Períodos --</option>
              {periodos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} {p.activo ? '(Activo)' : '(Finalizado)'}
                </option>
              ))}
            </select>
          </div>

          {(filtroEstudiante || filtroPeriodo) && (
            <button
              onClick={() => {
                setFiltroEstudiante('');
                setFiltroPeriodo('');
              }}
              className="btn btn-secondary btn-sm"
              style={{ alignSelf: 'flex-end' }}
            >
              Limpiar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Matrículas */}
      {loading ? (
        <LoadingSpinner mensaje="Cargando registros de matrículas..." />
      ) : matriculasFiltradas.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          titulo="No hay matrículas que coincidan"
          descripcion="No se encontraron matrículas con los filtros seleccionados o aún no se han registrado inscripciones."
          actionText="Matricular Estudiante"
          onAction={() => setModalCrearOpen(true)}
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Materia Inscrita</th>
                <th>Período</th>
                <th>Fecha Matrícula</th>
                <th>Estado</th>
                <th>Nota Final</th>
                <th style={{ textAlign: 'right' }}>Evaluaciones</th>
              </tr>
            </thead>
            <tbody>
              {matriculasFiltradas.map((m) => {
                const notaMin = m.subject?.notaMinimaAprobatoria || 70;
                const tieneNota = m.notaFinal !== null && m.notaFinal !== undefined;
                const aprobada = tieneNota && m.notaFinal >= notaMin;

                return (
                  <tr key={m.id}>
                    <td>
                      <div>
                        <strong>{m.user?.nombre} {m.user?.apellidos}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                          {m.user?.email}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{m.subject?.codigo}</strong> — {m.subject?.nombre}
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                          {m.subject?.creditos} Créditos | Mín: {notaMin} pts
                        </div>
                      </div>
                    </td>
                    <td>
                      <span>{m.academicPeriod?.nombre || `Período #${m.academicPeriodId}`}</span>
                    </td>
                    <td>
                      {new Date(m.fechaMatricula).toLocaleDateString('es-CR')}
                    </td>
                    <td>
                      <Badge status={m.estado} />
                    </td>
                    <td>
                      {tieneNota ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          {aprobada ? (
                            <CheckCircle2 size={16} className="text-success" />
                          ) : (
                            <AlertCircle size={16} className="text-danger" />
                          )}
                          <span style={{ fontWeight: 800, color: aprobada ? '#059669' : '#dc2626' }}>
                            {m.notaFinal} / 100
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>En curso</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        to={`/calificaciones?matriculaId=${m.id}`}
                        className="btn btn-secondary btn-sm"
                        title="Ver calificaciones parciales y cálculo ponderado"
                      >
                        <Award size={15} />
                        <span>Calificaciones ({m.grades?.length || 0})</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Nueva Matrícula */}
      <Modal isOpen={modalCrearOpen} onClose={() => setModalCrearOpen(false)} title="Registrar Nueva Matrícula">
        <form onSubmit={handleCrearMatriculaSubmit}>
          <ErrorBanner error={formError} />

          <div className="form-group">
            <label className="form-label">Estudiante *</label>
            <select
              className="form-select"
              required
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
            >
              <option value="">-- Seleccione un estudiante --</option>
              {estudiantes.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre} {u.apellidos} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Materia *</label>
            <select
              className="form-select"
              required
              value={formData.subjectId}
              onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
            >
              <option value="">-- Seleccione una materia --</option>
              {materias.map((m) => {
                const prereqs = m.prerrequisitos?.length || 0;
                return (
                  <option key={m.id} value={m.id}>
                    {m.codigo} — {m.nombre} ({m.creditos} Créditos) {prereqs > 0 ? `[Exige ${prereqs} prerreq.]` : ''}
                  </option>
                );
              })}
            </select>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
              El sistema verificará automáticamente si el estudiante tiene aprobadas las materias previas requeridas.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Período Académico *</label>
            <select
              className="form-select"
              required
              value={formData.academicPeriodId}
              onChange={(e) => setFormData({ ...formData, academicPeriodId: e.target.value })}
            >
              <option value="">-- Seleccione el período --</option>
              {periodos.map((p) => (
                <option key={p.id} value={p.id} disabled={!p.activo}>
                  {p.nombre} {p.activo ? '— (Activo para Matrícula)' : '— [Inactivo/Cerrado]'}
                </option>
              ))}
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
              {loadingAction ? 'Validando Prerrequisitos en MySQL...' : 'Confirmar Matrícula'}
            </button>
          </div>
        </form>
      </Modal>

      <style>{`
        .filters-card {
          padding: 1rem 1.25rem;
          margin-bottom: 1.25rem;
        }
        .filters-group {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          flex-wrap: wrap;
        }
        .filter-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .filter-label {
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--text-muted);
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
};

export default MatriculasPage;

