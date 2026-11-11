# Integrante B: integración con DeepSeek

Implementa preguntas, resumen de notas, errores del proveedor y documentación OpenAPI. Conserva CommonJS y Express 5. El CRUD pertenece a A y no se modifica. No se necesitan agentes, historial, herramientas ni selector LLM_PROVIDER.

## Instalación y configuración

Desde `backend`, ejecuta `npm ci`. Se añade `openai` y se retira el SDK de Anthropic, que no utiliza ningún módulo existente. No se añaden dependencias de pruebas: se usa `node:test`.

Si no existe `.env`, copia `.env.example`. Si ya existe, añade las variables manualmente sin sobrescribirlo:

```env
PORT=3000
DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-flash
```

Introduce la clave localmente, nunca en el chat. `npm start` carga dotenv antes de importar la aplicación. `npm test` ejecuta pruebas sin clave real y sin tráfico a DeepSeek. La ausencia de configuración produce 502 únicamente al solicitar IA; el CRUD sigue funcionando.

Modelo verificado el 11 de noviembre de 2026 en la [documentación oficial](https://api-docs.deepseek.com/): `deepseek-flash`. El ejemplo antiguo `deepseek-chat` del material no se copia. La [referencia Chat Completions](https://api-docs.deepseek.com/api/create-chat-completion/) documenta `max_tokens` y `thinking.type`. Se usa `max_tokens: 1024`, `thinking: { type: 'disabled' }`, sin streaming. El cliente reutilizado tiene timeout de 30 segundos y cero reintentos automáticos para evitar duplicar solicitudes.

## Contratos

`POST /api/ia/preguntar`, Content-Type `application/json`:

```json
{ "pregunta": "¿Qué es una API REST?" }
```

La cadena debe tener entre 3 y 2000 caracteres después de quitar espacios externos. El middleware `validar` de A rechaza entradas inválidas antes de consultar IA. La respuesta 200 contiene `respuesta` (texto del proveedor) y `uso` (objeto usage original con `prompt_tokens`, `completion_tokens`, `total_tokens` y los campos adicionales que informe DeepSeek). No se generan contadores de reemplazo: respuesta vacía, estructura inesperada o consumo ausente se consideran fallo 502.

`POST /api/notas/1/resumen`, sin body, devuelve 200 con `notaId` y `resumen`, ambos derivados de la nota y de la respuesta del modelo. Primero busca la nota; un 404 no consume IA.

El servicio real de A exporta `buscarPorId(id)` y devuelve `null` al no encontrarla, en lugar de `buscar(id)` con excepción que presenta la guía. La ruta usa ese contrato existente y reproduce el mismo NotFoundError de A. Reutiliza `validarParamId`, sin cambiar sus reglas ni implementar otro servicio de notas. No queda un contrato de A pendiente para ejecutar la integración.

Ejemplos desde PowerShell:

```powershell
Invoke-RestMethod http://localhost:3000/api/ia/preguntar -Method Post -ContentType 'application/json' -Body '{"pregunta":"¿Qué es una API REST?"}'
Invoke-RestMethod http://localhost:3000/api/notas/1/resumen -Method Post
```

Estas llamadas consumen créditos si configuras una clave válida. Se entregan como instrucciones: no se ejecutaron contra DeepSeek.

## Errores

Todos los fallos de IA responden exclusivamente `{"error":"IA_NO_DISPONIBLE"}`:

- 401 de DeepSeek se convierte en 502: la autenticación fallida pertenece al backend, no al usuario de esta API.
- 429 se conserva como 429.
- 503 se conserva como 503; no se utiliza el 529 de Claude.
- Timeout del SDK: 504.
- Otros fallos del SDK, conexión, configuración ausente o respuesta inválida: 502.

El servidor registra solo el código HTTP resultante para errores de IA, sin mensaje original, cabeceras, claves u objetos completos. Se conserva el tratamiento anterior de AppError, Zod, JSON inválido y errores internos.

## Adaptación y reflexión

Claude usa Messages y bloques de contenido; DeepSeek usa Chat Completions y `choices[0].message.content`. El prompt de sistema define reglas, idioma y tarea; el mensaje `user` contiene la pregunta o el contenido de la nota. Aquí se envían como dos mensajes con roles distintos. El resumen usa exactamente: «Resume el texto en 3 viñetas breves, en español.»

La correspondencia de consumo es `input_tokens → prompt_tokens` y `output_tokens → completion_tokens`. El campo `total_tokens` también se entrega cuando lo informa DeepSeek. `max_tokens` limita la salida; validar la entrada limita solicitudes inútiles y textos excesivos. No validar permitiría gastar créditos en preguntas vacías y aumentar costo o latencia con entradas enormes.

La API key no puede ir en el frontend: un usuario podría leer el JavaScript, las variables incorporadas al bundle o las solicitudes desde las herramientas del navegador.

Pendientes de evidencia real: consumo de dos llamadas, efecto observado al cambiar el prompt, capturas de preguntas y resúmenes reales, y prueba de autenticación rechazada. No se han registrado conflictos de integración; su explicación queda pendiente si ocurren. No se inventan nombres, tokens, aprobaciones ni capturas.

## Verificación y Swagger

Se ejecutó `npm test`: 11 pruebas aprobadas, con SDK real y transporte del proveedor simulado. El servidor Express y el servicio de notas son reales durante las pruebas HTTP. Se cubren entrada válida e inválida, trimming, contenido y consumo, resumen, nota inexistente sin llamada, 401/429/503/otros errores, ausencia de configuración, timeout simulado, respuesta vacía/inesperada y conservación del manejador de errores. La prueba de timeout verifica la política mediante una excepción simulada; no espera 30 segundos ni mide un timeout de red real.

Se comprobó por HTTP el CRUD de A: crear dos notas 201, listar 200, inexistente 404, body vacío 400, eliminar 204 y consultar después 404. También se validan `/api-docs/`, los contratos publicados en `/api-docs.json` y sus referencias internas.

Pendiente de repetir manualmente desde `http://localhost:3000/api-docs` con **Try it out → Execute**:

1. Crear dos notas (201), listar (200), consultar una inexistente (404), crear con `{}` (400), eliminar (204) y consultar después (404).
2. Preguntar con body válido (200 con texto y consumo reales) y con pregunta de una letra (400).
3. Resumir una nota existente (200) y una inexistente (404).
4. Con una clave falsa configurada solo localmente y reiniciando el proceso, verificar 502 y ausencia de detalles sensibles.
5. Guardar capturas sin credenciales; anotar tokens de dos llamadas y resultados al cambiar el prompt.

No se presenta la simulación como validación completa del proveedor ni como prueba visual de Swagger.

## Git y revisión

`npm audit` informó cinco alertas (cuatro moderadas y una alta): `glob`, `minimatch`, `nodemon`, `swagger-jsdoc` y `zod`. Se comprobó que sus versiones en package-lock son idénticas a la base de A. No corresponden al nuevo cliente `openai`. La corrección de Zod propuesta por npm implica migrar a la versión mayor 4; se deja para un cambio coordinado del equipo y no se aplica `audit fix --force`.

`feature/ia` parte de `feature/notas` con autorización del usuario, ya que es la única rama disponible en el remoto. No existe `main`; no se crea ni se fusiona automáticamente. El PR hacia `main` deberá abrirse cuando el equipo publique esa base. La revisión y aprobación corresponden al compañero.

Cambios compartidos mínimos: una línea para registrar el router en `app.js`, incorporación de la ruta de resumen a `notas.routes.js`, tratamiento de errores IA en `errorHandler.js`, variables/dependencias/script de pruebas y esta documentación. `index.js`, `validar.js`, `notas.service.js`, el CRUD y la configuración inicial de Swagger se conservan.
