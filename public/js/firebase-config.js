import { initializeApp, getApps, getApp }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';

let _configCache    = null;
let _firebaseApp    = null;
let _loadingPromise = null;

async function loadConfig() {
  if (_configCache) return _configCache;
  if (_loadingPromise) return _loadingPromise;

  _loadingPromise = fetch('/config/client')
    .then(res => {
      if (!res.ok) throw new Error('No se pudo obtener la configuración del servidor');
      return res.json();
    })
    .then(cfg => {
      _configCache    = cfg;
      _loadingPromise = null;
      return cfg;
    })
    .catch(err => {
      _loadingPromise = null;
      console.error('[firebase-config] Error cargando config:', err);
      throw err;
    });

  return _loadingPromise;
}

export async function getFirebaseApp() {
  if (_firebaseApp) return _firebaseApp;
  if (getApps().length > 0) { _firebaseApp = getApp(); return _firebaseApp; }

  const config = await loadConfig();
  _firebaseApp = initializeApp(config.firebase);

  

  const siteKey = '6LdHje4sAAAAABTsSFt9c7TRZm8PlruxXDGrelAz';
  
  

  const esLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);

  

  if (siteKey) {
    try {
      const { initializeAppCheck, ReCaptchaV3Provider } =
        await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-check.js');

      

      

      if (esLocal) {
        self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
        console.warn('[App Check] Entorno local detectado. Modo Debug activado.');
      }

      initializeAppCheck(_firebaseApp, {
        provider: new ReCaptchaV3Provider(siteKey),
        isTokenAutoRefreshEnabled: true,
      });

      console.log('[App Check] Inicializado exitosamente con la clave:', siteKey);
    } catch (err) {
      console.error('[App Check] Error crítico en la inicialización:', err);
    }
  }

  return _firebaseApp;
}

export async function getSupabaseConfig() {
  const config = await loadConfig();
  return config.supabase;
}

export async function getAllConfig() {
  return loadConfig();
}
