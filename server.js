// ═══════════════════════════════════════════════════════════════
// SNEAK STUDIO — server.js
// ═══════════════════════════════════════════════════════════════

'use strict';

require('dotenv').config();

const express = require('express');
const path    = require('path');

const apiRoutes    = require('./src/routes/api');
const configRoutes = require('./src/routes/config');

const { errorHandler }    = require('./src/middleware/errorHandler');
const { requestLogger }   = require('./src/middleware/requestLogger');
const { securityHeaders } = require('./src/middleware/securityHeaders');

const app  = express();
const PORT = process.env.PORT || 3000;
const HTML = path.join(__dirname, 'public', 'html');

// ── Middleware global ─────────────────────────────────────────
app.use(securityHeaders);
app.use(requestLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Archivos estáticos ────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── API y config ──────────────────────────────────────────────
app.use('/api',    apiRoutes);
app.use('/config', configRoutes);

// ── URLs limpias ──────────────────────────────────────────────
const PAGES = {
  '/':               'index.html',
  '/inicio':         'inicio.html',
  '/explorar':       'Explorar.html',
  '/biblioteca':     'Biblioteca.html',
  '/favoritas':      'Favoritas.html',
  '/creacion':       'Creacion.html',
  '/denuncia':       'Denuncia.html',
  '/crear':          'Creacion.html',
  '/perfil':         'Perfil.html',
  '/notificaciones': 'Notificaciones.html',
  '/proyectos':      'proyectos.html',
  '/cancion':        'Cancion.html',
  '/genero':         'Genero.html',
  '/radio':          'Radio.html',
  '/listas':         'Listas y Album.html',
  '/login':          'login.html',
  '/registro':       'SignUp.html',
  '/signup':         'SignUp.html',
  '/onboarding':     'Onboarding.html',
};

Object.entries(PAGES).forEach(([route, file]) => {
  app.get(route, (req, res) => {
    res.sendFile(path.join(HTML, file));
  });
});

// ── Fallback ──────────────────────────────────────────────────
app.get('*', (req, res) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/config')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(HTML, 'index.html'));
});

// ── Error handler ─────────────────────────────────────────────
app.use(errorHandler);

// ── Arrancar ─────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n OK SNEAK STUDIO corriendo en http://localhost:${PORT}`);
  console.log(`   Entorno:  ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Firebase: ${process.env.FIREBASE_PROJECT_ID || 'No configurado'}`);
  console.log(`   Supabase: ${process.env.SUPABASE_URL ? 'ok' : 'No configurado'}\n`);
  console.log('   URLs limpias activas:');
  console.log('   /inicio  /explorar  /biblioteca  /favoritas  /creacion');
  console.log('   /perfil  /notificaciones  /proyectos  /cancion  /genero\n');
});

module.exports = app;