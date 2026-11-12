import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import materiasService from '../services/materias.service';
import matriculasService from '../services/matriculas.service';
import notasService from '../services/notas.service';
import iaService from '../services/ia.service';
import StatsCard from '../components/StatsCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';
import Badge from '../components/Badge';
import {
  BookOpen,
  GraduationCap,
  FileText,
  Award,
  Bot,
  BarChart3,
  ArrowRight,
  Sparkles,
  Calendar
} from 'lucide-react';

export const DashboardPage = () => {
  const { usuarioActivo } = useApp();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estadísticas reales obtenidas del backend
  const [stats, setStats] = useState({
    totalMaterias: 0,
    totalMatriculas: 0,
    totalNotas: 0,
    promedioAcademico: null,
    totalTokensIA: 0,
    costoTotalIA: 0,
    matriculasRecientes: [],
    notasRecientes: []
  });

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar en paralelo datos reales de todos los módulos
      const [materias, matriculas, notas, resumenIA] = await Promise.all([
        materiasService.obtenerTodas().catch(() => []),
        matriculasService.obtenerTodas().catch(() => []),
        notasService.obtenerTodas().catch(() => []),
        iaService.obtenerUsoResumen().catch(() => null)
      ]);

      // Filtrar matrículas del estudiante activo si existe
      const matriculasEstudiante = usuarioActivo
        ? matriculas.filter((m) => m.userId === usuarioActivo.id)
        : matriculas;

      // Calcular promedio ponderado real de notas finales existentes
      const notasValidas = matriculasEstudiante
        .map((m) => m.notaFinal)
        .filter((n) => typeof n === 'number' && !isNaN(n));

      const promedio = notasValidas.length > 0
        ? (notasValidas.reduce((a, b) => a + b, 0) / notasValidas.length).toFixed(1)
        : null;

      setStats({
        totalMaterias: materias.length,
        totalMatriculas: matriculasEstudiante.length,
        totalNotas: notas.length,
        promedioAcademico: promedio,
        totalTokensIA: resumenIA ? resumenIA.totalTokens : 0,
        costoTotalIA: resumenIA ? resumenIA.costoTotalEstimado : 0,
        matriculasRecientes: matriculasEstudiante.slice(0, 5),
        notasRecientes: notas.slice(0, 5)
      });
    } catch (err) {
      console.error('Error cargando el dashboard:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [usuarioActivo]);

  if (loading) {
    return <LoadingSpinner mensaje="Cargando métricas del sistema académico..." />;
  }

  return (
    <div className="dashboard-page">
      <ErrorBanner error={error} onRetry={cargarDatos} />

      {/* Banner de Bienvenida Académica */}
      <div className="card welcome-card">
        <div className="welcome-content">
          <div className="welcome-tag">
            <Sparkles size={15} />
            <span>Sistema Relacional MySQL — Base: Notas_lab &bull; Rol: <strong>{usuarioActivo?.rol || 'ESTUDIANTE'}</strong></span>
          </div>
          <h2>
            {usuarioActivo ? `Bienvenido/a, ${usuarioActivo.nombre} ${usuarioActivo.apellidos}` : 'Panel de Control Académico'}
          </h2>
          <p>
            {usuarioActivo?.rol === 'ADMIN'
              ? 'Panel de control maestro: supervisa el catálogo de asignaturas, la matrícula general de estudiantes, los períodos lectivos y las métricas de consumo de inteligencia artificial.'
              : usuarioActivo?.rol === 'DOCENTE'
              ? 'Portal docente: gestiona las calificaciones ponderadas de tus cursos, estructura los temas académicos y aprovecha el asistente pedagógico para formular evaluaciones.'
              : 'Portal estudiantil: consulta tus asignaturas inscritas, cumplimiento de prerrequisitos, tus calificaciones acumuladas y tu cuaderno personal de notas con tutoría DeepSeek.'}
          </p>
        </div>
        <div className="welcome-actions">
          {usuarioActivo?.rol === 'ADMIN' && (
            <>
              <Link to="/matriculas" className="btn btn-primary">
                <span>Gestionar Matrículas</span>
                <ArrowRight size={16} />
              </Link>
              <Link to="/consumo" className="btn btn-secondary">
                <BarChart3 size={16} />
                <span>Auditoría IA</span>
              </Link>
            </>
          )}

          {usuarioActivo?.rol === 'DOCENTE' && (
            <>
              <Link to="/calificaciones" className="btn btn-primary">
                <Award size={16} />
                <span>Calificar Evaluaciones</span>
              </Link>
              <Link to="/ia" className="btn btn-secondary">
                <Bot size={16} />
                <span>Asistente Pedagógico IA</span>
              </Link>
            </>
          )}

          {(!usuarioActivo || usuarioActivo?.rol === 'ESTUDIANTE') && (
            <>
              <Link to="/calificaciones" className="btn btn-primary">
                <Award size={16} />
                <span>Mis Calificaciones</span>
              </Link>
              <Link to="/ia" className="btn btn-secondary">
                <Bot size={16} />
                <span>Consultar Tutor IA</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Tarjetas de Estadísticas Principales */}
      <div className="stats-grid">
        <StatsCard
          title="Materias en Catálogo"
          value={stats.totalMaterias}
          subtitle="Asignaturas académicas registradas"
          icon={BookOpen}
          color="#0284c7"
          bgColor="#e0f2fe"
        />
        <StatsCard
          title="Matrículas Activas"
          value={stats.totalMatriculas}
          subtitle={usuarioActivo ? `Inscritas por ${usuarioActivo.nombre}` : 'Inscripciones en período'}
          icon={GraduationCap}
          color="#0ea5e9"
          bgColor="#f0f9ff"
        />
        <StatsCard
          title="Promedio Académico"
          value={stats.promedioAcademico !== null ? `${stats.promedioAcademico} pts` : 'Sin notas'}
          subtitle="Calculado a partir de notas finales"
          icon={Award}
          badgeText={stats.promedioAcademico >= 70 ? 'Aprobatorio' : stats.promedioAcademico ? 'Atención' : 'N/A'}
          badgeVariant={stats.promedioAcademico >= 70 ? 'success' : stats.promedioAcademico ? 'warning' : 'neutral'}
          color="#10b981"
          bgColor="#ecfdf5"
        />
        <StatsCard
          title="Cuaderno de Notas"
          value={stats.totalNotas}
          subtitle="Apuntes y resúmenes registrados"
          icon={FileText}
          color="#8b5cf6"
          bgColor="#f5f3ff"
        />
        <StatsCard
          title="Consumo de Tokens IA"
          value={stats.totalTokensIA.toLocaleString()}
          subtitle={`Costo acumulado: $${stats.costoTotalIA.toFixed(5)} USD`}
          icon={BarChart3}
          badgeText="DeepSeek"
          badgeVariant="info"
          color="#d97706"
          bgColor="#fffbeb"
        />
      </div>

      {/* Paneles de Actividad y Contenido */}
      <div className="dashboard-grid">
        {/* Panel de Matrículas Recientes */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <GraduationCap size={20} className="text-primary" />
              <span>Matrículas del Ciclo Lectivo</span>
            </div>
            <Link to="/matriculas" className="btn btn-ghost btn-sm">
              Ver todas <ArrowRight size={14} />
            </Link>
          </div>

          {stats.matriculasRecientes.length === 0 ? (
            <p className="no-data-text">No hay matrículas registradas para este usuario.</p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Materia</th>
                    <th>Período</th>
                    <th>Estado</th>
                    <th>Nota Final</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.matriculasRecientes.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <strong>{m.subject?.codigo}</strong> — {m.subject?.nombre}
                      </td>
                      <td>{m.academicPeriod?.nombre || 'Ciclo activo'}</td>
                      <td>
                        <Badge status={m.estado} />
                      </td>
                      <td>
                        {m.notaFinal !== null && m.notaFinal !== undefined ? (
                          <span style={{ fontWeight: 700, color: m.notaFinal >= (m.subject?.notaMinimaAprobatoria || 70) ? '#059669' : '#dc2626' }}>
                            {m.notaFinal} / 100
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-light)' }}>En curso</span>
                        )}
                      </td>
                      <td>
                        <Link to={`/calificaciones?matriculaId=${m.id}`} className="btn btn-secondary btn-sm">
                          Ver Evaluación
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Panel de Apuntes Recientes */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <FileText size={20} className="text-primary" />
              <span>Últimos Apuntes Académicos</span>
            </div>
            <Link to="/notas" className="btn btn-ghost btn-sm">
              Ver cuaderno <ArrowRight size={14} />
            </Link>
          </div>

          {stats.notasRecientes.length === 0 ? (
            <p className="no-data-text">No hay notas registradas en el cuaderno.</p>
          ) : (
            <div className="notes-list">
              {stats.notasRecientes.map((n) => (
                <div key={n.id} className="note-mini-card">
                  <div className="note-mini-header">
                    <span className="note-mini-title">{n.titulo}</span>
                    {n.subject && <span className="badge badge-info">{n.subject.codigo}</span>}
                  </div>
                  <p className="note-mini-snippet">
                    {n.contenido.length > 120 ? `${n.contenido.substring(0, 120)}...` : n.contenido}
                  </p>
                  <div className="note-mini-footer">
                    <span className="note-mini-date">
                      {new Date(n.createdAt).toLocaleDateString('es-CR')}
                    </span>
                    {n.topic && <span className="badge badge-neutral">{n.topic.nombre}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .welcome-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 2rem;
          background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);
          border-left: 5px solid var(--primary-600);
          gap: 1.5rem;
        }
        .welcome-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.25rem 0.625rem;
          background: var(--primary-100);
          color: var(--primary-800);
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
        }
        .welcome-actions {
          display: flex;
          gap: 0.75rem;
          flex-shrink: 0;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.25rem;
        }
        .dashboard-grid {
          display: grid;
          grid-template-columns: 3fr 2fr;
          gap: 1.5rem;
        }
        @media (max-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
          .welcome-card {
            flex-direction: column;
            align-items: flex-start;
          }
        }
        .notes-list {
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
        }
        .note-mini-card {
          padding: 1rem;
          background: var(--surface-ground);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }
        .note-mini-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .note-mini-title {
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--text-main);
        }
        .note-mini-snippet {
          font-size: 0.835rem;
          color: var(--text-muted);
          line-height: 1.4;
          margin: 0;
        }
        .note-mini-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 0.25rem;
        }
        .note-mini-date {
          font-size: 0.75rem;
          color: var(--text-light);
        }
        .no-data-text {
          color: var(--text-muted);
          font-style: italic;
          padding: 1.5rem 0;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;

