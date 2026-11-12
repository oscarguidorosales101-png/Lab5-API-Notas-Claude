const express = require('express');
const router = express.Router();
const matriculasService = require('../services/matriculas.service');
const { validar } = require('../middlewares/validar');
const { calificacionActualizarSchema } = require('../validators/academic.validator');
const { BadRequestError } = require('../utils/errors');
const { autenticar, requerirRol } = require('../middlewares/auth');

router.use(autenticar);
router.use(requerirRol(['ADMIN', 'DOCENTE']));

const validarParamId = (req, res, next) => {
  const numId = Number(req.params.id);
  if (!Number.isInteger(numId) || numId <= 0) {
    return next(new BadRequestError('El parámetro id debe ser un número entero positivo'));
  }
  req.gradeId = numId;
  next();
};

/**
 * @openapi
 * /api/calificaciones/{id}:
 *   put:
 *     summary: Actualizar una evaluación existente
 *     tags:
 *       - Calificaciones
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
 *         description: Calificación actualizada y nota final recalculada.
 *       400:
 *         description: Datos inválidos o ponderación excedida.
 *       404:
 *         description: Calificación no encontrada.
 *       409:
 *         description: Conflicto de nombre duplicado.
 */
router.put('/:id', validarParamId, validar(calificacionActualizarSchema), async (req, res, next) => {
  try {
    const actualizada = await matriculasService.actualizarCalificacion(req.gradeId, req.body);
    res.status(200).json(actualizada);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/calificaciones/{id}:
 *   delete:
 *     summary: Eliminar una calificación
 *     tags:
 *       - Calificaciones
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Calificación eliminada y nota final recalculada.
 *       404:
 *         description: Calificación no encontrada.
 */
router.delete('/:id', validarParamId, async (req, res, next) => {
  try {
    await matriculasService.eliminarCalificacion(req.gradeId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;

