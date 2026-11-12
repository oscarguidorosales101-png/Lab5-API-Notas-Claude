const express = require('express');
const router = express.Router();
const usuariosService = require('../services/usuarios.service');
const { validar } = require('../middlewares/validar');
const { usuarioSchema, usuarioActualizarSchema } = require('../validators/academic.validator');
const { BadRequestError } = require('../utils/errors');
const { autenticar, requerirRol } = require('../middlewares/auth');

router.use(autenticar);

const validarParamId = (req, res, next) => {
  const numId = Number(req.params.id);
  if (!Number.isInteger(numId) || numId <= 0) {
    return next(new BadRequestError('El parámetro id debe ser un número entero positivo'));
  }
  req.userId = numId;
  next();
};

/**
 * @openapi
 * /api/usuarios:
 *   get:
 *     summary: Listar todos los usuarios
 *     tags:
 *       - Usuarios
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida exitosamente.
 */
router.get('/', requerirRol(['ADMIN', 'DOCENTE']), async (req, res, next) => {
  try {
    const usuarios = await usuariosService.obtenerTodos();
    res.status(200).json(usuarios);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/usuarios/{id}:
 *   get:
 *     summary: Obtener un usuario por ID
 *     tags:
 *       - Usuarios
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Usuario encontrado.
 *       404:
 *         description: Usuario no encontrado.
 */
router.get('/:id', requerirRol(['ADMIN', 'DOCENTE']), validarParamId, async (req, res, next) => {
  try {
    const usuario = await usuariosService.obtenerPorId(req.userId);
    res.status(200).json(usuario);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/usuarios:
 *   post:
 *     summary: Crear un nuevo usuario
 *     tags:
 *       - Usuarios
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - apellidos
 *               - email
 *               - password
 *             properties:
 *               nombre:
 *                 type: string
 *               apellidos:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               rol:
 *                 type: string
 *                 enum: [ADMIN, DOCENTE, ESTUDIANTE]
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente.
 *       400:
 *         description: Error de validación.
 *       409:
 *         description: Correo electrónico ya registrado.
 */
router.post('/', requerirRol(['ADMIN']), validar(usuarioSchema), async (req, res, next) => {
  try {
    const nuevoUsuario = await usuariosService.crear(req.body);
    res.status(201).json(nuevoUsuario);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/usuarios/{id}:
 *   put:
 *     summary: Actualizar un usuario existente
 *     tags:
 *       - Usuarios
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
 *         description: Usuario actualizado exitosamente.
 *       404:
 *         description: Usuario no encontrado.
 *       409:
 *         description: Correo electrónico duplicado.
 */
router.put('/:id', requerirRol(['ADMIN']), validarParamId, validar(usuarioActualizarSchema), async (req, res, next) => {
  try {
    const usuarioActualizado = await usuariosService.actualizar(req.userId, req.body);
    res.status(200).json(usuarioActualizado);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/usuarios/{id}:
 *   delete:
 *     summary: Eliminar un usuario
 *     tags:
 *       - Usuarios
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Usuario eliminado exitosamente.
 *       404:
 *         description: Usuario no encontrado.
 */
router.delete('/:id', requerirRol(['ADMIN']), validarParamId, async (req, res, next) => {
  try {
    await usuariosService.eliminar(req.userId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/usuarios/{id}/matriculas:
 *   get:
 *     summary: Obtener el historial de matrículas de un estudiante
 *     tags:
 *       - Usuarios
 *       - Matrículas
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Matrículas del estudiante obtenidas exitosamente.
 *       404:
 *         description: Estudiante no encontrado.
 */
router.get('/:id/matriculas', validarParamId, async (req, res, next) => {
  try {
    const matriculas = await usuariosService.obtenerMatriculas(req.userId);
    res.status(200).json(matriculas);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

