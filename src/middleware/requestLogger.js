// ═══════════════════════════════════════════════════════════════
// SNEAK STUDIO — src/middleware/requestLogger.js
// Logger de peticiones HTTP. Muestra método, ruta, status y tiempo.
// En producción puedes sustituirlo por Morgan o Winston.
// ═══════════════════════════════════════════════════════════════

'use strict';

const COLORS = {
  reset:  '\x1b[0m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  cyan:   '\x1b[36m',
  gray:   '\x1b[90m',
};

function colorForStatus(status) {
  if (status >= 500) return COLORS.red;
  if (status >= 400) return COLORS.yellow;
  if (status >= 300) return COLORS.cyan;
  return COLORS.green;
}

function requestLogger(req, res, next) {
  // Ignorar archivos estáticos para no llenar la consola
  const isStatic = /\.(css|js|html|png|jpg|svg|ico|woff|ttf|otf|mp3|mp4)$/i.test(req.path);
  if (isStatic) return next();

  const start = Date.now();

  // Hookeamos el evento 'finish' para loguear después de la respuesta
  res.on('finish', () => {
    const ms     = Date.now() - start;
    const color  = colorForStatus(res.statusCode);
    const method = req.method.padEnd(6);
    const status = res.statusCode;

    console.log(
      `${COLORS.gray}[${new Date().toISOString()}]${COLORS.reset} ` +
      `${COLORS.cyan}${method}${COLORS.reset} ` +
      `${req.path.padEnd(40)} ` +
      `${color}${status}${COLORS.reset} ` +
      `${COLORS.gray}${ms}ms${COLORS.reset}`
    );
  });

  next();
}

module.exports = { requestLogger };
