/**
 * Seed reproducible e idempotente para el Sistema de Gestión Académica.
 * Configura usuarios con distintos roles, materias con prerrequisitos (individuales y múltiples),
 * períodos académicos, matrículas con calificaciones ponderadas, temas y notas académicas.
 */
require('dotenv').config();
const crypto = require('crypto');
const prisma = require('../src/config/prisma');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log('=== EJECUTANDO SEED DE LA BASE DE DATOS ACADÉMICA ===\n');

  // 1. USUARIOS
  const passHash = hashPassword('Clave123*');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@universidad.test' },
    update: {},
    create: {
      nombre: 'Administrador',
      apellidos: 'Sistema',
      email: 'admin@universidad.test',
      password: passHash,
      rol: 'ADMIN'
    }
  });

  const docente = await prisma.user.upsert({
    where: { email: 'profesor.garcia@universidad.test' },
    update: {},
    create: {
      nombre: 'Roberto',
      apellidos: 'García Monge',
      email: 'profesor.garcia@universidad.test',
      password: passHash,
      rol: 'DOCENTE'
    }
  });

  const estudiante1 = await prisma.user.upsert({
    where: { email: 'estudiante.aprobado@universidad.test' },
    update: {},
    create: {
      nombre: 'Carlos',
      apellidos: 'Soto Alvarado',
      email: 'estudiante.aprobado@universidad.test',
      password: passHash,
      rol: 'ESTUDIANTE'
    }
  });

  const estudiante2 = await prisma.user.upsert({
    where: { email: 'estudiante.nuevo@universidad.test' },
    update: {},
    create: {
      nombre: 'Valeria',
      apellidos: 'Mora Cordero',
      email: 'estudiante.nuevo@universidad.test',
      password: passHash,
      rol: 'ESTUDIANTE'
    }
  });

  const estudiante3 = await prisma.user.upsert({
    where: { email: 'estudiante.avanzado@universidad.test' },
    update: {},
    create: {
      nombre: 'Andrés',
      apellidos: 'Vega Benavides',
      email: 'estudiante.avanzado@universidad.test',
      password: passHash,
      rol: 'ESTUDIANTE'
    }
  });

  console.log('✔ Usuarios creados/verificados: Admin, Docente, Estudiantes (Carlos, Valeria, Andrés)');

  // 2. PERIODOS ACADÉMICOS
  const periodoPrevio = await prisma.academicPeriod.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      nombre: 'Segundo Cuatrimestre 2025',
      fechaInicio: new Date('2025-08-01T00:00:00Z'),
      fechaFin: new Date('2025-12-15T23:59:59Z'),
      anio: 2025,
      periodo: '2C',
      activo: false
    }
  });

  const periodoActual = await prisma.academicPeriod.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      nombre: 'Primer Cuatrimestre 2026',
      fechaInicio: new Date('2026-01-15T00:00:00Z'),
      fechaFin: new Date('2026-05-15T23:59:59Z'),
      anio: 2026,
      periodo: '1C',
      activo: true
    }
  });

  console.log('✔ Períodos académicos creados/verificados: 2025-2C (Inactivo), 2026-1C (Activo)');

  // 3. MATERIAS
  const matCiencias = await prisma.subject.upsert({
    where: { codigo: 'CI-101' },
    update: {},
    create: {
      codigo: 'CI-101',
      nombre: 'Ciencias Generales',
      descripcion: 'Principios y fundamentos de física, química y biología integrada.',
      creditos: 3,
      notaMinimaAprobatoria: 70.0
    }
  });

  const matQuimica = await prisma.subject.upsert({
    where: { codigo: 'QUI-201' },
    update: {},
    create: {
      codigo: 'QUI-201',
      nombre: 'Química General',
      descripcion: 'Estructura atómica, enlaces, estequiometría y soluciones.',
      creditos: 4,
      notaMinimaAprobatoria: 70.0
    }
  });

  const matMate1 = await prisma.subject.upsert({
    where: { codigo: 'MAT-101' },
    update: {},
    create: {
      codigo: 'MAT-101',
      nombre: 'Matemática Básica',
      descripcion: 'Álgebra, funciones, trigonometría y modelado matemático.',
      creditos: 4,
      notaMinimaAprobatoria: 70.0
    }
  });

  const matCalculo1 = await prisma.subject.upsert({
    where: { codigo: 'MAT-102' },
    update: {},
    create: {
      codigo: 'MAT-102',
      nombre: 'Cálculo I',
      descripcion: 'Límites, continuidad, derivadas y aplicaciones.',
      creditos: 4,
      notaMinimaAprobatoria: 70.0
    }
  });

  const matFisica = await prisma.subject.upsert({
    where: { codigo: 'FIS-301' },
    update: {},
    create: {
      codigo: 'FIS-301',
      nombre: 'Física Avanzada',
      descripcion: 'Mecánica analítica y electromagnetismo (Requiere Ciencias Generales y Matemática Básica).',
      creditos: 4,
      notaMinimaAprobatoria: 70.0
    }
  });

  console.log('✔ Materias creadas/verificadas: CI-101, QUI-201, MAT-101, MAT-102, FIS-301');

  // 4. PRERREQUISITOS
  // Escenario 1: Ciencias Generales (CI-101) es prerrequisito de Química General (QUI-201)
  await prisma.subjectPrerequisite.upsert({
    where: {
      subjectId_prerequisiteId: {
        subjectId: matQuimica.id,
        prerequisiteId: matCiencias.id
      }
    },
    update: {},
    create: {
      subjectId: matQuimica.id,
      prerequisiteId: matCiencias.id
    }
  });

  // Matemática Básica es prerrequisito de Cálculo I
  await prisma.subjectPrerequisite.upsert({
    where: {
      subjectId_prerequisiteId: {
        subjectId: matCalculo1.id,
        prerequisiteId: matMate1.id
      }
    },
    update: {},
    create: {
      subjectId: matCalculo1.id,
      prerequisiteId: matMate1.id
    }
  });

  // Escenario 2: Múltiples prerrequisitos para FIS-301 (Requiere CI-101 Y MAT-101)
  await prisma.subjectPrerequisite.upsert({
    where: {
      subjectId_prerequisiteId: {
        subjectId: matFisica.id,
        prerequisiteId: matCiencias.id
      }
    },
    update: {},
    create: {
      subjectId: matFisica.id,
      prerequisiteId: matCiencias.id
    }
  });

  await prisma.subjectPrerequisite.upsert({
    where: {
      subjectId_prerequisiteId: {
        subjectId: matFisica.id,
        prerequisiteId: matMate1.id
      }
    },
    update: {},
    create: {
      subjectId: matFisica.id,
      prerequisiteId: matMate1.id
    }
  });

  console.log('✔ Prerrequisitos creados: QUI-201 <- CI-101; MAT-102 <- MAT-101; FIS-301 <- (CI-101 + MAT-101)');

  // 5. MATRÍCULA Y CALIFICACIONES PREVIAS (Estudiante 1 aprueba CI-101 en 2025-2C con nota 92.5)
  const matriculaAprobada = await prisma.enrollment.upsert({
    where: {
      userId_subjectId_academicPeriodId: {
        userId: estudiante1.id,
        subjectId: matCiencias.id,
        academicPeriodId: periodoPrevio.id
      }
    },
    update: {
      estado: 'APROBADA',
      notaFinal: 92.5
    },
    create: {
      userId: estudiante1.id,
      subjectId: matCiencias.id,
      academicPeriodId: periodoPrevio.id,
      estado: 'APROBADA',
      notaFinal: 92.5
    }
  });

  // Calificaciones que sustentan la nota aprobada
  const eval1 = await prisma.grade.findFirst({
    where: { enrollmentId: matriculaAprobada.id, nombreEvaluacion: 'Examen Parcial 1' }
  });
  if (!eval1) {
    await prisma.grade.create({
      data: {
        enrollmentId: matriculaAprobada.id,
        nombreEvaluacion: 'Examen Parcial 1',
        puntajeObtenido: 40,
        puntajeMaximo: 40,
        porcentaje: 40,
        observaciones: 'Evaluación teórica inicial aprobada con excelencia'
      }
    });
  }

  const eval2 = await prisma.grade.findFirst({
    where: { enrollmentId: matriculaAprobada.id, nombreEvaluacion: 'Examen Final' }
  });
  if (!eval2) {
    await prisma.grade.create({
      data: {
        enrollmentId: matriculaAprobada.id,
        nombreEvaluacion: 'Examen Final',
        puntajeObtenido: 35,
        puntajeMaximo: 40,
        porcentaje: 40,
        observaciones: 'Evaluación final acumulativa'
      }
    });
  }

  const eval3 = await prisma.grade.findFirst({
    where: { enrollmentId: matriculaAprobada.id, nombreEvaluacion: 'Laboratorios Prácticos' }
  });
  if (!eval3) {
    await prisma.grade.create({
      data: {
        enrollmentId: matriculaAprobada.id,
        nombreEvaluacion: 'Laboratorios Prácticos',
        puntajeObtenido: 17.5,
        puntajeMaximo: 20,
        porcentaje: 20,
        observaciones: 'Prácticas de laboratorio completadas satisfactoriamente'
      }
    });
  }

  // Estudiante 1 matricula Química en el período actual (2026-1C) porque SÍ tiene CI-101 aprobada
  const matriculaQuimica = await prisma.enrollment.upsert({
    where: {
      userId_subjectId_academicPeriodId: {
        userId: estudiante1.id,
        subjectId: matQuimica.id,
        academicPeriodId: periodoActual.id
      }
    },
    update: {},
    create: {
      userId: estudiante1.id,
      subjectId: matQuimica.id,
      academicPeriodId: periodoActual.id,
      estado: 'ACTIVA'
    }
  });

  console.log('✔ Matrículas y calificaciones cargadas: Estudiante 1 aprobó CI-101 y matriculó QUI-201');

  // 6. TEMAS ACADÉMICOS
  const temaQuimica1 = await prisma.noteTopic.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      nombre: 'Estructura Atómica y Enlace Químico',
      descripcion: 'Configuraciones electrónicas, tabla periódica y enlaces covalentes e iónicos.',
      subjectId: matQuimica.id
    }
  });

  const temaQuimica2 = await prisma.noteTopic.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      nombre: 'Estequiometría y Balanceo',
      descripcion: 'Cálculos de masa molar, reactivo limitante y rendimiento de reacciones.',
      subjectId: matQuimica.id
    }
  });

  const temaCalculo1 = await prisma.noteTopic.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      nombre: 'Límites y Continuidad',
      descripcion: 'Teorema del emparedado, límites al infinito y discontinuidades.',
      subjectId: matCalculo1.id
    }
  });

  console.log('✔ Temas académicos creados/verificados: Química (2 temas), Cálculo (1 tema)');

  // 7. NOTAS ACADÉMICAS
  await prisma.note.upsert({
    where: { id: 100 },
    update: {},
    create: {
      id: 100,
      titulo: 'Apuntes de Regla del Octeto',
      contenido: 'La regla del octeto establece que los átomos tienden a combinarse para tener ocho electrones en su capa de valencia, logrando una configuración estable similar a la de un gas noble.',
      userId: estudiante1.id,
      subjectId: matQuimica.id,
      topicId: temaQuimica1.id
    }
  });

  await prisma.note.upsert({
    where: { id: 101 },
    update: {},
    create: {
      id: 101,
      titulo: 'Definición Épsilon-Delta de Límite',
      contenido: 'Para todo epsilon > 0 existe un delta > 0 tal que si 0 < |x - a| < delta, entonces |f(x) - L| < epsilon.',
      userId: estudiante1.id,
      subjectId: matCalculo1.id,
      topicId: temaCalculo1.id
    }
  });

  console.log('✔ Notas académicas de ejemplo creadas con relaciones completas');
  console.log('\n=== SEED COMPLETADO SATISFACTORIAMENTE ===\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error durante la ejecución del seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });

