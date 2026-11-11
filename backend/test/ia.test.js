const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const OpenAI = require('openai');
const nativeFetch = global.fetch;
let server;
let base;
let calls = [];
let providerStatus = 200;
let payload;
let timeout = false;
const usage = { prompt_tokens: 12, completion_tokens: 8, total_tokens: 20 };
const success = () => ({ choices: [{ message: { content: 'Texto simulado' } }], usage });

before(async () => {
  process.env.DEEPSEEK_API_KEY = 'clave-ficticia-pruebas';
  process.env.DEEPSEEK_MODEL = 'deepseek-flash';
  global.fetch = async (url, options) => {
    assert.equal(new URL(url).origin, 'https://api.deepseek.com');
    calls.push(JSON.parse(options.body));
    if (timeout) throw new OpenAI.APIConnectionTimeoutError();
    return new Response(JSON.stringify(payload), {
      status: providerStatus, headers: { 'content-type': 'application/json' }
    });
  };
  const app = require('../src/app');
  server = await new Promise(resolve => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  global.fetch = nativeFetch;
  await new Promise(resolve => server.close(resolve));
});

async function request(path, body, method = 'POST') {
  return nativeFetch(base + path, {
    method, headers: { 'content-type': 'application/json' },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  });
}
function reset() {
  calls = [];
  providerStatus = 200;
  payload = success();
  timeout = false;
}

test('pregunta válida: SDK, mensajes, límites, texto y tokens del proveedor simulado', async () => {
  reset();
  const res = await request('/api/ia/preguntar', { pregunta: '  ¿Qué es REST?  ' });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { respuesta: 'Texto simulado', uso: usage });
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], {
    model: 'deepseek-flash', max_tokens: 1024, thinking: { type: 'disabled' }, stream: false,
    messages: [
      { role: 'system', content: 'Eres un asistente útil. Responde en español.' },
      { role: 'user', content: '¿Qué es REST?' }
    ]
  });
});

test('entradas inválidas: 400 sin llamar a DeepSeek', async () => {
  reset();
  for (const body of [{}, { pregunta: '' }, { pregunta: 'ab' }, { pregunta: '   ' },
    { pregunta: 'x'.repeat(2001) }, { pregunta: 123 }, { pregunta: null }]) {
    assert.equal((await request('/api/ia/preguntar', body)).status, 400);
  }
  assert.equal(calls.length, 0);
});

test('resumen: servicio real de A, contenido y prompt de tres viñetas', async () => {
  reset();
  const created = await request('/api/notas', { titulo: 'Prueba', contenido: 'Contenido a resumir' });
  assert.equal(created.status, 201);
  const nota = await created.json();
  const res = await request(`/api/notas/${nota.id}/resumen`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { notaId: nota.id, resumen: 'Texto simulado' });
  assert.deepEqual(calls[0].messages, [
    { role: 'system', content: 'Resume el texto en 3 viñetas breves, en español.' },
    { role: 'user', content: nota.contenido }
  ]);
});

test('nota inexistente e identificadores inválidos: sin llamadas al proveedor', async () => {
  reset();
  assert.equal((await request('/api/notas/99999/resumen')).status, 404);
  for (const id of ['0', '-1', 'abc', '1.5']) {
    assert.equal((await request(`/api/notas/${id}/resumen`)).status, 400);
  }
  assert.equal(calls.length, 0);
});

test('401, 429, 503 y otros errores: política pública y sin reintentos', async () => {
  for (const [upstream, expected] of [[401, 502], [429, 429], [503, 503], [400, 502], [500, 502]]) {
    reset();
    providerStatus = upstream;
    payload = { error: { message: 'detalle privado', type: 'provider_error' } };
    const res = await request('/api/ia/preguntar', { pregunta: 'Una pregunta' });
    assert.equal(res.status, expected);
    assert.deepEqual(await res.json(), { error: 'IA_NO_DISPONIBLE' });
    assert.equal(calls.length, 1);
  }
});

test('timeout simulado: 504 controlado', async () => {
  reset(); timeout = true;
  const res = await request('/api/ia/preguntar', { pregunta: 'Una pregunta' });
  assert.equal(res.status, 504);
  assert.deepEqual(await res.json(), { error: 'IA_NO_DISPONIBLE' });
  assert.equal(calls.length, 1);
});

test('respuesta vacía, estructura inesperada o uso ausente: 502', async () => {
  for (const value of [{}, { choices: [] }, { ...success(), choices: [{ message: { content: '  ' } }] },
    { ...success(), usage: null }, { ...success(), usage: { prompt_tokens: -1 } }]) {
    reset(); payload = value;
    const res = await request('/api/ia/preguntar', { pregunta: 'Una pregunta' });
    assert.equal(res.status, 502);
    assert.deepEqual(await res.json(), { error: 'IA_NO_DISPONIBLE' });
  }
});

test('configuración ausente no impide CRUD ni llama al proveedor', async () => {
  reset();
  const key = process.env.DEEPSEEK_API_KEY;
  delete process.env.DEEPSEEK_API_KEY;
  try {
    assert.equal((await request('/api/ia/preguntar', { pregunta: 'Una pregunta' })).status, 502);
    assert.equal((await request('/api/notas', undefined, 'GET')).status, 200);
    assert.equal(calls.length, 0);
  } finally { process.env.DEEPSEEK_API_KEY = key; }
});

test('regresión CRUD de A por HTTP: crear dos, listar, 404, body vacío, eliminar', async () => {
  const ids = [];
  for (let i = 0; i < 2; i++) {
    const res = await request('/api/notas', { titulo: `Nota ${i}`, contenido: 'Contenido' });
    assert.equal(res.status, 201); ids.push((await res.json()).id);
  }
  const listado = await request('/api/notas', undefined, 'GET');
  assert.equal(listado.status, 200);
  const notas = await listado.json();
  assert.ok(ids.every(id => notas.some(nota => nota.id === id)));
  assert.equal((await request('/api/notas/99999', undefined, 'GET')).status, 404);
  assert.equal((await request('/api/notas', {})).status, 400);
  assert.equal((await request(`/api/notas/${ids[1]}`, undefined, 'DELETE')).status, 204);
  assert.equal((await request(`/api/notas/${ids[1]}`, undefined, 'GET')).status, 404);
});

test('manejador conserva AppError, Zod, JSON inválido y error interno', async () => {
  const handler = require('../src/middlewares/errorHandler');
  const { BadRequestError } = require('../src/utils/errors');
  const { z } = require('zod');
  const validation = z.string().safeParse(1).error;
  for (const [err, expected] of [[new BadRequestError('Esperado'), 400], [validation, 400],
    [Object.assign(new SyntaxError(), { type: 'entity.parse.failed' }), 400], [new Error('prueba interna'), 500]]) {
    let status;
    const res = { status(code) { status = code; return this; }, json(body) { return body; } };
    const body = handler(err, {}, res, () => {});
    assert.equal(status, expected);
    if (expected === 500) assert.deepEqual(body, { error: 'Error interno del servidor' });
  }
  const res = await nativeFetch(base + '/api/ia/preguntar', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: '{'
  });
  assert.equal(res.status, 400);
});

test('OpenAPI publica ambos contratos y referencias resolubles', async () => {
  const res = await request('/api-docs.json', undefined, 'GET');
  assert.equal(res.status, 200);
  const spec = await res.json();
  for (const path of ['/api/ia/preguntar', '/api/notas/{id}/resumen']) {
    const operation = spec.paths[path].post;
    for (const code of [200, 400, 429, 502, 503, 504]) assert.ok(operation.responses[code]);
  }
  assert.ok(spec.paths['/api/notas/{id}/resumen'].post.responses[404]);
  function check(value) {
    if (!value || typeof value !== 'object') return;
    if (value.$ref) assert.ok(value.$ref.slice(2).split('/').reduce((obj, key) => obj?.[key], spec));
    Object.values(value).forEach(check);
  }
  check(spec);
  assert.equal((await request('/api-docs/', undefined, 'GET')).status, 200);
});
