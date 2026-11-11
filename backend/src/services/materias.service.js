const prisma = require('../config/prisma');
const { NotFoundError, ConflictError, BadRequestError } = require('../utils/errors');

class MateriasService {
  async obtenerTodas() {
    const materias = await prisma.subject.findMany({
      orderBy: { id: 'asc' },
      include: {
        prerrequisitos: {
          include: {
            prerequisite: true
          }
        },
        temas: true
      }
    });
    return materias;
  }

  async obtenerPorId(id) {
    const materia = await prisma.subject.findUnique({
      where: { id },
      include: {
        prerrequisitos: {
          include: {
            prerequisite: true
          }
        },
        esPrerrequisitoDe: {
          include: {
            subject: true
          }
        },
        temas: true,
        enrollments: {
          include: {
            user: {
              select: { id: true, nombre: true, apellidos: true, email: true, rol: true }
            },
            academicPeriod: true
          }
        }
      }
    });

    if (!materia) {
      throw new NotFoundError(`Materia con id ${id} no encontrada`);
    }

    return materia;
  }

  async crear(data) {
    const { codigo, nombre, descripcion, creditos, notaMinimaAprobatoria } = data;

    const existe = await prisma.subject.findUnique({
      where: { codigo }
    });

    if (existe) {
      throw new ConflictError(`Ya existe una materia registrada con el código ${codigo}`);
    }

    const nuevaMateria = await prisma.subject.create({
      data: {
        codigo,
        nombre,
        descripcion,
        creditos: creditos !== undefined ? creditos : 3,
        notaMinimaAprobatoria: notaMinimaAprobatoria !== undefined ? notaMinimaAprobatoria : 70.0
      }
    });

    return nuevaMateria;
  }

  async actualizar(id, data) {
    await this.obtenerPorId(id);

    const dataToUpdate = {};
    if (data.nombre !== undefined) dataToUpdate.nombre = data.nombre;
    if (data.descripcion !== undefined) dataToUpdate.descripcion = data.descripcion;
    if (data.creditos !== undefined) dataToUpdate.creditos = data.creditos;
    if (data.notaMinimaAprobatoria !== undefined) dataToUpdate.notaMinimaAprobatoria = data.notaMinimaAprobatoria;

    if (data.codigo !== undefined) {
      const codigoExistente = await prisma.subject.findFirst({
        where: {
          codigo: data.codigo,
          NOT: { id }
        }
      });
      if (codigoExistente) {
        throw new ConflictError(`El código ${data.codigo} ya está asignado a otra materia`);
      }
      dataToUpdate.codigo = data.codigo;
    }

    const materiaActualizada = await prisma.subject.update({
      where: { id },
      data: dataToUpdate
    });

    return materiaActualizada;
  }

  async eliminar(id) {
    await this.obtenerPorId(id);
    await prisma.subject.delete({
      where: { id }
    });
  }

  async obtenerPrerrequisitos(subjectId) {
    await this.obtenerPorId(subjectId);

    const prerrequisitos = await prisma.subjectPrerequisite.findMany({
      where: { subjectId },
      include: {
        prerequisite: true
      }
    });

    return prerrequisitos.map((p) => p.prerequisite);
  }

  async agregarPrerrequisito(subjectId, prerequisiteId) {
    if (subjectId === prerequisiteId) {
      throw new BadRequestError('Una materia no puede ser prerrequisito de sí misma');
    }

    // Verificar que ambas materias existan
    const materia = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!materia) {
      throw new NotFoundError(`Materia con id ${subjectId} no encontrada`);
    }

    const prerrequisito = await prisma.subject.findUnique({ where: { id: prerequisiteId } });
    if (!prerrequisito) {
      throw new NotFoundError(`Materia prerrequisito con id ${prerequisiteId} no encontrada`);
    }

    // Verificar duplicidad
    const existente = await prisma.subjectPrerequisite.findUnique({
      where: {
        subjectId_prerequisiteId: {
          subjectId,
          prerequisiteId
        }
      }
    });

    if (existente) {
      throw new ConflictError('La materia ya tiene asignado este prerrequisito');
    }

    // Prevenir dependencia circular directa: si prerequisiteId ya requiere subjectId
    const circular = await prisma.subjectPrerequisite.findUnique({
      where: {
        subjectId_prerequisiteId: {
          subjectId: prerequisiteId,
          prerequisiteId: subjectId
        }
      }
    });

    if (circular) {
      throw new ConflictError('No se permite una dependencia circular entre materias');
    }

    const nuevaRelacion = await prisma.subjectPrerequisite.create({
      data: {
        subjectId,
        prerequisiteId
      },
      include: {
        subject: true,
        prerequisite: true
      }
    });

    return nuevaRelacion;
  }

  async eliminarPrerrequisito(subjectId, prerequisiteId) {
    const relacion = await prisma.subjectPrerequisite.findUnique({
      where: {
        subjectId_prerequisiteId: {
          subjectId,
          prerequisiteId
        }
      }
    });

    if (!relacion) {
      throw new NotFoundError(`No existe relación de prerrequisito entre la materia ${subjectId} y ${prerequisiteId}`);
    }

    await prisma.subjectPrerequisite.delete({
      where: {
        subjectId_prerequisiteId: {
          subjectId,
          prerequisiteId
        }
      }
    });
  }
}

module.exports = new MateriasService();

