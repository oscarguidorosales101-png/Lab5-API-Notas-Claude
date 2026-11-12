const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const OpenAI = require('openai');

// Configuración de entorno de pruebas con tarifas controladas
process.env.NODE_ENV = 'test';
process.env.DEEPSEEK_API_KEY = 'clave-ficticia-pruebas-reto';
process.env.DEEPSEEK_MODEL = 'deepseek-flash';
process.env.AI_PRICE_PER_MILLION_INPUT_TOKENS = '0.14';
process.env.AI_PRICE_PER_MILLION_OUTPUT_TOKENS = '0.28';
process.env.TIMEZONE = 'America/Costa_Rica';

const app = require('../src/app');
const prisma = require('../src/config/prisma');
const deepseek = require('../src/services/deepseek.service');
const costosService = require('../src/services/costos.service');

const nativeFetch = global.fetch;
let providerStatus = 200;
let providerPayload = {};
let calls = [];
let simulateTimeout = false;

function resetMock(status = 200, content = 'Respuesta simulada', usage = { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 }) {
  providerStatus = status;
  calls = [];
  simulateTimeout = false;
  providerPayload = {
    choices: [{ message: { content } }],
    usage
  };
}

describe('RETO 1, 2 Y 3 — PRUEBAS DE INTEGRACIÓN CON SUPERTEST, PRISMA Y COSTOS', () => {
  before(async () => {
    // Interceptar llamadas HTTP externas para simular DeepSeek sin consumir créditos reales ni requerir internet
    global.fetch = async (url, options) => {
      assert.equal(new URL(url).origin, 'https://api.deepseek.com');
      calls.push(JSON.parse(options.body));

      if (simulateTimeout) {
        throw new OpenAI.APIConnectionTimeoutError();
      }

      return new Response(JSON.stringify(providerPayload), {
        status: providerStatus,
        headers: { 'content-type': 'application/json' }
      });
    };

    // Asegurar conexión a Prisma
    await prisma.$connect();
  });

  after(async () => {
    global.fetch = nativeFetch;
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Limpiar tablas para garantizar aislamiento e independencia entre pruebas
    await prisma.aIUsage.deleteMany();
    await prisma.note.deleteMany();
    resetMock();
  });

  /* =========================================================================
   * 4.1 PRUEBAS DEL CRUD CON PERSISTENCIA EN MYSQL VIA PRISMA
   * ========================================================================= */
  describe('4.1 CRUD de Notas con Prisma y MySQL (Notas_lab_test)', () => {
    test('1. Crear una nota correctamente retorna 201 y persiste en MySQL', async () => {
      const payload = {
        titulo: 'Nota MySQL',
        contenido: 'Contenido persistido en la base de datos MySQL con Prisma.'
      };

      const res = await request(app)
        .post('/api/notas')
        .send(payload)
        .expect(201);

      assert.ok(res.body.id);
      assert.equal(res.body.titulo, payload.titulo);
      assert.equal(res.body.contenido, payload.contenido);

      // Verificación directa en base de datos MySQL via Prisma
      const notaEnDb = await prisma.note.findUnique({ where: { id: res.body.id } });
      assert.ok(notaEnDb);
      assert.equal(notaEnDb.titulo, payload.titulo);
    });

    test('2. Obtener todas las notas retorna 200 y array de notas ordenadas', async () => {
      await prisma.note.createMany({
        data: [
          { titulo: 'Nota 1', contenido: 'Contenido 1' },
          { titulo: 'Nota 2', contenido: 'Contenido 2' }
        ]
      });

      const res = await request(app)
        .get('/api/notas')
        .expect(200);

      assert.ok(Array.isArray(res.body));
      assert.equal(res.body.length, 2);
      assert.equal(res.body[0].titulo, 'Nota 1');
      assert.equal(res.body[1].titulo, 'Nota 2');
    });

    test('3. Obtener una nota por ID existente retorna 200', async () => {
      const creada = await prisma.note.create({
        data: { titulo: 'Nota Individual', contenido: 'Detalle de la nota' }
      });

      const res = await request(app)
        .get(`/api/notas/${creada.id}`)
        .expect(200);

      assert.equal(res.body.id, creada.id);
      assert.equal(res.body.titulo, 'Nota Individual');
    });

    test('4. Responder 404 cuando la nota no exista', async () => {
      const res = await request(app)
        .get('/api/notas/99999')
        .expect(404);

      assert.ok(res.body.error);
    });

    test('5. Rechazar datos inválidos con 400 y detalles claros', async () => {
      // Cuerpo vacío
      const resVacio = await request(app)
        .post('/api/notas')
        .send({})
        .expect(400);
      assert.ok(resVacio.body.error);

      // Título vacío
      const resTituloVacio = await request(app)
        .post('/api/notas')
        .send({ titulo: '   ', contenido: 'Texto válido' })
        .expect(400);
      assert.ok(resTituloVacio.body.detalles);

      // Contenido que supera 5000 caracteres
      const resContenidoLargo = await request(app)
        .post('/api/notas')
        .send({ titulo: 'Título', contenido: 'X'.repeat(5001) })
        .expect(400);
      assert.ok(resContenidoLargo.body.detalles);
    });

    test('6. Eliminar una nota existente retorna 204', async () => {
      const creada = await prisma.note.create({
        data: { titulo: 'A eliminar', contenido: 'Contenido' }
      });

      await request(app)
        .delete(`/api/notas/${creada.id}`)
        .expect(204);

      const enDb = await prisma.note.findUnique({ where: { id: creada.id } });
      assert.equal(enDb, null);
    });

    test('7. Comprobar que la nota eliminada ya no existe (404)', async () => {
      const creada = await prisma.note.create({
        data: { titulo: 'Temporal', contenido: 'Para borrar' }
      });

      await request(app).delete(`/api/notas/${creada.id}`).expect(204);
      await request(app).get(`/api/notas/${creada.id}`).expect(404);
    });

    test('8. Comprobar validaciones Zod contra tipos incorrectos', async () => {
      const res = await request(app)
        .post('/api/notas')
        .send({ titulo: 12345, contenido: true })
        .expect(400);

      assert.ok(res.body.detalles);
      assert.ok(res.body.detalles.some(d => d.campo === 'titulo'));
    });
  });

  /* =========================================================================
   * 4.2 SIMULACIÓN DEL SERVICIO DE IA Y REGISTRO DE CONSUMO
   * ========================================================================= */
  describe('4.2 Mocks de DeepSeek y Registro Persistente de Consumo', () => {
    test('Respuesta exitosa de una pregunta registra consumo en MySQL', async () => {
      resetMock(200, 'París es la capital de Francia', { prompt_tokens: 15, completion_tokens: 30, total_tokens: 45 });

      const res = await request(app)
        .post('/api/ia/preguntar')
        .send({ pregunta: '¿Cuál es la capital de Francia?' })
        .expect(200);

      assert.equal(res.body.respuesta, 'París es la capital de Francia');
      assert.equal(calls.length, 1);

      // Verificar que se guardó en la base de datos AIUsage
      const registros = await prisma.aIUsage.findMany();
      assert.equal(registros.length, 1);
      assert.equal(registros[0].tipoOperacion, 'pregunta');
      assert.equal(registros[0].tokensEntrada, 15);
      assert.equal(registros[0].tokensSalida, 30);
      assert.equal(registros[0].totalTokens, 45);
    });

    test('Respuesta exitosa de un resumen registra consumo en MySQL', async () => {
      const nota = await prisma.note.create({
        data: { titulo: 'Reunión', contenido: 'Detalle de la reunión técnica del equipo' }
      });

      resetMock(200, '- Punto 1\n- Punto 2\n- Punto 3', { prompt_tokens: 50, completion_tokens: 40, total_tokens: 90 });

      const res = await request(app)
        .post(`/api/notas/${nota.id}/resumen`)
        .expect(200);

      assert.equal(res.body.notaId, nota.id);
      assert.equal(res.body.resumen, '- Punto 1\n- Punto 2\n- Punto 3');

      const registros = await prisma.aIUsage.findMany();
      assert.equal(registros.length, 1);
      assert.equal(registros[0].tipoOperacion, 'resumen');
      assert.equal(registros[0].tokensEntrada, 50);
      assert.equal(registros[0].tokensSalida, 40);
    });

    test('Error de autenticación (401 de proveedor) devuelve 502 y NO registra consumo', async () => {
      resetMock(401);
      providerPayload = { error: { message: 'Invalid API key', type: 'authentication_error' } };

      const res = await request(app)
        .post('/api/ia/preguntar')
        .send({ pregunta: 'Pregunta con key inválida' })
        .expect(502);

      assert.deepEqual(res.body, { error: 'IA_NO_DISPONIBLE' });

      // Verificar ausencia de registros de consumo ficticios ante fallos
      const registros = await prisma.aIUsage.findMany();
      assert.equal(registros.length, 0);
    });

    test('Límite de solicitudes del proveedor (429) devuelve 429 y no registra consumo', async () => {
      resetMock(429);
      providerPayload = { error: { message: 'Rate limit exceeded' } };

      const res = await request(app)
        .post('/api/ia/preguntar')
        .send({ pregunta: 'Pregunta con rate limit' })
        .expect(429);

      assert.deepEqual(res.body, { error: 'IA_NO_DISPONIBLE' });
      assert.equal(await prisma.aIUsage.count(), 0);
    });

    test('Timeout simulado devuelve 504 y no registra consumo', async () => {
      resetMock();
      simulateTimeout = true;

      const res = await request(app)
        .post('/api/ia/preguntar')
        .send({ pregunta: 'Pregunta que causa timeout' })
        .expect(504);

      assert.deepEqual(res.body, { error: 'IA_NO_DISPONIBLE' });
      assert.equal(await prisma.aIUsage.count(), 0);
    });

    test('Respuesta inválida del proveedor devuelve 502 y no registra consumo', async () => {
      resetMock(200);
      providerPayload = { choices: [] }; // Sin contenido válido

      const res = await request(app)
        .post('/api/ia/preguntar')
        .send({ pregunta: 'Pregunta respuesta vacía' })
        .expect(502);

      assert.deepEqual(res.body, { error: 'IA_NO_DISPONIBLE' });
      assert.equal(await prisma.aIUsage.count(), 0);
    });

    test('Servicio no disponible (503) devuelve 503 y no registra consumo', async () => {
      resetMock(503);

      const res = await request(app)
        .post('/api/ia/preguntar')
        .send({ pregunta: 'Pregunta cuando el servicio está caído' })
        .expect(503);

      assert.deepEqual(res.body, { error: 'IA_NO_DISPONIBLE' });
      assert.equal(await prisma.aIUsage.count(), 0);
    });

    test('Configuración ausente produce 502 sin llamar al proveedor', async () => {
      const originalKey = process.env.DEEPSEEK_API_KEY;
      delete process.env.DEEPSEEK_API_KEY;
      try {
        const res = await request(app)
          .post('/api/ia/preguntar')
          .send({ pregunta: 'Sin clave configurada' })
          .expect(502);

        assert.deepEqual(res.body, { error: 'IA_NO_DISPONIBLE' });
        assert.equal(calls.length, 0);
      } finally {
        process.env.DEEPSEEK_API_KEY = originalKey;
      }
    });
  });

  /* =========================================================================
   * 4.3 PRUEBAS DE CÁLCULO DE COSTOS Y ENDPOINTS DE USO
   * ========================================================================= */
  describe('4.3 Fórmulas de Costos y Endpoints de Consumo (/api/ia/uso)', () => {
    test('Fórmula de costos: cálculo exacto de tokens de entrada, salida y total', async () => {
      // Precio configurado: Entrada $0.14 por 1M, Salida $0.28 por 1M
      // 100,000 tokens de entrada = (100,000 / 1,000,000) * 0.14 = $0.014
      // 200,000 tokens de salida  = (200,000 / 1,000,000) * 0.28 = $0.056
      // Costo total esperado     = $0.070
      const reg = await costosService.registrarConsumo({
        tipoOperacion: 'pregunta',
        modelo: 'deepseek-flash',
        uso: { prompt_tokens: 100000, completion_tokens: 200000, total_tokens: 300000 }
      });

      assert.ok(reg);
      assert.equal(reg.tokensEntrada, 100000);
      assert.equal(reg.tokensSalida, 200000);
      assert.equal(reg.totalTokens, 300000);
      assert.equal(reg.costoEntrada, 0.014);
      assert.equal(reg.costoSalida, 0.056);
      assert.equal(reg.costoTotal, 0.07);
    });

    test('GET /api/ia/uso retorna el historial paginado de consumos', async () => {
      await costosService.registrarConsumo({
        tipoOperacion: 'pregunta',
        uso: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
      });
      await costosService.registrarConsumo({
        tipoOperacion: 'resumen',
        uso: { prompt_tokens: 40, completion_tokens: 60, total_tokens: 100 }
      });

      const res = await request(app)
        .get('/api/ia/uso?limite=10&offset=0')
        .expect(200);

      assert.equal(res.body.total, 2);
      assert.equal(res.body.registros.length, 2);
      assert.ok(res.body.registros[0].costoTotal > 0);
    });

    test('GET /api/ia/uso/hoy acumula correctamente las solicitudes del día', async () => {
      await costosService.registrarConsumo({
        tipoOperacion: 'pregunta',
        uso: { prompt_tokens: 1000, completion_tokens: 2000, total_tokens: 3000 }
      });
      await costosService.registrarConsumo({
        tipoOperacion: 'resumen',
        uso: { prompt_tokens: 2000, completion_tokens: 3000, total_tokens: 5000 }
      });

      const res = await request(app)
        .get('/api/ia/uso/hoy')
        .expect(200);

      assert.equal(res.body.totalSolicitudes, 2);
      assert.equal(res.body.totalTokensEntrada, 3000);
      assert.equal(res.body.totalTokensSalida, 5000);
      assert.equal(res.body.totalTokens, 8000);
      assert.ok(res.body.gastoTotalEstimado > 0);
      assert.ok(res.body.fecha);
      assert.ok(res.body.zonaHoraria);
    });

    test('Separación entre fechas: registros de días anteriores no se suman a hoy', async () => {
      // Registro de hoy
      await costosService.registrarConsumo({
        tipoOperacion: 'pregunta',
        uso: { prompt_tokens: 100, completion_tokens: 100, total_tokens: 200 }
      });

      // Registro simulado de hace 3 días creado directamente con fecha pasada
      const fechaPasada = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      await prisma.aIUsage.create({
        data: {
          requestId: 'req_pasado',
          tipoOperacion: 'pregunta',
          modelo: 'deepseek-flash',
          tokensEntrada: 50000,
          tokensSalida: 50000,
          totalTokens: 100000,
          costoEntrada: 0.007,
          costoSalida: 0.014,
          costoTotal: 0.021,
          createdAt: fechaPasada
        }
      });

      const resHoy = await request(app)
        .get('/api/ia/uso/hoy')
        .expect(200);

      // Solo debe acumular el registro de hoy (1 solicitud, 200 tokens)
      assert.equal(resHoy.body.totalSolicitudes, 1);
      assert.equal(resHoy.body.totalTokens, 200);

      // El historial completo sí debe listar ambos (2 solicitudes)
      const resHistorial = await request(app)
        .get('/api/ia/uso')
        .expect(200);
      assert.equal(resHistorial.body.total, 2);
    });

    test('GET /api/ia/uso/resumen provee métricas globales y desglose por operación', async () => {
      await costosService.registrarConsumo({
        tipoOperacion: 'pregunta',
        uso: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
      });
      await costosService.registrarConsumo({
        tipoOperacion: 'resumen',
        uso: { prompt_tokens: 30, completion_tokens: 40, total_tokens: 70 }
      });

      const res = await request(app)
        .get('/api/ia/uso/resumen')
        .expect(200);

      assert.equal(res.body.totalSolicitudes, 2);
      assert.equal(res.body.totalTokens, 100);
      assert.equal(res.body.desglosePorOperacion.pregunta.solicitudes, 1);
      assert.equal(res.body.desglosePorOperacion.resumen.solicitudes, 1);
      assert.ok(res.body.primeraSolicitud);
      assert.ok(res.body.ultimaSolicitud);
    });
  });

  /* =========================================================================
   * 4.5 PRUEBAS DE INTEGRACIÓN GLOBAL Y SWAGGER
   * ========================================================================= */
  describe('4.5 Integración de Rutas, Middleware de Errores y Swagger', () => {
    test('El middleware de errores captura rutas inexistentes (404 uniforme)', async () => {
      const res = await request(app)
        .get('/ruta-que-no-existe-en-el-servidor')
        .expect(404);

      assert.ok(res.body.error);
    });

    test('Swagger publica los esquemas de Notas y de Costos de IA', async () => {
      const res = await request(app)
        .get('/api-docs.json')
        .expect(200);

      assert.equal(res.body.openapi, '3.0.0');
      assert.ok(res.body.paths['/api/notas']);
      assert.ok(res.body.paths['/api/ia/preguntar']);
      assert.ok(res.body.paths['/api/ia/uso']);
      assert.ok(res.body.paths['/api/ia/uso/hoy']);
      assert.ok(res.body.paths['/api/ia/uso/resumen']);
      assert.ok(res.body.components.schemas.Nota);
      assert.ok(res.body.components.schemas.AIUsageRecord);
      assert.ok(res.body.components.schemas.ResumenDiario);
      assert.ok(res.body.components.schemas.ResumenGeneral);
    });
  });
});
