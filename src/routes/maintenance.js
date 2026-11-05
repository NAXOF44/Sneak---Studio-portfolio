// ═══════════════════════════════════════════════
// SNEAK STUDIO — routes/maintenance.js
// Rutas de admin para encender/apagar el mantenimiento.
//
// Endpoints:
//   GET  /api/maintenance          → estado actual
//   POST /api/maintenance/on       → activar mantenimiento
//   POST /api/maintenance/off      → desactivar mantenimiento
//
// Protegidas con MAINTENANCE_SECRET del .env
// ═══════════════════════════════════════════════════════════════

'use strict';

const { Router } = require('express');
const {
  activarMantenimiento,
  desactivarMantenimiento,
  estadoMantenimiento,
} = require('../middleware/maintenance');

const router = Router();

function checkSecret(req, res, next) {
  const secret = process.env.MAINTENANCE_SECRET;
  if (!secret) {
    const ip = req.ip || req.connection.remoteAddress;
    const esLocal = ['::1', '127.0.0.1', '::ffff:127.0.0.1'].includes(ip);
    if (!esLocal) return res.status(403).json({ error: 'Configura MAINTENANCE_SECRET en .env' });
    return next();
  }
  const clave = req.headers['x-maintenance-secret'] || req.query.secret;
  if (clave !== secret) return res.status(403).json({ error: 'Clave incorrecta' });
  next();
}

router.get('/', (req, res) => {
  res.json({ mantenimiento: estadoMantenimiento() });
});

router.post('/on', checkSecret, (req, res) => {
  activarMantenimiento();
  console.log('[Maintenance] ⚠️  Modo mantenimiento ACTIVADO');
  res.json({ mantenimiento: true, mensaje: 'Modo mantenimiento activado' });
});

router.post('/off', checkSecret, (req, res) => {
  desactivarMantenimiento();
  console.log('[Maintenance] ✅ Modo mantenimiento DESACTIVADO');
  res.json({ mantenimiento: false, mensaje: 'Modo mantenimiento desactivado' });
});

module.exports = router;
