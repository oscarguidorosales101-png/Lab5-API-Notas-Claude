const OpenAI = require('openai');

// Error propio para configuración o respuestas inválidas; nunca contiene datos del proveedor.
class IAError extends Error {
  constructor() {
    super('IA_NO_DISPONIBLE');
  }
}

let client;

async function preguntar(texto, system = 'Eres un asistente útil. Responde en español.') {
  if (!process.env.DEEPSEEK_API_KEY?.trim() || !process.env.DEEPSEEK_MODEL?.trim()) {
    throw new IAError();
  }
  client ??= new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API_KEY,
    timeout: 30000,
    maxRetries: 0 // Una llamada por petición; evita consumo duplicado automático.
  });

  const result = await client.chat.completions.create({
    model: process.env.DEEPSEEK_MODEL,
    max_tokens: 1024,
    thinking: { type: 'disabled' },
    stream: false,
    messages: [
      { role: 'system', content: system },
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

module.exports = { preguntar, IAError };
