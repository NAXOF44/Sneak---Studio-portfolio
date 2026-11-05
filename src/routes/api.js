// ═══════════════════════════════════════════════════════════════
// SNEAK STUDIO — src/routes/api.js
// Router principal de la API. Agrupa todos los sub-routers.
// Todas las rutas aquí son accesibles en /api/*
// ═══════════════════════════════════════════════════════════════

'use strict';

const express = require('express');
const router  = express.Router();

// Sub-routers por dominio
const supabaseProxy = require('./supabaseProxy');
const healthRoutes  = require('./health');

// Montar sub-routers
router.use('/storage', supabaseProxy);  // /api/storage/*
router.use('/health',  healthRoutes);   // /api/health

/**
 * GET /api
 * Ruta raíz de la API. Útil para comprobar que el backend está vivo.
 */
router.get('/', (req, res) => {
  res.json({
    ok:      true,
    service: 'SNEAK STUDIO API',
    version: '2.0.0',
    docs:    'Ver README.md para documentación completa',
  });
});

module.exports = router;
