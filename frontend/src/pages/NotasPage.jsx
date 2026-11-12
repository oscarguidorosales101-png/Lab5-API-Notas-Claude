import React, { useState, useEffect } from 'react';
import notasService from '../services/notas.service';
import materiasService from '../services/materias.service';
import temasService from '../services/temas.service';
import usuariosService from '../services/usuarios.service';
import { useApp } from '../context/AppContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import Badge from '../components/Badge';
import {
  FileText,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Eye,
  BookOpen,
  Tag,
  User,
  Calendar,
  Layers
} from 'lucide-react';

export const NotasPage = () => {
  const { notifySuccess, notifyError, usuarioActivo } = useApp();

  const [notas, setNotas] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [temas, setTemas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [filtroMateria, setFiltroMateria] = useState('');
  const [filtroTema, setFiltroTema] = useState('');
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // Modales
  const [modalCrearOpen, setModalCrearOpen] = useState(false);
  const [modalVerOpen, setModalVerOpen] = useState(false);
  const [modalResumenOpen, setModalResumenOpen] = useState(false);
  const [modalEliminarOpen, setModalEliminarOpen] = useState(false);

  const [notaSeleccionada, setNotaSeleccionada] = useState(null);
  const [resumenIA, setResumenIA] = useState(null);
  const [loadingResumen, setLoadingResumen] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  const [formData, setFormData] = useState({
    titulo: '',
    contenido: '',
    userId: '',
    subjectId: '',
    topicId: ''
  });

  // Cargar lista con filtros del backend
  const cargarNotas = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (filtroMateria) params.subjectId = filtroMateria;
      if (filtroTema) params.topicId = filtroTema;
      if (filtroUsuario) params.userId = filtroUsuario;
      if (busqueda.trim()) params.search = busqueda.trim();

      const [dataNotas, dataMaterias, dataTemas, dataUsuarios] = await Promise.all([
        notasService.obtenerTodas(params),
        materiasService.obtenerTodas().catch(() => []),
        temasService.obtenerTodos().catch(() => []),
        usuariosService.obtenerTodos().catch(() => [])
      ]);

      setNotas(dataNotas || []);
      setMaterias(dataMaterias || []);
      setTemas(dataTemas || []);
      setUsuarios(dataUsuarios || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarNotas();
  }, [filtroMateria, filtroTema, filtroUsuario]);

  const handleBuscar = (e) => {
    e.preventDefault();
    cargarNotas();
  };

  const handleCrearSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoadingAction(true);
      const payload = {
        titulo: formData.titulo.trim(),
        contenido: formData.contenido.trim()
      };
      if (formData.userId) payload.userId = Number(formData.userId);
      if (formData.subjectId) payload.subjectId = Number(formData.subjectId);
      if (formData.topicId) payload.topicId = Number(formData.topicId);

      await notasService.crear(payload);
      notifySuccess('Nota académica guardada exitosamente');
      setModalCrearOpen(false);
      setFormData({ titulo: '', contenido: '', userId: '', subjectId: '', topicId: '' });
      await cargarNotas();
    } catch (err) {
      notifyError(err.message || 'Error al guardar la nota');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleEliminarConfirm = async () => {
    try {
      setLoadingAction(true);
      await notasService.eliminar(notaSeleccionada.id);
      notifySuccess('Nota eliminada del cuaderno');
      setModalEliminarOpen(false);
      await cargarNotas();
    } catch (err) {
      notifyError(err.message || 'Error al eliminar nota');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleResumirNota = async (nota) => {
    setNotaSeleccionada(nota);
    setResumenIA(null);
    setModalResumenOpen(true);
    try {
      setLoadingResumen(true);
      const resultado = await notasService.resumir(nota.id);
      setResumenIA(resultado);
      notifySuccess('Resumen generado exitosamente mediante DeepSeek');
    } catch (err) {
      notifyError(err.message || 'Error al generar resumen con DeepSeek');
    } finally {
      setLoadingResumen(false);
    }
  };

  // Filtrar temas según la materia seleccionada en el formulario
  const temasFiltradosForm = formData.subjectId
    ? temas.filter((t) => t.subjectId === Number(formData.subjectId))
    : temas;

  // Filtrado reactivo en tiempo real mientras el usuario escribe
  const notasFiltradas = notas.filter((n) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase().trim();
    const titulo = (n.titulo || '').toLowerCase();
    const contenido = (n.contenido || '').toLowerCase();
    const materia = (n.subject?.nombre || n.subject?.codigo || '').toLowerCase();
    const tema = (n.topic?.nombre || '').toLowerCase();
    const autor = n.user ? `${n.user.nombre} ${n.user.apellidos}`.toLowerCase() : '';
    return titulo.includes(q) || contenido.includes(q) || materia.includes(q) || tema.includes(q) || autor.includes(q);
  });

  return (
    <div className="notas-page">
      <div className="card-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h2>Cuaderno de Apuntes y Notas</h2>
          <p>Organización temática de notas académicas por estudiante, materia y tema, con asistencia de IA</p>
        </div>
        <button
          onClick={() => {
            setFormData({
              titulo: '',
              contenido: '',
              userId: usuarioActivo ? String(usuarioActivo.id) : '',
              subjectId: materias[0]?.id ? String(materias[0].id) : '',
              topicId: ''
            });
            setModalCrearOpen(true);
          }}
          className="btn btn-primary"
        >
          <Plus size={16} />
          <span>Redactar Nota</span>
        </button>
      </div>

      <ErrorBanner error={error} onRetry={cargarNotas} />

      {/* Barra de Filtros y Búsqueda en Tiempo Real */}
      <div className="card filters-card">
        <form onSubmit={handleBuscar} className="search-form-row" style={{ flex: 1 }}>
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Buscar en el título o contenido de los apuntes..."
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
        </form>

        <span className="results-count">
          {notasFiltradas.length} {notasFiltradas.length === 1 ? 'apunte' : 'apuntes'}
        </span>

        <div className="filters-row">
          <div className="filter-item">
            <label className="filter-label">Materia:</label>
            <select
              className="form-select"
              value={filtroMateria}
              onChange={(e) => setFiltroMateria(e.target.value)}
            >
              <option value="">-- Todas las Materias --</option>
              {materias.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.codigo} — {m.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label className="filter-label">Tema:</label>
            <select
              className="form-select"
              value={filtroTema}
              onChange={(e) => setFiltroTema(e.target.value)}
            >
              <option value="">-- Todos los Temas --</option>
              {temas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre} {t.materia ? `(${t.materia.codigo})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label className="filter-label">Autor:</label>
            <select
              className="form-select"
              value={filtroUsuario}
              onChange={(e) => setFiltroUsuario(e.target.value)}
            >
              <option value="">-- Todos los Autores --</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre} {u.apellidos}
                </option>
              ))}
            </select>
          </div>

          {(filtroMateria || filtroTema || filtroUsuario || busqueda) && (
            <button
              onClick={() => {
                setFiltroMateria('');
                setFiltroTema('');
                setFiltroUsuario('');
                setBusqueda('');
              }}
              className="btn btn-ghost btn-sm"
              style={{ alignSelf: 'flex-end' }}
            >
              Restablecer
            </button>
          )}
        </div>
      </div>

      {/* Grid de Tarjetas de Notas */}
      {loading ? (
        <LoadingSpinner mensaje="Cargando cuaderno de notas..." />
      ) : notasFiltradas.length === 0 ? (
        <EmptyState
          icon={FileText}
          titulo="No hay notas que coincidan"
          descripcion="No se encontraron apuntes con los filtros aplicados o aún no has creado notas."
          actionText="Crear Nueva Nota"
          onAction={() => setModalCrearOpen(true)}
        />
      ) : (
        <div className="notas-grid">
          {notasFiltradas.map((n) => (
            <div key={n.id} className="card nota-card">
              <div className="nota-card-header">
                <span className="nota-date">
                  <Calendar size={13} />
                  {new Date(n.createdAt).toLocaleDateString('es-CR', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {n.subject && <span className="badge badge-info">{n.subject.codigo}</span>}
                  {n.topic && <span className="badge badge-neutral">{n.topic.nombre}</span>}
                </div>
              </div>

              <h3 className="nota-title">{n.titulo}</h3>
              <p className="nota-snippet">{n.contenido}</p>

              {n.user && (
                <div className="nota-author">
                  <User size={13} className="text-muted" />
                  <span>{n.user.nombre} {n.user.apellidos}</span>
                </div>
              )}

              <div className="nota-card-actions">
                <button
                  onClick={() => {
                    setNotaSeleccionada(n);
                    setModalVerOpen(true);
                  }}
                  className="btn btn-secondary btn-sm"
                  title="Ver contenido completo"
                >
                  <Eye size={14} />
                  <span>Leer</span>
                </button>
                <button
                  onClick={() => handleResumirNota(n)}
                  className="btn btn-ghost btn-sm text-primary"
                  title="Generar resumen de 3 viñetas con DeepSeek"
                >
                  <Sparkles size={14} />
                  <span>Resumir IA</span>
                </button>
                <button
                  onClick={() => {
                    setNotaSeleccionada(n);
                    setModalEliminarOpen(true);
                  }}
                  className="btn btn-ghost btn-icon btn-sm text-danger"
                  style={{ marginLeft: 'auto' }}
                  title="Eliminar nota"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Crear Nota */}
      <Modal isOpen={modalCrearOpen} onClose={() => setModalCrearOpen(false)} title="Redactar Apunte Académico" maxWidth="620px">
        <form onSubmit={handleCrearSubmit}>
          <div className="form-group">
            <label className="form-label">Título de la Nota * (1 a 100 caracteres)</label>
            <input
              type="text"
              className="form-input"
              required
              maxLength={100}
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Ej. Estructura del Átomo y Enlace Covalente"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Materia Asociada (Opcional)</label>
              <select
                className="form-select"
                value={formData.subjectId}
                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value, topicId: '' })}
              >
                <option value="">-- Sin materia asignada --</option>
                {materias.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.codigo} — {m.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Tema Académico (Opcional)</label>
              <select
                className="form-select"
                value={formData.topicId}
                onChange={(e) => setFormData({ ...formData, topicId: e.target.value })}
              >
                <option value="">-- Sin tema específico --</option>
                {temasFiltradosForm.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Contenido de la Nota * (1 a 5000 caracteres)</label>
            <textarea
              className="form-textarea"
              rows={8}
              required
              maxLength={5000}
              value={formData.contenido}
              onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
              placeholder="Escribe aquí tus apuntes, definiciones, teoremas o fórmulas..."
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.75rem', color: 'var(--text-light)' }}>
              {formData.contenido.length} / 5000 caracteres
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={() => setModalCrearOpen(false)}
              className="btn btn-secondary"
              disabled={loadingAction}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loadingAction}>
              {loadingAction ? 'Guardando en MySQL...' : 'Guardar Apunte'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Leer Nota Completa */}
      <Modal isOpen={modalVerOpen} onClose={() => setModalVerOpen(false)} title={notaSeleccionada?.titulo || 'Detalle del Apunte'} maxWidth="680px">
        {notaSeleccionada && (
          <div className="nota-view-container">
            <div className="nota-meta-bar">
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {notaSeleccionada.subject && <span className="badge badge-info">{notaSeleccionada.subject.codigo} — {notaSeleccionada.subject.nombre}</span>}
                {notaSeleccionada.topic && <span className="badge badge-neutral">{notaSeleccionada.topic.nombre}</span>}
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {new Date(notaSeleccionada.createdAt).toLocaleString('es-CR')}
              </span>
            </div>

            <div className="nota-full-body">
              {notaSeleccionada.contenido}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
              <button
                onClick={() => handleResumirNota(notaSeleccionada)}
                className="btn btn-secondary"
              >
                <Sparkles size={16} className="text-primary" />
                <span>Generar Resumen con DeepSeek</span>
              </button>
              <button onClick={() => setModalVerOpen(false)} className="btn btn-primary">
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Resumen de IA */}
      <Modal isOpen={modalResumenOpen} onClose={() => setModalResumenOpen(false)} title="Resumen Asistido por DeepSeek" maxWidth="620px">
        {loadingResumen ? (
          <LoadingSpinner mensaje="DeepSeek está analizando el apunte y generando el resumen de tres viñetas..." />
        ) : resumenIA ? (
          <div className="ia-resumen-box">
            <div className="ia-resumen-banner">
              <Sparkles size={20} className="text-primary" />
              <div>
                <strong>Resumen Sintético Generado por DeepSeek AI</strong>
                <p style={{ margin: 0, fontSize: '0.8rem' }}>
                  Modelo: deepseek-flash | Tokens consumidos: {resumenIA.uso?.total_tokens || 0}
                </p>
              </div>
            </div>

            <div className="ia-resumen-content">
              {resumenIA.resumen}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button onClick={() => setModalResumenOpen(false)} className="btn btn-primary">
                Entendido
              </button>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={Sparkles}
            titulo="No se pudo obtener el resumen"
            descripcion="Ocurrió un error al consultar el servicio de IA de DeepSeek."
          />
        )}
      </Modal>

      {/* Modal: Confirmar Eliminación */}
      <ConfirmModal
        isOpen={modalEliminarOpen}
        onClose={() => setModalEliminarOpen(false)}
        onConfirm={handleEliminarConfirm}
        title="Eliminar Apunte"
        mensaje={`¿Confirma que desea eliminar la nota '${notaSeleccionada?.titulo}'? Esta acción no se puede deshacer.`}
        confirmText="Eliminar Nota"
        loading={loadingAction}
      />

      <style>{`
        .filters-card {
          padding: 1.25rem;
          margin-bottom: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .search-form-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .filters-row {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          flex-wrap: wrap;
          border-top: 1px solid var(--border-light);
          padding-top: 1rem;
        }
        .notas-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.25rem;
        }
        .nota-card {
          display: flex;
          flex-direction: column;
          padding: 1.35rem;
          height: 100%;
        }
        .nota-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }
        .nota-date {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.75rem;
          color: var(--text-light);
        }
        .nota-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 0.5rem;
          line-height: 1.3;
        }
        .nota-snippet {
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.45;
          margin-bottom: 0.75rem;
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
          flex: 1;
        }
        .nota-author {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-bottom: 0.875rem;
        }
        .nota-card-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border-top: 1px solid var(--border-light);
          padding-top: 0.875rem;
          margin-top: auto;
        }
        .nota-meta-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 1rem;
          margin-bottom: 1rem;
          border-bottom: 1px solid var(--border-light);
        }
        .nota-full-body {
          font-size: 0.95rem;
          line-height: 1.6;
          color: var(--text-main);
          white-space: pre-wrap;
          max-height: 50vh;
          overflow-y: auto;
        }
        .ia-resumen-banner {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 1rem;
          background: var(--primary-50);
          border: 1px solid var(--primary-200);
          border-radius: var(--radius-md);
          margin-bottom: 1.25rem;
        }
        .ia-resumen-content {
          padding: 1.25rem;
          background: #ffffff;
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          font-size: 0.925rem;
          line-height: 1.6;
          white-space: pre-wrap;
        }
      `}</style>
    </div>
  );
};

export default NotasPage;

