'use strict';

let maintenanceActive = false;

const RUTAS_EXENTAS = [
  '/html/error.html',
  '/css/error.css',
  '/img/',
  '/fonts/',
  '/api/maintenance',
  '/api/health',
];

function maintenanceMiddleware(req, res, next) {
  if (!maintenanceActive) return next();

  const estaExenta = RUTAS_EXENTAS.some(ruta => req.path.startsWith(ruta));
  if (estaExenta) return next();

  if (req.path.startsWith('/api/')) {
    return res.status(503).json({
      error: 'maintenance',
      mensaje: 'El servidor está en mantenimiento.',
    });
  }

  res.redirect(302, '/html/error.html');
}

function activarMantenimiento()    { maintenanceActive = true; }
function desactivarMantenimiento() { maintenanceActive = false; }
function estadoMantenimiento()     { return maintenanceActive; }

module.exports = {
  maintenanceMiddleware,
  activarMantenimiento,
  desactivarMantenimiento,
  estadoMantenimiento,
};
