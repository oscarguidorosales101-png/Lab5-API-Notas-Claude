const express = require('express');
const router = express.Router();
const notasService = require('../services/notas.service');
const { validar, notaSchema } = require('../middlewares/validar');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const costosService = require('../services/costos.service');

/**
 * Middleware para validar que el parámetro :id sea un entero positivo.
 */
const validarParamId = (req, res, next) => {
  const { id } = req.params;
  const numId = Number(id);

  if (!Number.isInteger(numId) || numId <= 0) {
    return next(new BadRequestError('El parámetro id debe ser un número entero positivo'));
  }

  req.notaId = numId;
  next();
};

/**
 * @openapi
 * /api/notas:
 *   get:
 *     summary: Obtener todas las notas
 *     description: Retorna un listado con todas las notas almacenadas en la base de datos SQLite. Si no hay notas registradas, devuelve un arreglo vacío.
 *     tags:
 *       - Notas
 *     responses:
 *       200:
 *         description: Lista de notas obtenida exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Nota'
 *             example:
 *               - id: 1
 *                 titulo: "Mi primera nota"
 *                 contenido: "Contenido de ejemplo para la nota"
 *               - id: 2
 *                 titulo: "Segunda nota"
 *                 contenido: "Otro contenido relevante"
 */
router.get('/', async (req, res, next) => {
  try {
    const notas = await notasService.obtenerTodas(req.query);
    res.status(200).json(notas);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/notas/{id}:
 *   get:
 *     summary: Obtener una nota por ID
 *     description: Busca y retorna una nota específica a partir de su identificador numérico único.
 *     tags:
 *       - Notas
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID único de la nota a consultar
 *         example: 1
 *     responses:
 *       200:
 *         description: Nota encontrada y retornada exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Nota'
 *             example:
 *               id: 1
 *               titulo: "Mi primera nota"
 *               contenido: "Contenido de ejemplo para la nota"
 *       400:
 *         description: Identificador inválido (no es un entero positivo).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "El parámetro id debe ser un número entero positivo"
 *       404:
 *         description: Nota no encontrada con el ID proporcionado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Nota con id 999 no encontrada"
 */
router.get('/:id', validarParamId, async (req, res, next) => {
  try {
    const nota = await notasService.buscarPorId(req.notaId);
    if (!nota) {
      throw new NotFoundError(`Nota con id ${req.notaId} no encontrada`);
    }
    res.status(200).json(nota);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/notas:
 *   post:
 *     summary: Crear una nueva nota
 *     description: Valida el cuerpo de la petición con Zod y persiste una nueva nota en la base de datos con un ID autoincremental único.
 *     tags:
 *       - Notas
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CrearNotaInput'
 *           example:
 *             titulo: "Mi primera nota"
 *             contenido: "Contenido de ejemplo"
 *     responses:
 *       201:
 *         description: Nota creada exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Nota'
 *             example:
 *               id: 1
 *               titulo: "Mi primera nota"
 *               contenido: "Contenido de ejemplo"
 *       400:
 *         description: Error de validación en los datos enviados (título vacío, exceso de longitud, etc.).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Error de validación"
 *               detalles:
 *                 - campo: "titulo"
 *                   mensaje: "El título no puede estar vacío y debe tener al menos 1 carácter"
 */
router.post('/', validar(notaSchema), async (req, res, next) => {
  try {
    const nuevaNota = await notasService.crearNota(req.body);
    res.status(201).json(nuevaNota);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/notas/{id}:
 *   delete:
 *     summary: Eliminar una nota por ID
 *     description: Elimina una nota existente de la base de datos utilizando su identificador numérico.
 *     tags:
 *       - Notas
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID numérico de la nota a eliminar
 *         example: 1
 *     responses:
 *       204:
 *         description: Nota eliminada con éxito. No retorna contenido en el cuerpo.
 *       400:
 *         description: Identificador inválido (no es un entero positivo).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "El parámetro id debe ser un número entero positivo"
 *       404:
 *         description: La nota solicitada para eliminar no existe.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Nota con id 999 no encontrada"
 */
router.delete('/:id', validarParamId, async (req, res, next) => {
  try {
    const eliminada = await notasService.eliminarNota(req.notaId);
    if (!eliminada) {
      throw new NotFoundError(`Nota con id ${req.notaId} no encontrada`);
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/notas/{id}/resumen:
 *   post:
 *     summary: Resumir una nota con DeepSeek
 *     description: Busca primero la nota y envía su contenido para resumirlo en tres viñetas breves en español. Registra automáticamente el consumo y costo asociado.
 *     tags: [Notas, IA]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *         description: Identificador de una nota existente.
 *     responses:
 *       200:
 *         description: Resumen generado por DeepSeek.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [notaId, resumen]
 *               properties:
 *                 notaId: { type: integer, minimum: 1 }
 *                 resumen: { type: string }
 *       400:
 *         description: Identificador inválido.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: Nota inexistente. No se llama al proveedor.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       429: { $ref: '#/components/responses/IALimite' }
 *       502: { $ref: '#/components/responses/IAFallo' }
 *       503: { $ref: '#/components/responses/IAOcupada' }
 *       504: { $ref: '#/components/responses/IATimeout' }
 */
router.post('/:id/resumen', require('../middlewares/limitarIA').limitarIA, validarParamId, async (req, res, next) => {
  try {
    const nota = await notasService.buscarPorId(req.notaId);
    if (!nota) {
      throw new NotFoundError(`Nota con id ${req.notaId} no encontrada`);
    }

    const { respuesta, uso } = await require('../services/deepseek.service').preguntar(
      nota.contenido,
      'Resume el texto en 3 viñetas breves, en español.'
    );

    // Registro persistente del consumo y costos estimados
    if (uso) {
      await costosService.registrarConsumo({
        tipoOperacion: 'resumen',
        modelo: process.env.DEEPSEEK_MODEL || 'deepseek-flash',
        uso
      });
    }

    res.json({ notaId: nota.id, resumen: respuesta });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
