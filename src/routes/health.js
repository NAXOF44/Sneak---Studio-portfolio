// ═══════════════════════════════════════════════════════════════
// SNEAK STUDIO — src/routes/health.js
// Endpoint de salud del servidor.
// Render y Railway lo usan para saber si el servicio está vivo.
// ═══════════════════════════════════════════════════════════════

'use strict';

const express = require('express');
const router  = express.Router();

const { isFirebaseConfigured } = require('../config/firebase');
const { isSupabaseConfigured } = require('../config/supabase');

/**
 * GET /api/health
 * Devuelve el estado del servidor y de las integraciones.
 * Úsalo como "healthcheck" en Render/Railway.
 */
router.get('/', (req, res) => {
  const uptime = process.uptime();

  res.json({
    ok:        true,
    status:    'healthy',
    timestamp: new Date().toISOString(),
    uptime:    `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
    env:       process.env.NODE_ENV || 'development',
    services: {
      firebase: isFirebaseConfigured() ? 'configured' : 'missing env vars',
      supabase: isSupabaseConfigured() ? 'configured' : 'missing env vars',
    },
  });
});

module.exports = router;
