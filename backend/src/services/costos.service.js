/**
 * Servicio de seguimiento de consumo y estimación de costos de IA.
 * Persiste los registros en SQLite con Prisma y ofrece estadísticas agregadas.
 */

const prisma = require('../config/prisma');

/**
 * Calcula los límites (inicio y fin) del día actual en la zona horaria especificada.
 * @param {string} timezone - Zona horaria IANA (ej. 'America/Costa_Rica', 'UTC')
 * @returns {{ startOfDay: Date, endOfDay: Date, dateStr: string }}
 */
const getTodayBounds = (timezone = process.env.TIMEZONE || 'America/Costa_Rica') => {
  const now = new Date();
  let dateStr;
  try {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    dateStr = fmt.format(now);
  } catch {
    // Si la zona horaria no es válida, fallback a UTC
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    dateStr = fmt.format(now);
    timezone = 'UTC';
  }

  // Calcular el desfase horario en milisegundos para esa zona horaria
  const nowInTz = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  const nowInUtc = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  const offsetMs = nowInTz.getTime() - nowInUtc.getTime();

  const startOfDay = new Date(new Date(`${dateStr}T00:00:00Z`).getTime() - offsetMs);
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

  return { startOfDay, endOfDay, dateStr, timezone };
};

/**
 * Registra el consumo de una solicitud exitosa a la IA.
 * @param {Object} params
 * @param {string} [params.requestId] - Identificador único de la petición
 * @param {'pregunta'|'resumen'} params.tipoOperacion - Tipo de operación realizada
 * @param {string} [params.modelo] - Modelo de IA utilizado
 * @param {Object} params.uso - Objeto usage devuelto por el proveedor con prompt_tokens y completion_tokens
 * @returns {Promise<Object|null>} Registro almacenado en la base de datos o null si no hay datos válidos
 */
const registrarConsumo = async ({
  requestId = null,
  tipoOperacion,
  modelo = process.env.DEEPSEEK_MODEL || 'deepseek-flash',
  uso
}) => {
  if (!uso || typeof uso !== 'object') {
    return null;
  }

  const tokensEntrada = Number(uso.prompt_tokens);
  const tokensSalida = Number(uso.completion_tokens);
  const totalTokens = Number(uso.total_tokens) || (tokensEntrada + tokensSalida);

  // Si el proveedor no devuelve números enteros válidos, no calcular costo ficticio
  if (!Number.isInteger(tokensEntrada) || !Number.isInteger(tokensSalida) || tokensEntrada < 0 || tokensSalida < 0) {
    return null;
  }

  const precioEntrada = parseFloat(process.env.AI_PRICE_PER_MILLION_INPUT_TOKENS || '0.14');
  const precioSalida = parseFloat(process.env.AI_PRICE_PER_MILLION_OUTPUT_TOKENS || '0.28');

  // Fórmulas especificadas:
  // (tokens / 1_000_000) * precio_por_millon
  const costoEntrada = (tokensEntrada / 1000000) * precioEntrada;
  const costoSalida = (tokensSalida / 1000000) * precioSalida;
  const costoTotal = costoEntrada + costoSalida;

  const generadoId = requestId || `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  return await prisma.aIUsage.create({
    data: {
      requestId: generadoId,
      tipoOperacion,
      modelo,
      tokensEntrada,
      tokensSalida,
      totalTokens,
      costoEntrada: Number(costoEntrada.toFixed(8)),
      costoSalida: Number(costoSalida.toFixed(8)),
      costoTotal: Number(costoTotal.toFixed(8))
    }
  });
};

/**
 * Obtiene el historial de consumos registrados con paginación opcional.
 * @param {Object} [opciones]
 * @param {number} [opciones.limite=50] - Cantidad de registros a retornar
 * @param {number} [opciones.offset=0] - Cantidad de registros a omitir
 */
const obtenerHistorial = async ({ limite = 50, offset = 0 } = {}) => {
  const take = Math.min(Math.max(1, Number(limite) || 50), 100);
  const skip = Math.max(0, Number(offset) || 0);

  const [total, registros] = await Promise.all([
    prisma.aIUsage.count(),
    prisma.aIUsage.findMany({
      take,
      skip,
      orderBy: { createdAt: 'desc' }
    })
  ]);

  return {
    total,
    limite: take,
    offset: skip,
    registros
  };
};

/**
 * Calcula el resumen de consumo acumulado del día en la zona horaria configurada.
 * @param {Object} [opciones]
 * @param {string} [opciones.timezone] - Zona horaria a consultar (default: process.env.TIMEZONE)
 */
const obtenerResumenHoy = async ({ timezone = process.env.TIMEZONE || 'America/Costa_Rica' } = {}) => {
  const { startOfDay, endOfDay, dateStr, timezone: tzFinal } = getTodayBounds(timezone);

  const registros = await prisma.aIUsage.findMany({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const totalSolicitudes = registros.length;
  let totalTokensEntrada = 0;
  let totalTokensSalida = 0;
  let totalTokens = 0;
  let costoAcumuladoEntrada = 0;
  let costoAcumuladoSalida = 0;
  let gastoTotalEstimado = 0;

  for (const reg of registros) {
    totalTokensEntrada += reg.tokensEntrada;
    totalTokensSalida += reg.tokensSalida;
    totalTokens += reg.totalTokens;
    costoAcumuladoEntrada += reg.costoEntrada;
    costoAcumuladoSalida += reg.costoSalida;
    gastoTotalEstimado += reg.costoTotal;
  }

  return {
    fecha: dateStr,
    zonaHoraria: tzFinal,
    totalSolicitudes,
    totalTokensEntrada,
    totalTokensSalida,
    totalTokens,
    costoAcumuladoEntrada: Number(costoAcumuladoEntrada.toFixed(6)),
    costoAcumuladoSalida: Number(costoAcumuladoSalida.toFixed(6)),
    gastoTotalEstimado: Number(gastoTotalEstimado.toFixed(6)),
    solicitudes: registros
  };
};

/**
 * Genera estadísticas globales del consumo de IA histórico.
 */
const obtenerResumenGeneral = async () => {
  const registros = await prisma.aIUsage.findMany({
    orderBy: { createdAt: 'asc' }
  });

  const totalSolicitudes = registros.length;
  let totalTokensEntrada = 0;
  let totalTokensSalida = 0;
  let totalTokens = 0;
  let costoTotalEstimado = 0;

  const desglosePorOperacion = {
    pregunta: {
      solicitudes: 0,
      tokensEntrada: 0,
      tokensSalida: 0,
      totalTokens: 0,
      costoTotal: 0
    },
    resumen: {
      solicitudes: 0,
      tokensEntrada: 0,
      tokensSalida: 0,
      totalTokens: 0,
      costoTotal: 0
    }
  };

  for (const reg of registros) {
    totalTokensEntrada += reg.tokensEntrada;
    totalTokensSalida += reg.tokensSalida;
    totalTokens += reg.totalTokens;
    costoTotalEstimado += reg.costoTotal;

    const op = reg.tipoOperacion === 'resumen' ? 'resumen' : 'pregunta';
    if (desglosePorOperacion[op]) {
      desglosePorOperacion[op].solicitudes += 1;
      desglosePorOperacion[op].tokensEntrada += reg.tokensEntrada;
      desglosePorOperacion[op].tokensSalida += reg.tokensSalida;
      desglosePorOperacion[op].totalTokens += reg.totalTokens;
      desglosePorOperacion[op].costoTotal += reg.costoTotal;
    }
  }

  desglosePorOperacion.pregunta.costoTotal = Number(desglosePorOperacion.pregunta.costoTotal.toFixed(6));
  desglosePorOperacion.resumen.costoTotal = Number(desglosePorOperacion.resumen.costoTotal.toFixed(6));

  return {
    totalSolicitudes,
    totalTokensEntrada,
    totalTokensSalida,
    totalTokens,
    costoTotalEstimado: Number(costoTotalEstimado.toFixed(6)),
    desglosePorOperacion,
    primeraSolicitud: registros.length > 0 ? registros[0].createdAt : null,
    ultimaSolicitud: registros.length > 0 ? registros[registros.length - 1].createdAt : null
  };
};

module.exports = {
  registrarConsumo,
  obtenerHistorial,
  obtenerResumenHoy,
  obtenerResumenGeneral,
  getTodayBounds
};

