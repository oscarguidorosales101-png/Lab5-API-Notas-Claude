const prisma = require('../config/prisma');
const { NotFoundError, BadRequestError } = require('../utils/errors');

class PeriodosService {
  async obtenerTodos() {
    const periodos = await prisma.academicPeriod.findMany({
      orderBy: [{ anio: 'desc' }, { id: 'desc' }],
      include: {
        _count: {
          select: { enrollments: true }
        }
      }
    });
    return periodos;
  }

  async obtenerPorId(id) {
    const periodo = await prisma.academicPeriod.findUnique({
      where: { id },
      include: {
        enrollments: {
          include: {
            user: {
              select: { id: true, nombre: true, apellidos: true, email: true }
            },
            subject: true
          }
        }
      }
    });

    if (!periodo) {
      throw new NotFoundError(`Período académico con id ${id} no encontrado`);
    }

    return periodo;
  }

  async crear(data) {
    const { nombre, fechaInicio, fechaFin, anio, periodo, activo } = data;

    const nuevoPeriodo = await prisma.academicPeriod.create({
      data: {
        nombre,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        anio,
        periodo,
        activo: activo !== undefined ? activo : true
      }
    });

    return nuevoPeriodo;
  }

  async actualizar(id, data) {
    await this.obtenerPorId(id);

    const dataToUpdate = {};
    if (data.nombre !== undefined) dataToUpdate.nombre = data.nombre;
    if (data.fechaInicio !== undefined) dataToUpdate.fechaInicio = new Date(data.fechaInicio);
    if (data.fechaFin !== undefined) dataToUpdate.fechaFin = new Date(data.fechaFin);
    if (data.anio !== undefined) dataToUpdate.anio = data.anio;
    if (data.periodo !== undefined) dataToUpdate.periodo = data.periodo;
    if (data.activo !== undefined) dataToUpdate.activo = data.activo;

    const periodoActualizado = await prisma.academicPeriod.update({
      where: { id },
      data: dataToUpdate
    });

    return periodoActualizado;
  }

  async eliminar(id) {
    await this.obtenerPorId(id);
    await prisma.academicPeriod.delete({
      where: { id }
    });
  }
}

module.exports = new PeriodosService();

