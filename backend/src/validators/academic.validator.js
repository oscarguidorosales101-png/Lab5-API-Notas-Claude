const { z } = require('zod');

/**
 * Esquemas de validación Zod para el Sistema de Gestión Académica
 */

// USUARIOS
const usuarioSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre es obligatorio' })
    .trim()
    .min(1, 'El nombre no puede estar vacío')
    .max(100, 'El nombre no puede superar los 100 caracteres'),
  apellidos: z
    .string({ required_error: 'Los apellidos son obligatorios' })
    .trim()
    .min(1, 'Los apellidos no pueden estar vacíos')
    .max(100, 'Los apellidos no pueden superar los 100 caracteres'),
  email: z
    .string({ required_error: 'El correo electrónico es obligatorio' })
    .trim()
    .email('Debe ser un correo electrónico válido')
    .max(150, 'El correo no puede superar los 150 caracteres'),
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(100, 'La contraseña no puede superar los 100 caracteres'),
  rol: z
    .enum(['ADMIN', 'DOCENTE', 'ESTUDIANTE'], {
      errorMap: () => ({ message: 'El rol debe ser ADMIN, DOCENTE o ESTUDIANTE' })
    })
    .default('ESTUDIANTE')
});

const usuarioActualizarSchema = usuarioSchema.partial();

// MATERIAS
const materiaSchema = z.object({
  codigo: z
    .string({ required_error: 'El código de materia es obligatorio' })
    .trim()
    .min(1, 'El código no puede estar vacío')
    .max(20, 'El código no puede superar los 20 caracteres'),
  nombre: z
    .string({ required_error: 'El nombre de materia es obligatorio' })
    .trim()
    .min(1, 'El nombre no puede estar vacío')
    .max(150, 'El nombre no puede superar los 150 caracteres'),
  descripcion: z.string().trim().optional(),
  creditos: z
    .number({ invalid_type_error: 'Los créditos deben ser un número entero' })
    .int('Los créditos deben ser un número entero')
    .min(1, 'Los créditos deben ser al menos 1')
    .max(30, 'Los créditos no pueden superar 30')
    .default(3),
  notaMinimaAprobatoria: z
    .number({ invalid_type_error: 'La nota mínima debe ser un número' })
    .min(0, 'La nota mínima no puede ser menor a 0')
    .max(100, 'La nota mínima no puede superar 100')
    .default(70.0)
});

const materiaActualizarSchema = materiaSchema.partial();

// PRERREQUISITOS
const prerrequisitoSchema = z.object({
  prerequisiteId: z
    .number({ required_error: 'El ID del prerrequisito es obligatorio' })
    .int('El ID del prerrequisito debe ser un entero')
    .positive('El ID del prerrequisito debe ser positivo')
});

// PERIODOS ACADÉMICOS
const periodoSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre del período es obligatorio' })
    .trim()
    .min(1, 'El nombre no puede estar vacío')
    .max(100, 'El nombre no puede superar los 100 caracteres'),
  fechaInicio: z
    .string({ required_error: 'La fecha de inicio es obligatoria' })
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Fecha de inicio inválida' }),
  fechaFin: z
    .string({ required_error: 'La fecha de fin es obligatoria' })
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Fecha de fin inválida' }),
  anio: z
    .number({ required_error: 'El año es obligatorio' })
    .int('El año debe ser un número entero')
    .min(2000, 'El año debe ser igual o superior al 2000')
    .max(2100, 'El año no puede ser superior al 2100'),
  periodo: z
    .string({ required_error: 'El período es obligatorio' })
    .trim()
    .min(1, 'El período no puede estar vacío')
    .max(20, 'El período no puede superar los 20 caracteres'),
  activo: z.boolean().default(true)
}).refine((data) => new Date(data.fechaFin) >= new Date(data.fechaInicio), {
  message: 'La fecha de finalización debe ser posterior o igual a la de inicio',
  path: ['fechaFin']
});

const periodoActualizarSchema = z.object({
  nombre: z.string().trim().min(1).max(100).optional(),
  fechaInicio: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Fecha de inicio inválida' }).optional(),
  fechaFin: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Fecha de fin inválida' }).optional(),
  anio: z.number().int().min(2000).max(2100).optional(),
  periodo: z.string().trim().min(1).max(20).optional(),
  activo: z.boolean().optional()
}).refine((data) => {
  if (data.fechaInicio && data.fechaFin) {
    return new Date(data.fechaFin) >= new Date(data.fechaInicio);
  }
  return true;
}, {
  message: 'La fecha de finalización debe ser posterior o igual a la de inicio',
  path: ['fechaFin']
});

// MATRICULAS
const matriculaSchema = z.object({
  userId: z
    .number({ required_error: 'El ID del estudiante (userId) es obligatorio' })
    .int('El ID del estudiante debe ser un número entero')
    .positive('El ID del estudiante debe ser positivo'),
  subjectId: z
    .number({ required_error: 'El ID de la materia (subjectId) es obligatorio' })
    .int('El ID de la materia debe ser un número entero')
    .positive('El ID de la materia debe ser positivo'),
  academicPeriodId: z
    .number({ required_error: 'El ID del período académico es obligatorio' })
    .int('El ID del período debe ser un número entero')
    .positive('El ID del período debe ser positivo')
});

// CALIFICACIONES
const calificacionSchema = z.object({
  nombreEvaluacion: z
    .string({ required_error: 'El nombre de la evaluación es obligatorio' })
    .trim()
    .min(1, 'El nombre de la evaluación no puede estar vacío')
    .max(100, 'El nombre no puede superar los 100 caracteres'),
  puntajeObtenido: z
    .number({ required_error: 'El puntaje obtenido es obligatorio' })
    .min(0, 'El puntaje obtenido no puede ser negativo'),
  puntajeMaximo: z
    .number({ required_error: 'El puntaje máximo es obligatorio' })
    .positive('El puntaje máximo debe ser mayor a 0'),
  porcentaje: z
    .number({ required_error: 'El porcentaje de ponderación es obligatorio' })
    .min(0.01, 'El porcentaje debe ser mayor a 0')
    .max(100, 'El porcentaje no puede superar 100'),
  fechaEvaluacion: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Fecha de evaluación inválida' })
    .optional(),
  observaciones: z.string().trim().optional()
}).refine((data) => data.puntajeObtenido <= data.puntajeMaximo, {
  message: 'El puntaje obtenido no puede ser mayor al puntaje máximo',
  path: ['puntajeObtenido']
});

const calificacionActualizarSchema = z.object({
  nombreEvaluacion: z.string().trim().min(1).max(100).optional(),
  puntajeObtenido: z.number().min(0).optional(),
  puntajeMaximo: z.number().positive().optional(),
  porcentaje: z.number().min(0.01).max(100).optional(),
  fechaEvaluacion: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Fecha de evaluación inválida' }).optional(),
  observaciones: z.string().trim().optional()
}).refine((data) => {
  if (data.puntajeObtenido !== undefined && data.puntajeMaximo !== undefined) {
    return data.puntajeObtenido <= data.puntajeMaximo;
  }
  return true;
}, {
  message: 'El puntaje obtenido no puede ser mayor al puntaje máximo',
  path: ['puntajeObtenido']
});

// TEMAS ACADÉMICOS
const temaSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre del tema es obligatorio' })
    .trim()
    .min(1, 'El nombre del tema no puede estar vacío')
    .max(100, 'El nombre no puede superar los 100 caracteres'),
  descripcion: z.string().trim().optional(),
  subjectId: z
    .number({ invalid_type_error: 'El ID de la materia debe ser un entero' })
    .int()
    .positive()
    .optional()
    .nullable()
});

const temaActualizarSchema = temaSchema.partial();

// NOTAS (AMPLIADO CON CAMPOS ACADÉMICOS OPCIONALES)
const notaAcademicaSchema = z.object({
  titulo: z
    .string({ required_error: 'El título es un campo obligatorio' })
    .trim()
    .min(1, 'El título no puede estar vacío y debe tener al menos 1 carácter')
    .max(100, 'El título no puede superar los 100 caracteres'),
  contenido: z
    .string({ required_error: 'El contenido es un campo obligatorio' })
    .trim()
    .min(1, 'El contenido no puede estar vacío y debe tener al menos 1 carácter')
    .max(5000, 'El contenido no puede superar los 5000 caracteres'),
  userId: z.number().int().positive().optional().nullable(),
  subjectId: z.number().int().positive().optional().nullable(),
  topicId: z.number().int().positive().optional().nullable()
});

module.exports = {
  usuarioSchema,
  usuarioActualizarSchema,
  materiaSchema,
  materiaActualizarSchema,
  prerrequisitoSchema,
  periodoSchema,
  periodoActualizarSchema,
  matriculaSchema,
  calificacionSchema,
  calificacionActualizarSchema,
  temaSchema,
  temaActualizarSchema,
  notaAcademicaSchema
};

