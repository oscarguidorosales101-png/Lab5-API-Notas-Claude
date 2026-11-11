# Laboratorio #5 — Sistema de Gestión Académica y API REST con Express 5, Prisma y MySQL

API REST profesional y modular desarrollada con **Node.js** y **Express 5**, persistencia relacional empresarial en **MySQL** (`Notas_lab`) gestionada mediante **Prisma ORM (v6)**, documentada interactivamente con **Swagger/OpenAPI 3**, con validación de esquemas estricta mediante **Zod**, seguimiento analítico de consumo y costos de IA con **DeepSeek**, y suite exhaustiva de pruebas automatizadas con **Supertest**.

El proyecto integra de manera armónica el trabajo del **Integrante A** (`feature/notas`: arquitectura modular, modelo de datos relacional académico, servicios y endpoints de usuarios, materias, prerrequisitos, períodos, matrículas, calificaciones, temas y notas, migración de datos desde SQLite, sistema analítico de costos y suite de pruebas) y del **Integrante B** (`feature/ia`: integración con DeepSeek AI, streaming y control de conversaciones).

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

## 3. Instalación y Configuración Paso a Paso

### 3.1 Clonar el repositorio y acceder a backend
```bash
git clone <URL_DEL_REPOSITORIO>
cd Lab5-API-Notas-Claude/backend
```

### 3.2 Instalar dependencias
```bash
npm install
```

### 3.3 Crear las Bases de Datos en MySQL
Conéctese a su servidor MySQL local y ejecute:
```sql
CREATE DATABASE IF NOT EXISTS `Notas_lab`
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS `Notas_lab_test`
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

### 3.4 Configuración de Variables de Entorno (`.env`)
Copie la plantilla de ejemplo:
```bash
cp .env.example .env
```
Edite `.env` con las credenciales de su MySQL local:
```env
PORT=3000
DATABASE_URL="mysql://root:su_contrasena@localhost:3306/Notas_lab"
TEST_DATABASE_URL="mysql://root:su_contrasena@localhost:3306/Notas_lab_test"

# Proveedor de IA (DeepSeek)
DEEPSEEK_API_KEY=su_clave_api_aqui
DEEPSEEK_MODEL=deepseek-flash

# Tarifas configurables para estimación de costos (USD por millón de tokens)
AI_PRICE_PER_MILLION_INPUT_TOKENS=0.14
AI_PRICE_PER_MILLION_OUTPUT_TOKENS=0.28

# Zona horaria para el cálculo del resumen diario
TIMEZONE=America/Costa_Rica
```

### 3.5 Aplicar Migraciones de Prisma
Aplica las migraciones iniciales de MySQL a la base de datos `Notas_lab`:
```bash
npx prisma migrate dev
```

### 3.6 Sincronizar Base de Datos de Pruebas
Sincroniza el esquema relacional en la base de datos aislada de pruebas:
```bash
npx prisma db push --schema=prisma/schema.prisma
```

### 3.7 Migración de Datos Históricos desde SQLite
Transfiere los registros históricos de `Note` y `AIUsage` preservando identificadores y campos:
```bash
npm run migrate:sqlite
```
*Este script es 100% seguro e idempotente; no duplica datos si se ejecuta varias veces.*

### 3.8 Poblar Datos de Prueba (Seed Idempotente)
Carga datos académicos de demostración (usuarios, materias, prerrequisitos, matrículas y temas):
```bash
npm run seed
```

### 3.9 Iniciar el Servidor
- Modo desarrollo (con recarga automática mediante Nodemon):
  ```bash
  npm run dev
  ```
- Modo producción:
  ```bash
  npm start
  ```
El servidor quedará disponible en `http://localhost:3000`.

---

## 4. Documentación Interactiva (Swagger / OpenAPI)

Una vez iniciado el servidor, acceda a la documentación visual interactiva:
- **Swagger UI**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **Especificación OpenAPI (JSON)**: [http://localhost:3000/api-docs.json](http://localhost:3000/api-docs.json)

---

## 5. Catálogo Completo de Endpoints REST

### 5.1 Usuarios (`/api/usuarios`)
| Método | Ruta | Descripción | Códigos HTTP |
|---|---|---|---|
| `GET` | `/api/usuarios` | Lista todos los usuarios (excluyendo contraseñas) | 200, 500 |
| `GET` | `/api/usuarios/:id` | Detalle del usuario con matrículas y notas asociadas | 200, 400, 404 |
| `POST` | `/api/usuarios` | Crea un usuario (`ADMIN`, `DOCENTE`, `ESTUDIANTE`) con contraseña hasheada | 201, 400, 409 |
| `PUT` | `/api/usuarios/:id` | Actualiza los datos de un usuario existente | 200, 400, 404, 409 |
| `DELETE` | `/api/usuarios/:id` | Elimina un usuario | 204, 400, 404 |
| `GET` | `/api/usuarios/:id/matriculas` | Consulta el historial de matrículas y calificaciones de un estudiante | 200, 400, 404 |

### 5.2 Materias y Prerrequisitos (`/api/materias`)
| Método | Ruta | Descripción | Códigos HTTP |
|---|---|---|---|
| `GET` | `/api/materias` | Lista todas las materias con sus prerrequisitos y temas | 200, 500 |
| `GET` | `/api/materias/:id` | Detalle de la materia con relaciones académicas | 200, 400, 404 |
| `POST` | `/api/materias` | Registra una nueva materia académica (código único, créditos, nota mínima) | 201, 400, 409 |
| `PUT` | `/api/materias/:id` | Actualiza la información de una materia | 200, 400, 404, 409 |
| `DELETE` | `/api/materias/:id` | Elimina una materia | 204, 400, 404 |
| `GET` | `/api/materias/:id/prerrequisitos` | Lista los prerrequisitos asignados a una materia | 200, 400, 404 |
| `POST` | `/api/materias/:id/prerrequisitos` | Asigna un prerrequisito (previene reflexividad y ciclos directos) | 201, 400, 404, 409 |
| `DELETE` | `/api/materias/:id/prerrequisitos/:prerrequisitoId` | Elimina la relación de prerrequisito | 204, 400, 404 |
| `GET` | `/api/materias/:id/temas` | Lista los temas académicos asociados a la materia | 200, 400, 404 |

### 5.3 Períodos Académicos (`/api/periodos`)
| Método | Ruta | Descripción | Códigos HTTP |
|---|---|---|---|
| `GET` | `/api/periodos` | Lista todos los períodos académicos ordenados cronológicamente | 200, 500 |
| `GET` | `/api/periodos/:id` | Obtiene un período académico por ID | 200, 400, 404 |
| `POST` | `/api/periodos` | Crea un período lectivo con fechas de inicio/fin y estado activo | 201, 400 |
| `PUT` | `/api/periodos/:id` | Actualiza un período académico | 200, 400, 404 |
| `DELETE` | `/api/periodos/:id` | Elimina un período académico | 204, 400, 404 |

### 5.4 Matrículas (`/api/matriculas`)
| Método | Ruta | Descripción | Códigos HTTP |
|---|---|---|---|
| `GET` | `/api/matriculas` | Lista todas las matrículas con estudiante, materia y período | 200, 500 |
| `GET` | `/api/matriculas/:id` | Detalle de la matrícula con lista de calificaciones | 200, 400, 404 |
| `POST` | `/api/matriculas` | Matricula un estudiante validando rol, período activo, unicidad y aprobación de prerrequisitos | 201, 400, 404, 409 |
| `GET` | `/api/matriculas/:id/calificaciones` | Lista las evaluaciones y notas de la matrícula | 200, 400, 404 |
| `POST` | `/api/matriculas/:id/calificaciones` | Registra una evaluación y recalcula la nota ponderada en transacción | 201, 400, 404, 409 |
| `GET` | `/api/matriculas/:id/resultado-final` | Detalle del cálculo final ponderado y estado académico | 200, 400, 404 |

### 5.5 Calificaciones (`/api/calificaciones`)
| Método | Ruta | Descripción | Códigos HTTP |
|---|---|---|---|
| `PUT` | `/api/calificaciones/:id` | Actualiza puntaje o ponderación de una evaluación y recalcula nota | 200, 400, 404, 409 |
| `DELETE` | `/api/calificaciones/:id` | Elimina una evaluación y actualiza la matrícula en transacción | 204, 400, 404 |

### 5.6 Temas Académicos (`/api/temas`)
| Método | Ruta | Descripción | Códigos HTTP |
|---|---|---|---|
| `GET` | `/api/temas` | Lista temas (filtro opcional por `materiaId`) | 200, 500 |
| `GET` | `/api/temas/:id` | Detalle de un tema con materia y notas asociadas | 200, 400, 404 |
| `POST` | `/api/temas` | Registra un tema académico para una asignatura | 201, 400, 404 |
| `PUT` | `/api/temas/:id` | Actualiza un tema académico | 200, 400, 404 |
| `DELETE` | `/api/temas/:id` | Elimina un tema académico | 204, 400, 404 |

### 5.7 Notas Académicas (`/api/notas`)
| Método | Ruta | Descripción | Códigos HTTP |
|---|---|---|---|
| `GET` | `/api/notas` | Lista notas con filtros avanzados (`userId`, `subjectId`, `topicId`, `search`) | 200, 500 |
| `GET` | `/api/notas/:id` | Detalle de la nota con relaciones académicas | 200, 400, 404 |
| `POST` | `/api/notas` | Crea una nota (soporta vinculación opcional a estudiante, materia y tema) | 201, 400 |
| `DELETE` | `/api/notas/:id` | Elimina una nota por ID | 204, 400, 404 |
| `POST` | `/api/notas/:id/resumen` | Genera resumen de tres viñetas mediante DeepSeek y audita tokens | 200, 404, 502, 504 |

### 5.8 Inteligencia Artificial y Costos (`/api/ia`)
| Método | Ruta | Descripción | Códigos HTTP |
|---|---|---|---|
| `POST` | `/api/ia/preguntar` | Envía una consulta a DeepSeek y registra persistencia de consumo | 200, 400, 429, 502, 504 |
| `GET` | `/api/ia/uso` | Historial paginado de solicitudes con tokens y costos | 200, 500 |
| `GET` | `/api/ia/uso/hoy` | Consumo acumulado diario en zona horaria configurada | 200, 500 |
| `GET` | `/api/ia/uso/resumen` | Métricas acumuladas y desglose por tipo de operación | 200, 500 |

---

## 6. Modelo de Datos Relacional en Prisma

```mermaid
erDiagram
    User ||--o{ Enrollment : "matricula"
    User ||--o{ Note : "escribe"
    Subject ||--o{ SubjectPrerequisite : "tiene_prerrequisitos"
    Subject ||--o{ SubjectPrerequisite : "es_prerrequisito_de"
    Subject ||--o{ Enrollment : "inscribe"
    Subject ||--o{ NoteTopic : "clasifica_en"
    Subject ||--o{ Note : "referencia"
    AcademicPeriod ||--o{ Enrollment : "contiene"
    Enrollment ||--o{ Grade : "evalua"
    NoteTopic ||--o{ Note : "organiza"
```

### Entidades Principales
1. **User**: Almacena usuarios con contraseña hasheada (SHA-256). Roles: `ADMIN`, `DOCENTE`, `ESTUDIANTE`.
2. **Subject**: Asignaturas académicas con `codigo` único, `creditos` y `notaMinimaAprobatoria` (por defecto 70.0).
3. **SubjectPrerequisite**: Relación autorreferenciada muchos a muchos entre materias.
4. **AcademicPeriod**: Períodos o ciclos lectivos (`anio`, `periodo`, `activo`).
5. **Enrollment**: Matrícula única por `(userId, subjectId, academicPeriodId)`, con `estado` (`ACTIVA`, `APROBADA`, `REPROBADA`) y `notaFinal`.
6. **Grade**: Evaluaciones de una matrícula con `puntajeObtenido`, `puntajeMaximo`, `porcentaje` (ponderación) y observaciones.
7. **NoteTopic**: Categorización temática de las asignaturas (ej. Álgebra, Estructura Atómica).
8. **Note**: Apuntes académicos con soporte para filtros por materia, tema y estudiante.
9. **AIUsage**: Registro de auditoría para cada petición de IA (`requestId`, `tipoOperacion`, tokens reales de entrada/salida y costos calculados en USD).

---

## 7. Reglas de Negocio Académicas

1. **Matrículas y Prerrequisitos:**
   - Únicamente usuarios con rol `ESTUDIANTE` pueden matricular asignaturas.
   - El período académico debe existir y tener `activo: true`.
   - No se permiten matrículas duplicadas para el mismo estudiante, materia y período (código 409).
   - **Verificación Estricta de Prerrequisitos:** Para matricular una materia con prerrequisitos, el estudiante debe contar con matrícula previa en cada una de las materias requisito con estado `APROBADA` o `notaFinal >= notaMinimaAprobatoria`. En caso de incumplimiento, se rechaza la matrícula (HTTP 409) detallando las materias pendientes.

2. **Calificaciones Ponderadas y Transacciones:**
   - Cada evaluación valida que `puntajeObtenido <= puntajeMaximo` y `puntajeMaximo > 0`.
   - La suma acumulada de las ponderaciones (`porcentaje`) para una matrícula no puede superar el 100%.
   - Cada inserción, actualización o eliminación de calificación se ejecuta en una **transacción atómica de Prisma**, recalculando la nota final:
     $$\text{Nota Final} = \sum \left(\frac{\text{Puntaje Obtenido}}{\text{Puntaje Máximo}} \times \text{Ponderación}\right)$$
   - Al completar el 100% de la evaluación, la matrícula transiciona automáticamente a estado `APROBADA` o `REPROBADA` según la nota mínima establecida por la materia.

3. **Organización Temática de Apuntes:**
   - Cada estudiante puede clasificar sus notas bajo materias y temas específicos.
   - La API permite consultar notas mediante filtros en query parameters (`GET /api/notas?userId=1&subjectId=2&topicId=1`).

---

## 8. Fórmulas de Costos de IA (DeepSeek)

Se registran los tokens reales reportados por el proveedor y se calculan los costos según las tarifas configuradas en `.env`:
- **Costo Entrada (USD):**
  $$\text{Costo Entrada} = \frac{\text{tokensEntrada}}{1\,000\,000} \times \text{AI\_PRICE\_PER\_MILLION\_INPUT\_TOKENS}$$
- **Costo Salida (USD):**
  $$\text{Costo Salida} = \frac{\text{tokensSalida}}{1\,000\,000} \times \text{AI\_PRICE\_PER\_MILLION\_OUTPUT\_TOKENS}$$
- **Costo Total (USD):**
  $$\text{Costo Total} = \text{Costo Entrada} + \text{Costo Salida}$$

---

## 9. Pruebas Automatizadas

El backend incluye una suite completa de pruebas de integración con el test runner nativo de Node.js y **Supertest**.

Para ejecutar todas las pruebas:
```bash
npm test
```

### Características de la Suite de Pruebas:
- **Aislamiento Total:** Las pruebas se ejecutan exclusivamente contra la base de datos `Notas_lab_test` definida en `TEST_DATABASE_URL`, garantizando que la base de desarrollo `Notas_lab` jamás se contamine ni se borre.
- **Cero Gasto de Créditos de IA:** Las llamadas a DeepSeek son interceptadas mediante mocks en memoria; no se realizan peticiones externas a internet ni se consumen tokens reales.
- **Cobertura Completa:** 55 pruebas automatizadas organizadas en 6 suites que verifican CRUD de notas, persistencia en MySQL, transferencia de datos SQLite, CRUD de usuarios, materias, prerrequisitos, matrículas, calificaciones ponderadas, organización por temas, auditoría de AIUsage, resumen diario por zona horaria y compatibilidad con las rutas del Integrante B.
