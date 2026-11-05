// ═══════════════════════════════════════════════════════════════
// SNEAK STUDIO — src/routes/supabaseProxy.js
// Proxy hacia Supabase Storage
//
// ¿Por qué un proxy?
//   · La anon key de Supabase es pública, pero si en el futuro
//     necesitas usar la service_role key (para operaciones admin),
//     la llama queda en el backend y nunca llega al cliente.
//   · Puedes añadir autenticación, rate-limiting, o lógica de negocio
//     antes de que la petición llegue a Supabase.
//
// Rutas expuestas:
//   GET  /api/storage/list/:bucket        → listar archivos
//   GET  /api/storage/url/:bucket/:path   → URL pública firmada
// ═══════════════════════════════════════════════════════════════

'use strict';

const express = require('express');
const router  = express.Router();
const { supabaseConfig, isSupabaseConfigured } = require('../config/supabase');

// Importar node-fetch de forma compatible con CommonJS
let fetch;
(async () => { fetch = (await import('node-fetch')).default; })();

// ── Helper: cabeceras de autenticación para Supabase ─────────
function supabaseHeaders() {
  return {
    'apikey':        supabaseConfig.anonKey,
    'Authorization': `Bearer ${supabaseConfig.anonKey}`,
    'Content-Type':  'application/json',
  };
}

// ── Middleware: verificar que Supabase está configurado ───────
function requireSupabase(req, res, next) {
  if (!isSupabaseConfigured()) {
    return res.status(503).json({
      ok:    false,
      error: 'Supabase no está configurado en el servidor',
    });
  }
  next();
}

/**
 * GET /api/storage/list/:bucket
 * Lista los archivos de un bucket de Supabase Storage.
 *
 * Uso desde el frontend:
 *   const res = await fetch('/api/storage/list/canciones');
 *   const { data } = await res.json();
 */
router.get('/list/:bucket', requireSupabase, async (req, res, next) => {
  try {
    const { bucket } = req.params;
    const { prefix = '', limit = 100, offset = 0 } = req.query;

    const supabaseUrl = `${supabaseConfig.url}/storage/v1/object/list/${encodeURIComponent(bucket)}`;

    const supabaseRes = await fetch(supabaseUrl, {
      method:  'POST',
      headers: supabaseHeaders(),
      body:    JSON.stringify({
        prefix:  prefix,
        limit:   Number(limit),
        offset:  Number(offset),
        sortBy:  { column: 'created_at', order: 'desc' },
      }),
    });

    if (!supabaseRes.ok) {
      const err = await supabaseRes.json();
      return res.status(supabaseRes.status).json({ ok: false, error: err });
    }

    const data = await supabaseRes.json();
    res.json({ ok: true, data });

  } catch (error) {
    next(error); // Pasar al errorHandler global
  }
});

/**
 * GET /api/storage/url/:bucket/*
 * Devuelve la URL pública de un archivo en Supabase Storage.
 *
 * Uso desde el frontend:
 *   const res = await fetch('/api/storage/url/canciones/artista/tema.mp3');
 *   const { url } = await res.json();
 */
router.get('/url/:bucket/*', requireSupabase, async (req, res, next) => {
  try {
    const { bucket } = req.params;
    const filePath   = req.params[0]; // todo lo que viene después del bucket

    const publicUrl = `${supabaseConfig.url}/storage/v1/object/public/${encodeURIComponent(bucket)}/${filePath}`;

    res.json({ ok: true, url: publicUrl });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
