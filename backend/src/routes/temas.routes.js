const express = require('express');
const router = express.Router();
const temasService = require('../services/temas.service');
const { validar } = require('../middlewares/validar');
const { temaSchema, temaActualizarSchema } = require('../validators/academic.validator');
const { BadRequestError } = require('../utils/errors');

const validarParamId = (req, res, next) => {
  const numId = Number(req.params.id);
  if (!Number.isInteger(numId) || numId <= 0) {
    return next(new BadRequestError('El parámetro id debe ser un número entero positivo'));
  }
  req.temaId = numId;
  next();
};

/**
 * @openapi
 * /api/temas:
 *   get:
 *     summary: Listar temas académicos
 *     tags:
 *       - Temas
 *     parameters:
 *       - in: query
 *         name: materiaId
 *         schema:
 *           type: integer
 *         description: Filtro opcional por ID de materia
 *     responses:
 *       200:
 *         description: Lista de temas obtenida exitosamente.
 */
router.get('/', async (req, res, next) => {
  try {
    const temas = await temasService.obtenerTodos(req.query.materiaId);
    res.status(200).json(temas);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/temas/{id}:
 *   get:
 *     summary: Obtener un tema académico por ID
 *     tags:
 *       - Temas
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tema encontrado con su materia y notas asociadas.
 *       404:
 *         description: Tema no encontrado.
 */
router.get('/:id', validarParamId, async (req, res, next) => {
  try {
    const tema = await temasService.obtenerPorId(req.temaId);
    res.status(200).json(tema);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/temas:
 *   post:
 *     summary: Crear un nuevo tema académico
 *     tags:
 *       - Temas
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *             properties:
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               subjectId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Tema académico creado exitosamente.
 *       400:
 *         description: Error de validación.
 *       404:
 *         description: Materia asociada no encontrada.
 */
router.post('/', validar(temaSchema), async (req, res, next) => {
  try {
    const nuevoTema = await temasService.crear(req.body);
    res.status(201).json(nuevoTema);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/temas/{id}:
 *   put:
 *     summary: Actualizar un tema académico
 *     tags:
 *       - Temas
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Tema académico actualizado exitosamente.
 *       404:
 *         description: Tema o materia no encontrada.
 */
router.put('/:id', validarParamId, validar(temaActualizarSchema), async (req, res, next) => {
  try {
    const temaActualizado = await temasService.actualizar(req.temaId, req.body);
    res.status(200).json(temaActualizado);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/temas/{id}:
 *   delete:
 *     summary: Eliminar un tema académico
 *     tags:
 *       - Temas
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Tema eliminado exitosamente.
 *       404:
 *         description: Tema no encontrado.
 */
router.delete('/:id', validarParamId, async (req, res, next) => {
  try {
    await temasService.eliminar(req.temaId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;

