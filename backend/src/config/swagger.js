const swaggerJSDoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sistema de Gestión Académica y API de Notas - Laboratorio #5',
      version: '2.0.0',
      description:
        'API REST profesional desarrollada con Express 5, Prisma ORM v6 y MySQL (Notas_lab) para la gestión académica completa (usuarios, materias, prerrequisitos, períodos, matrículas y calificaciones ponderadas), notas organizadas por materia y tema, e integración con DeepSeek AI con seguimiento detallado de consumo y costos.'
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor local de desarrollo'
      }
    ],
    tags: [
      {
        name: 'Autenticación',
        description: 'Inicio de sesión con JWT, perfil de usuario y cambio rápido de cuentas demo'
      },
      {
        name: 'Usuarios',
        description: 'Gestión de usuarios del sistema (estudiantes, docentes, administradores)'
      },
      {
        name: 'Materias',
        description: 'Gestión del catálogo de asignaturas y créditos académicos'
      },
      {
        name: 'Prerrequisitos',
        description: 'Gestión de dependencias y validaciones de prerrequisitos entre asignaturas'
      },
      {
        name: 'Períodos',
        description: 'Gestión de períodos académicos y ciclos lectivos'
      },
      {
        name: 'Matrículas',
        description: 'Inscripción de estudiantes con verificación estricta de prerrequisitos aprobados'
      },
      {
        name: 'Calificaciones',
        description: 'Registro de evaluaciones, ponderaciones acumuladas y cálculo de nota final'
      },
      {
        name: 'Temas',
        description: 'Clasificación temática de contenidos para asignaturas y apuntes'
      },
      {
        name: 'Notas',
        description: 'Apuntes académicos con filtros por estudiante, materia y tema'
      },
      {
        name: 'IA',
        description: 'Inteligencia Artificial (DeepSeek) y analítica de consumo y costos de tokens'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Introduce el token JWT obtenido en /api/auth/login'
        }
      },
      schemas: {
        Usuario: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            nombre: { type: 'string', example: 'Carlos' },
            apellidos: { type: 'string', example: 'Alvarado Quesada' },
            email: { type: 'string', format: 'email', example: 'carlos.alvarado@universidad.ac.cr' },
            rol: { type: 'string', enum: ['ADMIN', 'DOCENTE', 'ESTUDIANTE'], example: 'ESTUDIANTE' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Materia: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            codigo: { type: 'string', example: 'CI-101' },
            nombre: { type: 'string', example: 'Ciencias Generales' },
            descripcion: { type: 'string', example: 'Fundamentos de ciencias biológicas y químicas' },
            creditos: { type: 'integer', example: 4 },
            notaMinimaAprobatoria: { type: 'number', example: 70.0 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        PeriodoAcademico: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            nombre: { type: 'string', example: 'Primer Cuatrimestre 2026' },
            fechaInicio: { type: 'string', format: 'date', example: '2026-01-15' },
            fechaFin: { type: 'string', format: 'date', example: '2026-04-30' },
            anio: { type: 'integer', example: 2026 },
            periodo: { type: 'string', example: '1C' },
            activo: { type: 'boolean', example: true }
          }
        },
        Matricula: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            userId: { type: 'integer', example: 1 },
            subjectId: { type: 'integer', example: 2 },
            academicPeriodId: { type: 'integer', example: 1 },
            fechaMatricula: { type: 'string', format: 'date-time' },
            estado: { type: 'string', example: 'ACTIVA' },
            notaFinal: { type: 'number', nullable: true, example: 85.5 }
          }
        },
        Calificacion: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            enrollmentId: { type: 'integer', example: 1 },
            nombreEvaluacion: { type: 'string', example: 'Examen Parcial 1' },
            puntajeObtenido: { type: 'number', example: 88 },
            puntajeMaximo: { type: 'number', example: 100 },
            porcentaje: { type: 'number', example: 30 },
            fechaEvaluacion: { type: 'string', format: 'date-time' },
            observaciones: { type: 'string', nullable: true, example: 'Excelente dominio del tema' }
          }
        },
        ResultadoFinal: {
          type: 'object',
          properties: {
            enrollmentId: { type: 'integer', example: 1 },
            estudiante: {
              type: 'object',
              properties: {
                id: { type: 'integer', example: 1 },
                nombreCompleto: { type: 'string', example: 'Carlos Alvarado' },
                email: { type: 'string', example: 'carlos@universidad.ac.cr' }
              }
            },
            materia: {
              type: 'object',
              properties: {
                id: { type: 'integer', example: 1 },
                codigo: { type: 'string', example: 'CI-101' },
                nombre: { type: 'string', example: 'Ciencias Generales' },
                notaMinimaAprobatoria: { type: 'number', example: 70.0 }
              }
            },
            porcentajeEvaluado: { type: 'number', example: 100 },
            notaFinal: { type: 'number', example: 85.5 },
            notaMinimaAprobatoria: { type: 'number', example: 70.0 },
            aprobada: { type: 'boolean', example: true },
            estado: { type: 'string', example: 'APROBADA' }
          }
        },
        TemaAcademico: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            nombre: { type: 'string', example: 'Estructura Atómica' },
            descripcion: { type: 'string', example: 'Modelos atómicos y configuración electrónica' },
            subjectId: { type: 'integer', nullable: true, example: 2 },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Nota: {
          type: 'object',
          required: ['id', 'titulo', 'contenido'],
          properties: {
            id: {
              type: 'integer',
              example: 1,
              description: 'Identificador único numérico de la nota'
            },
            titulo: {
              type: 'string',
              example: 'Apuntes de Enlaces Químicos',
              description: 'Título de la nota (1 a 100 caracteres)'
            },
            contenido: {
              type: 'string',
              example: 'Los enlaces covalentes se forman compartiendo pares de electrones...',
              description: 'Contenido completo de la nota (1 a 5000 caracteres)'
            },
            userId: {
              type: 'integer',
              nullable: true,
              example: 1,
              description: 'ID del estudiante propietario'
            },
            subjectId: {
              type: 'integer',
              nullable: true,
              example: 2,
              description: 'ID de la materia académica asociada'
            },
            topicId: {
              type: 'integer',
              nullable: true,
              example: 1,
              description: 'ID del tema académico asociado'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        CrearNotaInput: {
          type: 'object',
          required: ['titulo', 'contenido'],
          properties: {
            titulo: {
              type: 'string',
              example: 'Apuntes de Química',
              minLength: 1,
              maxLength: 100
            },
            contenido: {
              type: 'string',
              example: 'Contenido sobre reacciones redox...',
              minLength: 1,
              maxLength: 5000
            },
            userId: {
              type: 'integer',
              example: 1
            },
            subjectId: {
              type: 'integer',
              example: 2
            },
            topicId: {
              type: 'integer',
              example: 1
            }
          }
        },
        AIUsageRecord: {
          type: 'object',
          required: ['id', 'tipoOperacion', 'modelo', 'tokensEntrada', 'tokensSalida', 'totalTokens', 'costoEntrada', 'costoSalida', 'costoTotal', 'createdAt'],
          properties: {
            id: { type: 'integer', example: 1 },
            requestId: { type: 'string', example: 'req_1731340000000_abc123' },
            tipoOperacion: { type: 'string', enum: ['pregunta', 'resumen'], example: 'pregunta' },
            modelo: { type: 'string', example: 'deepseek-flash' },
            tokensEntrada: { type: 'integer', example: 15 },
            tokensSalida: { type: 'integer', example: 25 },
            totalTokens: { type: 'integer', example: 40 },
            costoEntrada: { type: 'number', format: 'double', example: 0.0000021 },
            costoSalida: { type: 'number', format: 'double', example: 0.000007 },
            costoTotal: { type: 'number', format: 'double', example: 0.0000091 },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        ResumenDiario: {
          type: 'object',
          required: ['fecha', 'zonaHoraria', 'totalSolicitudes', 'totalTokensEntrada', 'totalTokensSalida', 'totalTokens', 'costoAcumuladoEntrada', 'costoAcumuladoSalida', 'gastoTotalEstimado'],
          properties: {
            fecha: { type: 'string', example: '2026-11-11' },
            zonaHoraria: { type: 'string', example: 'America/Costa_Rica' },
            totalSolicitudes: { type: 'integer', example: 4 },
            totalTokensEntrada: { type: 'integer', example: 180 },
            totalTokensSalida: { type: 'integer', example: 420 },
            totalTokens: { type: 'integer', example: 600 },
            costoAcumuladoEntrada: { type: 'number', example: 0.000025 },
            costoAcumuladoSalida: { type: 'number', example: 0.000118 },
            gastoTotalEstimado: { type: 'number', example: 0.000143 },
            solicitudes: {
              type: 'array',
              items: { $ref: '#/components/schemas/AIUsageRecord' }
            }
          }
        },
        ResumenGeneral: {
          type: 'object',
          required: ['totalSolicitudes', 'totalTokensEntrada', 'totalTokensSalida', 'totalTokens', 'costoTotalEstimado', 'desglosePorOperacion'],
          properties: {
            totalSolicitudes: { type: 'integer', example: 15 },
            totalTokensEntrada: { type: 'integer', example: 1200 },
            totalTokensSalida: { type: 'integer', example: 3400 },
            totalTokens: { type: 'integer', example: 4600 },
            costoTotalEstimado: { type: 'number', example: 0.00112 },
            desglosePorOperacion: {
              type: 'object',
              properties: {
                pregunta: { type: 'object' },
                resumen: { type: 'object' }
              }
            },
            primeraSolicitud: { type: 'string', format: 'date-time', nullable: true },
            ultimaSolicitud: { type: 'string', format: 'date-time', nullable: true }
          }
        },
        ErrorDetalle: {
          type: 'object',
          properties: {
            campo: {
              type: 'string',
              example: 'titulo'
            },
            mensaje: {
              type: 'string',
              example: 'El título es un campo obligatorio'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          required: ['error'],
          properties: {
            error: {
              type: 'string',
              example: 'Mensaje descriptivo del error'
            },
            detalles: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/ErrorDetalle'
              },
              description: 'Lista de errores específicos de validación (opcional)'
            }
          }
        }
      }
    }
  },
  apis: [
    path.join(__dirname, '../routes/*.js').replace(/\\/g, '/')
  ]
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = {
  swaggerSpec
};
