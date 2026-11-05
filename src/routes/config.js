// ═══════════════════════════════════════════════════════════════
// SNEAK STUDIO — src/routes/config.js
// Endpoint GET /config/client
//
// El frontend llama a este endpoint UNA VEZ al arrancar para
// obtener la configuración pública. Esto elimina la necesidad
// de hardcodear claves en los archivos JS del frontend.
// ═══════════════════════════════════════════════════════════════

'use strict';

const express = require('express');
const router  = express.Router();

const { firebaseClientConfig } = require('../config/firebase');
const { supabaseConfig }       = require('../config/supabase');

/**
 * GET /config/client
 * Devuelve al frontend SOLO las claves que puede ver públicamente.
 * Las claves secretas (service_role, admin SDK) NUNCA aparecen aquí.
 */
router.get('/client', (req, res) => {
  res.json({
    firebase: {
      apiKey:            firebaseClientConfig.apiKey,
      authDomain:        firebaseClientConfig.authDomain,
      projectId:         firebaseClientConfig.projectId,
      storageBucket:     firebaseClientConfig.storageBucket,
      messagingSenderId: firebaseClientConfig.messagingSenderId,
      appId:             firebaseClientConfig.appId,
    },
    supabase: {
      url:     supabaseConfig.url,
      anonKey: supabaseConfig.anonKey,
    },
    recaptcha: {
      siteKey: process.env.RECAPTCHA_SITE_KEY,
    },
  });
});

module.exports = router;
