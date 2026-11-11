# Laboratorio #5 — API de notas con Express, Swagger y DeepSeek

API REST profesional desarrollada con **Node.js** y **Express 5**, persistencia relacional con **Prisma ORM y SQLite**, documentada con **Swagger/OpenAPI 3**, con validación de esquemas mediante **Zod**, seguimiento analítico de consumo/costos de IA y pruebas automatizadas con **Supertest**.

El backend integra el trabajo del **Integrante A** (`feature/notas`: API de notas, persistencia SQLite con Prisma, sistema de costos de IA y suite Supertest) y del **Integrante B** (`feature/ia`: integración con IA). La guía original utiliza Claude; este proyecto adapta la integración a **DeepSeek**.

Nombres de los integrantes: pendientes de completar por el equipo. No se deducen de las cuentas de Git.

---

## 1. Objetivo del Laboratorio

Diseñar e implementar una API REST modular, persistente y documentada para gestionar notas en SQLite, responder preguntas y resumir notas mediante DeepSeek, calcular y auditar los costos de tokens consumidos, y garantizar la calidad del software mediante una suite de pruebas automatizadas aisladas. El cliente se comunica con Express; únicamente el backend accede al proveedor de IA, a la base de datos y a las credenciales privadas.

---

## 2. Tecnologías Utilizadas

- **Node.js**: Entorno de ejecución JavaScript (v20+ requerido, probado en v24+).
- **Express 5**: Framework web minimalista y robusto para Node.js.
- **CommonJS**: Sistema estándar de módulos (`require` / `module.exports`).
- **Prisma ORM (v6)**: Mapeador objeto-relacional para modelado, cliente tipado y migraciones.
- **SQLite**: Motor de base de datos relacional ligero, embebido y sin dependencias de servicios externos.
- **Zod**: Biblioteca de declaración y validación estricta de esquemas.
- **Swagger JSDoc & Swagger UI Express**: Generación interactiva de documentación OpenAPI 3.
- **Supertest**: Biblioteca para pruebas de integración de endpoints HTTP contra Express.
- **Dotenv**: Gestión de variables de entorno mediante archivos `.env`.
- **Nodemon**: Herramienta de desarrollo para reinicio automático del servidor ante cambios de código.
- **openai**: Cliente oficial compatible con la API de DeepSeek, utilizado por el Integrante B.

---

## 3. Responsabilidad del Integrante A

El **Integrante A** tiene bajo su responsabilidad:
- Configuración inicial del proyecto backend, dependencias y arquitectura modular.
- Implementación del servicio y rutas del CRUD de notas.
- **Reto 1 — Sistema de Costos y Consumo de IA:** Registro persistente de tokens consumidos por operación, fórmulas de cálculo de costo de entrada/salida/total, cálculo diario por zona horaria y endpoints analíticos (`/api/ia/uso`, `/api/ia/uso/hoy`, `/api/ia/uso/resumen`).
- **Reto 2 — Persistencia con Prisma y SQLite:** Sustitución del almacenamiento volátil en memoria por base de datos SQLite con Prisma ORM (modelos `Note` y `AIUsage`, migraciones y cliente singleton).
- **Reto 3 — Pruebas Automatizadas con Supertest:** Suite completa de pruebas de integración con Supertest, aislamiento en base de datos SQLite de pruebas (`test.db`) y simulación estricta de DeepSeek sin llamadas reales a internet ni consumo de créditos.
- Sistema centralizado y extensible de manejo de errores HTTP y operacionales.
- Documentación OpenAPI 3 / Swagger interactiva y actualizada para todos los endpoints.

---

## 4. Estructura del Backend

```text
backend/
│
├── prisma/
│   ├── migrations/             # Historial de migraciones SQL gestionadas por Prisma
│   │   └── 20261111170243_init/
│   │       └── migration.sql
│   ├── dev.db                  # Base de datos SQLite local de desarrollo (ignorado por Git)
│   ├── test.db                 # Base de datos SQLite aislada de pruebas (ignorado por Git)
│   └── schema.prisma           # Definición de modelos Note y AIUsage
│
├── src/
│   ├── config/
│   │   ├── prisma.js           # Cliente singleton de Prisma ORM
│   │   └── swagger.js          # Configuración de OpenAPI 3 y Swagger UI
│   │
│   ├── routes/
│   │   ├── notas.routes.js     # CRUD de notas y endpoint de resumen
│   │   └── ia.routes.js        # Preguntas con DeepSeek y endpoints de costos de IA
│   │
│   ├── services/
│   │   ├── notas.service.js    # CRUD de notas con persistencia en SQLite via Prisma
│   │   ├── costos.service.js   # Registro, fórmulas y analítica de consumo de IA
│   │   └── deepseek.service.js # Cliente y llamadas a DeepSeek
│   │
│   ├── middlewares/
│   │   ├── validar.js          # Middleware reutilizable de validación con Zod
│   │   └── errorHandler.js     # Manejo centralizado y seguro de errores
│   │
│   ├── utils/
│   │   └── errors.js           # Clases personalizadas de error (AppError, NotFoundError, etc.)
│   │
│   ├── app.js                  # Configuración de la aplicación Express y middlewares
│   └── index.js                # Inicialización del servidor HTTP y variables de entorno
│
├── test/
│   ├── ia.test.js              # Pruebas unitarias de IA (Integrante B)
│   └── retos-a.test.js         # Suite de pruebas Supertest y Prisma (Integrante A)
│
├── docs/                       # Documentación técnica adicional de integración
│   ├── INTEGRACION-IA.md
│   └── PR-IA.md
│
├── .env                        # Variables de entorno locales (ignorado por Git)
├── .env.example                # Plantilla de variables de entorno para el equipo
├── .gitignore                  # Exclusión de node_modules, .env y *.db
├── package.json                # Dependencias y scripts npm
├── package-lock.json           # Árbol de dependencias bloqueado
└── README.md                   # Documentación técnica del backend
```

---

## 5. Requisitos de Instalación

- **Node.js** >= 20.0.0
- **npm** >= 9.0.0

Comprobar versiones instaladas:

```bash
node -v
npm -v
```

---

## 6. Instalación y Configuración

1. Navegar hasta la carpeta `backend`:

```bash
cd backend
```

2. Instalar las dependencias del proyecto:

```bash
npm install
```

3. Si todavía no existe `.env`, crearlo desde la plantilla:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Contenido del archivo `.env`:

```env
PORT=3000
DATABASE_URL="file:./dev.db"

# Proveedor de IA (DeepSeek)
DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-flash

# Tarifas configurables para estimación de costos (precio por millón de tokens en USD)
AI_PRICE_PER_MILLION_INPUT_TOKENS=0.14
AI_PRICE_PER_MILLION_OUTPUT_TOKENS=0.28

# Zona horaria para el cálculo del resumen diario (ej. America/Costa_Rica o UTC)
TIMEZONE=America/Costa_Rica
```

> **Nota de seguridad:** El archivo `.env` está expresamente excluido en `.gitignore`. Configura `DEEPSEEK_API_KEY` únicamente en tu archivo local. Nunca compartas claves por chat, repositorios ni capturas.

4. Inicializar y sincronizar la base de datos SQLite con Prisma:

```bash
npx prisma migrate dev
```

---

## 7. Ejecución del Servidor

### Modo Desarrollo (con reinicio automático via Nodemon):

```bash
npm run dev
```

### Modo Producción:

```bash
npm start
```

El servidor iniciará en el puerto configurado (por defecto `3000`):

```text
====================================================
🚀 Servidor ejecutándose en: http://localhost:3000
📚 Documentación Swagger en: http://localhost:3000/api-docs
====================================================
```

---

## 8. Documentación Interactiva con Swagger

La documentación OpenAPI 3 se encuentra accesible en el navegador en la siguiente URL:

```text
http://localhost:3000/api-docs
```

También se dispone del esquema OpenAPI en formato JSON en:

```text
http://localhost:3000/api-docs.json
```

Desde Swagger UI se pueden inspeccionar y probar interactivamente las operaciones del CRUD de Notas, Preguntas, Resúmenes y Endpoints de Costos de IA.

---

## 9. Endpoints REST Disponibles

### Notas (CRUD en SQLite con Prisma)

| Método | Endpoint | Descripción | Códigos HTTP |
|---|---|---|---|
| `GET` | `/api/notas` | Obtener todas las notas registradas | 200 |
| `GET` | `/api/notas/:id` | Obtener una nota específica por su ID numérico | 200, 400, 404 |
| `POST` | `/api/notas` | Crear una nueva nota persistida en SQLite | 201, 400 |
| `DELETE` | `/api/notas/:id` | Eliminar una nota existente de la base de datos | 204, 400, 404 |

### Inteligencia Artificial (DeepSeek)

| Método | Endpoint | Descripción | Códigos HTTP |
|---|---|---|---|
| `POST` | `/api/ia/preguntar` | Responder preguntas con DeepSeek y registrar consumo | 200, 400, 429, 502, 503, 504 |
| `POST` | `/api/notas/:id/resumen` | Resumir una nota existente en 3 viñetas y registrar consumo | 200, 400, 404, 429, 502, 503, 504 |

### Analítica de Costos y Consumo de IA (Reto 1)

| Método | Endpoint | Descripción | Códigos HTTP |
|---|---|---|---|
| `GET` | `/api/ia/uso` | Historial paginado de solicitudes, tokens y costos | 200 |
| `GET` | `/api/ia/uso/hoy` | Resumen acumulado del día según zona horaria configurable | 200 |
| `GET` | `/api/ia/uso/resumen` | Métricas y estadísticas globales consolidadas | 200 |

---

## 10. Reto 1 — Sistema de Seguimiento de Costos y Consumo de IA

### 10.1 Fórmulas de Cálculo

Cada solicitud exitosa procesada por DeepSeek devuelve en el objeto `uso` los contadores reales:
- `tokensEntrada` (`prompt_tokens`).
- `tokensSalida` (`completion_tokens`).
- `totalTokens` (`total_tokens`).

Las fórmulas implementadas en `src/services/costos.service.js` son:

$$\text{Costo Entrada} = \left(\frac{\text{Tokens Entrada}}{1\,000\,000}\right) \times \text{Precio por Millón de Entrada}$$

$$\text{Costo Salida} = \left(\frac{\text{Tokens Salida}}{1\,000\,000}\right) \times \text{Precio por Millón de Salida}$$

$$\text{Costo Total} = \text{Costo Entrada} + \text{Costo Salida}$$

### 10.2 Configuración de Tarifas

Las tarifas son completamente configurables mediante variables de entorno en el archivo `.env`:

```env
AI_PRICE_PER_MILLION_INPUT_TOKENS=0.14
AI_PRICE_PER_MILLION_OUTPUT_TOKENS=0.28
TIMEZONE=America/Costa_Rica
```

- **Valores de referencia:** DeepSeek maneja tarifas estándar aproximadas de \$0.14 por millón de tokens de entrada (cache miss) y \$0.28 por millón de tokens de salida.
- **Precisión:** Las operaciones numéricas conservan precisión flotante completa en base de datos (`Float` / `Double` de 8 decimales) y se presentan redondeadas a 6 decimales para evitar acumulación de errores por truncado.
- **Integridad:** Ante fallos de proveedor (errores 401, 429, 503, 504) **no** se registran consumos ficticios.

### 10.3 Resumen Diario por Zona Horaria

El endpoint `GET /api/ia/uso/hoy` determina el inicio del día (`00:00:00.000`) y el final (`23:59:59.999`) según la zona horaria IANA configurada (ej. `America/Costa_Rica`), convirtiéndola a instantes UTC para consultar SQLite. Registros de días previos quedan automáticamente aislados y no alteran la métrica diaria.

**Ejemplo de respuesta (`GET /api/ia/uso/hoy`):**

```json
{
  "fecha": "2026-11-11",
  "zonaHoraria": "America/Costa_Rica",
  "totalSolicitudes": 3,
  "totalTokensEntrada": 120,
  "totalTokensSalida": 350,
  "totalTokens": 470,
  "costoAcumuladoEntrada": 0.000017,
  "costoAcumuladoSalida": 0.000098,
  "gastoTotalEstimado": 0.000115,
  "solicitudes": []
}
```

---

## 11. Reto 2 — Persistencia con Prisma ORM y SQLite

Se sustituyó el almacenamiento volátil en memoria por una base de datos relacional SQLite gestionada mediante Prisma ORM.

### 11.1 Modelos del Esquema (`prisma/schema.prisma`)

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Note {
  id        Int      @id @default(autoincrement())
  titulo    String
  contenido String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model AIUsage {
  id            Int      @id @default(autoincrement())
  requestId     String?
  tipoOperacion String   // "pregunta" | "resumen"
  modelo        String
  tokensEntrada Int
  tokensSalida  Int
  totalTokens   Int
  costoEntrada  Float
  costoSalida   Float
  costoTotal    Float
  createdAt     DateTime @default(now())
}
```

### 11.2 Comandos Útiles de Prisma

- **Generar cliente:** `npx prisma generate` (o `npm run prisma:generate`)
- **Crear y aplicar migraciones en desarrollo:** `npx prisma migrate dev` (o `npm run prisma:migrate`)
- **Aplicar migraciones en producción:** `npx prisma migrate deploy`
- **Explorador visual de datos:** `npx prisma studio` (o `npm run prisma:studio` en `http://localhost:5555`)
- **Sincronizar base de datos de pruebas:** `npx prisma db push`

### 11.3 Persistencia Garantizada

- El cliente de Prisma está configurado como Singleton en `src/config/prisma.js` para evitar fugas de conexiones.
- Al reiniciar el proceso de Node.js, las notas y el historial de consumo de IA permanecen intactos en `prisma/dev.db`.
- Los archivos `.db`, `.db-journal`, `.db-shm` y `.db-wal` están debidamente ignorados por Git para no versionar datos locales.

---

## 12. Reto 3 — Pruebas Automatizadas con Supertest

Se incorporó una suite de pruebas de integración con **Supertest** en `test/retos-a.test.js`, que se ejecuta junto a la suite de IA de Integrante B (`test/ia.test.js`) mediante el runner nativo de Node.js (`node --test`).

### 12.1 Cobertura de la Suite

1. **CRUD y Validaciones Zod:**
   - Creación exitosa (HTTP 201) y verificación de persistencia en SQLite.
   - Listado ordenado (HTTP 200).
   - Consulta por ID existente (HTTP 200).
   - Consulta de ID inexistente (HTTP 404).
   - Rechazo de cuerpos vacíos, títulos vacíos y textos > 5000 caracteres (HTTP 400).
   - Eliminación exitosa (HTTP 204) y comprobación de ausencia posterior (HTTP 404).
   - Validación de tipos de datos incorrectos.
2. **Simulación de IA con Mocks Controlados:**
   - Respuesta de pregunta y confirmación de guardado en la tabla `AIUsage`.
   - Respuesta de resumen sobre nota real persistida y confirmación de guardado en `AIUsage`.
   - Errores de autenticación (401 $\rightarrow$ 502) verificando que **no** se creen consumos ficticios.
   - Control de límites de tasa (429), timeouts simulados (504), respuestas vacías (502) y caídas de servicio (503).
   - Ausencia de credenciales produciendo 502 sin emitir tráfico de red.
3. **Cálculo y Analítica de Costos:**
   - Comprobación matemática exacta de las fórmulas de costos.
   - Paginación del historial `GET /api/ia/uso`.
   - Acumulación diaria `GET /api/ia/uso/hoy`.
   - Aislamiento temporal: registros de días anteriores no contaminan la suma de hoy.
   - Métricas globales y desglose por tipo de operación `GET /api/ia/uso/resumen`.
4. **Aislamiento de Persistencia:**
   - La suite utiliza una base de datos SQLite aislada de pruebas (`test.db`), sin tocar ni borrar `dev.db`.
   - Ninguna prueba realiza llamadas reales a DeepSeek ni gasta créditos del usuario.

### 12.2 Ejecución de Pruebas

```bash
npm test
```

**Resultado de la última ejecución oficial:**

```text
ℹ tests 34
ℹ suites 5
ℹ pass 34
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

---

## 13. Preparación de una Instalación Limpia

Para clonar y poner en marcha el proyecto desde cero en una máquina nueva:

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd Lab5-API-Notas-Claude/backend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env

# 4. Aplicar migraciones para crear la base de datos SQLite
npx prisma migrate dev

# 5. Ejecutar la suite de pruebas
npm test

# 6. Iniciar el servidor
npm run dev
```
