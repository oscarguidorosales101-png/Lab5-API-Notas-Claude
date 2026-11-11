const prisma = require('../config/prisma');
const { NotFoundError, BadRequestError } = require('../utils/errors');

class TemasService {
  async obtenerTodos(filtroMateriaId = null) {
    const where = {};
    if (filtroMateriaId) {
      where.subjectId = Number(filtroMateriaId);
    }

    const temas = await prisma.noteTopic.findMany({
      where,
      orderBy: { id: 'asc' },
      include: {
        materia: true,
        notes: {
          select: {
            id: true,
            titulo: true,
            createdAt: true,
            userId: true
          }
        }
      }
    });

    return temas;
  }

  async obtenerPorMateria(materiaId) {
    const materia = await prisma.subject.findUnique({
      where: { id: Number(materiaId) }
    });

    if (!materia) {
      throw new NotFoundError(`Materia con id ${materiaId} no encontrada`);
    }

    const temas = await prisma.noteTopic.findMany({
      where: { subjectId: Number(materiaId) },
      orderBy: { id: 'asc' },
      include: {
        notes: true
      }
    });

    return temas;
  }

  async obtenerPorId(id) {
    const tema = await prisma.noteTopic.findUnique({
      where: { id },
      include: {
        materia: true,
        notes: {
          include: {
            user: {
              select: { id: true, nombre: true, apellidos: true, email: true }
            }
          }
        }
      }
    });

    if (!tema) {
      throw new NotFoundError(`Tema académico con id ${id} no encontrado`);
    }

    return tema;
  }

  async crear(data) {
    const { nombre, descripcion, subjectId } = data;

    if (subjectId) {
      const materia = await prisma.subject.findUnique({
        where: { id: subjectId }
      });
      if (!materia) {
        throw new NotFoundError(`Materia con id ${subjectId} no encontrada`);
      }
    }

    const nuevoTema = await prisma.noteTopic.create({
      data: {
        nombre,
        descripcion: descripcion || null,
        subjectId: subjectId || null
      },
      include: {
        materia: true
      }
    });

    return nuevoTema;
  }

  async actualizar(id, data) {
    await this.obtenerPorId(id);

    if (data.subjectId) {
      const materia = await prisma.subject.findUnique({
        where: { id: data.subjectId }
      });
      if (!materia) {
        throw new NotFoundError(`Materia con id ${data.subjectId} no encontrada`);
      }
    }

    const dataToUpdate = {};
    if (data.nombre !== undefined) dataToUpdate.nombre = data.nombre;
    if (data.descripcion !== undefined) dataToUpdate.descripcion = data.descripcion;
    if (data.subjectId !== undefined) dataToUpdate.subjectId = data.subjectId;

    const temaActualizado = await prisma.noteTopic.update({
      where: { id },
      data: dataToUpdate,
      include: {
        materia: true
      }
    });

    return temaActualizado;
  }

  async eliminar(id) {
    await this.obtenerPorId(id);
    await prisma.noteTopic.delete({
      where: { id }
    });
  }
}

module.exports = new TemasService();

