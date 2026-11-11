# Sistema de Gestión Académica y Notas — Frontend (React + Vite)
## Laboratorio #5 — API REST con Express, Swagger, Prisma ORM, MySQL y DeepSeek AI

Interfaz web moderna, modular y reactiva desarrollada con **React 19**, **Vite 6**, **React Router DOM 7** y **Lucide React**. Conecta directamente con la API REST académica desarrollada en Express y Prisma ORM sobre MySQL (`Notas_lab`).

---

## 🚀 Tecnologías Principales

- **Core:** [React 19](https://react.dev/) + [Vite 6](https://vitejs.dev/)
- **Enrutamiento:** [React Router DOM v7](https://reactrouter.com/) (Single Page Application)
- **Iconografía:** [Lucide React](https://lucide.dev/)
- **Diseño & Estilos:** CSS modular con diseño estructurado mediante Variables CSS (Design Tokens).
  - Paleta académica: Celeste institucional (`#0284c7`, `#0ea5e9`), fondos luminosos (`#f8fafc`), tarjetas en blanco puro (`#ffffff`), navegación en azul medianoche (`#0f172a`).
  - Totalmente responsivo, sin frameworks externos pesados, con animaciones y transiciones suaves.
- **Tipografía:** Google Fonts — *Plus Jakarta Sans*.

---

## 📁 Estructura del Proyecto

```text
frontend/
├── public/
│   └── vite.svg
├── src/
│   ├── assets/              # Logotipos e isotipos vectoriales
│   ├── components/          # Componentes transversales y reutilizables
│   │   ├── Badge.jsx            # Indicadores de estado visuales y roles
│   │   ├── Breadcrumbs.jsx      # Migas de pan de navegación jerárquica
│   │   ├── ConfirmModal.jsx     # Diálogo de confirmación para borrados seguros
│   │   ├── EmptyState.jsx       # Vistas de estado vacío ilustradas
│   │   ├── ErrorBanner.jsx      # Avisos de error con desglose de validaciones
│   │   ├── Header.jsx           # Barra superior con selector de rol/usuario
│   │   ├── LoadingSpinner.jsx   # Indicador de carga animado
│   │   ├── Modal.jsx            # Modal flotante con tecla Escape y clic externo
│   │   ├── Sidebar.jsx          # Navegación lateral colapsable
│   │   ├── StatsCard.jsx        # Tarjetas de métricas del Dashboard
│   │   └── ToastContainer.jsx   # Sistema global de notificaciones toast
│   ├── config/              # Configuración y mapa de endpoints del backend
│   │   └── api.config.js
│   ├── context/             # Estado global (roles activos, notificaciones, colapso)
│   │   └── AppContext.jsx
│   ├── pages/               # Vistas principales del sistema
│   │   ├── DashboardPage.jsx       # Resumen ejecutivo con métricas reales
│   │   ├── UsuariosPage.jsx        # Gestión de Estudiantes, Docentes y Administradores
│   │   ├── MateriasPage.jsx        # Gestión de Materias y Prerrequisitos académicos
│   │   ├── PeriodosPage.jsx        # Ciclos lectivos y activación académica
│   │   ├── MatriculasPage.jsx      # Inscripciones con validación de prerrequisitos
│   │   ├── CalificacionesPage.jsx  # Evaluaciones ponderadas y cálculo de nota final
│   │   ├── TemasPage.jsx           # Clasificación de contenidos por materia
│   │   ├── NotasPage.jsx           # Cuaderno de notas con resumen asistido por IA
│   │   ├── IAPage.jsx              # Asistente IA interactivo y preguntas directas
│   │   └── ConsumoIAPage.jsx       # Auditoría de tokens, costos y operaciones IA
│   ├── routes/              # Configuración del enrutador central
│   │   └── AppRoutes.jsx
│   ├── scripts/             # Scripts de verificación de conectividad
│   │   └── test-api-connection.js
│   ├── services/            # Clientes de API modulares (Fetch API con manejo 204 y JSON)
│   │   ├── api.js               # Cliente base con mapeo de errores del backend
│   │   ├── usuarios.service.js
│   │   ├── materias.service.js
│   │   ├── periodos.service.js
│   │   ├── matriculas.service.js
│   │   ├── temas.service.js
│   │   ├── notas.service.js
│   │   └── ia.service.js
│   ├── styles/              # Design System
│   │   ├── variables.css        # Paleta de colores, sombras y radios
│   │   └── globals.css          # Reset, componentes base, tablas y utilidades
│   ├── utils/               # Formateadores de fecha (es-CR), moneda y notas
│   │   └── formatters.js
│   ├── App.jsx              # Shell principal con sidebar, header y enrutador
│   └── main.jsx             # Punto de entrada de la aplicación
├── .env.example             # Ejemplo de variables de entorno
├── .gitignore               # Exclusiones de Git (node_modules, dist, .env)
├── index.html               # Shell HTML responsivo con viewport y fuentes
├── package.json             # Dependencias y scripts de ejecución
└── vite.config.js           # Configuración de Vite y proxy local al backend
```

---

## ⚙️ Configuración y Variables de Entorno

Crear un archivo `.env` en la raíz de `frontend/` (o copiar de `.env.example`):

```bash
cp .env.example .env
```

Contenido del archivo `.env`:
```ini
# URL base de la API REST del backend
VITE_API_URL=http://localhost:3000/api
```

> **Nota de seguridad:** La API Key de DeepSeek (`DEEPSEEK_API_KEY`) y la conexión a MySQL residen **exclusivamente en `backend/.env`**. El frontend nunca expone credenciales sensibles ni claves de IA en el cliente.

---

## 📦 Instalación y Ejecución

### 1. Instalar dependencias
```bash
npm install
```

### 2. Ejecutar en modo desarrollo
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:5173`.
*(El proxy interno en `vite.config.js` redirige las peticiones `/api` al backend en el puerto `3000`).*

### 3. Compilar para producción
```bash
npm run build
```
Genera los archivos optimizados listos para producción dentro del directorio `dist/`.

### 4. Previsualizar la compilación de producción
```bash
npm run preview
```

---

## 🎯 Módulos y Funcionalidades Desarrolladas

1. **Dashboard Ejecutivo (`/`):**
   - Tarjetas de estadísticas en tiempo real: Total de Materias, Estudiantes Matriculados, Notas Registradas, Promedio General de Notas, Consumo de Tokens y Costo Estimado en USD.
   - Listado de registros recientes y accesos rápidos a los módulos del sistema.

2. **Gestión de Usuarios (`/usuarios`):**
   - Listado paginado/filtrable de usuarios con roles visuales (`ADMIN`, `DOCENTE`, `ESTUDIANTE`).
   - Modal para crear y editar usuarios.
   - Vista detallada del perfil con historial de notas y matrículas asociadas.
   - Eliminación segura con confirmación.

3. **Materias y Prerrequisitos (`/materias`):**
   - Creación y edición de materias (código único, nombre, créditos, horas).
   - Gestión interactiva de prerrequisitos académicos (asociación y eliminación de dependencias con prevención de ciclos y autoreferencias).
   - Visualización de temas académicos asociados a cada asignatura.

4. **Períodos Académicos (`/periodos`):**
   - Registro de ciclos lectivos (código, nombre, fechas de inicio y fin).
   - Activación y desactivación de períodos académicos.

5. **Matrículas Académicas (`/matriculas`):**
   - Inscripción de estudiantes en materias y períodos activos.
   - **Validación estricta de prerrequisitos:** Si un estudiante no ha aprobado una materia previa requerida, el frontend captura el error HTTP 409 del backend y presenta una alerta explicativa indicando exactamente qué materias faltan.

6. **Calificaciones y Resultado Final (`/calificaciones`):**
   - Registro de evaluaciones con nombre, porcentaje ponderado y calificación obtenida.
   - Control de validación para evitar sobrepasar el 100% de la ponderación total.
   - Banner de **Resultado Final Oficial** consumiendo `/api/matriculas/:id/resultado-final`, mostrando la nota final calculada ponderadamente y el estado académico: **APROBADO** (nota $\ge 70$), **REPROBADO** o **EN_CURSO**.

7. **Temas Académicos (`/temas`):**
   - Creación y catalogación de temas vinculados a materias para estructuración curricular.
   - Visualización de cantidad de notas vinculadas por tema.

8. **Cuaderno de Notas (`/notas`):**
   - Editor de notas de estudio con vinculación a estudiante, materia y tema.
   - Filtros dinámicos por estudiante, materia, tema y búsqueda por texto libre.
   - Modal de lectura en vista amplia.
   - **Integración de IA:** Botón directo para solicitar a DeepSeek un resumen en 3 puntos clave sobre cualquier nota guardada.

9. **Asistente Inteligente IA (`/ia`):**
   - **Modo Chat:** Conversación interactiva con historial persistente en la sesión utilizando `/api/ia/conversar`.
   - **Modo Pregunta Rápida:** Consulta puntual directa a través de `/api/ia/preguntar`.
   - **Modo Resumidor:** Carga notas existentes y genera síntesis estructuradas al instante.

10. **Auditoría de Consumo y Costos de IA (`/consumo-ia`):**
    - Métricas de uso total: Tokens de entrada, tokens de salida y costo financiero acumulado en USD.
    - Desglose por tipo de operación (`CHAT`, `PREGUNTA`, `RESUMEN_NOTA`).
    - Resumen diario agrupado según la zona horaria institucional (`America/Costa_Rica`).
    - Tabla histórica detallada con todos los registros de consumo almacenados en la base de datos MySQL.

