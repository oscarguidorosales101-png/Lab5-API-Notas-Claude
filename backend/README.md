# Lab5-API-Notas-Claude — Backend (Feature / Notas)

API REST profesional desarrollada con **Node.js** y **Express 5**, documentada con **Swagger/OpenAPI 3**, con validación de esquemas mediante **Zod** y almacenamiento en memoria.

Este componente corresponde a la implementación de la rama `feature/notas`, bajo la responsabilidad del **Integrante A** para el **Laboratorio #5: API REST con Express, Swagger y Claude API**.

---

## 1. Objetivo del Laboratorio

Diseñar e implementar una API REST modular, robusta y documentada que permita gestionar un sistema de notas en memoria. La arquitectura fue estructurada para servir como cimiento sólido y desacoplado, permitiendo al **Integrante B** integrar las capacidades de Inteligencia Artificial (Anthropic Claude API) en la rama `feature/ia` sin necesidad de refactorizar ni reconstruir el backend base.

---

## 2. Tecnologías Utilizadas

- **Node.js**: Entorno de ejecución JavaScript (v20+ requerido, probado en v24+).
- **Express 5**: Framework web minimalista y robusto para Node.js.
- **CommonJS**: Sistema estándar de módulos (`require` / `module.exports`).
- **Zod**: Biblioteca de declaración y validación de esquemas TypeScript-first para JavaScript.
- **Swagger JSDoc & Swagger UI Express**: Generación interactiva de documentación OpenAPI 3.
- **Dotenv**: Gestión de variables de entorno mediante archivos `.env`.
- **Nodemon**: Herramienta de desarrollo para reinicio automático del servidor ante cambios de código.
- **@anthropic-ai/sdk**: SDK oficial de Anthropic preinstalado para la integración que realizará el Integrante B.

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
│   │   └── notas.routes.js     # Endpoints REST y anotaciones Swagger
│   │
│   ├── services/
│   │   └── notas.service.js    # Lógica de negocio y almacenamiento en memoria
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
npm install
```

3. Configurar las variables de entorno creando el archivo `.env` a partir de `.env.example`:

```bash
cp .env.example .env
```

Contenido del archivo `.env`:

```env
PORT=3000
ANTHROPIC_API_KEY=
CLAUDE_MODEL=claude-haiku-4-5-20251001
```

> **Nota de Seguridad:** El archivo `.env` está expresamente excluido en `.gitignore` para proteger las credenciales y llaves de acceso. La variable `ANTHROPIC_API_KEY` se mantiene vacía hasta que el Integrante B configure su clave para las pruebas de IA.

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

Desde la interfaz de Swagger UI se pueden inspeccionar los esquemas, parámetros y ejecutar peticiones directamente contra los endpoints de notas.

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

## 12. Integración pendiente del Integrante B

La base del backend queda completamente preparada y desacoplada para que el **Integrante B** desarrolle su trabajo en la rama `feature/ia`.

El Integrante B encontrará disponibles y listos para usar los siguientes módulos:

1. **Servicio de notas reutilizable (`src/services/notas.service.js`)**:
   - Dispone de la función `buscarPorId(id)`, lista para ser importada por el servicio de IA para extraer el contenido de una nota antes de enviarlo a Claude para su resumen.
2. **Middleware de validación genérico (`src/middlewares/validar.js`)**:
   - Puede ser utilizado directamente para validar peticiones del endpoint de IA definiendo un nuevo esquema con Zod (ej. `validar(iaResumenSchema)`).
3. **Manejo centralizado de errores extensible (`src/middlewares/errorHandler.js` y `src/utils/errors.js`)**:
   - Permite capturar errores de la API de Anthropic o definir subclases de `AppError` (como `ClaudeAPIError`), retornando respuestas estructuradas sin caídas del servidor.
4. **Configuración modular de Express (`src/app.js`)**:
   - Permite registrar el nuevo enrutador de IA con una sola línea: `app.use('/api/ia', iaRoutes);`.
5. **Swagger extensible (`src/config/swagger.js`)**:
   - Escanea automáticamente los archivos dentro de `src/routes/`, por lo que cualquier endpoint anotado con JSDoc en las rutas del Integrante B aparecerá de inmediato en `/api-docs`.

> **Pendiente para el Integrante B:**
> - Crear `src/services/claude.service.js` con la lógica de invocación a Anthropic Claude.
> - Crear `src/routes/ia.routes.js` con el endpoint de generación de resúmenes (e.g. `POST /api/ia/resumen`).
> - Incorporar las anotaciones Swagger correspondientes a las operaciones de IA.
> - Añadir la clave `ANTHROPIC_API_KEY` en su archivo local `.env`.
