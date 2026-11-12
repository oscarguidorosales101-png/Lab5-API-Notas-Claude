const express = require('express');
const router = express.Router();
const materiasService = require('../services/materias.service');
const temasService = require('../services/temas.service');
const { validar } = require('../middlewares/validar');
const {
  materiaSchema,
  materiaActualizarSchema,
  prerrequisitoSchema
} = require('../validators/academic.validator');
const { BadRequestError } = require('../utils/errors');
const { autenticar, requerirRol } = require('../middlewares/auth');

const validarParamId = (req, res, next) => {
  const numId = Number(req.params.id);
  if (!Number.isInteger(numId) || numId <= 0) {
    return next(new BadRequestError('El parámetro id debe ser un número entero positivo'));
  }
  req.materiaId = numId;
  next();
};

/**
 * @openapi
 * /api/materias:
 *   get:
 *     summary: Listar todas las materias
 *     tags:
 *       - Materias
 *     responses:
 *       200:
 *         description: Lista de materias obtenida exitosamente.
 */
router.get('/', async (req, res, next) => {
  try {
    const materias = await materiasService.obtenerTodas();
    res.status(200).json(materias);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/materias/{id}:
 *   get:
 *     summary: Obtener una materia por ID
 *     tags:
 *       - Materias
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Materia encontrada con sus prerrequisitos y temas.
 *       404:
 *         description: Materia no encontrada.
 */
router.get('/:id', validarParamId, async (req, res, next) => {
  try {
    const materia = await materiasService.obtenerPorId(req.materiaId);
    res.status(200).json(materia);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/materias:
 *   post:
 *     summary: Crear una nueva materia académica
 *     tags:
 *       - Materias
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - codigo
 *               - nombre
 *             properties:
 *               codigo:
 *                 type: string
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               creditos:
 *                 type: integer
 *               notaMinimaAprobatoria:
 *                 type: number
 *     responses:
 *       201:
 *         description: Materia creada exitosamente.
 *       400:
 *         description: Error de validación.
 *       409:
 *         description: Código de materia duplicado.
 */
router.post('/', autenticar, requerirRol(['ADMIN']), validar(materiaSchema), async (req, res, next) => {
  try {
    const nuevaMateria = await materiasService.crear(req.body);
    res.status(201).json(nuevaMateria);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/materias/{id}:
 *   put:
 *     summary: Actualizar una materia existente
 *     tags:
 *       - Materias
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
 *         description: Materia actualizada exitosamente.
 *       404:
 *         description: Materia no encontrada.
 *       409:
 *         description: Código de materia en conflicto.
 */
router.put('/:id', autenticar, requerirRol(['ADMIN']), validarParamId, validar(materiaActualizarSchema), async (req, res, next) => {
  try {
    const materiaActualizada = await materiasService.actualizar(req.materiaId, req.body);
    res.status(200).json(materiaActualizada);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/materias/{id}:
 *   delete:
 *     summary: Eliminar una materia
 *     tags:
 *       - Materias
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Materia eliminada exitosamente.
 *       404:
 *         description: Materia no encontrada.
 */
router.delete('/:id', autenticar, requerirRol(['ADMIN']), validarParamId, async (req, res, next) => {
  try {
    await materiasService.eliminar(req.materiaId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/materias/{id}/prerrequisitos:
 *   get:
 *     summary: Obtener los prerrequisitos de una materia
 *     tags:
 *       - Materias
 *       - Prerrequisitos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de prerrequisitos obtenida.
 *       404:
 *         description: Materia no encontrada.
 */
router.get('/:id/prerrequisitos', validarParamId, async (req, res, next) => {
  try {
    const prerrequisitos = await materiasService.obtenerPrerrequisitos(req.materiaId);
    res.status(200).json(prerrequisitos);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/materias/{id}/prerrequisitos:
 *   post:
 *     summary: Agregar un prerrequisito a una materia
 *     tags:
 *       - Materias
 *       - Prerrequisitos
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
 *             required:
 *               - prerequisiteId
 *             properties:
 *               prerequisiteId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Prerrequisito agregado exitosamente.
 *       400:
 *         description: Datos inválidos o intento de ser prerrequisito de sí misma.
 *       404:
 *         description: Materia o prerrequisito no encontrado.
 *       409:
 *         description: Prerrequisito ya asignado o dependencia circular.
 */
router.post('/:id/prerrequisitos', autenticar, requerirRol(['ADMIN']), validarParamId, validar(prerrequisitoSchema), async (req, res, next) => {
  try {
    const relacion = await materiasService.agregarPrerrequisito(req.materiaId, req.body.prerequisiteId);
    res.status(201).json(relacion);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/materias/{id}/prerrequisitos/{prerrequisitoId}:
 *   delete:
 *     summary: Eliminar un prerrequisito de una materia
 *     tags:
 *       - Materias
 *       - Prerrequisitos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: prerrequisitoId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Prerrequisito eliminado exitosamente.
 *       404:
 *         description: Relación de prerrequisito no encontrada.
 */
router.delete('/:id/prerrequisitos/:prerrequisitoId', autenticar, requerirRol(['ADMIN']), validarParamId, async (req, res, next) => {
  try {
    const prereqId = Number(req.params.prerrequisitoId);
    if (!Number.isInteger(prereqId) || prereqId <= 0) {
      return next(new BadRequestError('El parámetro prerrequisitoId debe ser un entero positivo'));
    }
    await materiasService.eliminarPrerrequisito(req.materiaId, prereqId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/materias/{id}/temas:
 *   get:
 *     summary: Obtener los temas académicos asociados a una materia
 *     tags:
 *       - Materias
 *       - Temas
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Temas de la materia obtenidos exitosamente.
 *       404:
 *         description: Materia no encontrada.
 */
router.get('/:id/temas', validarParamId, async (req, res, next) => {
  try {
    const temas = await temasService.obtenerPorMateria(req.materiaId);
    res.status(200).json(temas);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

