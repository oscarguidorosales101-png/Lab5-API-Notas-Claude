require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function audit() {
  const dbUrl = process.env.DATABASE_URL;
  console.log('Auditing database URL:', dbUrl ? dbUrl.replace(/:[^:@]+@/, ':***@') : 'UNDEFINED');
  
  const prisma = new PrismaClient({
    datasources: { db: { url: dbUrl } }
  });

  try {
    await prisma.$connect();
    console.log('✅ Conexión exitosa a MySQL mediante Prisma Client');

    const tables = await prisma.$queryRaw`SHOW TABLES`;
    console.log('📋 Tablas detectadas en Notas_lab:', tables);

    const counts = {
      users: await prisma.user.count(),
      subjects: await prisma.subject.count(),
      prerequisites: await prisma.subjectPrerequisite.count(),
      periods: await prisma.academicPeriod.count(),
      enrollments: await prisma.enrollment.count(),
      grades: await prisma.grade.count(),
      topics: await prisma.noteTopic.count(),
      notes: await prisma.note.count(),
      aiUsage: await prisma.aIUsage.count()
    };
    console.log('📊 Conteo de registros por modelo en Notas_lab:');
    console.table(counts);

    // Muestra de registros existentes para verificar integridad
    const sampleUser = await prisma.user.findFirst({ select: { id: true, nombre: true, apellidos: true, email: true, rol: true } });
    console.log('Muestra de Usuario:', sampleUser);

    const sampleSubject = await prisma.subject.findFirst({ include: { prerrequisitos: true, temas: true } });
    console.log('Muestra de Materia:', sampleSubject ? { id: sampleSubject.id, codigo: sampleSubject.codigo, nombre: sampleSubject.nombre } : null);

    const samplePeriod = await prisma.academicPeriod.findFirst();
    console.log('Muestra de Período:', samplePeriod ? { id: samplePeriod.id, nombre: samplePeriod.nombre, activo: samplePeriod.activo } : null);

    const sampleEnrollment = await prisma.enrollment.findFirst({ include: { grades: true } });
    console.log('Muestra de Matrícula:', sampleEnrollment ? { id: sampleEnrollment.id, userId: sampleEnrollment.userId, subjectId: sampleEnrollment.subjectId, notaFinal: sampleEnrollment.notaFinal, estado: sampleEnrollment.estado, evaluaciones: sampleEnrollment.grades.length } : null);

  } catch (error) {
    console.error(' Error durante la auditoría de MySQL:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

audit();

