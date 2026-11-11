# Laboratorio #5 — API de notas con Express, Swagger y DeepSeek

API REST profesional desarrollada con **Node.js** y **Express 5**, documentada con **Swagger/OpenAPI 3**, con validación de esquemas mediante **Zod** y almacenamiento en memoria.

El backend integra el trabajo del **Integrante A** (`feature/notas`: API de notas y configuración inicial) y del **Integrante B** (`feature/ia`: integración con IA). La guía original utiliza Claude; este proyecto adapta la integración a **DeepSeek**.

Nombres de los integrantes: pendientes de completar por el equipo. No se deducen de las cuentas de Git.

---

## 1. Objetivo del Laboratorio

Diseñar e implementar una API REST modular y documentada para gestionar notas en memoria, responder preguntas y resumir notas mediante DeepSeek. El cliente se comunica con Express; únicamente el backend accede al proveedor de IA y a su clave privada.

---

## 2. Tecnologías Utilizadas

- **Node.js**: Entorno de ejecución JavaScript (v20+ requerido, probado en v24+).
- **Express 5**: Framework web minimalista y robusto para Node.js.
- **CommonJS**: Sistema estándar de módulos (`require` / `module.exports`).
- **Zod**: Biblioteca de declaración y validación de esquemas TypeScript-first para JavaScript.
- **Swagger JSDoc & Swagger UI Express**: Generación interactiva de documentación OpenAPI 3.
- **Dotenv**: Gestión de variables de entorno mediante archivos `.env`.
- **Nodemon**: Herramienta de desarrollo para reinicio automático del servidor ante cambios de código.
- **openai**: cliente compatible con la API de DeepSeek, utilizado por el Integrante B.

---

## 3. Responsabilidad del Integrante A

El **Integrante A** tiene bajo su responsabilidad:
- Configuración inicial del proyecto backend y sus dependencias.
- Definición de la arquitectura modular y árbol de directorios.
- Implementación del servicio de notas con persistencia en memoria y generación de IDs autoincrementales sin duplicados.
- Desarrollo de validaciones estrictas con Zod para la creación de notas.
- Implementación de los 4 endpoints REST de notas (`GET /api/notas`, `GET /api/notas/:id`, `POST /api/notas`, `DELETE /api/notas/:id`).
- Sistema centralizado y extensible de manejo de errores HTTP y operacionales.
- Documentación OpenAPI 3 / Swagger interactiva y accesible.
- Configuración de scripts de arranque y variables de entorno seguras (`.gitignore`).
- Pruebas manuales y verificación exhaustiva de todos los casos de éxito y error.

---

## 4. Estructura del Backend

```text
backend/
│
├── src/
│   ├── config/
│   │   └── swagger.js          # Configuración de OpenAPI 3 y Swagger UI
│   │
│   ├── routes/
│   │   ├── notas.routes.js     # CRUD de A y ruta de resumen de B
│   │   └── ia.routes.js        # Preguntas, validación y OpenAPI
│   │
│   ├── services/
│   │   ├── notas.service.js    # Lógica de negocio y almacenamiento en memoria
│   │   └── deepseek.service.js # Cliente y llamadas a DeepSeek
│   │
│   ├── middlewares/
│   │   ├── validar.js          # Middleware reutilizable de validación con Zod
│   │   └── errorHandler.js     # Manejo centralizado y uniforme de errores
│   │
│   ├── utils/
│   │   └── errors.js           # Clases personalizadas de error (AppError, NotFoundError, etc.)
│   │
│   ├── app.js                  # Configuración de la aplicación Express y middlewares
│   └── index.js                # Inicialización del servidor HTTP y variables de entorno
│
├── .env                        # Variables de entorno locales (ignorado por Git)
├── .env.example                # Plantilla de variables de entorno para el equipo
├── .gitignore                  # Exclusión de node_modules y .env
├── package.json                # Configuración de dependencias y scripts npm
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
npm ci
```

3. Si todavía no existe `.env`, crearlo desde la plantilla (PowerShell). Si ya existe, editar únicamente las variables necesarias:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Contenido del archivo `.env`:

```env
PORT=3000
DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-flash
```

> **Nota de seguridad:** `.env` está ignorado. Configura `DEEPSEEK_API_KEY` únicamente en tu archivo local. No sobrescribas un `.env` existente ni compartas la clave por chat o capturas.

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

Desde Swagger UI se pueden inspeccionar los contratos de notas e IA. Abre una operación, pulsa **Try it out**, completa los datos y pulsa **Execute**. Las operaciones de preguntas y resumen consumen créditos de DeepSeek.

---

## 9. Endpoints REST Disponibles

| Método | Endpoint | Descripción | Códigos HTTP |
|---|---|---|---|
| `GET` | `/api/notas` | Obtener todas las notas registradas | 200 |
| `GET` | `/api/notas/:id` | Obtener una nota específica por su ID numérico | 200, 400, 404 |
| `POST` | `/api/notas` | Crear una nueva nota validada con Zod | 201, 400 |
| `DELETE` | `/api/notas/:id` | Eliminar una nota existente por su ID | 204, 400, 404 |

---

## 10. Ejemplos de Solicitud y Respuestas

### 10.1 Crear una nota (`POST /api/notas`)

**Solicitud:**

```bash
curl -X POST http://localhost:3000/api/notas \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Reunión de planificación",
    "contenido": "Revisar arquitectura de microservicios y despliegue en AWS."
  }'
```

**Respuesta Exitosa (`201 Created`):**

```json
{
  "id": 1,
  "titulo": "Reunión de planificación",
  "contenido": "Revisar arquitectura de microservicios y despliegue en AWS."
}
```

**Respuesta de Error de Validación (`400 Bad Request`):**

```json
{
  "error": "Error de validación",
  "detalles": [
    {
      "campo": "titulo",
      "mensaje": "El título no puede estar vacío y debe tener al menos 1 carácter"
    }
  ]
}
```

---

### 10.2 Consultar todas las notas (`GET /api/notas`)

**Solicitud:**

```bash
curl http://localhost:3000/api/notas
```

**Respuesta Exitosa (`200 OK`):**

```json
[
  {
    "id": 1,
    "titulo": "Reunión de planificación",
    "contenido": "Revisar arquitectura de microservicios y despliegue en AWS."
  }
]
```

---

### 10.3 Consultar una nota por ID (`GET /api/notas/:id`)

**Solicitud:**

```bash
curl http://localhost:3000/api/notas/1
```

**Respuesta Exitosa (`200 OK`):**

```json
{
  "id": 1,
  "titulo": "Reunión de planificación",
  "contenido": "Revisar arquitectura de microservicios y despliegue en AWS."
}
```

**Respuesta Recurso No Encontrado (`404 Not Found`):**

```json
{
  "error": "Nota con id 999 no encontrada"
}
```

**Respuesta ID Inválido (`400 Bad Request`):**

```json
{
  "error": "El parámetro id debe ser un número entero positivo"
}
```

---

### 10.4 Eliminar una nota (`DELETE /api/notas/:id`)

**Solicitud:**

```bash
curl -X DELETE http://localhost:3000/api/notas/1
```

**Respuesta Exitosa (`204 No Content`):**

*(Sin contenido en el cuerpo de la respuesta)*

---

## 11. Almacenamiento en Memoria

El servicio `src/services/notas.service.js` implementa un almacenamiento volátil en memoria utilizando un array en JavaScript (`notas = []`) y un contador secuencial (`nextId = 1`). 

- Las operaciones son síncronas, rápidas y no requieren configuración de motores de base de datos externos.
- La persistencia dura mientras el proceso de Node.js continúe en ejecución.
- Las funciones retornan copias de los objetos para evitar mutaciones no controladas de la fuente de datos en memoria.

---

## 12. Integración del Integrante B con DeepSeek

La integración de preguntas y resúmenes está implementada. Consulta [configuración, contratos, pruebas y evidencias pendientes](docs/INTEGRACION-IA.md). Se conserva el CRUD del integrante A.

El integrante B implementa el servicio DeepSeek, los dos endpoints de IA, la adaptación de errores del proveedor, sus contratos OpenAPI y pruebas. Reutiliza `validar.js` y `notasService.buscarPorId(id)`. Los ajustes compartidos se limitan al registro del router, la ruta de resumen, el manejador de errores y la configuración/documentación de la integración.

### 12.1 Preguntar al modelo

`POST /api/ia/preguntar`, con Content-Type `application/json`:

```json
{
  "pregunta": "¿Qué es una API REST?"
}
```

Se eliminan espacios externos y se valida que la pregunta tenga entre 3 y 2000 caracteres antes de llamar a IA. HTTP 200 devuelve `respuesta` con el texto generado y `uso` con el objeto de consumo informado por DeepSeek: `prompt_tokens`, `completion_tokens`, `total_tokens` y los campos adicionales del proveedor. No se incluyen cifras de ejemplo que puedan confundirse con evidencia real.

### 12.2 Resumir una nota

`POST /api/notas/{id}/resumen` no necesita body. En Swagger introduce el identificador de una nota creada previamente. HTTP 200 devuelve `notaId` y `resumen` con el texto generado. Una nota inexistente devuelve 404 antes de llamar al proveedor. Un identificador inválido devuelve 400.

El contenido de la nota se envía como mensaje `user`, con la instrucción `system`: «Resume el texto en 3 viñetas breves, en español.»

### 12.3 Adaptación de Claude a DeepSeek y errores

Se usa el paquete `openai` con `baseURL: https://api.deepseek.com`. El SDK de Anthropic se retiró porque no se utiliza. La clave y el modelo proceden de `DEEPSEEK_API_KEY` y `DEEPSEEK_MODEL`. El texto se lee de `choices[0].message.content` y el consumo de `usage`.

El servicio limita la salida a 1024 tokens, desactiva el modo de razonamiento y configura 30 segundos de timeout, sin reintentos automáticos. La correspondencia de tokens es `input_tokens → prompt_tokens` y `output_tokens → completion_tokens`.

Los fallos de IA devuelven exclusivamente:

```json
{ "error": "IA_NO_DISPONIBLE" }
```

- 401 del proveedor → 502 de nuestra API.
- 429 → 429; 503 → 503.
- Timeout → 504.
- Otros fallos del proveedor, configuración ausente o respuesta inválida → 502.

Se conserva el tratamiento existente de validaciones, AppError, JSON inválido y errores internos. Los errores de IA no publican mensajes originales ni credenciales.

## 13. Pruebas y estado de las evidencias

Desde `backend`, ejecutar:

```bash
npm test
```

La última ejecución automatizada completó **11 pruebas aprobadas y ninguna fallida**, con Express, SDK y servicio de notas reales, pero con transporte DeepSeek simulado. Incluye validación, mensajes enviados, consumo, resumen, inexistentes sin llamadas al proveedor, errores 401/429/503, timeout simulado, respuestas inválidas, configuración ausente, regresión CRUD y contratos OpenAPI. No constituye una prueba real del proveedor.

**Pruebas manuales informadas por el integrante B:** confirmó que Swagger funciona, que probó el CRUD y que la integración de IA también funciona. Esta confirmación procede de sus pruebas locales; no se han adjuntado respuestas, códigos concretos, cifras de tokens ni capturas para documentar cada caso.

Evidencias y comprobaciones que falta incorporar:

- Capturas de Swagger de una pregunta y un resumen exitosos, sin secretos.
- Registro de `prompt_tokens` y `completion_tokens` de dos llamadas reales.
- Evidencia de la prueba con clave falsa: respuesta 502 `IA_NO_DISPONIBLE`.
- Resultados concretos del CRUD desde Swagger: dos creaciones 201, listado 200, inexistente 404, body vacío 400, eliminación 204 y consulta posterior 404.
- Pruebas cruzadas: el integrante A debe probar los endpoints de B. No se da por realizada esa revisión.
- Comparación observada al cambiar la instrucción de sistema.

Las capturas se pueden guardar en `docs/evidencias/` y enlazar aquí cuando existan. No se incluyen capturas ni resultados inventados.

## 14. Reflexiones

1. **¿Por qué la clave no puede estar en el frontend?** Un usuario podría leerla en el código descargado, en el bundle o en las solicitudes mediante las herramientas del navegador. Se mantiene exclusivamente en el entorno del backend y fuera de Git.
2. **¿Qué ocurre si el proveedor devuelve 401?** Nuestra API responde 502. El fallo corresponde a la autenticación del backend ante DeepSeek; reenviar 401 sugeriría incorrectamente que el cliente debe autenticarse ante nuestra API. El cuerpo público no revela detalles del proveedor.
3. **¿Qué diferencia hay entre system y user?** `system` establece tarea, idioma y formato; `user` contiene la pregunta o el texto a procesar. En el resumen, la instrucción solicita tres viñetas y el mensaje de usuario contiene la nota. La comparación de respuestas reales al modificar esa instrucción queda pendiente.
4. **¿Cuántos tokens consumieron dos llamadas y cómo se limita el costo?** Las cifras reales quedan pendientes de registrar. DeepSeek informa `prompt_tokens` y `completion_tokens`; `max_tokens: 1024` limita la salida. También se limita la longitud de la pregunta y se evitan reintentos automáticos.
5. **¿Qué pasaría sin validar el body?** Se gastarían créditos en entradas vacías o inválidas; entradas excesivas aumentarían el consumo y la latencia. Validar antes del proveedor evita esas solicitudes.
6. **¿Qué conflictos de Git ocurrieron y cómo se resolvieron?** No se observaron conflictos durante el desarrollo realizado. La integración por PR aún está pendiente; no se atribuyen conflictos ni resoluciones que no hayan ocurrido.

## 15. Colaboración y entrega

El integrante B trabaja en `feature/ia`, creada desde `feature/notas` con autorización expresa porque era la única base disponible. Se publicaron cinco commits significativos: `a945785`, `41f59fa`, `1d25c19`, `c660b88` y `37dd6a5`. Esta actualización de documentación es posterior a esos commits.

En la última comprobación del remoto no existía `main`. Falta coordinar esa base, abrir el PR de `feature/ia` hacia `main` y obtener revisión con comentarios y aprobación del compañero antes de integrar. El [borrador de título, descripción y comandos](docs/PR-IA.md) está preparado. No se aprueba ni fusiona el propio PR.

Antes de entregar: completar nombres y roles, adjuntar evidencias y tokens reales, finalizar la revisión en pareja, verificar la rama `main` integrada y completar la coevaluación que indique el docente.

Se detectaron cinco alertas de npm en dependencias cuyas versiones ya estaban en la base de A. Su detalle está en la documentación de integración. Una migración de Zod o actualizaciones generales deben coordinarse como otro cambio del equipo.
