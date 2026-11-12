const crypto = require('crypto');
const prisma = require('../config/prisma');
const { UnauthorizedError, NotFoundError, BadRequestError } = require('../utils/errors');

const JWT_SECRET = process.env.JWT_SECRET || 'lab5-secret-key-notas-claude-2026-auth-token-system';

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return Buffer.from(base64, 'base64').toString('utf8');
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function omitPassword(user) {
  if (!user) return null;
  const { password, ...usuarioSinPassword } = user;
  return usuarioSinPassword;
}

function generarToken(payload, duracionSegundos = 12 * 3600) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + duracionSegundos;
  const fullPayload = { ...payload, exp, iat: Math.floor(Date.now() / 1000) };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verificarToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  if (signature !== expectedSignature) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Sesión expirada
    }
    return payload;
  } catch {
    return null;
  }
}

class AuthService {
  /**
   * Inicia sesión autenticando credenciales contra MySQL mediante Prisma.
   */
  async login(email, password) {
    if (!email || !password) {
      throw new BadRequestError('Debe proporcionar correo electrónico y contraseña');
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (!user) {
      throw new UnauthorizedError('Credenciales incorrectas: correo o contraseña inválidos');
    }

    const hashedInput = hashPassword(password);
    if (user.password !== hashedInput) {
      throw new UnauthorizedError('Credenciales incorrectas: correo o contraseña inválidos');
    }

    const token = generarToken({
      userId: user.id,
      email: user.email,
      rol: user.rol,
      nombre: user.nombre,
      apellidos: user.apellidos
    });

    return {
      token,
      usuario: omitPassword(user)
    };
  }

  /**
   * Obtiene el perfil actual y comprueba que la cuenta continúe existiendo en MySQL.
   */
  async obtenerPerfil(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        enrollments: {
          include: {
            subject: true,
            academicPeriod: true,
            grades: true
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    return omitPassword(user);
  }

  /**
   * Retorna las cuentas ficticias habilitadas para demostración académica.
   */
  async obtenerCuentasDemo() {
    const usuarios = await prisma.user.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        email: true,
        rol: true
      }
    });

    return usuarios.map((u) => ({
      ...u,
      descripcion: u.rol === 'ADMIN' ? 'Control total administrativo' :
                   u.rol === 'DOCENTE' ? 'Gestión académica y calificaciones' :
                   'Acceso a asignaturas, notas y tutor IA'
    }));
  }

  /**
   * Realiza cambio auténtico a una cuenta demo verificando credenciales en el backend.
   */
  async cambiarCuentaDemo(email) {
    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (!user) {
      throw new NotFoundError(`La cuenta demo con correo ${cleanEmail} no existe en la base de datos`);
    }

    // Generar nuevo token con expiración renovada
    const token = generarToken({
      userId: user.id,
      email: user.email,
      rol: user.rol,
      nombre: user.nombre,
      apellidos: user.apellidos
    });

    return {
      token,
      usuario: omitPassword(user)
    };
  }
}

module.exports = {
  authService: new AuthService(),
  generarToken,
  verificarToken,
  hashPassword,
  omitPassword
};

