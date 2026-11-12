require('dotenv').config();
const OpenAI = require('openai');

/**
 * Script de prueba de integración REAL con el proveedor DeepSeek.
 * Realiza una llamada mínima auténtica sin simulación para verificar credenciales y cuota.
 * NUNCA imprime la API Key en pantalla ni en registros.
 */
async function testDeepSeekLive() {
  console.log('====================================================');
  console.log('🧪 PRUEBA DE INTEGRACIÓN REAL CON DEEPSEEK');
  console.log('====================================================');

  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  const model = process.env.DEEPSEEK_MODEL?.trim();
  const baseURL = 'https://api.deepseek.com';

  console.log(`📡 URL Base configurada: ${baseURL}`);
  console.log(`🤖 Modelo configurado:   ${model || '(No configurado)'}`);
  console.log(`🔑 Clave API:            ${apiKey ? `Presente (${apiKey.length} caracteres, oculta)` : 'NO ENCONTRADA'}`);
  console.log('----------------------------------------------------');

  // 1. Verificación de configuración
  if (!apiKey || !model) {
    console.error('❌ RESULTADO: CONFIGURACIÓN INCOMPLETA');
    console.error('   Faltan variables en backend/.env:');
    if (!apiKey) console.error('   - DEEPSEEK_API_KEY no está definida o está vacía.');
    if (!model) console.error('   - DEEPSEEK_MODEL no está definida o está vacía (ej. deepseek-chat).');
    process.exit(1);
  }

  // 2. Instanciación del cliente OpenAI compatible con DeepSeek
  const client = new OpenAI({
    baseURL,
    apiKey,
    timeout: 20000,
    maxRetries: 0 // Una única solicitud directa
  });

  console.log('⏳ Enviando solicitud de prueba mínima a DeepSeek (max_tokens: 60)...');
  const startTime = Date.now();

  try {
    const response = await client.chat.completions.create({
      model,
      max_tokens: 60,
      stream: false,
      messages: [
        { role: 'system', content: 'Eres un evaluador de conectividad.' },
        { role: 'user', content: 'Responde únicamente con la palabra: CONECTADO' }
      ]
    });

    const elapsed = Date.now() - startTime;
    const content = response?.choices?.[0]?.message?.content?.trim();
    const usage = response?.usage;

    if (!content || !usage) {
      console.error('❌ RESULTADO: RESPUESTA INVÁLIDA DEL PROVEEDOR');
      console.error('   El proveedor respondió pero la estructura no incluye contenido o uso de tokens.');
      process.exit(1);
    }

    console.log('----------------------------------------------------');
    console.log('✅ RESULTADO: CONEXIÓN REAL EXITOSA');
    console.log(`⏱️  Tiempo de respuesta:  ${elapsed} ms`);
    console.log(`💬 Respuesta recibida:   "${content}"`);
    console.log(`📊 Tokens de entrada:    ${usage.prompt_tokens}`);
    console.log(`📊 Tokens de salida:     ${usage.completion_tokens}`);
    console.log(`📊 Tokens totales:       ${usage.total_tokens}`);
    console.log('====================================================');
    process.exit(0);
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.log('----------------------------------------------------');

    if (error instanceof OpenAI.AuthenticationError || error.status === 401) {
      console.error('❌ RESULTADO: API KEY INVÁLIDA');
      console.error(`   Detalle: Error 401 - Las credenciales enviadas fueron rechazadas por DeepSeek.`);
      console.error(`   Mensaje del proveedor: ${error.message}`);
    } else if (
      error.status === 402 ||
      (error.message && (
        error.message.toLowerCase().includes('insufficient balance') ||
        error.message.toLowerCase().includes('quota') ||
        error.message.toLowerCase().includes('credit')
      ))
    ) {
      console.error('❌ RESULTADO: CRÉDITOS O CUOTA INSUFICIENTES');
      console.error(`   Detalle: La cuenta de DeepSeek no tiene saldo disponible o la cuota fue excedida.`);
      console.error(`   Mensaje del proveedor: ${error.message}`);
    } else if (
      error.status === 404 ||
      (error.message && (
        error.message.toLowerCase().includes('model') ||
        error.message.toLowerCase().includes('not found')
      ))
    ) {
      console.error('❌ RESULTADO: MODELO NO DISPONIBLE');
      console.error(`   Detalle: El modelo '${model}' no es reconocido o no está disponible en la cuenta.`);
      console.error(`   Mensaje del proveedor: ${error.message}`);
      console.error(`   Sugerencia: Para DeepSeek API, el modelo estándar suele ser 'deepseek-chat' o 'deepseek-reasoner'.`);
    } else if (error instanceof OpenAI.RateLimitError || error.status === 429) {
      console.error('❌ RESULTADO: LÍMITE DE SOLICITUDES');
      console.error(`   Detalle: Se alcanzó el límite de peticiones por minuto (HTTP 429).`);
      console.error(`   Mensaje del proveedor: ${error.message}`);
    } else if (error instanceof OpenAI.APIConnectionTimeoutError) {
      console.error('❌ RESULTADO: TIMEOUT');
      console.error(`   Detalle: La solicitud superó el tiempo máximo de espera tras ${elapsed} ms.`);
    } else if (error instanceof OpenAI.APIConnectionError) {
      console.error('❌ RESULTADO: ERROR DE RED');
      console.error(`   Detalle: No se pudo establecer conexión con ${baseURL}.`);
      console.error(`   Mensaje: ${error.message}`);
    } else {
      console.error('❌ RESULTADO: RESPUESTA INVÁLIDA DEL PROVEEDOR');
      console.error(`   Detalle: Fallo inesperado [HTTP ${error.status || 'N/A'}]`);
      console.error(`   Mensaje: ${error.message}`);
    }

    console.log('====================================================');
    process.exit(1);
  }
}

testDeepSeekLive();
