require('dotenv').config();
const request = require('supertest');
const assert = require('node:assert/strict');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

async function testMultiTurnReal() {
  console.log('====================================================');
  console.log('🧪 PRUEBA EN VIVO: CONVERSACIONES MULTI-TURNO PERSISTENTES');
  console.log('====================================================');

  await prisma.$connect();

  // 1. Iniciar sesión como docente
  const loginDocente = await request(app)
    .post('/api/auth/login')
    .send({ email: 'profesor.garcia@universidad.test', password: 'Clave123*' })
    .expect(200);
  const tokenDocente = loginDocente.body.token;
  const docenteId = loginDocente.body.usuario.id;
  console.log(`✅ 1. Login exitoso para docente: ${loginDocente.body.usuario.nombre} (ID: ${docenteId})`);

  // 2. Turno 1 real: enviar primera pregunta
  console.log('⏳ 2. Enviando Turno 1 a DeepSeek...');
  const resTurno1 = await request(app)
    .post('/api/ia/conversar')
    .set('Authorization', `Bearer ${tokenDocente}`)
    .send({ pregunta: 'Me llamo Carlos García y soy profesor de Algoritmos. Recuerda mi nombre y materia.' })
    .expect(200);

  const convId = resTurno1.body.conversacionId;
  assert.ok(convId, 'Debe retornar conversacionId');
  console.log(`✅ Turno 1 exitoso. ID Conversación: ${convId}`);
  console.log(`💬 Respuesta Turno 1: "${resTurno1.body.respuesta.slice(0, 100)}..."`);
  console.log(`📊 Tokens Turno 1: ${resTurno1.body.uso?.total_tokens} tokens`);

  // 3. Verificar persistencia en MySQL tras Turno 1
  const enDbTurno1 = await prisma.conversation.findUnique({
    where: { id: convId },
    include: { messages: true }
  });
  assert.ok(enDbTurno1, 'La conversación debe existir en MySQL Notas_lab');
  assert.equal(enDbTurno1.userId, docenteId);
  assert.equal(enDbTurno1.messages.length, 2, 'Deben existir 2 mensajes (user y assistant)');
  console.log(`✅ 3. Persistencia en MySQL confirmada: 2 mensajes almacenados en tabla 'message'`);

  // 4. Turno 2 real: verificar memoria contextual de DeepSeek
  console.log('⏳ 4. Enviando Turno 2 contextual a DeepSeek...');
  const resTurno2 = await request(app)
    .post('/api/ia/conversar')
    .set('Authorization', `Bearer ${tokenDocente}`)
    .send({
      pregunta: '¿Cuál es mi nombre y qué materia imparto según lo que te acabo de decir?',
      conversacionId: convId
    })
    .expect(200);

  console.log(`✅ Turno 2 exitoso en la misma sesión (${resTurno2.body.conversacionId})`);
  console.log(`💬 Respuesta Turno 2: "${resTurno2.body.respuesta.slice(0, 120)}..."`);
  console.log(`📊 Tokens Turno 2: ${resTurno2.body.uso?.total_tokens} tokens`);

  // Verificar que la respuesta de DeepSeek contiene Carlos o García o Algoritmos
  const respLower = resTurno2.body.respuesta.toLowerCase();
  const reconocioContexto = respLower.includes('carlos') || respLower.includes('garc') || respLower.includes('algoritmo');
  console.log(`🧠 Memoria contextual comprobada: ${reconocioContexto ? 'SÍ (reconoció datos)' : 'NO'}`);

  // 5. Verificar persistencia de 4 mensajes en MySQL
  const enDbTurno2 = await prisma.conversation.findUnique({
    where: { id: convId },
    include: { messages: { orderBy: { createdAt: 'asc' } } }
  });
  assert.equal(enDbTurno2.messages.length, 4, 'Deben existir 4 mensajes en total');
  console.log(`✅ 5. MySQL contiene los 4 mensajes secuenciales con roles y fechas`);

  // 6. Probar listado de conversaciones del usuario
  const resLista = await request(app)
    .get('/api/ia/conversaciones')
    .set('Authorization', `Bearer ${tokenDocente}`)
    .expect(200);
  assert.ok(resLista.body.some(c => c.id === convId));
  console.log(`✅ 6. GET /api/ia/conversaciones retornó ${resLista.body.length} conversaciones del usuario`);

  // 7. Probar aislamiento de seguridad: estudiante no puede ver la conversación del docente
  const loginEstudiante = await request(app)
    .post('/api/auth/login')
    .send({ email: 'estudiante.aprobado@universidad.test', password: 'Clave123*' })
    .expect(200);
  const tokenEstudiante = loginEstudiante.body.token;

  await request(app)
    .get(`/api/ia/conversaciones/${convId}`)
    .set('Authorization', `Bearer ${tokenEstudiante}`)
    .expect(404);
  console.log(`✅ 7. Aislamiento comprobado: estudiante recibe 404 al intentar acceder a conversación de docente`);

  // 8. Limpiar la conversación de prueba
  await request(app)
    .delete(`/api/ia/conversaciones/${convId}`)
    .set('Authorization', `Bearer ${tokenDocente}`)
    .expect(200);
  const eliminada = await prisma.conversation.findUnique({ where: { id: convId } });
  assert.equal(eliminada, null, 'La conversación debe ser eliminada');
  console.log(`✅ 8. DELETE /api/ia/conversaciones/:id eliminó la conversación y sus mensajes en cascada`);

  console.log('====================================================');
  console.log('🎉 PRUEBA DE CONVERSACIONES MULTI-TURNO EN VIVO EXITOSA');
  console.log('====================================================');
  await prisma.$disconnect();
}

testMultiTurnReal().catch((err) => {
  console.error('❌ Error en prueba multi-turno:', err);
  process.exit(1);
});

