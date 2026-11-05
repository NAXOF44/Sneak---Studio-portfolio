// ═══════════════════════════════════════════════════════════════
// SNEAK STUDIO — src/middleware/errorHandler.js
// Middleware centralizado de manejo de errores.
// Captura cualquier error que se pase con next(error) en las rutas.
// ═══════════════════════════════════════════════════════════════

'use strict';

/**
 * Middleware de errores de Express (4 parámetros obligatorios).
 * Se registra SIEMPRE como el último middleware en server.js.
 */
function errorHandler(err, req, res, next) {
  // Loguear el error en consola del servidor (con stack en desarrollo)
  const isDev = process.env.NODE_ENV !== 'production';

  console.error(`[ERROR] ${req.method} ${req.path}`);
  console.error(`  → ${err.message}`);
  if (isDev && err.stack) {
    console.error(err.stack);
  }

  // Determinar el código HTTP apropiado
  const statusCode = err.statusCode || err.status || 500;

  // Respuesta JSON estructurada
  res.status(statusCode).json({
    ok:      false,
    error:   err.message || 'Error interno del servidor',
    // En producción no exponemos el stack trace
    ...(isDev && { stack: err.stack }),
  });
}

/**
 * Helper para crear errores con statusCode personalizado.
 * Uso: throw createError(404, 'Canción no encontrada');
 */
function createError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

module.exports = { errorHandler, createError };
