const crypto = require('crypto');
const prisma = require('../config/prisma');
const { NotFoundError, ConflictError, BadRequestError } = require('../utils/errors');

/**
 * Función para generar un hash seguro de la contraseña
 */
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Remueve el campo password del objeto de usuario
 */
function omitPassword(user) {
  if (!user) return null;
  const { password, ...usuarioSinPassword } = user;
  return usuarioSinPassword;
}

class UsuariosService {
  async obtenerTodos() {
    const usuarios = await prisma.user.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        email: true,
        rol: true,
        createdAt: true,
        updatedAt: true
      }
    });
    return usuarios;
  }

  async obtenerPorId(id) {
    const usuario = await prisma.user.findUnique({
      where: { id },
      include: {
        enrollments: {
          include: {
            subject: true,
            academicPeriod: true,
            grades: true
          }
        },
        notes: true
      }
    });

    if (!usuario) {
      throw new NotFoundError(`Usuario con id ${id} no encontrado`);
    }

    return omitPassword(usuario);
  }

  async crear(data) {
    const { nombre, apellidos, email, password, rol } = data;

    // Verificar unicidad de correo
    const existe = await prisma.user.findUnique({
      where: { email }
    });

    if (existe) {
      throw new ConflictError('Ya existe un usuario registrado con este correo electrónico');
    }

    const hashedPassword = hashPassword(password);

    const nuevoUsuario = await prisma.user.create({
      data: {
        nombre,
        apellidos,
        email,
        password: hashedPassword,
        rol: rol || 'ESTUDIANTE'
      }
    });

    return omitPassword(nuevoUsuario);
  }

  async actualizar(id, data) {
    await this.obtenerPorId(id);

    const dataToUpdate = {};
    if (data.nombre !== undefined) dataToUpdate.nombre = data.nombre;
    if (data.apellidos !== undefined) dataToUpdate.apellidos = data.apellidos;
    if (data.rol !== undefined) dataToUpdate.rol = data.rol;

    if (data.email !== undefined) {
      const emailExistente = await prisma.user.findFirst({
        where: {
          email: data.email,
          NOT: { id }
        }
      });
      if (emailExistente) {
        throw new ConflictError('El correo electrónico ya está en uso por otro usuario');
      }
      dataToUpdate.email = data.email;
    }

    if (data.password !== undefined) {
      dataToUpdate.password = hashPassword(data.password);
    }

    const usuarioActualizado = await prisma.user.update({
      where: { id },
      data: dataToUpdate
    });

    return omitPassword(usuarioActualizado);
  }

  async eliminar(id) {
    await this.obtenerPorId(id);
    await prisma.user.delete({
      where: { id }
    });
  }

  async obtenerMatriculas(userId) {
    await this.obtenerPorId(userId);

    const matriculas = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        subject: true,
        academicPeriod: true,
        grades: true
      },
      orderBy: { id: 'desc' }
    });

    return matriculas;
  }
}

module.exports = new UsuariosService();

