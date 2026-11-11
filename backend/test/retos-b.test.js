const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { randomUUID } = require('node:crypto');
const nativeFetch = global.fetch;
const uso = { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14 };
let app;
let server;
let base;
let messages = [];
let registros = [];
let modo = 'normal';
let liberar;
let registrarOriginal;
const encoder = new TextEncoder();
const sse = value => encoder.encode(`data: ${JSON.stringify(value)}\n\n`);

before(async () => {
  process.env.DEEPSEEK_API_KEY = 'clave-ficticia-retos-b';
  process.env.DEEPSEEK_MODEL = 'deepseek-flash';
  const costos = require('../src/services/costos.service');
  registrarOriginal = costos.registrarConsumo;
  costos.registrarConsumo = async value => registros.push(value);
  global.fetch = async (url, options) => {
    assert.equal(new URL(url).origin, 'https://api.deepseek.com');
    const body = JSON.parse(options.body);
    messages.push(body);
    if (modo === 'fallo') return new Response(JSON.stringify({ error: { message: 'privado' } }), {
      status: 401, headers: { 'content-type': 'application/json' }
    });
    if (!body.stream) return new Response(JSON.stringify({
      choices: [{ message: { content: 'Hola Ana' } }], usage: uso
    }), { headers: { 'content-type': 'application/json' } });
    assert.deepEqual(body.stream_options, { include_usage: true });
    const actual = modo;
    return new Response(new ReadableStream({
      async start(controller) {
        controller.enqueue(sse({ choices: [{ delta: { content: 'Hola ' } }] }));
        if (actual === 'progresivo') await new Promise(resolve => { liberar = resolve; });
        if (actual === 'roto') {
          controller.error(new Error('detalle privado del transporte'));
          return;
        }
        controller.enqueue(sse({ choices: [{ delta: { content: 'Ana' } }] }));
        if (actual !== 'sinUso') controller.enqueue(sse({ choices: [], usage: uso }));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    }), { headers: { 'content-type': 'text/event-stream' } });
  };
  app = require('../src/app');
  server = await new Promise(resolve => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  liberar?.();
  global.fetch = nativeFetch;
  require('../src/services/costos.service').registrarConsumo = registrarOriginal;
  await new Promise(resolve => server.close(resolve));
  await require('../src/config/prisma').$disconnect();
});

test('conversación conserva roles, usa el historial y aísla conversaciones', async () => {
  const primero = await request(app).post('/api/ia/conversar').send({ pregunta: 'Me llamo Ana' }).expect(200);
  const id = primero.body.conversacionId;
  assert.match(id, /^[a-f0-9-]{36}$/);
  await request(app).post('/api/ia/conversar').send({ pregunta: '¿Cómo me llamo?', conversacionId: id }).expect(200);
  assert.deepEqual(messages.at(-1).messages.slice(1), [
    { role: 'user', content: 'Me llamo Ana' },
    { role: 'assistant', content: 'Hola Ana' },
    { role: 'user', content: '¿Cómo me llamo?' }
  ]);
  const otra = await request(app).post('/api/ia/conversar').send({ pregunta: 'Otro usuario' }).expect(200);
  assert.notEqual(otra.body.conversacionId, id);
  assert.equal(messages.at(-1).messages.length, 2);
  assert.deepEqual(otra.body.uso, uso);
});

test('validación y conversación inexistente no llaman al proveedor', async () => {
  const cantidad = messages.length;
  for (const body of [{ pregunta: ' ' }, { pregunta: 'válida', conversacionId: 'incorrecto' }]) {
    await request(app).post('/api/ia/conversar').send(body).expect(400);
  }
  await request(app).post('/api/ia/conversar').send({ pregunta: 'válida', conversacionId: randomUUID() }).expect(404);
  await request(app).post('/api/ia/preguntar/stream').send({ pregunta: 'a' }).expect(400);
  assert.equal(messages.length, cantidad);
});

test('historial limitado a diez turnos y caducidad tras treinta minutos', async () => {
  const primero = await request(app).post('/api/ia/conversar').send({ pregunta: 'Turno inicial' });
  const id = primero.body.conversacionId;
  for (let i = 0; i < 11; i++) {
    await request(app).post('/api/ia/conversar').send({ pregunta: `Turno ${i}`, conversacionId: id }).expect(200);
  }
  assert.equal(messages.at(-1).messages.length, 22); // sistema + 20 previos + pregunta
  assert.equal(messages.at(-1).messages[1].content, 'Turno 0');
  const reloj = Date.now;
  Date.now = () => reloj() + 31 * 60 * 1000;
  try {
    await request(app).post('/api/ia/conversar').send({ pregunta: 'Otra pregunta', conversacionId: id }).expect(404);
  } finally { Date.now = reloj; }
});

test('turno fallido no se añade al historial y conserva la política de errores', async () => {
  const primero = await request(app).post('/api/ia/conversar').send({ pregunta: 'Me llamo Ana' });
  modo = 'fallo';
  try {
    const error = await request(app).post('/api/ia/conversar').send({ pregunta: 'Turno fallido', conversacionId: primero.body.conversacionId }).expect(502);
    assert.deepEqual(error.body, { error: 'IA_NO_DISPONIBLE' });
  } finally { modo = 'normal'; }
  await request(app).post('/api/ia/conversar').send({ pregunta: 'Continuar conversación', conversacionId: primero.body.conversacionId }).expect(200);
  assert.ok(!messages.at(-1).messages.some(m => m.content === 'Turno fallido'));
});

test('turnos simultáneos de una conversación se rechazan sin mezclar historial', async () => {
  const primero = await request(app).post('/api/ia/conversar').send({ pregunta: 'Hola otra vez' });
  const service = require('../src/services/conversacion.service');
  const deepseek = require('../src/services/deepseek.service');
  const original = deepseek.preguntar;
  let completar;
  deepseek.preguntar = () => new Promise(resolve => { completar = resolve; });
  try {
    const pendiente = service.conversar('Turno en curso', primero.body.conversacionId);
    await assert.rejects(service.conversar('Turno concurrente', primero.body.conversacionId),
      error => error.statusCode === 409);
    completar({ respuesta: 'Listo', uso });
    await pendiente;
  } finally { deepseek.preguntar = original; }
});

test('streaming entrega el primer fragmento antes de terminar y registra consumo una vez', async () => {
  modo = 'progresivo';
  const antes = registros.length;
  const controller = new AbortController();
  const limite = setTimeout(() => { liberar?.(); controller.abort(); }, 3000);
  try {
    const res = await nativeFetch(base + '/api/ia/preguntar/stream', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pregunta: 'Saluda a Ana' }), signal: controller.signal
    });
    assert.match(res.headers.get('content-type'), /text\/event-stream/);
    const reader = res.body.getReader();
    const primer = new TextDecoder().decode((await reader.read()).value);
    assert.match(primer, /event: texto/);
    assert.match(primer, /Hola /);
    assert.ok(!primer.includes('event: fin'));
    liberar();
    let resto = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      resto += new TextDecoder().decode(value);
    }
    assert.match(resto, /Ana/);
    assert.match(resto, /event: fin/);
    assert.equal(registros.length, antes + 1);
    assert.deepEqual(registros.at(-1).uso, uso);
  } finally { clearTimeout(limite); modo = 'normal'; liberar?.(); }
});

test('fallos de streaming antes y después de comenzar no exponen mensajes privados', async () => {
  modo = 'fallo';
  const antes = registros.length;
  try {
    await request(app).post('/api/ia/preguntar/stream').send({ pregunta: 'Una pregunta' }).expect(502);
    for (const valor of ['sinUso', 'roto']) {
      modo = valor;
      const res = await request(app).post('/api/ia/preguntar/stream').send({ pregunta: 'Una pregunta' });
      assert.ok(!res.text.includes('privado'));
      if (res.status === 200) assert.match(res.text, /event: error\ndata: \{"error":"IA_NO_DISPONIBLE"\}/);
      else assert.equal(res.status, 502);
    }
    assert.equal(registros.length, antes);
  } finally { modo = 'normal'; }
});

test('rate limit compartido bloquea todas las llamadas de IA sin afectar CRUD', async () => {
  let bloqueada;
  for (let i = 0; i <= 60; i++) {
    const res = await request(app).post('/api/ia/preguntar').send({ pregunta: '' });
    if (res.status === 429) { bloqueada = res; break; }
    assert.equal(res.status, 400);
  }
  assert.ok(bloqueada);
  assert.deepEqual(bloqueada.body, { error: 'LIMITE_IA_EXCEDIDO' });
  assert.ok(bloqueada.headers['retry-after']);
  const cantidad = messages.length;
  for (const path of ['/api/ia/preguntar', '/api/ia/conversar', '/api/ia/preguntar/stream', '/api/notas/1/resumen']) {
    await request(app).post(path).send({ pregunta: 'Pregunta válida' }).expect(429);
  }
  assert.equal(messages.length, cantidad);
  await request(app).get('/api/notas').expect(200);
});

test('Swagger publica los dos nuevos contratos', () => {
  const { swaggerSpec } = require('../src/config/swagger');
  assert.ok(swaggerSpec.paths['/api/ia/conversar'].post);
  assert.ok(swaggerSpec.paths['/api/ia/preguntar/stream'].post.responses[200].content['text/event-stream']);
});
