// ═══════════════════════════════════════════════════════════════
// SNEAK STUDIO — src/config/supabase.js
// Configuración de Supabase leída desde variables de entorno
// ═══════════════════════════════════════════════════════════════

'use strict';

const supabaseConfig = {
  url:     process.env.SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY,
};

function isSupabaseConfigured() {
  return Boolean(supabaseConfig.url && supabaseConfig.anonKey);
}

module.exports = { supabaseConfig, isSupabaseConfigured };
