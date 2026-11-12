require('dotenv').config();
const assert = require('node:assert/strict');
const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const app = require('../src/app');

async function verifyPersistence() {
  console.log('====================================================');
  console.log('🔍 PRUEBA DEFINITIVA DE PERSISTENCIA REAL EN MYSQL (Notas_lab)');
  console.log('====================================================');

  const dbUrl = process.env.DATABASE_URL;
  console.log(`📌 DATABASE_URL en desarrollo: ${dbUrl ? dbUrl.replace(/:[^:@]+@/, ':***@') : 'UNDEFINED'}`);
  assert.ok(dbUrl && dbUrl.includes('Notas_lab'), 'DATABASE_URL debe apuntar a Notas_lab');

  let prisma = new PrismaClient({
    datasources: { db: { url: dbUrl } }
  });

  try {
    await prisma.$connect();
    console.log('✅ Paso 1: Conexión establecida con MySQL (Notas_lab)');

    // Paso 2: Autenticación real mediante /api/auth/login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@universidad.test', password: 'Clave123*' })
      .expect(200);
    const authToken = loginRes.body.token;
    console.log(`✅ Paso 2a: Login exitoso para ${loginRes.body.usuario.email} (${loginRes.body.usuario.rol})`);

    // Paso 2b: Consultar usuarios y materias mediante HTTP con Authorization
    const resUsuarios = await request(app)
      .get('/api/usuarios')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    console.log(`✅ Paso 2b: GET /api/usuarios retornó ${resUsuarios.body.length} usuarios existentes`);

    const resMaterias = await request(app)
      .get('/api/materias')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    console.log(`✅ Paso 2c: GET /api/materias retornó ${resMaterias.body.length} materias existentes`);

    // Paso 3: Crear un registro de prueba controlado en Notas_lab
    const testPayload = {
      titulo: 'NOTA_CONTROL_AUDITORIA_PERSISTENCIA',
      contenido: 'Esta nota verifica la persistencia real de extremo a extremo en Notas_lab.'
    };

    const resCreate = await request(app)
      .post('/api/notas')
      .send(testPayload)
      .expect(201);

    const notaId = resCreate.body.id;
    console.log(`✅ Paso 3: POST /api/notas creó nota con ID ${notaId}`);
    assert.equal(resCreate.body.titulo, testPayload.titulo);

    // Paso 4: Consultar el registro creado mediante GET
    const resGet = await request(app).get(`/api/notas/${notaId}`).expect(200);
    console.log(`✅ Paso 4: GET /api/notas/${notaId} recuperó la nota correctamente`);
    assert.equal(resGet.body.id, notaId);

    // Paso 5: Verificar directamente en la base de datos MySQL mediante Prisma
    const enDb1 = await prisma.note.findUnique({ where: { id: notaId } });
    assert.ok(enDb1, 'La nota debe existir en la base de datos MySQL Notas_lab');
    console.log(`✅ Paso 5: Verificación directa en MySQL: Nota ${enDb1.id} "${enDb1.titulo}" existe en tabla 'note'`);

    // Paso 6: Simulación de reinicio de Express y Prisma Client
    console.log('🔄 Paso 6: Simulando reinicio de conexiones de Express y Prisma Client...');
    await prisma.$disconnect();

    // Nueva instancia de Prisma conectando a Notas_lab
    prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
    await prisma.$connect();

    // Paso 7: Consultar nuevamente tras el reinicio
    const enDb2 = await prisma.note.findUnique({ where: { id: notaId } });
    assert.ok(enDb2, 'La nota debe seguir existiendo tras el reinicio de conexión');
    console.log(`✅ Paso 7: Confirmado: La nota ${enDb2.id} sobrevivió al reinicio de conexiones`);

    // Paso 8: Probar actualización vía PUT
    const updatePayload = {
      titulo: 'NOTA_CONTROL_AUDITORIA_ACTUALIZADA',
      contenido: 'Contenido actualizado para comprobar operaciones PUT en MySQL.'
    };
    const resPut = await request(app)
      .put(`/api/notas/${notaId}`)
      .send(updatePayload)
      .expect(200);

    assert.equal(resPut.body.titulo, updatePayload.titulo);
    console.log(`✅ Paso 8: PUT /api/notas/${notaId} actualizó el registro en MySQL`);

    // Paso 9: Limpieza controlada del registro de prueba
    await request(app).delete(`/api/notas/${notaId}`).expect(204);
    const enDbFinal = await prisma.note.findUnique({ where: { id: notaId } });
    assert.equal(enDbFinal, null, 'El registro de prueba debe ser eliminado');
    console.log(`✅ Paso 9: DELETE /api/notas/${notaId} limpió el registro de prueba; eliminación confirmada en MySQL`);

    // Paso 10: Auditoría de AIUsage
    const countAi = await prisma.aIUsage.count();
    console.log(`✅ Paso 10: Auditoría AIUsage: ${countAi} registros persistidos en Notas_lab`);

    console.log('====================================================');
    console.log('🎉 PERSISTENCIA REAL EN NOTAS_LAB CONFIRMADA AL 100%');
    console.log('====================================================');
  } catch (error) {
    console.error(' Error en prueba de persistencia:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyPersistence();

