const router = require('express').Router();
const { z } = require('zod');
const { validar } = require('../middlewares/validar');
const deepseek = require('../services/deepseek.service');
const costosService = require('../services/costos.service');
const { limitarIA } = require('../middlewares/limitarIA');
const conversaciones = require('../services/conversacion.service');

router.use((req, res, next) => req.method === 'POST' ? limitarIA(req, res, next) : next());

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
    const resultado = await deepseek.preguntar(req.body.pregunta);

    // Registro persistente del consumo de tokens y estimación de costos
    if (resultado.uso) {
      await costosService.registrarConsumo({
        tipoOperacion: 'pregunta',
        modelo: process.env.DEEPSEEK_MODEL || 'deepseek-flash',
        uso: resultado.uso
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
router.get('/uso', async (req, res, next) => {
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
router.get('/uso/hoy', async (req, res, next) => {
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
router.get('/uso/resumen', async (req, res, next) => {
  try {
    const estadisticas = await costosService.obtenerResumenGeneral();
    res.json(estadisticas);
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
router.post('/conversar', validar(preguntaSchema.extend({
  conversacionId: z.string().uuid().optional()
})), async (req, res) => {
  const resultado = await conversaciones.conversar(req.body.pregunta, req.body.conversacionId);
  await costosService.registrarConsumo({
    tipoOperacion: 'pregunta', modelo: process.env.DEEPSEEK_MODEL, uso: resultado.uso
  });
  res.json(resultado);
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
