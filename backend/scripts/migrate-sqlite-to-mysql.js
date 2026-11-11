/**
 * Script de migración de datos de SQLite a MySQL
 * Lee los registros respaldados de SQLite (Note y AIUsage) y los inserta de forma
 * segura e idempotente en la base de datos MySQL (Notas_lab), preservando identificadores,
 * marcas de tiempo y campos de consumo de IA.
 */
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');
const prisma = require('../src/config/prisma');

async function migrarDatos() {
  console.log('=== INICIO DE MIGRACIÓN DE DATOS SQLITE -> MYSQL ===\n');

  // Determinar la ruta de la base de datos SQLite respaldada
  const sqlitePaths = [
    path.join(__dirname, '../prisma/legacy-sqlite/dev.db'),
    path.join(__dirname, '../prisma/dev.db')
  ];

  let sqlitePath = sqlitePaths.find(p => fs.existsSync(p));

  if (!sqlitePath) {
    console.warn('[AVISO] No se encontró ninguna base de datos SQLite para migrar.');
    return {
      notas: { encontradas: 0, migradas: 0, omitidas: 0 },
      iaUsage: { encontradas: 0, migradas: 0, omitidas: 0 }
    };
  }

  console.log(`Leyendo datos SQLite desde: ${sqlitePath}`);
  const sqliteDb = new DatabaseSync(sqlitePath);

  // 1. MIGRACIÓN DE NOTAS
  let notasEncontradas = [];
  try {
    notasEncontradas = sqliteDb.prepare('SELECT * FROM Note ORDER BY id ASC').all();
  } catch (err) {
    console.warn('[AVISO] La tabla Note no existe o está vacía en SQLite:', err.message);
  }

  console.log(`\nRegistros de 'Note' encontrados en SQLite: ${notasEncontradas.length}`);

  let notasMigradas = 0;
  let notasOmitidas = 0;

  for (const n of notasEncontradas) {
    const existe = await prisma.note.findUnique({ where: { id: n.id } });
    if (existe) {
      notasOmitidas++;
    } else {
      await prisma.note.create({
        data: {
          id: n.id,
          titulo: n.titulo,
          contenido: n.contenido,
          createdAt: new Date(n.createdAt),
          updatedAt: new Date(n.updatedAt)
        }
      });
      notasMigradas++;
    }
  }

  console.log(`-> Notas insertadas en MySQL: ${notasMigradas}`);
  console.log(`-> Notas omitidas (ya existían): ${notasOmitidas}`);

  // 2. MIGRACIÓN DE AIUSAGE
  let aiUsageEncontradas = [];
  try {
    aiUsageEncontradas = sqliteDb.prepare('SELECT * FROM AIUsage ORDER BY id ASC').all();
  } catch (err) {
    console.warn('[AVISO] La tabla AIUsage no existe o está vacía en SQLite:', err.message);
  }

  console.log(`\nRegistros de 'AIUsage' encontrados en SQLite: ${aiUsageEncontradas.length}`);

  let aiUsageMigradas = 0;
  let aiUsageOmitidas = 0;

  for (const u of aiUsageEncontradas) {
    const existe = await prisma.aIUsage.findUnique({ where: { id: u.id } });
    if (existe) {
      aiUsageOmitidas++;
    } else {
      await prisma.aIUsage.create({
        data: {
          id: u.id,
          requestId: u.requestId,
          tipoOperacion: u.tipoOperacion,
          modelo: u.modelo,
          tokensEntrada: u.tokensEntrada,
          tokensSalida: u.tokensSalida,
          totalTokens: u.totalTokens,
          costoEntrada: u.costoEntrada,
          costoSalida: u.costoSalida,
          costoTotal: u.costoTotal,
          createdAt: new Date(u.createdAt)
        }
      });
      aiUsageMigradas++;
    }
  }

  console.log(`-> Registros de AIUsage insertados en MySQL: ${aiUsageMigradas}`);
  console.log(`-> Registros de AIUsage omitidos (ya existían): ${aiUsageOmitidas}`);

  // 3. VERIFICACIÓN EN MYSQL
  const totalNotasMysql = await prisma.note.count();
  const totalAIUsageMysql = await prisma.aIUsage.count();

  console.log('\n--- VERIFICACIÓN DE TOTALES EN MYSQL (Notas_lab) ---');
  console.log(`Total registros en tabla 'Note': ${totalNotasMysql}`);
  console.log(`Total registros en tabla 'AIUsage': ${totalAIUsageMysql}`);
  console.log('====================================================\n');

  sqliteDb.close();

  return {
    notas: {
      encontradas: notasEncontradas.length,
      migradas: notasMigradas,
      omitidas: notasOmitidas,
      totalMysql: totalNotasMysql
    },
    iaUsage: {
      encontradas: aiUsageEncontradas.length,
      migradas: aiUsageMigradas,
      omitidas: aiUsageOmitidas,
      totalMysql: totalAIUsageMysql
    }
  };
}

if (require.main === module) {
  migrarDatos()
    .then(() => {
      console.log('Migración de datos completada exitosamente.');
      return prisma.$disconnect();
    })
    .catch((err) => {
      console.error('Error durante la migración de datos:', err);
      prisma.$disconnect().then(() => process.exit(1));
    });
}

module.exports = { migrarDatos };

