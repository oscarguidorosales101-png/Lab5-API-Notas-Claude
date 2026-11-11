const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

process.env.NODE_ENV = 'test';
process.env.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'mysql://root:root@localhost:3306/Notas_lab_test';
process.env.DEEPSEEK_API_KEY = 'clave-ficticia-pruebas-academico';
process.env.DEEPSEEK_MODEL = 'deepseek-flash';

const app = require('../src/app');
const prisma = require('../src/config/prisma');
const { migrarDatos } = require('../scripts/migrate-sqlite-to-mysql');

const nativeFetch = global.fetch;

describe('SISTEMA ACADÉMICO Y MIGRACIÓN MYSQL — SUITE DE PRUEBAS', () => {
  before(async () => {
    // Interceptar fetch para aislar cualquier llamada externa de IA
    global.fetch = async (url, options) => {
      return new Response(JSON.stringify({
        choices: [{ message: { content: 'Respuesta académica simulada' } }],
        usage: { prompt_tokens: 15, completion_tokens: 25, total_tokens: 40 }
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    };

    await prisma.$connect();
  });

  after(async () => {
    global.fetch = nativeFetch;
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Limpieza ordenada respetando foreign keys en Notas_lab_test
    await prisma.grade.deleteMany();
    await prisma.enrollment.deleteMany();
    await prisma.subjectPrerequisite.deleteMany();
    await prisma.note.deleteMany();
    await prisma.noteTopic.deleteMany();
    await prisma.subject.deleteMany();
    await prisma.academicPeriod.deleteMany();
    await prisma.user.deleteMany();
    await prisma.aIUsage.deleteMany();
  });

  // 1. CRUD DE NOTAS
  test('1. CRUD de notas: crear, obtener, listar y eliminar', async () => {
    const resCreate = await request(app)
      .post('/api/notas')
      .send({ titulo: 'Nota de Álgebra', contenido: 'Contenido sobre espacios vectoriales' })
      .expect(201);

    assert.equal(resCreate.body.titulo, 'Nota de Álgebra');
    const notaId = resCreate.body.id;

    const resGet = await request(app)
      .get(`/api/notas/${notaId}`)
      .expect(200);
    assert.equal(resGet.body.id, notaId);

    const resList = await request(app)
      .get('/api/notas')
      .expect(200);
    assert.ok(Array.isArray(resList.body));
    assert.equal(resList.body.length, 1);

    await request(app)
      .delete(`/api/notas/${notaId}`)
      .expect(204);

    await request(app)
      .get(`/api/notas/${notaId}`)
      .expect(404);
  });

  // 2. PERSISTENCIA DE NOTAS EN MYSQL
  test('2. Persistencia de notas en MySQL: verificación directa en base de datos', async () => {
    const res = await request(app)
      .post('/api/notas')
      .send({ titulo: 'Persistencia MySQL', contenido: 'Verificando inserción en tabla notes de MySQL' })
      .expect(201);

    const enBD = await prisma.note.findUnique({ where: { id: res.body.id } });
    assert.ok(enBD !== null);
    assert.equal(enBD.titulo, 'Persistencia MySQL');
  });

  // 3. TRANSFERENCIA DE DATOS SQLITE
  test('3. Transferencia de datos SQLite a MySQL: migrarDatos ejecuta de forma segura e idempotente', async () => {
    const resultado = await migrarDatos();
    assert.ok(resultado.notas.encontradas >= 0);
    assert.ok(resultado.iaUsage.encontradas >= 0);

    // Segunda ejecución debe omitir los ya insertados
    const segunda = await migrarDatos();
    assert.equal(segunda.notas.migradas, 0);
    assert.equal(segunda.iaUsage.migradas, 0);
  });

  // 4. CRUD DE USUARIOS
  test('4. CRUD de usuarios: crear con hash, listar sin password, actualizar y eliminar', async () => {
    const resCreate = await request(app)
      .post('/api/usuarios')
      .send({
        nombre: 'Estudiante',
        apellidos: 'Prueba',
        email: 'estudiante.test@universidad.test',
        password: 'Password123*',
        rol: 'ESTUDIANTE'
      })
      .expect(201);

    assert.equal(resCreate.body.email, 'estudiante.test@universidad.test');
    assert.equal(resCreate.body.password, undefined); // Nunca exponer password
    const userId = resCreate.body.id;

    // Verificar en BD que la contraseña esté hasheada y no en texto plano
    const enBD = await prisma.user.findUnique({ where: { id: userId } });
    assert.notEqual(enBD.password, 'Password123*');
    assert.equal(enBD.password.length, 64); // SHA-256 hex length

    // Rechazar correo duplicado (409)
    await request(app)
      .post('/api/usuarios')
      .send({
        nombre: 'Otro',
        apellidos: 'Usuario',
        email: 'estudiante.test@universidad.test',
        password: 'Password123*',
        rol: 'ESTUDIANTE'
      })
      .expect(409);

    // Actualizar usuario
    const resUpdate = await request(app)
      .put(`/api/usuarios/${userId}`)
      .send({ nombre: 'Estudiante Actualizado' })
      .expect(200);
    assert.equal(resUpdate.body.nombre, 'Estudiante Actualizado');

    // Eliminar usuario
    await request(app).delete(`/api/usuarios/${userId}`).expect(204);
  });

  // 5. CRUD DE MATERIAS
  test('5. CRUD de materias: creación, código único, actualización y consulta', async () => {
    const resMateria = await request(app)
      .post('/api/materias')
      .send({
        codigo: 'MAT-101',
        nombre: 'Matemática I',
        descripcion: 'Cálculo diferencial y funciones',
        creditos: 4,
        notaMinimaAprobatoria: 70.0
      })
      .expect(201);

    assert.equal(resMateria.body.codigo, 'MAT-101');

    // Rechazar código duplicado (409)
    await request(app)
      .post('/api/materias')
      .send({
        codigo: 'MAT-101',
        nombre: 'Otra Matemática',
        creditos: 3
      })
      .expect(409);
  });

  // 6. RELACIONES DE PRERREQUISITOS
  test('6. Relaciones de prerrequisitos: asignación, rechazo autorreferencial y circular', async () => {
    const matA = await prisma.subject.create({
      data: { codigo: 'BIO-101', nombre: 'Biología General', creditos: 3 }
    });
    const matB = await prisma.subject.create({
      data: { codigo: 'BIO-201', nombre: 'Genética', creditos: 4 }
    });

    // Rechazar materia como prerrequisito de sí misma (400)
    await request(app)
      .post(`/api/materias/${matA.id}/prerrequisitos`)
      .send({ prerequisiteId: matA.id })
      .expect(400);

    // Asignar Bio-101 como prerrequisito de Bio-201
    await request(app)
      .post(`/api/materias/${matB.id}/prerrequisitos`)
      .send({ prerequisiteId: matA.id })
      .expect(201);

    // Rechazar duplicado (409)
    await request(app)
      .post(`/api/materias/${matB.id}/prerrequisitos`)
      .send({ prerequisiteId: matA.id })
      .expect(409);

    // Rechazar dependencia circular directa (409): hacer que Bio-101 requiera Bio-201
    await request(app)
      .post(`/api/materias/${matA.id}/prerrequisitos`)
      .send({ prerequisiteId: matB.id })
      .expect(409);

    // Consultar prerrequisitos
    const resPrereq = await request(app)
      .get(`/api/materias/${matB.id}/prerrequisitos`)
      .expect(200);
    assert.equal(resPrereq.body.length, 1);
    assert.equal(resPrereq.body[0].id, matA.id);

    // Eliminar prerrequisito
    await request(app)
      .delete(`/api/materias/${matB.id}/prerrequisitos/${matA.id}`)
      .expect(204);
  });

  // 7, 8, 9. MATRÍCULAS VÁLIDAS, PRERREQUISITOS INCUMPLIDOS Y DUPLICADAS
  test('7, 8, 9. Matrículas: validación de rol, período activo, prerrequisitos aprobados y duplicidad', async () => {
    // 1. Crear usuarios
    const estudiante = await prisma.user.create({
      data: {
        nombre: 'Ana',
        apellidos: 'Castro',
        email: 'ana.castro@test.com',
        password: 'hash',
        rol: 'ESTUDIANTE'
      }
    });

    const docente = await prisma.user.create({
      data: {
        nombre: 'Profesor',
        apellidos: 'X',
        email: 'prof.x@test.com',
        password: 'hash',
        rol: 'DOCENTE'
      }
    });

    // 2. Crear período activo y período inactivo
    const periodoActivo = await prisma.academicPeriod.create({
      data: {
        nombre: '2026-1C',
        fechaInicio: new Date('2026-01-01'),
        fechaFin: new Date('2026-04-30'),
        anio: 2026,
        periodo: '1C',
        activo: true
      }
    });

    const periodoInactivo = await prisma.academicPeriod.create({
      data: {
        nombre: '2025-3C',
        fechaInicio: new Date('2025-09-01'),
        fechaFin: new Date('2025-12-15'),
        anio: 2025,
        periodo: '3C',
        activo: false
      }
    });

    // 3. Crear materias con prerrequisito
    const ci101 = await prisma.subject.create({
      data: { codigo: 'CI-101', nombre: 'Ciencias Generales', notaMinimaAprobatoria: 70.0 }
    });

    const qui201 = await prisma.subject.create({
      data: { codigo: 'QUI-201', nombre: 'Química General', notaMinimaAprobatoria: 70.0 }
    });

    await prisma.subjectPrerequisite.create({
      data: { subjectId: qui201.id, prerequisiteId: ci101.id }
    });

    // Intento con rol no estudiante -> 400
    await request(app)
      .post('/api/matriculas')
      .send({ userId: docente.id, subjectId: ci101.id, academicPeriodId: periodoActivo.id })
      .expect(400);

    // Intento en período inactivo -> 400
    await request(app)
      .post('/api/matriculas')
      .send({ userId: estudiante.id, subjectId: ci101.id, academicPeriodId: periodoInactivo.id })
      .expect(400);

    // 8. Intento de matricular Química SIN haber aprobado Ciencias Generales -> 409 con detalles
    const resSinPrereq = await request(app)
      .post('/api/matriculas')
      .send({ userId: estudiante.id, subjectId: qui201.id, academicPeriodId: periodoActivo.id })
      .expect(409);
    assert.ok(resSinPrereq.body.error.includes('prerrequisitos obligatorios'));

    // Matricular válidamente en Ciencias Generales (no tiene prerrequisito)
    const resMatriculaCI = await request(app)
      .post('/api/matriculas')
      .send({ userId: estudiante.id, subjectId: ci101.id, academicPeriodId: periodoActivo.id })
      .expect(201);

    // 9. Intento de matrícula duplicada -> 409
    await request(app)
      .post('/api/matriculas')
      .send({ userId: estudiante.id, subjectId: ci101.id, academicPeriodId: periodoActivo.id })
      .expect(409);

    // Simular que aprueba Ciencias Generales (nota 80.0, estado APROBADA)
    await prisma.enrollment.update({
      where: { id: resMatriculaCI.body.id },
      data: { estado: 'APROBADA', notaFinal: 80.0 }
    });

    // Ahora SÍ puede matricular Química General
    const resMatriculaQUI = await request(app)
      .post('/api/matriculas')
      .send({ userId: estudiante.id, subjectId: qui201.id, academicPeriodId: periodoActivo.id })
      .expect(201);

    assert.equal(resMatriculaQUI.body.subjectId, qui201.id);
  });

  // 10 Y 11. CALIFICACIONES Y CÁLCULO DE NOTA FINAL
  test('10 y 11. Calificaciones: validaciones de puntajes, ponderación y cálculo final', async () => {
    const estudiante = await prisma.user.create({
      data: { nombre: 'Luis', apellidos: 'Rojas', email: 'luis@test.com', password: 'h', rol: 'ESTUDIANTE' }
    });
    const periodo = await prisma.academicPeriod.create({
      data: { nombre: 'P1', fechaInicio: new Date(), fechaFin: new Date(), anio: 2026, periodo: '1C', activo: true }
    });
    const materia = await prisma.subject.create({
      data: { codigo: 'HIS-101', nombre: 'Historia', notaMinimaAprobatoria: 70.0 }
    });
    const matricula = await prisma.enrollment.create({
      data: { userId: estudiante.id, subjectId: materia.id, academicPeriodId: periodo.id, estado: 'ACTIVA' }
    });

    // Rechazar puntajeObtenido > puntajeMaximo -> 400
    await request(app)
      .post(`/api/matriculas/${matricula.id}/calificaciones`)
      .send({
        nombreEvaluacion: 'Examen 1',
        puntajeObtenido: 105,
        puntajeMaximo: 100,
        porcentaje: 30
      })
      .expect(400);

    // Agregar Evaluación 1: 50 pts de 50, 50%
    await request(app)
      .post(`/api/matriculas/${matricula.id}/calificaciones`)
      .send({
        nombreEvaluacion: 'Parcial 1',
        puntajeObtenido: 50,
        puntajeMaximo: 50,
        porcentaje: 50
      })
      .expect(201);

    // Rechazar evaluación que haga superar el 100% (intentar agregar 51%)
    await request(app)
      .post(`/api/matriculas/${matricula.id}/calificaciones`)
      .send({
        nombreEvaluacion: 'Parcial 2',
        puntajeObtenido: 40,
        puntajeMaximo: 50,
        porcentaje: 51
      })
      .expect(400);

    // Agregar Evaluación 2: 40 pts de 50 (80%), 50% -> Ponderación: 0.8 * 50 = 40. Nota final esperada = 50 + 40 = 90
    await request(app)
      .post(`/api/matriculas/${matricula.id}/calificaciones`)
      .send({
        nombreEvaluacion: 'Parcial 2',
        puntajeObtenido: 40,
        puntajeMaximo: 50,
        porcentaje: 50
      })
      .expect(201);

    // Consultar resultado final
    const resResultado = await request(app)
      .get(`/api/matriculas/${matricula.id}/resultado-final`)
      .expect(200);

    assert.equal(resResultado.body.notaFinal, 90);
    assert.equal(resResultado.body.porcentajeEvaluado, 100);
    assert.equal(resResultado.body.aprobada, true);
    assert.equal(resResultado.body.estado, 'APROBADA');
  });

  // 12. ORGANIZACIÓN POR TEMAS Y FILTROS
  test('12. Organización por temas: creación de tema y filtros en /api/notas', async () => {
    const materia = await prisma.subject.create({
      data: { codigo: 'FIL-101', nombre: 'Filosofía', creditos: 3 }
    });
    const estudiante = await prisma.user.create({
      data: { nombre: 'María', apellidos: 'Solís', email: 'maria@test.com', password: 'h', rol: 'ESTUDIANTE' }
    });

    const resTema = await request(app)
      .post('/api/temas')
      .send({ nombre: 'Ética y Moral', subjectId: materia.id })
      .expect(201);

    const temaId = resTema.body.id;

    // Crear nota vinculada a estudiante, materia y tema
    const resNota = await request(app)
      .post('/api/notas')
      .send({
        titulo: 'Imperativo Categórico',
        contenido: 'Apuntes sobre la ética kantiana',
        userId: estudiante.id,
        subjectId: materia.id,
        topicId: temaId
      })
      .expect(201);

    // Filtrar por tema
    const resFiltro = await request(app)
      .get(`/api/notas?topicId=${temaId}`)
      .expect(200);
    assert.equal(resFiltro.body.length, 1);
    assert.equal(resFiltro.body[0].id, resNota.body.id);

    // Filtrar por materia
    const resMateria = await request(app)
      .get(`/api/notas?subjectId=${materia.id}`)
      .expect(200);
    assert.equal(resMateria.body.length, 1);

    // Filtrar por otro ID inexistente
    const resVacio = await request(app)
      .get('/api/notas?topicId=9999')
      .expect(200);
    assert.equal(resVacio.body.length, 0);
  });

  // 13, 14, 15. PERSISTENCIA DE AIUSAGE, COSTOS Y RESUMEN DIARIO
  test('13, 14, 15. AIUsage: persistencia en MySQL, fórmulas de costo y resumen diario', async () => {
    const resPregunta = await request(app)
      .post('/api/ia/preguntar')
      .send({ pregunta: '¿Qué es una reacción endotérmica?' })
      .expect(200);

    assert.ok(resPregunta.body.respuesta);
    assert.equal(resPregunta.body.uso.total_tokens, 40);

    // 13. Persistencia en MySQL
    const registros = await prisma.aIUsage.findMany();
    assert.equal(registros.length, 1);
    assert.equal(registros[0].totalTokens, 40);

    // 14. Cálculo de costos
    // Entrada: (15 / 1_000_000) * 0.14 = 0.0000021
    // Salida: (25 / 1_000_000) * 0.28 = 0.000007
    // Total = 0.0000091
    assert.ok(Math.abs(registros[0].costoTotal - 0.0000091) < 0.000001);

    // 15. Resumen diario
    const resHoy = await request(app)
      .get('/api/ia/uso/hoy')
      .expect(200);
    assert.equal(resHoy.body.totalSolicitudes, 1);
    assert.equal(resHoy.body.totalTokens, 40);
  });

  // 16. AISLAMIENTO DE DATOS DE PRUEBAS
  test('16. Aislamiento: la suite utiliza exclusivamente la base de datos de pruebas (Notas_lab_test)', async () => {
    const dbUrl = process.env.TEST_DATABASE_URL || '';
    assert.ok(dbUrl.toLowerCase().includes('notas_lab_test'), 'Debe apuntar a notas_lab_test');
  });

  // 17. COMPATIBILIDAD CON ENDPOINTS EXISTENTES DE DEEPSEEK
  test('17. Compatibilidad con endpoints de DeepSeek: /api/ia/uso y /api/ia/uso/resumen', async () => {
    const resUso = await request(app)
      .get('/api/ia/uso')
      .expect(200);
    assert.ok(resUso.body.total !== undefined);
    assert.ok(Array.isArray(resUso.body.registros));

    const resResumen = await request(app)
      .get('/api/ia/uso/resumen')
      .expect(200);
    assert.ok(resResumen.body.desglosePorOperacion);
  });
});
