const express = require('express');
const router = express.Router();
const { authService } = require('../services/auth.service');
const { autenticar } = require('../middlewares/auth');

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión con credenciales
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@universidad.test
 *               password:
 *                 type: string
 *                 example: Clave123*
 *     responses:
 *       200:
 *         description: Autenticación exitosa y retorno de token JWT.
 *       401:
 *         description: Credenciales incorrectas.
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const resultado = await authService.login(email, password);
    res.status(200).json(resultado);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Obtener perfil de la sesión activa
 *     tags: [Autenticación]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario autenticado.
 *       401:
 *         description: Token inválido o expirado.
 */
router.get('/me', autenticar, async (req, res, next) => {
  try {
    const perfil = await authService.obtenerPerfil(req.user.userId || req.user.id);
    res.status(200).json(perfil);
  } catch (error) {
    next(error);
  }
});

// Alias compatible para /perfil
router.get('/perfil', autenticar, async (req, res, next) => {
  try {
    const perfil = await authService.obtenerPerfil(req.user.userId || req.user.id);
    res.status(200).json(perfil);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [Autenticación]
 *     responses:
 *       200:
 *         description: Sesión cerrada con éxito.
 */
router.post('/logout', (req, res) => {
  res.status(200).json({ mensaje: 'Sesión cerrada exitosamente' });
});

/**
 * @openapi
 * /api/auth/cuentas-demo:
 *   get:
 *     summary: Listar cuentas ficticias habilitadas para demostración
 *     tags: [Autenticación]
 *     responses:
 *       200:
 *         description: Lista de cuentas demo disponibles en el sistema.
 */
router.get('/cuentas-demo', async (req, res, next) => {
  try {
    const cuentas = await authService.obtenerCuentasDemo();
    res.status(200).json(cuentas);
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/auth/cambiar-cuenta:
 *   post:
 *     summary: Cambiar de cuenta de forma auténtica hacia una cuenta demo
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Nueva sesión autenticada con token y perfil actualizado.
 */
router.post('/cambiar-cuenta', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Debe especificar el correo de la cuenta' });
    }
    const resultado = await authService.cambiarCuentaDemo(email);
    res.status(200).json(resultado);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

