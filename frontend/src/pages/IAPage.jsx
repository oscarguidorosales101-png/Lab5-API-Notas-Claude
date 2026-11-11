import React, { useState, useEffect } from 'react';
import iaService from '../services/ia.service';
import notasService from '../services/notas.service';
import { useApp } from '../context/AppContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';
import Badge from '../components/Badge';
import {
  Bot,
  Send,
  Sparkles,
  MessageSquare,
  FileText,
  RotateCcw,
  Zap,
  Cpu
} from 'lucide-react';

export const IAPage = () => {
  const { notifySuccess, notifyError } = useApp();

  const [modo, setModo] = useState('conversacion'); // 'conversacion' | 'pregunta' | 'resumen'
  const [pregunta, setPregunta] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estado para conversación interactiva
  const [conversacionId, setConversacionId] = useState(null);
  const [mensajes, setMensajes] = useState([
    {
      rol: 'assistant',
      texto: '¡Hola! Soy tu asistente académico impulsado por DeepSeek. ¿En qué tema o materia puedo ayudarte hoy? Puedes hacerme preguntas sobre química, matemáticas, redactar explicaciones o resumir tus apuntes.'
    }
  ]);

  // Estado para pregunta directa
  const [respuestaDirecta, setRespuestaDirecta] = useState(null);

  // Estado para resumen de notas
  const [notasList, setNotasList] = useState([]);
  const [notaSeleccionadaId, setNotaSeleccionadaId] = useState('');
  const [resumenNota, setResumenNota] = useState(null);

  useEffect(() => {
    // Cargar notas disponibles para el modo resumen
    notasService.obtenerTodas()
      .then((data) => {
        setNotasList(data || []);
        if (data && data.length > 0) {
          setNotaSeleccionadaId(String(data[0].id));
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleEnviarMensaje = async (e) => {
    e.preventDefault();
    if (!pregunta.trim() || loading) return;

    const textoUsuario = pregunta.trim();
    setPregunta('');
    setError(null);

    if (modo === 'conversacion') {
      // Agregar mensaje del usuario a la vista
      setMensajes((prev) => [...prev, { rol: 'user', texto: textoUsuario }]);
      try {
        setLoading(true);
        const data = await iaService.conversar(textoUsuario, conversacionId);
        setConversacionId(data.conversacionId);
        setMensajes((prev) => [
          ...prev,
          {
            rol: 'assistant',
            texto: data.respuesta,
            tokens: data.uso?.total_tokens
          }
        ]);
      } catch (err) {
        setError(err);
        notifyError(err.message || 'Error al comunicarse con DeepSeek');
      } finally {
        setLoading(false);
      }
    } else if (modo === 'pregunta') {
      try {
        setLoading(true);
        setRespuestaDirecta(null);
        const data = await iaService.preguntar(textoUsuario);
        setRespuestaDirecta(data);
        notifySuccess('Respuesta generada por DeepSeek');
      } catch (err) {
        setError(err);
        notifyError(err.message || 'Error al consultar DeepSeek');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleResumirNotaSubmit = async (e) => {
    e.preventDefault();
    if (!notaSeleccionadaId || loading) return;

    try {
      setLoading(true);
      setError(null);
      setResumenNota(null);
      const data = await notasService.resumir(Number(notaSeleccionadaId));
      setResumenNota(data);
      notifySuccess('Resumen generado exitosamente');
    } catch (err) {
      setError(err);
      notifyError(err.message || 'Error al resumir la nota');
    } finally {
      setLoading(false);
    }
  };

  const reiniciarConversacion = () => {
    setConversacionId(null);
    setMensajes([
      {
        rol: 'assistant',
        texto: 'Conversación reiniciada. ¿Qué otra duda o tema académico deseas explorar?'
      }
    ]);
  };

  return (
    <div className="ia-page">
      <div className="card-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h2>Asistente Académico DeepSeek</h2>
          <p>Consultas conceptuales, resolución de dudas y generación automática de resúmenes mediante IA</p>
        </div>

        {/* Selector de Modo */}
        <div className="mode-selector">
          <button
            onClick={() => setModo('conversacion')}
            className={`btn btn-sm ${modo === 'conversacion' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <MessageSquare size={15} />
            <span>Chat con Historial</span>
          </button>
          <button
            onClick={() => setModo('pregunta')}
            className={`btn btn-sm ${modo === 'pregunta' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Zap size={15} />
            <span>Consulta Rápida</span>
          </button>
          <button
            onClick={() => setModo('resumen')}
            className={`btn btn-sm ${modo === 'resumen' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <FileText size={15} />
            <span>Resumir Apunte</span>
          </button>
        </div>
      </div>

      <ErrorBanner error={error} />

      {/* MODO 1: CONVERSACIÓN INTERACTIVA */}
      {modo === 'conversacion' && (
        <div className="card chat-card">
          <div className="chat-top-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div className="ai-status-circle">
                <Cpu size={16} />
              </div>
              <div>
                <strong>DeepSeek Flash Assistant</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginLeft: '0.5rem' }}>
                  {conversacionId ? `Sesión activa: #${conversacionId.substring(0, 8)}...` : 'Nueva sesión'}
                </span>
              </div>
            </div>
            <button
              onClick={reiniciarConversacion}
              className="btn btn-ghost btn-sm"
              title="Iniciar una nueva conversación limpia"
            >
              <RotateCcw size={14} />
              <span>Limpiar Chat</span>
            </button>
          </div>

          <div className="chat-messages-box">
            {mensajes.map((m, index) => (
              <div
                key={index}
                className={`chat-bubble ${m.rol === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`}
              >
                <div className="bubble-author">
                  {m.rol === 'user' ? 'Tú' : 'DeepSeek'}
                </div>
                <div className="bubble-text">{m.texto}</div>
                {m.tokens && (
                  <div className="bubble-tokens">
                    Tokens: {m.tokens}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="chat-bubble chat-bubble-ai chat-typing">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            )}
          </div>

          <form onSubmit={handleEnviarMensaje} className="chat-input-bar">
            <input
              type="text"
              className="form-input"
              style={{ flex: 1 }}
              placeholder="Pregunta algo sobre tus materias o temas (ej. ¿Cómo balanceo ecuaciones redox?)..."
              value={pregunta}
              onChange={(e) => setPregunta(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !pregunta.trim()}
            >
              <Send size={16} />
              <span>Enviar</span>
            </button>
          </form>
        </div>
      )}

      {/* MODO 2: PREGUNTA RÁPIDA SIN HISTORIAL */}
      {modo === 'pregunta' && (
        <div className="card query-card">
          <form onSubmit={handleEnviarMensaje} style={{ marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Escribe tu consulta académica * (mínimo 3 caracteres)</label>
              <textarea
                className="form-textarea"
                rows={3}
                required
                minLength={3}
                maxLength={2000}
                placeholder="Ej. Explica la diferencia entre enlace covalente polar y no polar con ejemplos..."
                value={pregunta}
                onChange={(e) => setPregunta(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || pregunta.trim().length < 3}
              >
                {loading ? 'Consultando a DeepSeek...' : 'Generar Respuesta'}
              </button>
            </div>
          </form>

          {loading && <LoadingSpinner mensaje="DeepSeek está procesando tu consulta..." />}

          {respuestaDirecta && (
            <div className="query-result-box">
              <div className="query-result-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={18} className="text-primary" />
                  <strong>Respuesta de DeepSeek</strong>
                </div>
                {respuestaDirecta.uso && (
                  <div className="query-tokens-badge">
                    Total: {respuestaDirecta.uso.total_tokens} tokens ({respuestaDirecta.uso.prompt_tokens} in / {respuestaDirecta.uso.completion_tokens} out)
                  </div>
                )}
              </div>
              <div className="query-result-body">
                {respuestaDirecta.respuesta}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODO 3: RESUMEN DE NOTAS */}
      {modo === 'resumen' && (
        <div className="card resumen-card">
          <form onSubmit={handleResumirNotaSubmit} style={{ marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Selecciona el apunte de tu cuaderno que deseas sintetizar *</label>
              <select
                className="form-select"
                required
                value={notaSeleccionadaId}
                onChange={(e) => setNotaSeleccionadaId(e.target.value)}
              >
                {notasList.map((n) => (
                  <option key={n.id} value={n.id}>
                    #{n.id} — {n.titulo} {n.subject ? `(${n.subject.codigo})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !notaSeleccionadaId}
              >
                {loading ? 'Sintetizando apunte...' : 'Generar Resumen de 3 Viñetas'}
              </button>
            </div>
          </form>

          {loading && <LoadingSpinner mensaje="Analizando apunte y extrayendo conceptos clave..." />}

          {resumenNota && (
            <div className="query-result-box">
              <div className="query-result-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={18} className="text-primary" />
                  <strong>Resumen Académico Sintetizado</strong>
                </div>
                {resumenNota.uso && (
                  <span className="badge badge-info">
                    {resumenNota.uso.total_tokens} tokens consumidos
                  </span>
                )}
              </div>
              <div className="query-result-body">
                {resumenNota.resumen}
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        .mode-selector {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .chat-card {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 220px);
          min-height: 520px;
          padding: 0;
          overflow: hidden;
        }
        .chat-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.875rem 1.25rem;
          border-bottom: 1px solid var(--border-light);
          background: #ffffff;
        }
        .ai-status-circle {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-full);
          background: var(--primary-100);
          color: var(--primary-700);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .chat-messages-box {
          flex: 1;
          padding: 1.25rem 1.5rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          background: var(--surface-ground);
        }
        .chat-bubble {
          max-width: 78%;
          padding: 0.875rem 1.125rem;
          border-radius: var(--radius-lg);
          font-size: 0.92rem;
          line-height: 1.55;
          animation: fadeIn 0.2s ease-out;
        }
        .chat-bubble-user {
          align-self: flex-end;
          background: var(--primary-600);
          color: white;
          border-bottom-right-radius: 4px;
        }
        .chat-bubble-ai {
          align-self: flex-start;
          background: #ffffff;
          color: var(--text-main);
          border: 1px solid var(--border-light);
          border-bottom-left-radius: 4px;
          box-shadow: var(--shadow-xs);
        }
        .bubble-author {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 0.25rem;
          opacity: 0.85;
        }
        .bubble-tokens {
          font-size: 0.68rem;
          color: var(--text-light);
          margin-top: 0.35rem;
          text-align: right;
        }
        .chat-input-bar {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          background: #ffffff;
          border-top: 1px solid var(--border-light);
        }
        .chat-typing {
          display: flex;
          gap: 0.35rem;
          align-items: center;
          padding: 0.75rem 1rem;
        }
        .dot {
          width: 7px;
          height: 7px;
          background: #94a3b8;
          border-radius: 50%;
          animation: bounce 1.2s infinite ease-in-out;
        }
        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
        .query-result-box {
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          background: var(--surface-ground);
          overflow: hidden;
        }
        .query-result-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.875rem 1.25rem;
          background: #ffffff;
          border-bottom: 1px solid var(--border-light);
        }
        .query-tokens-badge {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          background: var(--surface-alt);
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-sm);
        }
        .query-result-body {
          padding: 1.25rem;
          font-size: 0.95rem;
          line-height: 1.6;
          color: var(--text-main);
          white-space: pre-wrap;
        }
      `}</style>
    </div>
  );
};

export default IAPage;

