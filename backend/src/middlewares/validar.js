const { z } = require('zod');

/**
 * Esquema Zod para la creación de una nota.
 * Cumple con las restricciones:
 * - titulo: obligatorio, string, min 1, max 100 caracteres.
 * - contenido: obligatorio, string, min 1, max 5000 caracteres.
 */
const notaSchema = z.object({
  titulo: z
    .string({
      required_error: 'El título es un campo obligatorio',
      invalid_type_error: 'El título debe ser una cadena de texto'
    })
    .trim()
    .min(1, 'El título no puede estar vacío y debe tener al menos 1 carácter')
    .max(100, 'El título no puede superar los 100 caracteres'),
  contenido: z
    .string({
      required_error: 'El contenido es un campo obligatorio',
      invalid_type_error: 'El contenido debe ser una cadena de texto'
    })
    .trim()
    .min(1, 'El contenido no puede estar vacío y debe tener al menos 1 carácter')
    .max(5000, 'El contenido no puede superar los 5000 caracteres')
});

/**
 * Middleware de orden superior para validar cualquier target (body, params, query) con Zod.
 * Reutilizable para rutas actuales y futuras integraciones (ej. Integrante B con IA).
 * 
 * @param {import('zod').ZodSchema} schema - Esquema Zod a aplicar
 * @param {'body'|'params'|'query'} [target='body'] - Propiedad del request a validar
 */
const validar = (schema, target = 'body') => {
  return (req, res, next) => {
    const data = req[target];

    // Rechazar explícitamente cuerpos no definidos o vacíos
    if (!data || (typeof data === 'object' && Object.keys(data).length === 0 && !Array.isArray(data))) {
      return res.status(400).json({
        error: 'Error de validación',
        detalles: [
          {
            campo: target,
            mensaje: `El ${target === 'body' ? 'cuerpo de la solicitud' : target} no puede estar vacío`
          }
        ]
      });
    }

    const resultado = schema.safeParse(data);

    if (!resultado.success) {
      const detalles = resultado.error.issues.map((issue) => ({
        campo: issue.path.join('.') || target,
        mensaje: issue.message
      }));

      return res.status(400).json({
        error: 'Error de validación',
        detalles
      });
    }

    // Sobrescribir con la información parseada y saneada
    req[target] = resultado.data;
    next();
  };
};

module.exports = {
  validar,
  notaSchema
};
