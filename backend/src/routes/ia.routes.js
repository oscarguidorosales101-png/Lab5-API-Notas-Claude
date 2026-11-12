const router = require('express').Router();
const { z } = require('zod');
const { validar } = require('../middlewares/validar');
const deepseek = require('../services/deepseek.service');
const costosService = require('../services/costos.service');
const { limitarIA } = require('../middlewares/limitarIA');
const conversaciones = require('../services/conversacion.service');
const { autenticar, requerirRol, autenticarOpcional } = require('../middlewares/auth');

router.use(autenticarOpcional);
router.use((req, res, next) => req.method === 'POST' ? limitarIA(req, res, next) : next());

const obtenerSystemPromptPorRol = (rol) => {
  if (rol === 'ADMIN') {
    return 'Eres un consultor analítico y asesor administrativo para el sistema universitario Notas Lab. Brindas recomendaciones sobre métricas académicas, costos de IA y optimización de recursos institucionales. Responde en español de forma ejecutiva, concisa y estructurada.';
  }
  if (rol === 'DOCENTE') {
    return 'Eres un asistente pedagógico de educación superior para el sistema Notas Lab. Apoyas a docentes en planificación de clases, rúbricas de evaluación, metodologías didácticas y retroalimentación académica. Responde en español de forma profesional, motivadora y didáctica.';
  }
  return 'Eres un tutor académico universitario para el sistema Notas Lab. Ayudas a los estudiantes a comprender conceptos complejos, resolver dudas paso a paso y orientar sus técnicas de estudio. Responde en español con claridad, paciencia y rigor académico.';
};

const verificarLimiteUsuario = async (req, res) => {
  const userId = req.user?.userId || req.user?.id;
  if (!userId) return true;
  const limiteDiario = parseInt(process.env.AI_DAILY_LIMIT_PER_USER || '60', 10);
  const consultasHoy = await costosService.contarConsumoHoyUsuario(userId);
  if (consultasHoy >= limiteDiario) {
    res.status(429).json({
      error: 'LIMITE_DIARIO_EXCEDIDO',
      mensaje: `Has alcanzado el límite diario permitido de ${limiteDiario} consultas de inteligencia artificial. Intenta nuevamente mañana o contacta al administrador.`,
      limite: limiteDiario,
      consultasHoy
    });
    return false;
  }
  return true;
};

const preguntaSchema = z.object({
  pregunta: z.string().trim().min(3).max(2000)
});

/**
 * @openapi
 * /api/ia/preguntar:
 *   post:
 *     summary: Responder una pregunta con DeepSeek
 *     description: Valida y elimina espacios externos antes de llamar al proveedor. Retorna su texto y consumo real de tokens, registrando el consumo de forma persistente.
 *     tags: [IA]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pregunta]
 *             properties:
 *               pregunta:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 2000
 *                 description: Longitud después de eliminar espacios externos.
 *                 example: ¿Qué es una API REST?
 *     responses:
 *       200:
 *         description: Texto y consumo informados por DeepSeek.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [respuesta, uso]
 *               properties:
 *                 respuesta: { type: string }
 *                 uso:
 *                   type: object
 *                   required: [prompt_tokens, completion_tokens, total_tokens]
 *                   additionalProperties: true
 *                   properties:
 *                     prompt_tokens: { type: integer, minimum: 0 }
 *                     completion_tokens: { type: integer, minimum: 0 }
 *                     total_tokens: { type: integer, minimum: 0 }
 *       400:
 *         description: Pregunta inválida. No se llama al proveedor.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       429: { $ref: '#/components/responses/IALimite' }
 *       502: { $ref: '#/components/responses/IAFallo' }
 *       503: { $ref: '#/components/responses/IAOcupada' }
 *       504: { $ref: '#/components/responses/IATimeout' }
 * components:
 *   responses:
 *     IALimite:
 *       description: Límite del proveedor (IA_NO_DISPONIBLE) o límite local compartido de 60 peticiones por IP cada 15 minutos (LIMITE_IA_EXCEDIDO, con Retry-After).
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ErrorResponse' }
 *           example: { error: IA_NO_DISPONIBLE }
 *     IAFallo:
 *       description: Configuración ausente, autenticación rechazada, respuesta inválida u otro fallo del proveedor.
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ErrorResponse' }
 *           example: { error: IA_NO_DISPONIBLE }
 *     IAOcupada:
 *       description: Proveedor temporalmente no disponible (503).
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ErrorResponse' }
 *           example: { error: IA_NO_DISPONIBLE }
 *     IATimeout:
 *       description: Se agotó el tiempo de espera de 30 segundos.
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ErrorResponse' }
 *           example: { error: IA_NO_DISPONIBLE }
 */
router.post('/preguntar', validar(preguntaSchema), async (req, res, next) => {
  try {
    if (!(await verificarLimiteUsuario(req, res))) return;

    const systemPrompt = req.user?.rol ? obtenerSystemPromptPorRol(req.user.rol) : undefined;
    const resultado = await deepseek.preguntar(req.body.pregunta, systemPrompt);

    // Registro persistente del consumo de tokens y estimación de costos
    if (resultado.uso) {
      await costosService.registrarConsumo({
        tipoOperacion: 'pregunta',
        modelo: process.env.DEEPSEEK_MODEL || 'deepseek-flash',
        uso: resultado.uso,
        userId: req.user?.userId || req.user?.id || null
      });
    }

    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/ia/uso:
 *   get:
 *     summary: Historial de consumo y costos de IA
 *     description: Retorna el listado paginado de todas las solicitudes realizadas al proveedor de IA con su consumo de tokens y costos calculados.
 *     tags: [IA]
 *     parameters:
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *         description: Cantidad máxima de registros a retornar
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Cantidad de registros a omitir para paginación
 *     responses:
 *       200:
 *         description: Historial de consumo obtenido exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [total, limite, offset, registros]
 *               properties:
 *                 total: { type: integer, example: 10 }
 *                 limite: { type: integer, example: 50 }
 *                 offset: { type: integer, example: 0 }
 *                 registros:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AIUsageRecord'
 */
router.get('/uso', autenticar, requerirRol(['ADMIN']), async (req, res, next) => {
  try {
    const { limite, offset } = req.query;
    const datos = await costosService.obtenerHistorial({ limite, offset });
    res.json(datos);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/ia/uso/hoy:
 *   get:
 *     summary: Resumen acumulado de consumo diario de IA
 *     description: Calcula los totales de solicitudes, tokens consumidos y costos acumulados del día en curso según la zona horaria configurada.
 *     tags: [IA]
 *     parameters:
 *       - in: query
 *         name: timezone
 *         schema:
 *           type: string
 *           example: "America/Costa_Rica"
 *         description: "Zona horaria IANA opcional para el cálculo (default: variable de entorno TIMEZONE)"
 *     responses:
 *       200:
 *         description: Resumen del consumo diario obtenido exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResumenDiario'
 */
router.get('/uso/hoy', autenticar, requerirRol(['ADMIN']), async (req, res, next) => {
  try {
    const { timezone } = req.query;
    const resumen = await costosService.obtenerResumenHoy({ timezone });
    res.json(resumen);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/ia/uso/resumen:
 *   get:
 *     summary: Estadísticas generales e históricas de consumo de IA
 *     description: Proporciona métricas consolidadas de consumo y costos, incluyendo desglose por tipo de operación (preguntas vs resúmenes).
 *     tags: [IA]
 *     responses:
 *       200:
 *         description: Métricas globales de consumo obtenidas con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResumenGeneral'
 */
router.get('/uso/resumen', autenticar, requerirRol(['ADMIN']), async (req, res, next) => {
  try {
    const estadisticas = await costosService.obtenerResumenGeneral();
    res.json(estadisticas);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/ia/conversaciones:
 *   get:
 *     summary: Listar todas las conversaciones del usuario autenticado
 *     tags: [IA]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de conversaciones del usuario con conteo de mensajes.
 */
router.get('/conversaciones', autenticar, async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const lista = await conversaciones.listarConversaciones(userId);
    res.json(lista);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/ia/conversaciones/{id}:
 *   get:
 *     summary: Obtener el historial completo de mensajes de una conversación
 *     tags: [IA]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalle de la conversación y lista cronológica de mensajes.
 *       404:
 *         description: Conversación no encontrada o no pertenece al usuario.
 */
router.get('/conversaciones/:id', autenticar, async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const conv = await conversaciones.obtenerConversacion(req.params.id, userId);
    res.json(conv);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/ia/conversaciones:
 *   post:
 *     summary: Crear una nueva sesión de conversación vacía
 *     tags: [IA]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *                 example: Dudas de Química Orgánica
 *     responses:
 *       201:
 *         description: Conversación creada exitosamente en base de datos.
 */
router.post('/conversaciones', autenticar, async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const conv = await conversaciones.crearConversacion(userId, req.body?.titulo);
    res.status(201).json(conv);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/ia/conversaciones/{id}:
 *   delete:
 *     summary: Eliminar una conversación y todo su historial de mensajes
 *     tags: [IA]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Conversación eliminada exitosamente.
 *       404:
 *         description: Conversación no encontrada.
 */
router.delete('/conversaciones/:id', autenticar, async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const resultado = await conversaciones.eliminarConversacion(req.params.id, userId);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/ia/conversar:
 *   post:
 *     summary: Conversar con historial de varios turnos
 *     description: Omite conversacionId al comenzar y reutiliza el identificador devuelto en los siguientes turnos. Historial en memoria, privado por identificador, expira tras 30 minutos sin actividad; se conservan los últimos 10 turnos. Se pierde al reiniciar. Límite compartido de 60 solicitudes por IP cada 15 minutos.
 *     tags: [IA]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pregunta]
 *             properties:
 *               pregunta: { type: string, minLength: 3, maxLength: 2000 }
 *               conversacionId: { type: string, format: uuid }
 *           example: { pregunta: 'Me llamo Ana. Recuerda mi nombre.' }
 *     responses:
 *       200:
 *         description: Identificador para continuar, respuesta y consumo real.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [conversacionId, respuesta, uso]
 *               properties:
 *                 conversacionId: { type: string, format: uuid }
 *                 respuesta: { type: string }
 *                 uso: { type: object, additionalProperties: true }
 *       400: { description: Pregunta o identificador inválidos. }
 *       404: { description: Conversación inexistente o expirada. }
 *       409: { description: Ya existe una solicitud en curso para esta conversación. }
 *       429: { description: Límite por IP o capacidad de conversaciones alcanzado. }
 *       502: { $ref: '#/components/responses/IAFallo' }
 *       503: { $ref: '#/components/responses/IAOcupada' }
 *       504: { $ref: '#/components/responses/IATimeout' }
 */
const normalizarPregunta = (req, res, next) => {
  if (req.body) {
    if (!req.body.pregunta && req.body.mensaje) {
      req.body.pregunta = req.body.mensaje;
    }
    if (req.body.conversacionId === null || req.body.conversacionId === '' || req.body.conversacionId === undefined) {
      delete req.body.conversacionId;
    }
  }
  next();
};

router.post('/conversar', normalizarPregunta, validar(preguntaSchema.extend({
  conversacionId: z.string().uuid().optional()
})), async (req, res, next) => {
  try {
    if (!(await verificarLimiteUsuario(req, res))) return;

    const systemPrompt = req.body.system || (req.user?.rol ? obtenerSystemPromptPorRol(req.user.rol) : undefined);
    const resultado = await conversaciones.conversar(req.body.pregunta, req.body.conversacionId, {
      system: systemPrompt,
      userId: req.user?.userId || req.user?.id || null
    });

    if (resultado.uso) {
      await costosService.registrarConsumo({
        tipoOperacion: 'pregunta',
        modelo: process.env.DEEPSEEK_MODEL || 'deepseek-flash',
        uso: resultado.uso,
        userId: req.user?.userId || req.user?.id || null
      });
    }

    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/ia/chat:
 *   post:
 *     summary: Chat conversacional interactivo (alias compatible)
 *     description: Permite enviar 'pregunta' o 'mensaje' y mantener una conversación fluida con historial.
 *     tags: [IA]
 */
router.post('/chat', async (req, res, next) => {
  try {
    if (!(await verificarLimiteUsuario(req, res))) return;

    const texto = req.body.pregunta || req.body.mensaje;
    if (!texto || typeof texto !== 'string' || texto.trim().length < 3 || texto.trim().length > 2000) {
      return res.status(400).json({
        error: 'Error de validación',
        detalles: [{ campo: 'pregunta', mensaje: 'Debe proporcionar una pregunta o mensaje entre 3 y 2000 caracteres' }]
      });
    }

    const conversacionId = (req.body.conversacionId && req.body.conversacionId.trim()) ? req.body.conversacionId.trim() : undefined;
    const systemPrompt = req.body.system || (req.user?.rol ? obtenerSystemPromptPorRol(req.user.rol) : undefined);
    const resultado = await conversaciones.conversar(texto.trim(), conversacionId, {
      system: systemPrompt,
      userId: req.user?.userId || req.user?.id || null
    });

    if (resultado.uso) {
      await costosService.registrarConsumo({
        tipoOperacion: 'pregunta',
        modelo: process.env.DEEPSEEK_MODEL || 'deepseek-flash',
        uso: resultado.uso,
        userId: req.user?.userId || req.user?.id || null
      });
    }
    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/ia/preguntar/stream:
 *   post:
 *     summary: Recibir una respuesta progresiva mediante SSE
 *     description: Emite eventos texto con fragmentos, fin con uso real, o error con IA_NO_DISPONIBLE. Después de iniciar SSE los fallos se comunican por evento, sin cambiar el HTTP 200. Al desconectarse el cliente se cancela la llamada. Límite compartido de 60 solicitudes por IP cada 15 minutos. Para ver fragmentos al llegar utiliza un cliente SSE o curl con -N; Swagger puede mostrar el resultado al finalizar.
 *     tags: [IA]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pregunta]
 *             properties:
 *               pregunta: { type: string, minLength: 3, maxLength: 2000 }
 *     responses:
 *       200:
 *         description: Flujo SSE con eventos texto, fin o error.
 *         content:
 *           text/event-stream:
 *             schema: { type: string }
 *       400: { description: Pregunta inválida. }
 *       429: { description: Límite por IP alcanzado. }
 *       502: { $ref: '#/components/responses/IAFallo' }
 *       503: { $ref: '#/components/responses/IAOcupada' }
 *       504: { $ref: '#/components/responses/IATimeout' }
 */
router.post('/preguntar/stream', validar(preguntaSchema), async (req, res, next) => {
  const controller = new AbortController();
  const cancelar = () => controller.abort();
  res.on('close', cancelar);
  const enviar = (evento, datos) => {
    if (!res.headersSent) {
      res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' });
      res.flushHeaders();
    }
    res.write(`event: ${evento}\ndata: ${JSON.stringify(datos)}\n\n`);
  };
  // El timeout del SDK cubre la apertura; este plazo también limita la lectura del flujo.
  const plazo = setTimeout(() => {
    controller.abort();
    if (res.destroyed || res.writableEnded) return;
    if (res.headersSent) {
      enviar('error', { error: 'IA_NO_DISPONIBLE' });
      res.end();
    } else {
      next(new (require('openai').APIConnectionTimeoutError)());
    }
  }, 30000);
  try {
    for await (const fragmento of deepseek.preguntarStream(req.body.pregunta, controller.signal)) {
      if (controller.signal.aborted) return;
      if (fragmento.texto) enviar('texto', fragmento);
      if (fragmento.uso) {
        await costosService.registrarConsumo({
          tipoOperacion: 'pregunta', modelo: process.env.DEEPSEEK_MODEL, uso: fragmento.uso
        });
        enviar('fin', fragmento);
      }
    }
    res.end();
  } catch (error) {
    if (controller.signal.aborted) return;
    if (!res.headersSent) return next(error);
    enviar('error', { error: 'IA_NO_DISPONIBLE' });
    res.end();
  } finally {
    clearTimeout(plazo);
    res.off('close', cancelar);
  }
});

module.exports = router;
