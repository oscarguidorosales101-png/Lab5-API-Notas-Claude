const express = require('express');
const router = express.Router();
const periodosService = require('../services/periodos.service');
const { validar } = require('../middlewares/validar');
const { periodoSchema, periodoActualizarSchema } = require('../validators/academic.validator');
const { BadRequestError } = require('../utils/errors');

const validarParamId = (req, res, next) => {
  const numId = Number(req.params.id);
  if (!Number.isInteger(numId) || numId <= 0) {
    return next(new BadRequestError('El parámetro id debe ser un número entero positivo'));
  }
  req.periodoId = numId;
  next();
};

/**
 * @openapi
 * /api/periodos:
 *   get:
 *     summary: Listar todos los períodos académicos
 *     tags:
 *       - Períodos
 *     responses:
 *       200:
 *         description: Lista de períodos académicos obtenida exitosamente.
 */
router.get('/', async (req, res, next) => {
  try {
    const periodos = await periodosService.obtenerTodos();
    res.status(200).json(periodos);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/periodos/{id}:
 *   get:
 *     summary: Obtener un período académico por ID
 *     tags:
 *       - Períodos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Período académico encontrado.
 *       404:
 *         description: Período académico no encontrado.
 */
router.get('/:id', validarParamId, async (req, res, next) => {
  try {
    const periodo = await periodosService.obtenerPorId(req.periodoId);
    res.status(200).json(periodo);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/periodos:
 *   post:
 *     summary: Crear un nuevo período académico
 *     tags:
 *       - Períodos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - fechaInicio
 *               - fechaFin
 *               - anio
 *               - periodo
 *             properties:
 *               nombre:
 *                 type: string
 *               fechaInicio:
 *                 type: string
 *                 format: date
 *               fechaFin:
 *                 type: string
 *                 format: date
 *               anio:
 *                 type: integer
 *               periodo:
 *                 type: string
 *               activo:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Período académico creado exitosamente.
 *       400:
 *         description: Error de validación o fechas inconsistentes.
 */
router.post('/', validar(periodoSchema), async (req, res, next) => {
  try {
    const nuevoPeriodo = await periodosService.crear(req.body);
    res.status(201).json(nuevoPeriodo);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/periodos/{id}:
 *   put:
 *     summary: Actualizar un período académico
 *     tags:
 *       - Períodos
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
 *         description: Período académico actualizado exitosamente.
 *       404:
 *         description: Período académico no encontrado.
 */
router.put('/:id', validarParamId, validar(periodoActualizarSchema), async (req, res, next) => {
  try {
    const periodoActualizado = await periodosService.actualizar(req.periodoId, req.body);
    res.status(200).json(periodoActualizado);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/periodos/{id}:
 *   delete:
 *     summary: Eliminar un período académico
 *     tags:
 *       - Períodos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Período académico eliminado exitosamente.
 *       404:
 *         description: Período académico no encontrado.
 */
router.delete('/:id', validarParamId, async (req, res, next) => {
  try {
    await periodosService.eliminar(req.periodoId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;

