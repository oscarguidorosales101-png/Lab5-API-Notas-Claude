import React, { useState, useEffect } from 'react';
import iaService from '../services/ia.service';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';
import StatsCard from '../components/StatsCard';
import Badge from '../components/Badge';
import {
  BarChart3,
  DollarSign,
  Cpu,
  Clock,
  ArrowUpDown,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export const ConsumoIAPage = () => {
  const [resumenGeneral, setResumenGeneral] = useState(null);
  const [resumenHoy, setResumenHoy] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [totalHistorial, setTotalHistorial] = useState(0);
  const [pagina, setPagina] = useState(0);
  const limite = 10;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargarDatos = async (offset = 0) => {
    try {
      setLoading(true);
      setError(null);

      const [resumen, hoy, usoHist] = await Promise.all([
        iaService.obtenerUsoResumen().catch(() => null),
        iaService.obtenerUsoHoy().catch(() => null),
        iaService.obtenerUso({ limite, offset }).catch(() => ({ total: 0, registros: [] }))
      ]);

      setResumenGeneral(resumen);
      setResumenHoy(hoy);
      setHistorial(usoHist?.registros || []);
      setTotalHistorial(usoHist?.total || 0);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos(pagina * limite);
  }, [pagina]);

  const totalPaginas = Math.ceil(totalHistorial / limite) || 1;

  return (
    <div className="consumo-ia-page">
      <div className="card-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h2>Auditoría de Consumo y Costos de IA</h2>
          <p>Supervisión en tiempo real de tokens consumidos y costos acumulados en DeepSeek</p>
        </div>
      </div>

      <ErrorBanner error={error} onRetry={() => cargarDatos(pagina * limite)} />

      {/* Métricas Principales */}
      <div className="stats-grid">
        <StatsCard
          title="Total Solicitudes"
          value={resumenGeneral?.totalSolicitudes || 0}
          subtitle="Peticiones completadas con éxito"
          icon={BarChart3}
          color="#0284c7"
          bgColor="#e0f2fe"
        />
        <StatsCard
          title="Tokens Consumidos"
          value={(resumenGeneral?.totalTokens || 0).toLocaleString()}
          subtitle={`${(resumenGeneral?.totalTokensEntrada || 0).toLocaleString()} in / ${(resumenGeneral?.totalTokensSalida || 0).toLocaleString()} out`}
          icon={Cpu}
          color="#8b5cf6"
          bgColor="#f5f3ff"
        />
        <StatsCard
          title="Gasto Total Estimado"
          value={`$${(resumenGeneral?.costoTotalEstimado || 0).toFixed(6)}`}
          subtitle="Calculado con tarifas oficiales DeepSeek"
          icon={DollarSign}
          badgeText="USD"
          badgeVariant="success"
          color="#10b981"
          bgColor="#ecfdf5"
        />
        <StatsCard
          title="Consumo de Hoy"
          value={`${resumenHoy?.totalTokens || 0} tokens`}
          subtitle={`$${(resumenHoy?.gastoTotalEstimado || 0).toFixed(6)} USD | ${resumenHoy?.zonaHoraria || 'Costa Rica'}`}
          icon={Clock}
          badgeText={`${resumenHoy?.totalSolicitudes || 0} hoy`}
          badgeVariant="info"
          color="#f59e0b"
          bgColor="#fffbeb"
        />
      </div>

      {/* Desglose por Operación (Pregunta vs Resumen) */}
      {resumenGeneral?.desglosePorOperacion && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card-header">
            <div className="card-title">
              <Layers size={20} className="text-primary" />
              <span>Desglose por Tipo de Operación</span>
            </div>
          </div>

          <div className="operation-breakdown-grid">
            <div className="op-card">
              <span className="op-type">Consultas y Preguntas</span>
              <strong className="op-val">
                {resumenGeneral.desglosePorOperacion.pregunta?.solicitudes || 0} solicitudes
              </strong>
              <div className="op-sub">
                Tokens: {(resumenGeneral.desglosePorOperacion.pregunta?.tokens || 0).toLocaleString()} | Costo: ${(resumenGeneral.desglosePorOperacion.pregunta?.costo || 0).toFixed(6)} USD
              </div>
            </div>

            <div className="op-card">
              <span className="op-type">Síntesis y Resúmenes</span>
              <strong className="op-val">
                {resumenGeneral.desglosePorOperacion.resumen?.solicitudes || 0} solicitudes
              </strong>
              <div className="op-sub">
                Tokens: {(resumenGeneral.desglosePorOperacion.resumen?.tokens || 0).toLocaleString()} | Costo: ${(resumenGeneral.desglosePorOperacion.resumen?.costo || 0).toFixed(6)} USD
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historial Detallado de Peticiones */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-header">
          <div className="card-title">
            <Clock size={20} className="text-primary" />
            <span>Registro Histórico de Auditoría (MySQL `aiusage`)</span>
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Mostrando {historial.length} de {totalHistorial} registros
          </span>
        </div>

        {loading ? (
          <LoadingSpinner mensaje="Cargando historial de consumo..." />
        ) : historial.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
            Aún no se han registrado consumos de IA en la base de datos.
          </p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Operación</th>
                  <th>Modelo</th>
                  <th>Tokens Entrada</th>
                  <th>Tokens Salida</th>
                  <th>Total Tokens</th>
                  <th>Costo Estimado</th>
                  <th>Fecha y Hora</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((reg) => (
                  <tr key={reg.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-light)' }}>
                        #{reg.id}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${reg.tipoOperacion === 'resumen' ? 'badge-warning' : 'badge-info'}`}>
                        {reg.tipoOperacion}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.825rem', fontWeight: 600 }}>{reg.modelo}</span>
                    </td>
                    <td>{reg.tokensEntrada.toLocaleString()}</td>
                    <td>{reg.tokensSalida.toLocaleString()}</td>
                    <td>
                      <strong>{reg.totalTokens.toLocaleString()}</strong>
                    </td>
                    <td>
                      <span style={{ color: '#059669', fontWeight: 700 }}>
                        ${reg.costoTotal.toFixed(6)} USD
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(reg.createdAt).toLocaleString('es-CR')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="pagination-bar">
            <button
              onClick={() => setPagina((p) => Math.max(0, p - 1))}
              disabled={pagina === 0 || loading}
              className="btn btn-secondary btn-sm"
            >
              <ChevronLeft size={16} />
              <span>Anterior</span>
            </button>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Página {pagina + 1} de {totalPaginas}
            </span>
            <button
              onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
              disabled={pagina >= totalPaginas - 1 || loading}
              className="btn btn-secondary btn-sm"
            >
              <span>Siguiente</span>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      <style>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 1.25rem;
        }
        .operation-breakdown-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }
        @media (max-width: 768px) {
          .operation-breakdown-grid {
            grid-template-columns: 1fr;
          }
        }
        .op-card {
          padding: 1.25rem;
          background: var(--surface-ground);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .op-type {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        .op-val {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-main);
        }
        .op-sub {
          font-size: 0.8rem;
          color: var(--text-light);
        }
        .pagination-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 1.25rem;
          margin-top: 1rem;
          border-top: 1px solid var(--border-light);
        }
      `}</style>
    </div>
  );
};

export default ConsumoIAPage;

