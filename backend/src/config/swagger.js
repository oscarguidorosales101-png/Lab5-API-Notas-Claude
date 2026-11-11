const swaggerJSDoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API REST de Notas y DeepSeek - Laboratorio #5',
      version: '1.1.0',
      description:
        'API REST profesional desarrollada con Express 5, Prisma ORM y SQLite para la gestión de notas, integración con DeepSeek AI y seguimiento detallado de consumo y costos de tokens.'
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor local de desarrollo'
      }
    ],
    tags: [
      {
        name: 'Notas',
        description: 'Endpoints para la gestión CRUD de notas con persistencia en SQLite'
      },
      {
        name: 'IA',
        description: 'Endpoints de Inteligencia Artificial (DeepSeek) y analítica de consumo/costos'
      }
    ],
    components: {
      schemas: {
        Nota: {
          type: 'object',
          required: ['id', 'titulo', 'contenido'],
          properties: {
            id: {
              type: 'integer',
              example: 1,
              description: 'Identificador único numérico autoincremental de la nota'
            },
            titulo: {
              type: 'string',
              example: 'Mi primera nota',
              description: 'Título de la nota (1 a 100 caracteres)'
            },
            contenido: {
              type: 'string',
              example: 'Contenido de ejemplo para la nota.',
              description: 'Contenido completo de la nota (1 a 5000 caracteres)'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación del registro'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de última actualización del registro'
            }
          }
        },
        CrearNotaInput: {
          type: 'object',
          required: ['titulo', 'contenido'],
          properties: {
            titulo: {
              type: 'string',
              example: 'Mi primera nota',
              minLength: 1,
              maxLength: 100,
              description: 'Título de la nota'
            },
            contenido: {
              type: 'string',
              example: 'Contenido de ejemplo para la nota.',
              minLength: 1,
              maxLength: 5000,
              description: 'Contenido de la nota'
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
