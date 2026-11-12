import React, { useState, useEffect, useRef } from 'react';
import iaService from '../services/ia.service';
import notasService from '../services/notas.service';
import { useApp } from '../context/AppContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';
import {
  Bot,
  Send,
  Sparkles,
  MessageSquare,
  FileText,
  RotateCcw,
  Zap,
  Cpu,
  Trash2,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const IAPage = () => {
  const { notifySuccess, notifyError, notifyInfo, usuario } = useApp();

  const [modo, setModo] = useState('conversacion'); // 'conversacion' | 'pregunta' | 'resumen'
  const [pregunta, setPregunta] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Historial de conversaciones guardadas en MySQL
  const [conversacionesLista, setConversacionesLista] = useState([]);
  const [loadingConversaciones, setLoadingConversaciones] = useState(false);

  // Estado para conversación interactiva activa
  const [conversacionId, setConversacionId] = useState(null);
  const [conversacionTitulo, setConversacionTitulo] = useState('Nueva conversación');
  const [mensajes, setMensajes] = useState([
    {
      rol: 'assistant',
      texto: `¡Hola, ${usuario?.nombre || 'estudiante'}! Soy tu asistente académico impulsado por DeepSeek (${usuario?.rol || 'ESTUDIANTE'}). ¿En qué tema o materia puedo apoyarte hoy?`
    }
  ]);

  // Estado para pregunta directa
  const [respuestaDirecta, setRespuestaDirecta] = useState(null);

  // Estado para resumen de notas
  const [notasList, setNotasList] = useState([]);
  const [notaSeleccionadaId, setNotaSeleccionadaId] = useState('');
  const [resumenNota, setResumenNota] = useState(null);

  const messagesEndRef = useRef(null);

  const promptsPorRol = {
    ADMIN: [
      'Analiza los costos de IA acumulados y sugiere medidas de eficiencia en tokens.',
      '¿Cómo planificar de forma óptima la capacidad y prerrequisitos de cursos universitarios?',
      'Recomienda lineamientos de gobernanza para el uso de LLMs en el sistema académico.'
    ],
    DOCENTE: [
      'Diseña una rúbrica analítica de evaluación (escala de 0 a 100) para un proyecto de desarrollo web.',
      'Sugiere 3 actividades didácticas activas para enseñar el concepto de integridad referencial.',
      'Redacta una retroalimentación formativa y motivadora para un estudiante con dificultad en un examen.'
    ],
    ESTUDIANTE: [
      'Explícame qué es una clave foránea y cómo evita la inconsistencia de datos con un ejemplo sencillo.',
      '¿Cuáles son las técnicas de estudio más efectivas para preparar exámenes de programación?',
      '¿Cuál es la diferencia entre una clave primaria simple y una clave compuesta en bases de datos?'
    ]
  };
  const promptsSugeridos = promptsPorRol[usuario?.rol] || promptsPorRol.ESTUDIANTE;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [mensajes, loading]);

  // Cargar lista de conversaciones del usuario desde MySQL
  const cargarConversaciones = async () => {
    if (!usuario) return;
    try {
      setLoadingConversaciones(true);
      const data = await iaService.listarConversaciones();
      setConversacionesLista(data || []);
    } catch (err) {
      console.warn('No se pudieron cargar conversaciones:', err.message);
    } finally {
      setLoadingConversaciones(false);
    }
  };

  // Cargar notas disponibles para el modo resumen
  useEffect(() => {
    cargarConversaciones();
    notasService.obtenerTodas()
      .then((data) => {
        setNotasList(data || []);
        if (data && data.length > 0) {
          setNotaSeleccionadaId(String(data[0].id));
        }
      })
      .catch((err) => console.error(err));
  }, [usuario]);

  // Seleccionar una conversación existente para cargar su historial de mensajes
  const handleSeleccionarConversacion = async (id) => {
    if (loading || id === conversacionId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await iaService.obtenerConversacion(id);
      setConversacionId(data.id);
      setConversacionTitulo(data.titulo);
      if (data.messages && data.messages.length > 0) {
        setMensajes(data.messages.map((m) => ({
          rol: m.role,
          texto: m.content,
          tokens: m.tokens
        })));
      } else {
        setMensajes([
          {
            rol: 'assistant',
            texto: 'Esta conversación no contiene mensajes previos. Envía tu primera consulta para comenzar.'
          }
        ]);
      }
    } catch (err) {
      notifyError('No se pudo recuperar el historial de la conversación seleccionada');
    } finally {
      setLoading(false);
    }
  };

  // Crear una nueva conversación limpia
  const handleNuevaConversacion = () => {
    setConversacionId(null);
    setConversacionTitulo('Nueva conversación');
    setMensajes([
      {
        rol: 'assistant',
        texto: `Nueva conversación iniciada para ${usuario?.nombre || 'usuario'}. ¿Qué tema deseas tratar hoy?`
      }
    ]);
    setError(null);
  };

  // Eliminar una conversación
  const handleEliminarConversacion = async (e, id) => {
    e.stopPropagation();
    try {
      await iaService.eliminarConversacion(id);
      notifySuccess('Conversación eliminada del historial');
      if (conversacionId === id) {
        handleNuevaConversacion();
      }
      await cargarConversaciones();
    } catch (err) {
      notifyError(err.message || 'Error al eliminar conversación');
    }
  };

  const handleEnviarMensaje = async (e) => {
    if (e) e.preventDefault();
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
        // Recargar la lista lateral para actualizar títulos y fechas
        cargarConversaciones();
      } catch (err) {
        setError(err);
        if (err.status === 429) {
          notifyError('Límite diario de consultas de IA alcanzado');
        } else {
          notifyError(err.message || 'Error al comunicarse con DeepSeek');
        }
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviarMensaje();
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

  return (
    <div className="ia-page">
      {/* Selector de Modos de IA */}
      <div className="ia-modes-header">
        <div>
          <h2>Asistente de Inteligencia Artificial</h2>
          <p>Tutor académico y consultor pedagógico impulsado por DeepSeek en tiempo real</p>
        </div>
        <div className="ia-mode-tabs">
          <button
            onClick={() => setModo('conversacion')}
            className={`btn btn-sm ${modo === 'conversacion' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <MessageSquare size={15} />
            <span>Chat Multi-Turno</span>
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

      {/* MODO 1: CHAT CONVERSACIONAL PROFESIONAL CON HISTORIAL LATERAL */}
      {modo === 'conversacion' && (
        <div className="chat-layout-container">
          {/* Panel Lateral de Sesiones Guardadas */}
          <aside className="chat-history-sidebar">
            <div className="chat-sidebar-header">
              <span className="chat-sidebar-title">
                <Clock size={15} /> Mis Conversaciones
              </span>
              <button
                onClick={handleNuevaConversacion}
                className="btn btn-primary btn-sm btn-new-chat"
                title="Comenzar una nueva conversación limpia"
              >
                <Plus size={14} />
                <span>Nueva</span>
              </button>
            </div>

            <div className="chat-sessions-list">
              {loadingConversaciones && conversacionesLista.length === 0 ? (
                <p className="chat-sidebar-empty">Cargando historial...</p>
              ) : conversacionesLista.length === 0 ? (
                <div className="chat-sidebar-empty">
                  <p>No tienes conversaciones previas guardadas.</p>
                  <span>Tus chats se guardarán en MySQL automáticamente.</span>
                </div>
              ) : (
                conversacionesLista.map((c) => {
                  const isActive = c.id === conversacionId;
                  return (
                    <div
                      key={c.id}
                      className={`chat-session-item ${isActive ? 'active' : ''}`}
                      onClick={() => handleSeleccionarConversacion(c.id)}
                    >
                      <div className="chat-session-info">
                        <span className="chat-session-title">{c.titulo}</span>
                        <span className="chat-session-meta">
                          {c.totalMensajes} msgs &bull; {new Date(c.updatedAt).toLocaleDateString('es-CR', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <button
                        onClick={(e) => handleEliminarConversacion(e, c.id)}
                        className="btn-delete-session"
                        title="Eliminar conversación"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </aside>

          {/* Área Principal de Conversación */}
          <div className="chat-main-panel card">
            <div className="chat-top-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div className="ai-status-circle">
                  <Cpu size={16} />
                </div>
                <div>
                  <strong>{conversacionTitulo}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginLeft: '0.5rem' }}>
                    {conversacionId ? `Sesión: #${conversacionId.slice(0, 8)}...` : 'Nueva sesión'} &bull; DeepSeek Flash
                  </span>
                </div>
              </div>
              <button
                onClick={handleNuevaConversacion}
                className="btn btn-ghost btn-sm"
                title="Limpiar y comenzar nuevo chat"
              >
                <RotateCcw size={14} />
                <span>Limpiar</span>
              </button>
            </div>

            {/* Lista de Mensajes */}
            <div className="chat-messages-box">
              {mensajes.map((m, index) => (
                <div
                  key={index}
                  className={`chat-bubble ${m.rol === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`}
                >
                  <div className="bubble-author">
                    {m.rol === 'user' ? (usuario?.nombre || 'Tú') : 'Asistente DeepSeek'}
                  </div>
                  <div className="bubble-text">{m.texto}</div>
                  {m.tokens && (
                    <div className="bubble-tokens">
                      Consumo: {m.tokens} tokens
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
              <div ref={messagesEndRef} />
            </div>

            {/* Banner amigable si se alcanza el límite 429 sin cerrar sesión */}
            {error && error.status === 429 && (
              <div className="limit-reached-banner">
                <AlertCircle size={16} />
                <div>
                  <strong>Límite diario de consultas alcanzado:</strong>
                  <p>Has alcanzado el límite diario permitido de consultas de inteligencia artificial para tu usuario. Tu sesión sigue activa y todos tus datos se conservan. Podrás enviar nuevas consultas mañana.</p>
                </div>
              </div>
            )}

            {/* Sugerencias de Prompts por Rol */}
            <div className="suggested-prompts-bar">
              <span className="suggested-prompts-label">
                <Sparkles size={13} className="text-primary-600" /> Sugerencias ({usuario?.rol || 'ESTUDIANTE'}):
              </span>
              <div className="suggested-pills-row">
                {promptsSugeridos.map((promptText, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="prompt-pill-btn"
                    onClick={() => setPregunta(promptText)}
                    disabled={loading}
                  >
                    {promptText}
                  </button>
                ))}
              </div>
            </div>

            {/* Barra de Entrada de Mensaje */}
            <form onSubmit={handleEnviarMensaje} className="chat-input-bar">
              <textarea
                className="chat-textarea"
                rows={1}
                placeholder="Escribe tu mensaje... (Presiona Enter para enviar, Shift + Enter para salto de línea)"
                value={pregunta}
                onChange={(e) => setPregunta(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
              <button
                type="submit"
                className="btn btn-primary btn-send-message"
                disabled={loading || !pregunta.trim()}
              >
                <Send size={16} />
                <span>Enviar</span>
              </button>
            </form>
          </div>
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
                placeholder="Formula una consulta concisa para recibir una respuesta directa..."
                value={pregunta}
                onChange={(e) => setPregunta(e.target.value)}
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !pregunta.trim()}
            >
              <Send size={16} />
              <span>{loading ? 'Consultando...' : 'Enviar Consulta'}</span>
            </button>
          </form>

          {respuestaDirecta && (
            <div className="query-result-box">
              <div className="query-result-header">
                <strong>Respuesta de DeepSeek</strong>
                {respuestaDirecta.uso && (
                  <span className="query-tokens-badge">
                    {respuestaDirecta.uso.total_tokens} tokens consumidos
                  </span>
                )}
              </div>
              <div className="query-result-body">
                {respuestaDirecta.respuesta}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODO 3: RESUMEN DE APUNTE ACADÉMICO */}
      {modo === 'resumen' && (
        <div className="card summary-card">
          <form onSubmit={handleResumirNotaSubmit} style={{ marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Seleccione el apunte que desea resumir en 3 viñetas:</label>
              <select
                className="form-select"
                value={notaSeleccionadaId}
                onChange={(e) => setNotaSeleccionadaId(e.target.value)}
                disabled={loading || notasList.length === 0}
              >
                {notasList.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.titulo} {n.subject ? `(${n.subject.codigo})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !notaSeleccionadaId}
            >
              <FileText size={16} />
              <span>{loading ? 'Generando resumen...' : 'Resumir con DeepSeek'}</span>
            </button>
          </form>

          {resumenNota && (
            <div className="query-result-box">
              <div className="query-result-header">
                <strong>Resumen Sintetizado</strong>
                <span className="query-tokens-badge">Nota #{resumenNota.notaId}</span>
              </div>
              <div className="query-result-body">
                {resumenNota.resumen}
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        .ia-page {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          height: calc(100vh - var(--header-height) - 3.5rem);
        }
        .ia-modes-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .ia-mode-tabs {
          display: flex;
          gap: 0.5rem;
        }
        .chat-layout-container {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 1.25rem;
          flex: 1;
          min-height: 0;
        }
        @media (max-width: 900px) {
          .chat-layout-container {
            grid-template-columns: 1fr;
          }
          .chat-history-sidebar {
            display: none;
          }
        }
        .chat-history-sidebar {
          background: #ffffff;
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: var(--shadow-sm);
        }
        .chat-sidebar-header {
          padding: 0.85rem 1rem;
          border-bottom: 1px solid var(--border-light);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f8fafc;
        }
        .chat-sidebar-title {
          font-size: 0.825rem;
          font-weight: 700;
          color: var(--navy-900);
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .btn-new-chat {
          padding: 0.25rem 0.6rem;
          font-size: 0.75rem;
          border-radius: var(--radius-sm);
        }
        .chat-sessions-list {
          flex: 1;
          overflow-y: auto;
          padding: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .chat-sidebar-empty {
          padding: 1.5rem 1rem;
          text-align: center;
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .chat-sidebar-empty span {
          display: block;
          font-size: 0.72rem;
          color: var(--text-light);
          margin-top: 0.25rem;
        }
        .chat-session-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.6rem 0.75rem;
          border-radius: var(--radius-md);
          cursor: pointer;
          border: 1px solid transparent;
          transition: all var(--transition-fast);
        }
        .chat-session-item:hover {
          background: var(--surface-ground);
        }
        .chat-session-item.active {
          background: var(--primary-50);
          border-color: var(--primary-200);
        }
        .chat-session-info {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          overflow: hidden;
          flex: 1;
        }
        .chat-session-title {
          font-size: 0.825rem;
          font-weight: 600;
          color: var(--navy-900);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .chat-session-meta {
          font-size: 0.7rem;
          color: var(--text-muted);
        }
        .btn-delete-session {
          background: transparent;
          border: none;
          color: var(--text-light);
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 4px;
          opacity: 0;
          transition: all var(--transition-fast);
        }
        .chat-session-item:hover .btn-delete-session {
          opacity: 1;
        }
        .btn-delete-session:hover {
          color: var(--danger-text);
          background: var(--danger-bg);
        }
        .chat-main-panel {
          display: flex;
          flex-direction: column;
          padding: 0;
          overflow: hidden;
          height: 100%;
        }
        .chat-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.875rem 1.25rem;
          background: #ffffff;
          border-bottom: 1px solid var(--border-light);
        }
        .ai-status-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--primary-50);
          color: var(--primary-600);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .chat-messages-box {
          flex: 1;
          overflow-y: auto;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          background: #f8fafc;
        }
        .chat-bubble {
          max-width: 80%;
          padding: 0.875rem 1.15rem;
          border-radius: var(--radius-lg);
          font-size: 0.925rem;
          line-height: 1.55;
          word-break: break-word;
        }
        .chat-bubble-user {
          align-self: flex-end;
          background: var(--primary-600);
          color: white;
          border-bottom-right-radius: 4px;
          box-shadow: 0 1px 3px rgba(2, 132, 199, 0.2);
        }
        .chat-bubble-ai {
          align-self: flex-start;
          background: #ffffff;
          color: var(--navy-900);
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
          padding: 0.85rem 1.25rem;
          background: #ffffff;
          border-top: 1px solid var(--border-light);
        }
        .chat-textarea {
          flex: 1;
          height: 42px;
          max-height: 120px;
          padding: 0.6rem 0.85rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-light);
          font-family: inherit;
          font-size: 0.9rem;
          color: var(--navy-900);
          resize: none;
          outline: none;
          transition: border-color var(--transition-fast);
        }
        .chat-textarea:focus {
          border-color: var(--primary-500);
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15);
        }
        .btn-send-message {
          height: 42px;
          padding: 0 1.25rem;
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
        .suggested-prompts-bar {
          padding: 0.6rem 1.25rem;
          background: #f8fafc;
          border-top: 1px solid var(--border-light);
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .suggested-prompts-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--navy-800);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
        .suggested-pills-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }
        .prompt-pill-btn {
          background: #ffffff;
          border: 1px solid var(--border-light);
          padding: 0.3rem 0.65rem;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          color: var(--navy-900);
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: left;
        }
        .prompt-pill-btn:hover:not(:disabled) {
          border-color: var(--primary-400);
          background: var(--primary-50);
          color: var(--primary-700);
        }
        .limit-reached-banner {
          display: flex;
          align-items: flex-start;
          gap: 0.65rem;
          background: var(--warning-bg);
          border: 1px solid var(--warning-border);
          color: var(--warning-text);
          padding: 0.75rem 1rem;
          margin: 0.5rem 1rem;
          border-radius: var(--radius-md);
          font-size: 0.825rem;
        }
        .limit-reached-banner strong {
          display: block;
          margin-bottom: 0.15rem;
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
