# Laboratorio #5 — Sistema de Gestión Académica y API REST con Express 5, Prisma y MySQL
## Proyecto Completo: Backend (Node.js + MySQL + DeepSeek) y Frontend (React + Vite)

API REST profesional y modular desarrollada con **Node.js** y **Express 5**, persistencia relacional empresarial en **MySQL** (`Notas_lab`) gestionada mediante **Prisma ORM (v6)**, documentada interactivamente con **Swagger/OpenAPI 3**, con validación de esquemas estricta mediante **Zod**, seguimiento analítico de consumo y costos de IA con **DeepSeek**, y suite exhaustiva de pruebas automatizadas con **Supertest**.

El proyecto integra de manera armónica el trabajo del **Integrante A** (`feature/notas`: arquitectura modular, modelo de datos relacional académico, servicios y endpoints de usuarios, materias, prerrequisitos, períodos, matrículas, calificaciones, temas y notas, migración de datos desde SQLite, sistema analítico de costos, suite de pruebas y frontend React) y del **Integrante B** (`feature/ia`: integración con DeepSeek AI, streaming y control de conversaciones).

---

## 1. Arquitectura y Tecnologías

- **Node.js**: Entorno de ejecución JavaScript (v20+ requerido, probado en v24+).
- **Express 5**: Framework web minimalista, veloz y robusto para Node.js.
- **CommonJS**: Sistema estándar de módulos (`require` / `module.exports`).
- **Prisma ORM (v6)**: ORM tipado para MySQL con migraciones declarativas y transacciones atómicas.
- **MySQL 8.0**: Motor de base de datos relacional activo (`Notas_lab` para desarrollo, `Notas_lab_test` para pruebas).
- **SQLite (Respaldo Histórico)**: Conservado en `prisma/legacy-sqlite/` como histórico y alternativa técnica futura.
- **Zod**: Declaración de esquemas y validación rigurosa de entradas y parámetros HTTP.
- **Swagger JSDoc & Swagger UI Express**: Documentación interactiva OpenAPI 3 en `/api-docs` y esquema en `/api-docs.json`.
- **Supertest**: Pruebas de integración de endpoints HTTP contra Express en base de datos aislada.
- **Dotenv**: Configuración segura de variables de entorno mediante `.env`.
- **openai**: SDK compatible con la API de DeepSeek para inferencia y streaming de IA.

---

## 2. Requisitos Previos

- **Node.js**: Versión 20.x o superior (Node 24 recomendado).
- **MySQL Server**: Versión 8.0 o superior en ejecución local (puerto 3306).
- **npm**: Gestor de paquetes de Node.js.

---

## 3. Guía de Instalación y Configuración (PowerShell)

### 3.1 Instalar dependencias del Backend
```powershell
cd C:\Users\Foward\Desktop\lab2-2\Lab5-API-Notas-Claude\backend
npm install
```

### 3.2 Instalar dependencias del Frontend
```powershell
cd C:\Users\Foward\Desktop\lab2-2\Lab5-API-Notas-Claude\frontend
npm install
```

### 3.3 Configurar MySQL y Crear las Bases de Datos
Conéctese al cliente MySQL en PowerShell y ejecute:
```powershell
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS \`Notas_lab\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; CREATE DATABASE IF NOT EXISTS \`Notas_lab_test\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 3.4 Configurar Variables de Entorno en el Backend (`.env`)
En `backend/.env`:
```ini
PORT=3000
DATABASE_URL="mysql://root:SU_PASSWORD@localhost:3306/Notas_lab"
TEST_DATABASE_URL="mysql://root:SU_PASSWORD@localhost:3306/Notas_lab_test"

# Proveedor de IA (DeepSeek)
DEEPSEEK_API_KEY=su_clave_api_aqui
DEEPSEEK_MODEL=deepseek-flash

# Tarifas configurables para estimación de costos (USD por millón de tokens)
AI_PRICE_PER_MILLION_INPUT_TOKENS=0.14
AI_PRICE_PER_MILLION_OUTPUT_TOKENS=0.28

# Zona horaria para el cálculo del resumen diario
TIMEZONE=America/Costa_Rica
```

### 3.5 Ejecutar Migraciones de Prisma de Forma Segura
Aplica las migraciones declarativas a la base de datos de desarrollo `Notas_lab`:
```powershell
cd C:\Users\Foward\Desktop\lab2-2\Lab5-API-Notas-Claude\backend
npx prisma migrate dev
```
Sincroniza la base de datos de pruebas aislada `Notas_lab_test`:
```powershell
npx prisma db push
```

### 3.6 Iniciar el Backend
```powershell
cd C:\Users\Foward\Desktop\lab2-2\Lab5-API-Notas-Claude\backend
npm run dev
```
El servidor backend se ejecutará en: `http://localhost:3000`.

### 3.7 Iniciar el Frontend
En otra ventana de PowerShell:
```powershell
cd C:\Users\Foward\Desktop\lab2-2\Lab5-API-Notas-Claude\frontend
npm run dev
```
La aplicación web se ejecutará en: `http://localhost:5173`.

---

## 4. Verificación de Rutas Principales y Estado del Servidor

### 4.1 Comprobar Ruta Raíz (`GET /`)
Retorna el objeto JSON informativo con versión y enlaces operativos:
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/" -Method Get | ConvertTo-Json
```
**Respuesta:**
```json
{
  "nombre": "Lab5 API de Notas",
  "version": "1.0.0",
  "estado": "operativa",
  "documentacion": "/api-docs",
  "health": "/health"
}
```

### 4.2 Comprobar Estado de Salud (`GET /health`)
Ejecuta una consulta real contra MySQL mediante Prisma Client y valida la configuración de componentes:
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/health" -Method Get | ConvertTo-Json
```
**Respuesta:**
```json
{
  "status": "ok",
  "services": {
    "api": "connected",
    "database": "connected",
    "deepseek": "configured"
  }
}
```

### 4.3 Acceder a la Documentación Swagger
- **Swagger UI interactivo:** [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **Especificación OpenAPI en JSON:** [http://localhost:3000/api-docs.json](http://localhost:3000/api-docs.json)

---

## 5. Pruebas y Auditoría de DeepSeek

### 5.1 Pruebas Automatizadas en Memoria (Cero Consumo de Créditos)
La suite estándar utiliza mocks y la base de pruebas aislada `Notas_lab_test`. No realiza llamadas a internet ni consume tokens:
```powershell
cd C:\Users\Foward\Desktop\lab2-2\Lab5-API-Notas-Claude\backend
npm test
```
**Resultado:** 57 pruebas superadas en 6 suites (100% éxito).

### 5.2 Prueba de Integración REAL con DeepSeek
Comprueba de forma auténtica las credenciales, modelo y saldo enviando una solicitud mínima de verificación:
```powershell
cd C:\Users\Foward\Desktop\lab2-2\Lab5-API-Notas-Claude\backend
npm run test:deepseek:live
```
**Resultado esperado:**
```text
====================================================
🧪 PRUEBA DE INTEGRACIÓN REAL CON DEEPSEEK
====================================================
📡 URL Base configurada: https://api.deepseek.com
🤖 Modelo configurado:   deepseek-flash
🔑 Clave API:            Presente (35 caracteres, oculta)
----------------------------------------------------
⏳ Enviando solicitud de prueba mínima a DeepSeek (max_tokens: 60)...
----------------------------------------------------
✅ RESULTADO: CONEXIÓN REAL EXITOSA
⏱️  Tiempo de respuesta:  ~1100 ms
💬 Respuesta recibida:   "CONECTADO"
📊 Tokens de entrada:    51
📊 Tokens de salida:     22
📊 Tokens totales:       73
====================================================
```

### 5.3 Consultar el Consumo y Costos de IA
- Historial paginado con costos en USD:
  ```powershell
  Invoke-RestMethod -Uri "http://localhost:3000/api/ia/uso?limite=5" -Method Get | ConvertTo-Json -Depth 3
  ```
- Resumen acumulado del día:
  ```powershell
  Invoke-RestMethod -Uri "http://localhost:3000/api/ia/uso/hoy" -Method Get | ConvertTo-Json -Depth 3
  ```
- Estadísticas globales y desglose por operación:
  ```powershell
  Invoke-RestMethod -Uri "http://localhost:3000/api/ia/uso/resumen" -Method Get | ConvertTo-Json -Depth 3
  ```

---

## 6. Catálogo Completo de Endpoints REST

| Módulo | Método | Ruta | Descripción | Códigos HTTP |
|---|---|---|---|---|
| **Sistema** | `GET` | `/` | Información general del API y enlaces de navegación | 200 |
| **Salud** | `GET` | `/health` | Chequeo de Express, MySQL (Prisma) y variables de IA | 200, 503 |
| **Usuarios** | `GET` | `/api/usuarios` | Lista todos los usuarios (excluyendo contraseñas) | 200, 500 |
| | `GET` | `/api/usuarios/:id` | Detalle del usuario con matrículas y notas asociadas | 200, 400, 404 |
| | `POST` | `/api/usuarios` | Crea un usuario (`ADMIN`, `DOCENTE`, `ESTUDIANTE`) con contraseña hasheada | 201, 400, 409 |
| | `PUT` | `/api/usuarios/:id` | Actualiza los datos de un usuario existente | 200, 400, 404, 409 |
| | `DELETE` | `/api/usuarios/:id` | Elimina un usuario | 204, 400, 404 |
| | `GET` | `/api/usuarios/:id/matriculas` | Historial de matrículas y calificaciones de un estudiante | 200, 400, 404 |
| **Materias** | `GET` | `/api/materias` | Lista todas las materias con sus prerrequisitos y temas | 200, 500 |
| | `GET` | `/api/materias/:id` | Detalle de la materia con relaciones académicas | 200, 400, 404 |
| | `POST` | `/api/materias` | Registra una nueva materia académica (código único, créditos, nota mínima) | 201, 400, 409 |
| | `PUT` | `/api/materias/:id` | Actualiza la información de una materia | 200, 400, 404, 409 |
| | `DELETE` | `/api/materias/:id` | Elimina una materia | 204, 400, 404 |
| | `GET` | `/api/materias/:id/prerrequisitos` | Lista los prerrequisitos asignados a una materia | 200, 400, 404 |
| | `POST` | `/api/materias/:id/prerrequisitos` | Asigna un prerrequisito (previene reflexividad y ciclos directos) | 201, 400, 404, 409 |
| | `DELETE` | `/api/materias/:id/prerrequisitos/:prerrequisitoId` | Elimina la relación de prerrequisito | 204, 400, 404 |
| | `GET` | `/api/materias/:id/temas` | Lista los temas académicos asociados a la materia | 200, 400, 404 |
| **Períodos** | `GET` | `/api/periodos` | Lista todos los períodos académicos ordenados cronológicamente | 200, 500 |
| | `GET` | `/api/periodos/:id` | Obtiene un período académico por ID | 200, 400, 404 |
| | `POST` | `/api/periodos` | Crea un período lectivo con fechas de inicio/fin y estado activo | 201, 400 |
| | `PUT` | `/api/periodos/:id` | Actualiza un período académico | 200, 400, 404 |
| | `DELETE` | `/api/periodos/:id` | Elimina un período académico | 204, 400, 404 |
| **Matrículas** | `GET` | `/api/matriculas` | Lista todas las matrículas con estudiante, materia y período | 200, 500 |
| | `GET` | `/api/matriculas/:id` | Detalle de la matrícula con lista de calificaciones | 200, 400, 404 |
| | `POST` | `/api/matriculas` | Matricula un estudiante validando rol, período activo, unicidad y prerrequisitos | 201, 400, 404, 409 |
| | `GET` | `/api/matriculas/:id/calificaciones` | Lista las evaluaciones y notas de la matrícula | 200, 400, 404 |
| | `POST` | `/api/matriculas/:id/calificaciones` | Registra una evaluación y recalcula la nota ponderada en transacción | 201, 400, 404, 409 |
| | `GET` | `/api/matriculas/:id/resultado-final` | Detalle del cálculo final ponderado y estado académico | 200, 400, 404 |
| **Calificaciones** | `PUT` | `/api/calificaciones/:id` | Actualiza puntaje o ponderación de una evaluación y recalcula nota | 200, 400, 404, 409 |
| | `DELETE` | `/api/calificaciones/:id` | Elimina una evaluación y actualiza la matrícula en transacción | 204, 400, 404 |
| **Temas** | `GET` | `/api/temas` | Lista temas (filtro opcional por `materiaId`) | 200, 500 |
| | `GET` | `/api/temas/:id` | Detalle de un tema con materia y notas asociadas | 200, 400, 404 |
| | `POST` | `/api/temas` | Registra un tema académico para una asignatura | 201, 400, 404 |
| | `PUT` | `/api/temas/:id` | Actualiza un tema académico | 200, 400, 404 |
| | `DELETE` | `/api/temas/:id` | Elimina un tema académico | 204, 400, 404 |
| **Notas** | `GET` | `/api/notas` | Lista notas con filtros avanzados (`userId`, `subjectId`, `topicId`, `search`) | 200, 500 |
| | `GET` | `/api/notas/:id` | Detalle de la nota con relaciones académicas | 200, 400, 404 |
| | `POST` | `/api/notas` | Crea una nota (soporta vinculación opcional a estudiante, materia y tema) | 201, 400 |
| | `DELETE` | `/api/notas/:id` | Elimina una nota por ID | 204, 400, 404 |
| | `POST` | `/api/notas/:id/resumen` | Genera resumen de tres viñetas mediante DeepSeek y audita tokens | 200, 404, 502, 504 |
| **IA & Costos** | `POST` | `/api/ia/preguntar` | Envía una consulta a DeepSeek y registra persistencia de consumo | 200, 400, 429, 502, 504 |
| | `POST` | `/api/ia/conversar` | Conversación continua con historial y roles | 200, 400, 404, 409, 429, 502 |
| | `POST` | `/api/ia/preguntar/stream` | Respuesta progresiva mediante Server-Sent Events (SSE) | 200, 400, 429, 502 |
| | `GET` | `/api/ia/uso` | Historial paginado de solicitudes con tokens y costos | 200, 500 |
| | `GET` | `/api/ia/uso/hoy` | Consumo acumulado diario en zona horaria configurada | 200, 500 |
| | `GET` | `/api/ia/uso/resumen` | Métricas acumuladas y desglose por tipo de operación | 200, 500 |

---

## 7. Fórmulas de Costos de IA (DeepSeek)

Se registran los tokens reales reportados por el proveedor y se calculan los costos según las tarifas configuradas en `.env`:
- **Costo Entrada (USD):**
  $$\text{Costo Entrada} = \frac{\text{tokensEntrada}}{1\,000\,000} \times \text{AI\_PRICE\_PER\_MILLION\_INPUT\_TOKENS}$$
- **Costo Salida (USD):**
  $$\text{Costo Salida} = \frac{\text{tokensSalida}}{1\,000\,000} \times \text{AI\_PRICE\_PER\_MILLION\_OUTPUT\_TOKENS}$$
- **Costo Total (USD):**
  $$\text{Costo Total} = \text{Costo Entrada} + \text{Costo Salida}$$
