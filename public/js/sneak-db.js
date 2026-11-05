import { getFirebaseApp, getSupabaseConfig } from '/js/firebase-config.js';

import { getAuth }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  getFirestore,
  doc, setDoc, getDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, limit,
  getDocs, addDoc, increment, serverTimestamp,
  onSnapshot,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

let auth, db;
let SUPA_URL, SUPA_KEY;
const BUCKET = 'sneak-media';

let _initPromise = null;

async function ensureInit() {
  if (auth && db) return;
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    const app  = await getFirebaseApp();
    auth        = getAuth(app);
    db          = getFirestore(app);
    const supa  = await getSupabaseConfig();
    SUPA_URL    = supa.url;
    SUPA_KEY    = supa.anonKey;
  })();
  return _initPromise;
}

ensureInit().catch(e => console.error('[sneak-db] init:', e.message));

let _baneadosCache = null;
async function getBaneados() {
  if (_baneadosCache) return _baneadosCache;
  try {
    await ensureInit();
    const snap = await getDocs(collection(db, 'usuarios'));
    const set = new Set();
    snap.forEach(d => { if (d.data().baneado === true) set.add(d.id); });
    _baneadosCache = set;
    window._sneakBaneadosUids = set;
  } catch (_) {
    _baneadosCache = new Set(); 

  }
  return _baneadosCache;
}
export function invalidarCacheBaneados() { _baneadosCache = null; }

export function getUser() {
  return JSON.parse(localStorage.getItem('sneak_user') || 'null');
}

export async function getUID() {
  await ensureInit();
  return auth.currentUser?.uid || getUser()?.uid || null;
}

export async function supaUpload(file, carpeta, onProgress) {
  await ensureInit();

  const ALLOWED = {
    portadas: { exts: ['jpg','jpeg','png','webp','gif'],      mimes: ['image/jpeg','image/png','image/webp','image/gif'] },
    audios:   { exts: ['mp3','wav','ogg','flac','aac','m4a'], mimes: ['audio/mpeg','audio/wav','audio/ogg','audio/flac','audio/aac','audio/mp4','audio/x-m4a'] },
    videos:   { exts: ['mp4','webm','mov'],                   mimes: ['video/mp4','video/webm','video/quicktime'] },
    fotos:    { exts: ['jpg','jpeg','png','webp'],            mimes: ['image/jpeg','image/png','image/webp'] },
  };

  const rules = ALLOWED[carpeta];
  if (rules) {
    const ext  = file.name.split('.').pop().toLowerCase();
    const mime = file.type.toLowerCase().split(';')[0].trim();
    if (!rules.exts.includes(ext) || !rules.mimes.includes(mime))
      throw new Error(`Tipo no permitido: .${ext} / ${mime}`);
    const maxMB = (carpeta === 'audios' || carpeta === 'videos') ? 50 : 10;
    if (file.size > maxMB * 1024 * 1024) throw new Error(`Máximo ${maxMB}MB`);
  }

  const ext    = file.name.split('.').pop().toLowerCase();
  const nombre = `${carpeta}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${SUPA_URL}/storage/v1/object/${BUCKET}/${nombre}`);
    xhr.setRequestHeader('Authorization', `Bearer ${SUPA_KEY}`);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.setRequestHeader('x-upsert', 'true');
    if (onProgress)
      xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress(Math.round(e.loaded/e.total*100)); };
    xhr.onload  = () => xhr.status < 300
      ? resolve(`${SUPA_URL}/storage/v1/object/public/${BUCKET}/${nombre}`)
      : reject(new Error(`Upload ${xhr.status}: ${xhr.responseText}`));
    xhr.onerror = () => reject(new Error('Error de red'));
    xhr.send(file);
  });
}

export async function guardarPerfil(datos) {
  await ensureInit();
  const uid = await getUID(); if (!uid) throw new Error('No autenticado');
  await setDoc(doc(db, 'usuarios', uid), { ...datos, uid, updatedAt: serverTimestamp() }, { merge: true });
  localStorage.setItem('sneak_user', JSON.stringify({ ...getUser(), ...datos }));
}

export async function leerPerfil(uid) {
  await ensureInit();
  const snap = await getDoc(doc(db, 'usuarios', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function leerMiPerfil() {
  const uid = await getUID(); if (!uid) return null;
  const perfil = await leerPerfil(uid);
  if (perfil) localStorage.setItem('sneak_user', JSON.stringify({ ...getUser(), ...perfil }));
  return perfil;
}

export async function publicarCancion(datos) {
  await ensureInit();
  const uid  = await getUID(); if (!uid) throw new Error('No autenticado');
  const user = getUser();
  const item = {
    ...datos, uid,
    artista:        user?.username || user?.nombre || 'Artista',
    artistaFoto:    user?.foto || '',
    reproducciones: 0, likes: 0,
    creadoEn:       serverTimestamp(),
    actualizadoEn:  serverTimestamp(),
  };
  if (datos.id) {
    await setDoc(doc(db, 'canciones', datos.id), item, { merge: true });
    return { ...item, id: datos.id };
  }
  const id = `${uid}_${Date.now()}`;
  await setDoc(doc(db, 'canciones', id), { ...item, id });
  return { ...item, id };
}

export async function leerCancion(id) {
  await ensureInit();
  const snap = await getDoc(doc(db, 'canciones', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function leerCancionesDeUsuario(uid) {
  await ensureInit();
  const _ban = await getBaneados().catch(() => new Set());
  if (_ban.has(uid)) return [];
  try {
    const snap = await getDocs(query(collection(db, 'canciones'), where('uid','==',uid), orderBy('creadoEn','desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(c => c.activo !== false);
  } catch {
    const snap = await getDocs(query(collection(db, 'canciones'), where('uid','==',uid)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(c => c.activo !== false);
  }
}

export async function leerMisCanciones() {
  const uid = await getUID(); if (!uid) return [];
  return leerCancionesDeUsuario(uid);
}

export async function leerFeedGlobal(opciones = {}) {
  await ensureInit();
  const { tipo=null, genero=null, limite:lim=40, ordenPor='creadoEn' } = opciones;
  const filtros = [];
  if (tipo)   filtros.push(where('tipo','==',tipo));
  if (genero) filtros.push(where('genero','==',genero));
  filtros.push(orderBy(ordenPor,'desc'));
  filtros.push(limit(lim));
  const _ban = await getBaneados().catch(() => new Set());
  try {
    const snap = await getDocs(query(collection(db, 'canciones'), ...filtros));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .filter(c => c.activo !== false && !_ban.has(c.uid));
  } catch {
    const f2 = [];
    if (tipo)   f2.push(where('tipo','==',tipo));
    if (genero) f2.push(where('genero','==',genero));
    f2.push(limit(lim));
    const snap = await getDocs(query(collection(db, 'canciones'), ...f2));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .filter(c => c.activo !== false && !_ban.has(c.uid));
  }
}

export async function borrarCancion(id) {
  const uid = await getUID(); if (!uid) return;
  const c   = await leerCancion(id);
  if (c?.uid !== uid) throw new Error('Sin permiso');
  await deleteDoc(doc(db, 'canciones', id));
}

export async function editarCancion(id, cambios) {
  await ensureInit();
  await updateDoc(doc(db, 'canciones', id), { ...cambios, updatedAt: serverTimestamp() });
}

export async function registrarReproduccion(id) {
  try {
    const key = `snk_repro_${id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    await ensureInit();
    await updateDoc(doc(db, 'canciones', id), { reproducciones: increment(1) });
  } catch(_) {}
}

export async function toggleLike(cancionId) {
  await ensureInit();
  const uid = await getUID(); if (!uid) return false;
  const ref  = doc(db, 'likes', `${uid}_${cancionId}`);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await deleteDoc(ref);
    await updateDoc(doc(db, 'canciones', cancionId), { likes: increment(-1) });
    return false;
  }
  await setDoc(ref, { uid, cancionId, createdAt: serverTimestamp() });
  await updateDoc(doc(db, 'canciones', cancionId), { likes: increment(1) });
  return true;
}

export async function isLiked(cancionId) {
  await ensureInit();
  const uid = await getUID(); if (!uid) return false;
  return (await getDoc(doc(db, 'likes', `${uid}_${cancionId}`))).exists();
}

export async function getMisLikes() {
  await ensureInit();
  const uid = await getUID(); if (!uid) return [];
  const snap = await getDocs(query(collection(db, 'likes'), where('uid','==',uid)));
  return snap.docs.map(d => d.data().cancionId);
}

export async function toggleSeguir(artistaUid) {
  await ensureInit();
  const uid = await getUID();
  if (!uid || uid === artistaUid) return false;
  const ref  = doc(db, 'seguidores', `${uid}_${artistaUid}`);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await deleteDoc(ref);
    try { await updateDoc(doc(db, 'usuarios', artistaUid), { seguidores: increment(-1) }); } catch(_){}
    return false;
  }
  await setDoc(ref, { uid, artistaUid, createdAt: serverTimestamp() });
  try { await updateDoc(doc(db, 'usuarios', artistaUid), { seguidores: increment(1) }); } catch(_){}
  return true;
}

export async function isSiguiendo(artistaUid) {
  await ensureInit();
  const uid = await getUID(); if (!uid) return false;
  return (await getDoc(doc(db, 'seguidores', `${uid}_${artistaUid}`))).exists();
}

export async function getSeguidoresCount(uid) {
  await ensureInit();
  try {
    const snap = await getDocs(query(collection(db, 'seguidores'), where('artistaUid','==',uid)));
    return snap.size;
  } catch {
    const perfil = await leerPerfil(uid);
    return perfil?.seguidores || 0;
  }
}

export async function recomendar(opciones = {}) {
  const user    = getUser();
  const generos = user?.generos || [];
  const { tipo=null, limite:lim=40, topLikes=false, soloGenero=null, soloUid=null } = opciones;

  if (soloGenero) return leerFeedGlobal({ genero: soloGenero, limite: lim, tipo });
  if (topLikes)   return leerFeedGlobal({ limite: lim, ordenPor: 'likes', tipo });
  if (soloUid)    return leerCancionesDeUsuario(soloUid);

  if (generos.length > 0) {
    const resultados = await Promise.all(
      generos.slice(0,3).map(g => leerFeedGlobal({ genero: g, limite: Math.ceil(lim/generos.length), tipo }))
    );
    const vistos = new Set();
    const unicas = resultados.flat().filter(c => !vistos.has(c.id) && vistos.add(c.id));
    if (unicas.length < lim) {
      const extras = await leerFeedGlobal({ limite: lim - unicas.length, tipo });
      extras.forEach(c => { if (!vistos.has(c.id)) { vistos.add(c.id); unicas.push(c); } });
    }
    return unicas.slice(0, lim);
  }
  return leerFeedGlobal({ limite: lim, tipo });
}

export async function leerFeed(opciones = {}) {
  return leerFeedGlobal({ genero: opciones.genero, tipo: opciones.tipo, ordenPor: opciones.ordenPor, limite: opciones.maxItems });
}

export async function leerParaTi(maxItems = 40) {
  const generos = getUser()?.generos || [];
  if (!generos.length) return leerFeedGlobal({ limite: maxItems });
  const lotes  = await Promise.all(generos.slice(0,3).map(g => leerFeedGlobal({ genero: g, limite: 20 })));
  const vistos = new Set();
  const mezcla = lotes.flat().filter(c => !vistos.has(c.id) && vistos.add(c.id));
  if (mezcla.length < maxItems) {
    const extra = await leerFeedGlobal({ limite: maxItems });
    extra.forEach(c => { if (!vistos.has(c.id)) { vistos.add(c.id); mezcla.push(c); } });
  }
  return mezcla.slice(0, maxItems);
}

export async function leerMisFavoritas() {
  const ids = await getMisLikes();
  if (!ids.length) return [];
  const _ban = await getBaneados().catch(() => new Set());
  const canciones = (await Promise.all(ids.map(id => leerCancion(id)))).filter(Boolean);
  return canciones.filter(c => c.activo !== false && !_ban.has(c.uid));
}

export async function leerTopArtistas(limite = 10) {
  await ensureInit();
  try {
    const snap = await getDocs(query(collection(db, 'usuarios'), orderBy('reproducciones','desc'), limit(limite)));
    if (!snap.empty) return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch {}
  try {
    const snap = await getDocs(query(collection(db, 'usuarios'), limit(limite)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch { return []; }
}

export async function buscarCanciones(texto, limite = 40) {
  await ensureInit();
  const snap = await getDocs(query(collection(db, 'canciones'), orderBy('creadoEn','desc'), limit(200)));
  const q    = texto.toLowerCase();
  const _ban = await getBaneados().catch(() => new Set());
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(c => c.activo !== false && !_ban.has(c.uid))
    .filter(c => c.titulo?.toLowerCase().includes(q) || c.artista?.toLowerCase().includes(q))
    .slice(0, limite);
}

export function sanitize(str) {
  if (!str && str !== 0) return '';
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#x27;');
}

// ── DB DIRECTO (para queries avanzadas en páginas) ────────────
export async function getDB() {
  await ensureInit();
  return db;
}

export { db, auth, collection, query, where, orderBy, limit, getDocs, getDoc, doc, increment, updateDoc, setDoc, serverTimestamp };
