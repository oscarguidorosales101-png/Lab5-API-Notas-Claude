const OpenAI = require('openai');

// Error propio para configuración o respuestas inválidas; nunca contiene datos del proveedor.
class IAError extends Error {
  constructor() {
    super('IA_NO_DISPONIBLE');
  }
}

let client;

function obtenerCliente() {
  if (!process.env.DEEPSEEK_API_KEY?.trim() || !process.env.DEEPSEEK_MODEL?.trim()) {
    throw new IAError();
  }
  client ??= new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API_KEY,
    timeout: 30000,
    maxRetries: 0 // Una llamada por petición; evita consumo duplicado automático.
  });
  return client;
}

const sistemaDefault = 'Eres un asistente útil. Responde en español.';

async function preguntar(texto, system = sistemaDefault, historial = []) {
  const result = await obtenerCliente().chat.completions.create({
    model: process.env.DEEPSEEK_MODEL,
    max_tokens: 1024,
    thinking: { type: 'disabled' },
    stream: false,
    messages: [
      { role: 'system', content: system },
      ...historial,
      { role: 'user', content: texto }
    ]
  });

  const respuesta = result?.choices?.[0]?.message?.content;
  const uso = result?.usage;
  if (typeof respuesta !== 'string' || !respuesta.trim() ||
      !uso || !['prompt_tokens', 'completion_tokens', 'total_tokens'].every(
        (field) => Number.isInteger(uso[field]) && uso[field] >= 0
      )) {
    throw new IAError();
  }
  return { respuesta, uso };
}

async function* preguntarStream(texto, signal) {
  let stream;
  try {
    stream = await obtenerCliente().chat.completions.create({
      model: process.env.DEEPSEEK_MODEL,
      max_tokens: 1024,
      thinking: { type: 'disabled' },
      stream: true,
      stream_options: { include_usage: true },
      messages: [
        { role: 'system', content: sistemaDefault },
        { role: 'user', content: texto }
      ]
    }, { signal });
    let respuesta = '';
    let uso;
    for await (const chunk of stream) {
      const texto = chunk.choices?.[0]?.delta?.content;
      if (typeof texto === 'string' && texto) {
        respuesta += texto;
        yield { texto };
      }
      if (chunk.usage) uso = chunk.usage;
    }
    if (!respuesta.trim() || !uso ||
        !['prompt_tokens', 'completion_tokens', 'total_tokens'].every(
          field => Number.isInteger(uso[field]) && uso[field] >= 0
        )) throw new IAError();
    yield { uso };
  } catch (error) {
    if (error instanceof OpenAI.APIError) throw error;
    throw new IAError();
  } finally {
    stream?.controller.abort();
  }
}

module.exports = { preguntar, preguntarStream, IAError };
