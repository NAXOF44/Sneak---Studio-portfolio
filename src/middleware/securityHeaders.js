'use strict';

function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://cdnjs.cloudflare.com https://unpkg.com https://www.google.com https://www.recaptcha.net https://recaptcha.net https://apis.google.com",
    "script-src-elem 'self' 'unsafe-inline' https://www.gstatic.com https://cdnjs.cloudflare.com https://unpkg.com https://www.google.com https://www.recaptcha.net https://apis.google.com",
    // Se añade cdn.jsdelivr.net para los estilos
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
    "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
    // Se añade cdn.jsdelivr.net para los archivos de fuentes (woff2)
    "font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    "connect-src 'self' https://unpkg.com https://www.gstatic.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firebase.googleapis.com https://firebaseinstallations.googleapis.com https://zhaskmfehdihtbnofhrw.supabase.co wss://zhaskmfehdihtbnofhrw.supabase.co https://www.google.com https://www.recaptcha.net https://recaptcha.net https://content-firebaseappcheck.googleapis.com",
    "frame-src https://www.google.com https://www.recaptcha.net https://sneak-studio-9546b.firebaseapp.com",
  ].join('; '));

  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
}

module.exports = { securityHeaders };