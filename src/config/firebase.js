// ═══════════════════════════════════════════════════════════════
// SNEAK STUDIO — src/config/firebase.js
// Configuración de Firebase leída desde variables de entorno
// ═══════════════════════════════════════════════════════════════

'use strict';

/**
 * Configuración del cliente Firebase.
 * Estas claves son "semi-públicas" por diseño de Firebase:
 * la seguridad real viene de las Firestore Security Rules y App Check.
 * Las centralizamos aquí para evitar hardcodearlas en el código fuente.
 */
const firebaseClientConfig = {
  apiKey:            process.env.FIREBASE_API_KEY,
  authDomain:        process.env.FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.FIREBASE_PROJECT_ID,
  storageBucket:     process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.FIREBASE_APP_ID,
};

/**
 * Devuelve true si todas las variables de Firebase están definidas.
 */
function isFirebaseConfigured() {
  return Object.values(firebaseClientConfig).every(Boolean);
}

module.exports = { firebaseClientConfig, isFirebaseConfigured };
