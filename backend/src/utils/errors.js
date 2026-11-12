/**
 * Clases de error personalizadas para la API REST.
 * Proporcionan una base extensible para el manejo centralizado de errores.
 */

class AppError extends Error {
  /**
   * @param {string} message - Mensaje descriptivo del error
   * @param {number} statusCode - Código de estado HTTP (400, 404, 409, 500, etc.)
   * @param {Array|null} detalles - Información adicional o lista de fallos
   */
  constructor(message, statusCode = 500, detalles = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = true;
    this.detalles = detalles;
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends AppError {
  constructor(message = 'Solicitud incorrecta', detalles = null) {
    super(message, 400, detalles);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 404);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflicto con el estado actual del recurso', detalles = null) {
    super(message, 409, detalles);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado: credenciales o sesión inválidas', detalles = null) {
    super(message, 401, detalles);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Acceso denegado: permisos insuficientes para esta operación', detalles = null) {
    super(message, 403, detalles);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Error de validación', detalles = []) {
    super(message, 400, detalles);
  }
}

module.exports = {
  AppError,
  BadRequestError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError
};
