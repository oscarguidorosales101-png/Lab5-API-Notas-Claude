const prisma = require('../config/prisma');
const { NotFoundError, ConflictError, BadRequestError } = require('../utils/errors');

class MatriculasService {
  async obtenerTodas() {
    const matriculas = await prisma.enrollment.findMany({
      orderBy: { id: 'desc' },
      include: {
        user: {
          select: { id: true, nombre: true, apellidos: true, email: true, rol: true }
        },
        subject: true,
        academicPeriod: true,
        grades: true
      }
    });
    return matriculas;
  }

  async obtenerPorId(id) {
    const matricula = await prisma.enrollment.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, nombre: true, apellidos: true, email: true, rol: true }
        },
        subject: {
          include: {
            prerrequisitos: {
              include: { prerequisite: true }
            }
          }
        },
        academicPeriod: true,
        grades: {
          orderBy: { id: 'asc' }
        }
      }
    });

    if (!matricula) {
      throw new NotFoundError(`Matrícula con id ${id} no encontrada`);
    }

    return matricula;
  }

  async crearMatricula(data) {
    const { userId, subjectId, academicPeriodId } = data;

    // 1. Validar existencia del usuario
    const usuario = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!usuario) {
      throw new NotFoundError(`Usuario con id ${userId} no encontrado`);
    }

    // 2. Validar que tenga rol de ESTUDIANTE
    if (usuario.rol !== 'ESTUDIANTE') {
      throw new BadRequestError(`El usuario seleccionado tiene el rol ${usuario.rol}. Solo los usuarios con rol ESTUDIANTE pueden ser matriculados`);
    }

    // 3. Validar existencia de la materia y cargar prerrequisitos
    const materia = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        prerrequisitos: {
          include: { prerequisite: true }
        }
      }
    });

    if (!materia) {
      throw new NotFoundError(`Materia con id ${subjectId} no encontrada`);
    }

    // 4. Validar existencia y vigencia del período académico
    const periodo = await prisma.academicPeriod.findUnique({
      where: { id: academicPeriodId }
    });

    if (!periodo) {
      throw new NotFoundError(`Período académico con id ${academicPeriodId} no encontrado`);
    }

    if (!periodo.activo) {
      throw new BadRequestError(`El período académico '${periodo.nombre}' no se encuentra activo para matrículas`);
    }

    // 5. Validar que no exista matrícula duplicada para el estudiante en la misma materia y período
    const matriculaExistente = await prisma.enrollment.findUnique({
      where: {
        userId_subjectId_academicPeriodId: {
          userId,
          subjectId,
          academicPeriodId
        }
      }
    });

    if (matriculaExistente) {
      throw new ConflictError(`El estudiante ya se encuentra matriculado en la materia '${materia.nombre}' para el período '${periodo.nombre}'`);
    }

    // 6. Validar cumplimiento de todos los prerrequisitos
    if (materia.prerrequisitos && materia.prerrequisitos.length > 0) {
      const prerrequisitosIncumplidos = [];

      for (const req of materia.prerrequisitos) {
        const prereqMateria = req.prerequisite;

        // Buscar matrículas previas del estudiante en la materia prerrequisito
        const matriculasPrevias = await prisma.enrollment.findMany({
          where: {
            userId,
            subjectId: prereqMateria.id
          }
        });

        // Debe existir al menos una matrícula previa aprobada (estado APROBADA o notaFinal >= notaMinima)
        const haAprobado = matriculasPrevias.some((m) => {
          if (m.estado === 'APROBADA') return true;
          if (m.notaFinal !== null && m.notaFinal !== undefined && m.notaFinal >= prereqMateria.notaMinimaAprobatoria) {
            return true;
          }
          return false;
        });

        if (!haAprobado) {
          prerrequisitosIncumplidos.push({
            id: prereqMateria.id,
            codigo: prereqMateria.codigo,
            nombre: prereqMateria.nombre,
            notaMinimaAprobatoria: prereqMateria.notaMinimaAprobatoria
          });
        }
      }

      if (prerrequisitosIncumplidos.length > 0) {
        const nombres = prerrequisitosIncumplidos.map((p) => `${p.nombre} (${p.codigo})`).join(', ');
        throw new ConflictError(
          `No se puede realizar la matrícula. El estudiante no ha aprobado los siguientes prerrequisitos obligatorios: ${nombres}`,
          prerrequisitosIncumplidos
        );
      }
    }

    // 7. Crear la matrícula
    const nuevaMatricula = await prisma.enrollment.create({
      data: {
        userId,
        subjectId,
        academicPeriodId,
        estado: 'ACTIVA'
      },
      include: {
        user: {
          select: { id: true, nombre: true, apellidos: true, email: true, rol: true }
        },
        subject: true,
        academicPeriod: true
      }
    });

    return nuevaMatricula;
  }

  async obtenerCalificaciones(enrollmentId) {
    await this.obtenerPorId(enrollmentId);

    const calificaciones = await prisma.grade.findMany({
      where: { enrollmentId },
      orderBy: { id: 'asc' }
    });

    return calificaciones;
  }

  async agregarCalificacion(enrollmentId, data) {
    const matricula = await this.obtenerPorId(enrollmentId);

    const { nombreEvaluacion, puntajeObtenido, puntajeMaximo, porcentaje, fechaEvaluacion, observaciones } = data;

    // Validar nombre duplicado
    const evaluacionExistente = await prisma.grade.findFirst({
      where: {
        enrollmentId,
        nombreEvaluacion: { equals: nombreEvaluacion.trim() }
      }
    });

    if (evaluacionExistente) {
      throw new ConflictError(`Ya existe una evaluación con el nombre '${nombreEvaluacion}' para esta matrícula`);
    }

    // Validar suma de porcentajes
    const calificacionesActuales = await prisma.grade.findMany({
      where: { enrollmentId }
    });

    const sumaPorcentajeActual = calificacionesActuales.reduce((acc, g) => acc + g.porcentaje, 0);

    if (sumaPorcentajeActual + porcentaje > 100.01) {
      throw new BadRequestError(
        `La ponderación acumulada superaría el 100%. Ponderación actual: ${sumaPorcentajeActual}%, ponderación a agregar: ${porcentaje}%`
      );
    }

    // Transacción Prisma para agregar calificación y recalcular nota final de la matrícula
    return await prisma.$transaction(async (tx) => {
      const nuevaCalificacion = await tx.grade.create({
        data: {
          enrollmentId,
          nombreEvaluacion: nombreEvaluacion.trim(),
          puntajeObtenido,
          puntajeMaximo,
          porcentaje,
          fechaEvaluacion: fechaEvaluacion ? new Date(fechaEvaluacion) : new Date(),
          observaciones: observaciones || null
        }
      });

      const todasLasCalificaciones = [...calificacionesActuales, nuevaCalificacion];
      const sumaPonderada = todasLasCalificaciones.reduce(
        (acc, g) => acc + (g.puntajeObtenido / g.puntajeMaximo) * g.porcentaje,
        0
      );
      const totalPonderacion = todasLasCalificaciones.reduce((acc, g) => acc + g.porcentaje, 0);
      const notaRedondeada = Math.round(sumaPonderada * 100) / 100;

      // Si se completó el 100% de la evaluación, determinar APROBADA o REPROBADA
      let nuevoEstado = matricula.estado;
      if (totalPonderacion >= 99.99) {
        nuevoEstado = notaRedondeada >= matricula.subject.notaMinimaAprobatoria ? 'APROBADA' : 'REPROBADA';
      }

      await tx.enrollment.update({
        where: { id: enrollmentId },
        data: {
          notaFinal: notaRedondeada,
          estado: nuevoEstado
        }
      });

      return nuevaCalificacion;
    });
  }

  async actualizarCalificacion(gradeId, data) {
    const calificacion = await prisma.grade.findUnique({
      where: { id: gradeId },
      include: {
        enrollment: {
          include: { subject: true }
        }
      }
    });

    if (!calificacion) {
      throw new NotFoundError(`Calificación con id ${gradeId} no encontrada`);
    }

    const { enrollmentId, enrollment } = calificacion;

    // Validar nombre duplicado si se modifica
    if (data.nombreEvaluacion !== undefined) {
      const duplicada = await prisma.grade.findFirst({
        where: {
          enrollmentId,
          nombreEvaluacion: data.nombreEvaluacion.trim(),
          NOT: { id: gradeId }
        }
      });
      if (duplicada) {
        throw new ConflictError(`Ya existe una evaluación con el nombre '${data.nombreEvaluacion}'`);
      }
    }

    // Validar ponderación total si se modifica
    if (data.porcentaje !== undefined) {
      const otrasCalificaciones = await prisma.grade.findMany({
        where: {
          enrollmentId,
          NOT: { id: gradeId }
        }
      });
      const sumaOtras = otrasCalificaciones.reduce((acc, g) => acc + g.porcentaje, 0);
      if (sumaOtras + data.porcentaje > 100.01) {
        throw new BadRequestError(`La ponderación acumulada superaría el 100%. Ponderación máxima permitida: ${100 - sumaOtras}%`);
      }
    }

    return await prisma.$transaction(async (tx) => {
      const datosActualizar = {};
      if (data.nombreEvaluacion !== undefined) datosActualizar.nombreEvaluacion = data.nombreEvaluacion.trim();
      if (data.puntajeObtenido !== undefined) datosActualizar.puntajeObtenido = data.puntajeObtenido;
      if (data.puntajeMaximo !== undefined) datosActualizar.puntajeMaximo = data.puntajeMaximo;
      if (data.porcentaje !== undefined) datosActualizar.porcentaje = data.porcentaje;
      if (data.fechaEvaluacion !== undefined) datosActualizar.fechaEvaluacion = new Date(data.fechaEvaluacion);
      if (data.observaciones !== undefined) datosActualizar.observaciones = data.observaciones;

      const actualizada = await tx.grade.update({
        where: { id: gradeId },
        data: datosActualizar
      });

      // Recalcular nota final
      const todas = await tx.grade.findMany({ where: { enrollmentId } });
      const sumaPonderada = todas.reduce((acc, g) => acc + (g.puntajeObtenido / g.puntajeMaximo) * g.porcentaje, 0);
      const totalPonderacion = todas.reduce((acc, g) => acc + g.porcentaje, 0);
      const notaRedondeada = Math.round(sumaPonderada * 100) / 100;

      let nuevoEstado = enrollment.estado;
      if (totalPonderacion >= 99.99) {
        nuevoEstado = notaRedondeada >= enrollment.subject.notaMinimaAprobatoria ? 'APROBADA' : 'REPROBADA';
      }

      await tx.enrollment.update({
        where: { id: enrollmentId },
        data: {
          notaFinal: notaRedondeada,
          estado: nuevoEstado
        }
      });

      return actualizada;
    });
  }

  async eliminarCalificacion(gradeId) {
    const calificacion = await prisma.grade.findUnique({
      where: { id: gradeId },
      include: {
        enrollment: {
          include: { subject: true }
        }
      }
    });

    if (!calificacion) {
      throw new NotFoundError(`Calificación con id ${gradeId} no encontrada`);
    }

    const { enrollmentId, enrollment } = calificacion;

    await prisma.$transaction(async (tx) => {
      await tx.grade.delete({ where: { id: gradeId } });

      const restantes = await tx.grade.findMany({ where: { enrollmentId } });
      const sumaPonderada = restantes.reduce((acc, g) => acc + (g.puntajeObtenido / g.puntajeMaximo) * g.porcentaje, 0);
      const totalPonderacion = restantes.reduce((acc, g) => acc + g.porcentaje, 0);
      const notaRedondeada = restantes.length > 0 ? Math.round(sumaPonderada * 100) / 100 : null;

      let nuevoEstado = 'ACTIVA';
      if (totalPonderacion >= 99.99 && notaRedondeada !== null) {
        nuevoEstado = notaRedondeada >= enrollment.subject.notaMinimaAprobatoria ? 'APROBADA' : 'REPROBADA';
      }

      await tx.enrollment.update({
        where: { id: enrollmentId },
        data: {
          notaFinal: notaRedondeada,
          estado: nuevoEstado
        }
      });
    });
  }

  async calcularResultadoFinal(enrollmentId) {
    const matricula = await this.obtenerPorId(enrollmentId);

    const calificaciones = matricula.grades || [];
    const sumaPonderada = calificaciones.reduce((acc, g) => acc + (g.puntajeObtenido / g.puntajeMaximo) * g.porcentaje, 0);
    const porcentajeEvaluado = calificaciones.reduce((acc, g) => acc + g.porcentaje, 0);
    const notaCalculada = Math.round(sumaPonderada * 100) / 100;
    const notaMinima = matricula.subject.notaMinimaAprobatoria;
    const aprobada = notaCalculada >= notaMinima;

    return {
      enrollmentId: matricula.id,
      estudiante: {
        id: matricula.user.id,
        nombreCompleto: `${matricula.user.nombre} ${matricula.user.apellidos}`,
        email: matricula.user.email
      },
      materia: {
        id: matricula.subject.id,
        codigo: matricula.subject.codigo,
        nombre: matricula.subject.nombre,
        creditos: matricula.subject.creditos,
        notaMinimaAprobatoria: notaMinima
      },
      periodo: {
        id: matricula.academicPeriod.id,
        nombre: matricula.academicPeriod.nombre,
        anio: matricula.academicPeriod.anio,
        periodo: matricula.academicPeriod.periodo
      },
      porcentajeEvaluado: Math.round(porcentajeEvaluado * 100) / 100,
      notaFinal: notaCalculada,
      notaMinimaAprobatoria: notaMinima,
      aprobada,
      estado: matricula.estado,
      calificaciones
    };
  }
}

module.exports = new MatriculasService();

