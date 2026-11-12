const express = require('express');
const router = express.Router();
const matriculasService = require('../services/matriculas.service');
const { validar } = require('../middlewares/validar');
const {
  matriculaSchema,
  calificacionSchema
} = require('../validators/academic.validator');
const { BadRequestError } = require('../utils/errors');
const { autenticar, requerirRol } = require('../middlewares/auth');

router.use(autenticar);

const validarParamId = (req, res, next) => {
  const numId = Number(req.params.id);
  if (!Number.isInteger(numId) || numId <= 0) {
    return next(new BadRequestError('El parámetro id debe ser un número entero positivo'));
  }
  req.matriculaId = numId;
  next();
};

/**
 * @openapi
 * /api/matriculas:
 *   get:
 *     summary: Listar todas las matrículas
 *     tags:
 *       - Matrículas
 *     responses:
 *       200:
 *         description: Lista de matrículas obtenida exitosamente.
 */
router.get('/', async (req, res, next) => {
  try {
    const matriculas = await matriculasService.obtenerTodas();
    res.status(200).json(matriculas);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/matriculas/{id}:
 *   get:
 *     summary: Obtener una matrícula por ID
 *     tags:
 *       - Matrículas
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Matrícula encontrada con detalles de estudiante, materia, calificaciones y período.
 *       404:
 *         description: Matrícula no encontrada.
 */
router.get('/:id', validarParamId, async (req, res, next) => {
  try {
    const matricula = await matriculasService.obtenerPorId(req.matriculaId);
    res.status(200).json(matricula);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/matriculas:
 *   post:
 *     summary: Matricular a un estudiante en una materia y período académico
 *     tags:
 *       - Matrículas
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - subjectId
 *               - academicPeriodId
 *             properties:
 *               userId:
 *                 type: integer
 *               subjectId:
 *                 type: integer
 *               academicPeriodId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Matrícula registrada exitosamente.
 *       400:
 *         description: Datos inválidos, rol no correspondiente o período inactivo.
 *       404:
 *         description: Usuario, materia o período no encontrado.
 *       409:
 *         description: Matrícula duplicada o prerrequisitos no aprobados.
 */
router.post('/', requerirRol(['ADMIN']), validar(matriculaSchema), async (req, res, next) => {
  try {
    const nuevaMatricula = await matriculasService.crearMatricula(req.body);
    res.status(201).json(nuevaMatricula);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/matriculas/{id}/calificaciones:
 *   get:
 *     summary: Obtener todas las calificaciones asociadas a una matrícula
 *     tags:
 *       - Calificaciones
 *       - Matrículas
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de evaluaciones y calificaciones de la matrícula.
 *       404:
 *         description: Matrícula no encontrada.
 */
router.get('/:id/calificaciones', validarParamId, async (req, res, next) => {
  try {
    const calificaciones = await matriculasService.obtenerCalificaciones(req.matriculaId);
    res.status(200).json(calificaciones);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/matriculas/{id}/calificaciones:
 *   post:
 *     summary: Registrar una nueva calificación para una matrícula
 *     tags:
 *       - Calificaciones
 *       - Matrículas
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
 *               - nombreEvaluacion
 *               - puntajeObtenido
 *               - puntajeMaximo
 *               - porcentaje
 *             properties:
 *               nombreEvaluacion:
 *                 type: string
 *               puntajeObtenido:
 *                 type: number
 *               puntajeMaximo:
 *                 type: number
 *               porcentaje:
 *                 type: number
 *               fechaEvaluacion:
 *                 type: string
 *                 format: date
 *               observaciones:
 *                 type: string
 *     responses:
 *       201:
 *         description: Calificación registrada y nota final recalculada en transacción.
 *       400:
 *         description: Puntajes inconsistentes o ponderación total superior al 100%.
 *       404:
 *         description: Matrícula no encontrada.
 *       409:
 *         description: Nombre de evaluación duplicado.
 */
router.post('/:id/calificaciones', requerirRol(['ADMIN', 'DOCENTE']), validarParamId, validar(calificacionSchema), async (req, res, next) => {
  try {
    const calificacion = await matriculasService.agregarCalificacion(req.matriculaId, req.body);
    res.status(201).json(calificacion);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/matriculas/{id}/resultado-final:
 *   get:
 *     summary: Consultar el resultado y cálculo de nota final ponderada de una matrícula
 *     tags:
 *       - Calificaciones
 *       - Matrículas
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalle del resultado final ponderado, aprobación o reprobación.
 *       404:
 *         description: Matrícula no encontrada.
 */
router.get('/:id/resultado-final', validarParamId, async (req, res, next) => {
  try {
    const resultado = await matriculasService.calcularResultadoFinal(req.matriculaId);
    res.status(200).json(resultado);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

