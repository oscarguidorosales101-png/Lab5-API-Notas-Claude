const swaggerJSDoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API REST de Notas y Claude - Laboratorio #5',
      version: '1.0.0',
      description:
        'API REST profesional desarrollada con Express 5 para la gestión de notas en memoria. Diseñada con arquitectura modular y extensible para la posterior integración de servicios de Inteligencia Artificial (Claude API).'
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
        description: 'Endpoints para la gestión CRUD de notas en memoria'
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
