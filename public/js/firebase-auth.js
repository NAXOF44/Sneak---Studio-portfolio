import { getFirebaseApp } from '/js/firebase-config.js';

import {
  getAuth, onAuthStateChanged, signOut,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signInWithPopup, GoogleAuthProvider,
  sendPasswordResetEmail, updateProfile,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, onSnapshot, serverTimestamp }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

let auth, db, googleProvider;

async function ensureInit() {
  if (auth) return;
  const app    = await getFirebaseApp();
  auth          = getAuth(app);
  db            = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
}

const _initPromise = ensureInit();

export async function guardarPerfilFirestore(uid, datos) {
  await ensureInit();
  const ref = doc(db, 'usuarios', uid);
  const datosSeguros = { ...datos };
  if (datosSeguros.foto?.startsWith('data:')) delete datosSeguros.foto;
  await setDoc(ref, { ...datosSeguros, updatedAt: serverTimestamp() }, { merge: true });

  const snap = await getDoc(ref);
  if (snap.exists()) {
    const perfil = snap.data();
    const local = JSON.parse(localStorage.getItem('sneak_user') || '{}');
    localStorage.setItem('sneak_user', JSON.stringify({ ...local, ...perfil }));

    try {
      const nuevoArtista = perfil.username || perfil.nombre || '';
      const nuevaFoto    = perfil.foto || '';
      const cancionesSnap = await getDocs(query(collection(db, 'canciones'), where('uid', '==', uid)));
      await Promise.all(cancionesSnap.docs.map(dc =>
        updateDoc(doc(db, 'canciones', dc.id), { artista: nuevoArtista, artistaFoto: nuevaFoto })
      ));
    } catch (e) { console.warn('Sync canciones:', e); }
  }
}

export async function leerPerfilFirestore(uid) {
  await ensureInit();
  const snap = await getDoc(doc(db, 'usuarios', uid));
  return snap.exists() ? snap.data() : null;
}

export function guardarSesionLocal(firebaseUser, perfilExtra = {}) {
  const previo = JSON.parse(localStorage.getItem('sneak_user') || '{}');
  const extra  = Object.fromEntries(
    Object.entries(perfilExtra).filter(([, v]) => v !== undefined && v !== null)
  );
  const datos = {
    ...previo, ...extra,
    uid:        firebaseUser.uid,
    email:      firebaseUser.email,
    nombre:     extra.nombre   || previo.nombre   || firebaseUser.displayName || firebaseUser.email.split('@')[0],
    username:   extra.username || previo.username || (firebaseUser.displayName?.replace(/\s/g,'_').toLowerCase()) || firebaseUser.email.split('@')[0],
    foto:       ('foto' in extra) ? (extra.foto || null) : (previo.foto || firebaseUser.photoURL || null),
    onboarding: previo.onboarding === true || extra.onboarding === true || false,
  };
  localStorage.setItem('sneak_user', JSON.stringify(datos));
  return datos;
}

export function getUsuarioLocal() {
  return JSON.parse(localStorage.getItem('sneak_user') || 'null');
}

export function limpiarSesionLocal() {
  localStorage.removeItem('sneak_user');
  localStorage.removeItem('sneak_player_state');
  Object.keys(localStorage).forEach(k => {
    if (k.startsWith('sneak_') || k.startsWith('snk_')) localStorage.removeItem(k);
  });
  Object.keys(sessionStorage).forEach(k => {
    if (k.startsWith('snk_') || k.startsWith('sneak_')) sessionStorage.removeItem(k);
  });
}

export async function cerrarSesion() {
  await ensureInit();
  try { await signOut(auth); } catch (_) {}
  limpiarSesionLocal();
  window.location.href = '/login';
}

export async function iniciarObservador(callbackLogueado, callbackNoLogueado) {
  await ensureInit();
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        const perfil = await leerPerfilFirestore(firebaseUser.uid);

        

        if (perfil?.baneado === true) {
          limpiarSesionLocal();
          await signOut(auth);
          window.location.replace('/login?baneado=1');
          return;
        }
        

        guardarSesionLocal(firebaseUser, perfil || {});
      } catch (_) {
        guardarSesionLocal(firebaseUser);
      }
      if (callbackLogueado) callbackLogueado(getUsuarioLocal());

      

      

      if (!window.__snkBanWatcher) {
        window.__snkBanWatcher = onSnapshot(
          doc(db, 'usuarios', firebaseUser.uid),
          (snap) => {
            if (snap.exists() && snap.data().baneado === true) {
              limpiarSesionLocal();
              signOut(auth).catch(() => {});
              window.location.replace('/login?baneado=1');
            }
          },
          () => {} 

        );
      }
      

    } else {
      limpiarSesionLocal();
      if (callbackNoLogueado) callbackNoLogueado();
    }
  });
}

export async function getAuth_() {
  await ensureInit();
  return auth;
}

export async function getFirestoreDB() {
  await _initPromise;
  return db;
}

export {
  auth, db, googleProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
};
