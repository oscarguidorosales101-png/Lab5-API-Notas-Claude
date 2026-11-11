const router = require('express').Router();
const { z } = require('zod');
const { validar } = require('../middlewares/validar');
const deepseek = require('../services/deepseek.service');

const preguntaSchema = z.object({
  pregunta: z.string().trim().min(3).max(2000)
});

/**
 * @openapi
 * /api/ia/preguntar:
 *   post:
 *     summary: Responder una pregunta con DeepSeek
 *     description: Valida y elimina espacios externos antes de llamar al proveedor. Retorna su texto y consumo real de tokens.
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
 *       description: Límite de peticiones del proveedor.
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
router.post('/preguntar', validar(preguntaSchema), async (req, res) => {
  res.json(await deepseek.preguntar(req.body.pregunta));
});

module.exports = router;
