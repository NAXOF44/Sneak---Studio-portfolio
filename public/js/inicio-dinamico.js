import { getFirestoreDB, getUsuarioLocal } from '/js/firebase-auth.js';
import {
  collection, query, where, orderBy, limit,
  getDocs, doc, getDoc, updateDoc, increment,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const SVG_PLAY = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
  fill="currentColor" class="bi bi-play-fill" viewBox="0 0 16 16">
  <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308
  c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393"/></svg>`;

const _cancionesMap = {};

async function _getDB() {
  return await getFirestoreDB();
}

document.addEventListener('DOMContentLoaded', async () => {
  const user = getUsuarioLocal();
  if (!user) return;



  const _timeout = setTimeout(() => {
    if (typeof window.__sneakReady === 'function') window.__sneakReady();
  }, 10000);



  let _baneadosUids = new Set();
  try {
    const snapBan = await getDocs(collection(await _getDB(), 'usuarios'));
    snapBan.forEach(d => { if (d.data().baneado === true) _baneadosUids.add(d.id); });
  } catch (_) { }
  window._sneakBaneadosUids = _baneadosUids;

  let todas = [], listas = [];
  try {
    const snap = await getDocs(query(
      collection(await _getDB(), 'canciones'),
      orderBy('creadoEn', 'desc'),
      limit(300)
    ));
    snap.forEach(d => {
      const c = { id: d.id, ...d.data() };
      if (c.tipo === 'lista') listas.push(c);
      else todas.push(c);
    });
  } catch (err) {
    console.warn('Firestore inicio:', err.message);
    try {
      const snap2 = await getDocs(collection(await _getDB(), 'canciones'));
      snap2.forEach(d => {
        const c = { id: d.id, ...d.data() };
        if (c.tipo === 'lista') listas.push(c);
        else todas.push(c);
      });
    } catch (err2) { console.error('Firestore error total:', err2.message); }
  }



  todas = todas.filter(c => c.activo !== false && !_baneadosUids.has(c.uid));
  listas = listas.filter(l => l.activo !== false && !_baneadosUids.has(l.uid));

  _todosTracksPool = todas.filter(c =>
    c.tipo !== 'album' && c.tipo !== 'ep' && c.tipo !== 'lista'
  );



  renderSuperGenerosAuto(todas);



  renderGrid('sec-para-ti', ordenarParaTi(todas, user));



  const enAlta = [...todas].sort((a, b) => (b.reproducciones || 0) - (a.reproducciones || 0));
  renderGrid('sec-en-alta', enAlta);



  renderListas('sec-listas', listas.slice(0, 8));



  const albumesData = [...todas]
    .filter(c => c.tipo === 'album' || c.tipo === 'ep')
    .sort((a, b) => (b.reproducciones || 0) - (a.reproducciones || 0))
    .slice(0, 20);
  albumesData.forEach(a => { _albumsMap[a.id] = a; });
  renderAlbumes('sec-generos-alta', albumesData);



  const genFav1 = user.generos?.[0] || null;
  const genFav2 = user.generos?.[1] || null;

  if (genFav1) {
    const por1 = todas.filter(c => c.genero === genFav1).slice(0, 16);
    const t1 = document.getElementById('gen-fav-titulo');
    if (t1) t1.textContent = genFav1;
    if (por1.length) renderGrid('sec-genero', por1, { generoFijo: genFav1 });
    else document.getElementById('sec-generos1-titulo')?.style.setProperty('display', 'none');
  } else {
    document.getElementById('sec-generos1-titulo')?.style.setProperty('display', 'none');
  }

  if (genFav2) {
    const por2 = todas.filter(c => c.genero === genFav2).slice(0, 16);
    const t2 = document.getElementById('gen-fav2-titulo');
    if (t2) t2.textContent = genFav2;
    if (por2.length) renderGrid('sec-genero2', por2, { generoFijo: genFav2 });
    else document.getElementById('sec-electronica-titulo')?.style.setProperty('display', 'none');
  } else {
    document.getElementById('sec-electronica-titulo')?.style.setProperty('display', 'none');
  }



  renderSeccionesGenero(todas, user);





  await renderTopArtistas(todas, 'sec-creadores');



  try {
    const snap = await getDoc(doc(await _getDB(), 'admin_config', 'inicio'));
    const cfg = snap.exists() ? snap.data() : {};
    _adminCfg = cfg;

    renderBanner(cfg.banner || null);
    renderSuperGeneros(cfg.supergeneros || []);


    const mixData = cfg.mixes?.length ? cfg.mixes : (cfg.mix ? [cfg.mix] : null);
    renderMix(mixData ? (mixData.length === 1 ? mixData[0] : mixData) : null);
    renderRadio(cfg.radio || []);
  } catch (err) {
    console.warn('admin_config:', err.message);
    renderBanner(null); renderSuperGeneros([]); renderMix(null); renderRadio([]);
  }



  const _inp = document.getElementById('buscador-input');
  if (_inp) {
    _inp.addEventListener('input', e => {
      clearTimeout(_searchTimeout);
      _searchTimeout = setTimeout(() => buscar(e.target.value.trim().toLowerCase(), todas), 200);
    });
    _inp.addEventListener('focus', e => {
      if (e.target.value.trim()) buscar(e.target.value.trim().toLowerCase(), todas);
    });
    _inp.addEventListener('keydown', e => {
      if (e.key === 'Escape') { buscar('', todas); _inp.value = ''; _inp.blur(); }
    });
  }
});

function renderSeccionesGenero(todas, user) {


  const porGenero = {};
  todas.forEach(c => {
    if (!c.genero) return;
    if (!porGenero[c.genero]) porGenero[c.genero] = [];
    porGenero[c.genero].push(c);
  });



  const genFav1 = user.generos?.[0];
  const genFav2 = user.generos?.[1];
  const yaVistos = new Set([genFav1, genFav2].filter(Boolean));



  const generos = Object.entries(porGenero)
    .filter(([gen]) => !yaVistos.has(gen))
    .sort((a, b) => b[1].length - a[1].length);

  if (!generos.length) return;



  const footer = document.querySelector('.home-section footer');
  if (!footer) return;



  const _GEN_ICONS = {
    'Pop': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1m3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10h14V4zM2 5h12v8H2z"/></svg>`,
    'Rock': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M9.293 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.707zM9.5 3.5v-2l3 3h-2a1 1 0 0 1-1-1M6.354 9.854a.5.5 0 0 1-.708-.708l2-2a.5.5 0 0 1 .708.708z"/></svg>`,
    'Electrónica': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M6 0a.5.5 0 0 1 .5.5V3h3V.5a.5.5 0 0 1 1 0V3h1a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5H10v1h1.5a.5.5 0 0 1 0 1H10v1h.5a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0V11H6v2.5a.5.5 0 0 1-1 0V11H3.5a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5H5V7H3.5a.5.5 0 0 1 0-1H5V5H4.5a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 1 0V3h.5V.5A.5.5 0 0 1 6 0"/></svg>`,
    'Hip-Hop': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M9 13c0 1.105-1.12 2-2.5 2S4 14.105 4 13s1.12-2 2.5-2 2.5.896 2.5 2m3-4c0 1.105-1.12 2-2.5 2S7 10.105 7 9s1.12-2 2.5-2 2.5.895 2.5 2"/><path fill-rule="evenodd" d="M9 3v10H8V3zm3-2v9h-1V1z"/></svg>`,
    'Jazz & Blues': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M6 13c0 1.105-1.12 2-2.5 2S1 14.105 1 13s1.12-2 2.5-2 2.5.896 2.5 2m9-2c0 1.105-1.12 2-2.5 2s-2.5-.895-2.5-2 1.12-2 2.5-2 2.5.895 2.5 2"/><path fill-rule="evenodd" d="M14 11V2h1v9zM6 3v10H5V3z"/><path d="M5 2.905a1 1 0 0 1 .9-.995l8-.8a1 1 0 0 1 1.1.995V3L5 4z"/></svg>`,
    'Latina': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M11.536 14.01A8.47 8.47 0 0 0 14.026 8a8.47 8.47 0 0 0-2.49-6.01l-.708.707A7.476 7.476 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303z"/><path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.483 5.483 0 0 1 11.025 8a5.483 5.483 0 0 1-1.61 3.89z"/><path d="M8.707 11.182A4.486 4.486 0 0 0 10.025 8a4.486 4.486 0 0 0-1.318-3.182L8 5.525A3.489 3.489 0 0 1 9.025 8 3.49 3.49 0 0 1 8 10.475zM6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325L6.188 3.61a.5.5 0 0 1 .53-.06z"/></svg>`,
    'Trap': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M6 13c0 1.105-1.12 2-2.5 2S1 14.105 1 13s1.12-2 2.5-2 2.5.896 2.5 2m9-2c0 1.105-1.12 2-2.5 2s-2.5-.895-2.5-2 1.12-2 2.5-2 2.5.895 2.5 2"/><path fill-rule="evenodd" d="M14 11V2h1v9zM6 3v10H5V3z"/><path d="M5 2.905a1 1 0 0 1 .9-.995l8-.8a1 1 0 0 1 1.1.995V3L5 4z"/></svg>`,
    'Reggaeton': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M11.536 14.01A8.47 8.47 0 0 0 14.026 8a8.47 8.47 0 0 0-2.49-6.01l-.708.707A7.476 7.476 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303z"/><path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.483 5.483 0 0 1 11.025 8a5.483 5.483 0 0 1-1.61 3.89z"/><path d="M8.707 11.182A4.486 4.486 0 0 0 10.025 8a4.486 4.486 0 0 0-1.318-3.182L8 5.525A3.489 3.489 0 0 1 9.025 8 3.49 3.49 0 0 1 8 10.475zM6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325L6.188 3.61a.5.5 0 0 1 .53-.06z"/></svg>`,
    'R&B': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314"/></svg>`,
    'K-Pop': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314"/></svg>`,
    'Country': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M6 13c0 1.105-1.12 2-2.5 2S1 14.105 1 13s1.12-2 2.5-2 2.5.896 2.5 2m9-2c0 1.105-1.12 2-2.5 2s-2.5-.895-2.5-2 1.12-2 2.5-2 2.5.895 2.5 2"/><path fill-rule="evenodd" d="M14 11V2h1v9zM6 3v10H5V3z"/><path d="M5 2.905a1 1 0 0 1 .9-.995l8-.8a1 1 0 0 1 1.1.995V3L5 4z"/></svg>`,
    'Drill': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M9 13c0 1.105-1.12 2-2.5 2S4 14.105 4 13s1.12-2 2.5-2 2.5.896 2.5 2"/><path fill-rule="evenodd" d="M9 3v10H8V3z"/><path d="M7.5 2a2 2 0 0 1 2 2H15v1H1V4h5.5a2 2 0 0 1 2-2"/></svg>`,
    'Phonk': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M8 3a5 5 0 0 0-5 5v1h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8a6 6 0 1 1 12 0v5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1V8a5 5 0 0 0-5-5"/></svg>`,
    'Salsa': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M11.536 14.01A8.47 8.47 0 0 0 14.026 8a8.47 8.47 0 0 0-2.49-6.01l-.708.707A7.476 7.476 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303z"/><path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.483 5.483 0 0 1 11.025 8a5.483 5.483 0 0 1-1.61 3.89z"/><path d="M8.707 11.182A4.486 4.486 0 0 0 10.025 8a4.486 4.486 0 0 0-1.318-3.182L8 5.525A3.489 3.489 0 0 1 9.025 8 3.49 3.49 0 0 1 8 10.475zM6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325L6.188 3.61a.5.5 0 0 1 .53-.06z"/></svg>`,
    'Bachata': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M11.536 14.01A8.47 8.47 0 0 0 14.026 8a8.47 8.47 0 0 0-2.49-6.01l-.708.707A7.476 7.476 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303z"/><path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.483 5.483 0 0 1 11.025 8a5.483 5.483 0 0 1-1.61 3.89z"/><path d="M8.707 11.182A4.486 4.486 0 0 0 10.025 8a4.486 4.486 0 0 0-1.318-3.182L8 5.525A3.489 3.489 0 0 1 9.025 8 3.49 3.49 0 0 1 8 10.475zM6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325L6.188 3.61a.5.5 0 0 1 .53-.06z"/></svg>`,
    'Afrobeats': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M6 13c0 1.105-1.12 2-2.5 2S1 14.105 1 13s1.12-2 2.5-2 2.5.896 2.5 2m9-2c0 1.105-1.12 2-2.5 2s-2.5-.895-2.5-2 1.12-2 2.5-2 2.5.895 2.5 2"/><path fill-rule="evenodd" d="M14 11V2h1v9zM6 3v10H5V3z"/><path d="M5 2.905a1 1 0 0 1 .9-.995l8-.8a1 1 0 0 1 1.1.995V3L5 4z"/></svg>`,
    'PluggnB': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M6 13c0 1.105-1.12 2-2.5 2S1 14.105 1 13s1.12-2 2.5-2 2.5.896 2.5 2m9-2c0 1.105-1.12 2-2.5 2s-2.5-.895-2.5-2 1.12-2 2.5-2 2.5.895 2.5 2"/><path fill-rule="evenodd" d="M14 11V2h1v9zM6 3v10H5V3z"/><path d="M5 2.905a1 1 0 0 1 .9-.995l8-.8a1 1 0 0 1 1.1.995V3L5 4z"/></svg>`,
    'Mexicano': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M6 13c0 1.105-1.12 2-2.5 2S1 14.105 1 13s1.12-2 2.5-2 2.5.896 2.5 2m9-2c0 1.105-1.12 2-2.5 2s-2.5-.895-2.5-2 1.12-2 2.5-2 2.5.895 2.5 2"/><path fill-rule="evenodd" d="M14 11V2h1v9zM6 3v10H5V3z"/><path d="M5 2.905a1 1 0 0 1 .9-.995l8-.8a1 1 0 0 1 1.1.995V3L5 4z"/></svg>`,
    'Romántica': `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314"/></svg>`,
  };


  const _ICO_DEFAULT = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M6 13c0 1.105-1.12 2-2.5 2S1 14.105 1 13s1.12-2 2.5-2 2.5.896 2.5 2m9-2c0 1.105-1.12 2-2.5 2s-2.5-.895-2.5-2 1.12-2 2.5-2 2.5.895 2.5 2"/><path fill-rule="evenodd" d="M14 11V2h1v9zM6 3v10H5V3z"/><path d="M5 2.905a1 1 0 0 1 .9-.995l8-.8a1 1 0 0 1 1.1.995V3L5 4z"/></svg>`;

  generos.forEach(([gen, canciones]) => {
    if (canciones.length < 2) return;

    const secId = `sec-gen-${gen.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const icono = _GEN_ICONS[gen] || _GEN_ICONS[Object.keys(_GEN_ICONS).find(k => _normGenero(k) === _normGenero(gen))] || _ICO_DEFAULT;



    const titulo = document.createElement('div');
    titulo.className = 'electronica-sec';
    titulo.innerHTML = `<h1>${gen}</h1>${icono}`;



    const wrap = document.createElement('div');
    wrap.className = 'snk-scroll-wrap';
    wrap.style.position = 'relative';

    const grid = document.createElement('div');
    grid.className = 'musicas44';
    grid.id = secId;

    wrap.appendChild(grid);
    footer.before(titulo);
    footer.before(wrap);

    renderGrid(secId, canciones, { generoFijo: gen });
  });
}

async function renderTopArtistas(todas, secId) {
  const el = document.getElementById(secId);
  if (!el) return;



  const stats = {};
  todas.forEach(c => {
    if (!c.uid) return;
    if (!stats[c.uid]) stats[c.uid] = { reproducciones: 0, likes: 0, canciones: 0 };
    stats[c.uid].reproducciones += (c.reproducciones || 0);
    stats[c.uid].likes += (c.likes || 0);
    stats[c.uid].canciones++;
  });



  let usuarios = [];
  try {
    const snap = await getDocs(collection(await _getDB(), 'usuarios'));
    const _baneadosSet = new Set();
    snap.forEach(d => { const u = { uid: d.id, ...d.data() }; if (u.baneado === true) { _baneadosSet.add(d.id); } else { usuarios.push(u); } });
    window._sneakBaneadosUids = _baneadosSet;
  } catch (err) {
    console.warn('Usuarios Firestore:', err.message);


    usuarios = Object.keys(stats).map(uid => {
      const cancion = todas.find(c => c.uid === uid);
      return { uid, username: cancion?.artista || uid, foto: cancion?.artistaFoto || '' };
    });
  }



  const ranking = usuarios
    .filter(u => u.baneado !== true)
    .map(u => ({
      uid: u.uid,
      artista: u.username || u.nombre || 'Usuario',
      artistaFoto: u.foto || '',
      reproducciones: stats[u.uid]?.reproducciones || 0,
      likes: stats[u.uid]?.likes || 0,
      canciones: stats[u.uid]?.canciones || 0,
    }))
    .filter(u => u.reproducciones >= 1)
    .sort((a, b) => b.reproducciones - a.reproducciones)
    .slice(0, 10);

  if (!ranking.length) {
    el.innerHTML = `<div class="creat" style="padding:20px;color:#444;font-size:13px">
      Sin artistas todavía.</div>`;
    return;
  }

  el.innerHTML = ranking.map((a, i) => `
    <div class="creat" style="cursor:pointer"
      onclick="window.location.href='/perfil?uid=${a.uid}&artista=${encodeURIComponent(a.artista)}'">
      <div class="img-creat">
        <img src="${a.artistaFoto || '/img/porfile.jpeg'}"
          onerror="this.src='/img/porfile.jpeg'" alt="${a.artista}"
          data-uid="${a.uid}" class="artista-foto-top">
      </div>
      <div class="info-creat">
        <div class="nom-creat">
          <h1>${a.artista}</h1>
          <span style="font-size:10px;font-weight:700">#${i + 1}</span>
        </div>
        <div class="num-segui">
          <div class="cant-segui"><p>${fmtNum(a.reproducciones)}</p></div>
          <div class="seguidores-text"><p>reproducciones</p></div>
        </div>
      </div>
    </div>`).join('');
}

function ocultarSeccionAdmin(el) {
  el.style.display = 'none';


  const titulo = el.previousElementSibling;
  if (titulo) titulo.style.display = 'none';
}

let _adminCfg = {};

window._playSuperGenero = async function (idx) {
  const sg = _adminCfg.supergeneros?.[idx];
  if (!sg) return;

  const canciones = sg.canciones_data || [];
  if (!canciones.length) {


    if (sg.link && sg.link !== '#') window.location.href = sg.link;
    return;
  }



  if (typeof window.cargarCola === 'function') {
    window.cargarCola(canciones, 0);
  }
};

window._playMix = function () {
  const mix = (_mixItems && _mixItems.length) ? _mixItems[_mixActivo] : _adminCfg.mix;
  if (!mix) return;
  const canciones = mix.canciones_data || [];
  if (!canciones.length) {
    if (mix.link && mix.link !== '#') window.location.href = mix.link;
    return;
  }
  if (typeof window.cargarCola === 'function') window.cargarCola(canciones, 0);
};

window._playRadioItem = function (idx) {
  const item = _adminCfg.radio?.[idx];
  if (!item) return;

  const canciones = item.canciones_data || [];
  if (canciones.length) {
    if (typeof window.cargarCola === 'function') {
      window.cargarCola(canciones, 0);
    }
  } else if (item.link && item.link !== '#') {
    window.location.href = item.link;
  }
};

const _defaultSlides = [
  {
    imagen: '/img/banner-1-alt.png', link: '/creacion',
    titulo: 'Diseña el Sonido\nque Imagina tu Mente.', subtitulo: 'Encuentra el equipo profesional que necesitas, desde guitarras clásicas hasta sintetizadores de última generación...',
    btnTexto: 'Empezar a crear', btnBg: '#FF6200', btnColor: '#000'
  },
  {
    imagen: '/img/banner-2.png', link: '/explorar',
    titulo: 'Donde la creatividad\nse convierte en melodía.', subtitulo: 'Lleva tus pistas al siguiente nivel con nuestras herramientas de mezcla, masterización y distribución global...',
    btnTexto: 'Explorar ahora', btnBg: '#fff', btnColor: '#000'
  },
  {
    imagen: '/img/banner-3.png', link: '/biblioteca',
    titulo: 'Toda la música que\namas, en un solo lugar.', subtitulo: 'Sumérgete en un universo sonoro sin límites donde puedes explorar millones de canciones de todos los géneros...',
    btnTexto: 'Ver biblioteca', btnBg: '#ffffff', btnColor: '#00000'
  },
];
let _bannerTimer = null;
let _bannerIdx = 0;
let _bannerSlides = [];

function renderBanner(b) {
  const el = document.getElementById('sec-banner');
  if (!el) return;

  if (b?.tipo === 'codigo' && b.html) { el.innerHTML = b.html; return; }

  if (b && Array.isArray(b) && b[0]?.imagen) {
    _bannerSlides = b;
  } else {

    let saved = null;
    try { saved = JSON.parse(localStorage.getItem('sneak_banner_slides')); } catch (_) { }
    if (saved?.length) {
      _bannerSlides = saved;
    } else if (b?.slides?.length) {
      _bannerSlides = b.slides;
    } else if (b?.imagen) {
      _bannerSlides = [b, ..._defaultSlides.slice(1)];
    } else {
      _bannerSlides = _defaultSlides;
    }
  }



  (function () {

    const track = document.querySelector('#sec-generos-alta');

    if (!track) return;
    if (track.dataset.snkDone) return;

    track.dataset.snkDone = '1';

    const wrapper = track.parentElement;

    if (!wrapper) return;



    if (getComputedStyle(wrapper).position === 'static') {
      wrapper.style.position = 'relative';
    }



    track.style.scrollbarWidth = 'none';
    track.style.msOverflowStyle = 'none';

    if (!document.getElementById('snk-scroll-hide-generos')) {

      const style = document.createElement('style');

      style.id = 'snk-scroll-hide-generos';

      style.textContent = `
      #sec-generos-alta::-webkit-scrollbar{
        display:none;
      }
    `;

      document.head.appendChild(style);
    }



    const SVG_L = `
    <svg xmlns="http://www.w3.org/2000/svg"
         width="16"
         height="16"
         fill="currentColor"
         viewBox="0 0 16 16">
      <path fill-rule="evenodd"
            d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
    </svg>
  `;

    const SVG_R = `
    <svg xmlns="http://www.w3.org/2000/svg"
         width="16"
         height="16"
         fill="currentColor"
         viewBox="0 0 16 16">
      <path fill-rule="evenodd"
            d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
    </svg>
  `;

    const BTN_STYLE = `
    position:absolute;
    top:42%;
    transform:translateY(-50%);
    background:rgba(20,20,20,.95);
    border:none;
    color:#fff;
    cursor:pointer;
    width:34px;
    height:34px;
    border-radius:50%;
    display:flex;
    align-items:center;
    justify-content:center;
    z-index:10;
    transition:opacity .2s;
    box-shadow:0 2px 10px rgba(0,0,0,.6);
  `;



    const btnL = document.createElement('button');

    btnL.setAttribute('aria-label', 'Anterior');

    btnL.innerHTML = SVG_L;

    btnL.style.cssText =
      BTN_STYLE +
      'left:6px;opacity:0;pointer-events:none;';



    const btnR = document.createElement('button');

    btnR.setAttribute('aria-label', 'Siguiente');

    btnR.innerHTML = SVG_R;

    btnR.style.cssText =
      BTN_STYLE +
      'right:6px;opacity:1;';



    function updateBtns() {

      const sl = track.scrollLeft;
      const maxSl = track.scrollWidth - track.clientWidth;

      btnL.style.opacity =
        sl > 8 ? '1' : '0';

      btnL.style.pointerEvents =
        sl > 8 ? 'auto' : 'none';

      btnR.style.opacity =
        sl < maxSl - 8 ? '1' : '0';

      btnR.style.pointerEvents =
        sl < maxSl - 8 ? 'auto' : 'none';
    }



    btnL.addEventListener('click', function () {

      track.scrollBy({
        left: -300,
        behavior: 'smooth'
      });
    });

    btnR.addEventListener('click', function () {

      track.scrollBy({
        left: 300,
        behavior: 'smooth'
      });
    });



    track.addEventListener(
      'scroll',
      updateBtns,
      { passive: true }
    );



    wrapper.appendChild(btnL);
    wrapper.appendChild(btnR);



    setTimeout(updateBtns, 150);







    if (!track.dataset.snkDrag) {

      track.dataset.snkDrag = '1';

      let isDown = false;
      let startX;
      let scrollStart;

      track.addEventListener('mousedown', function (e) {

        if (e.button !== 0) return;

        isDown = true;

        startX = e.pageX - track.offsetLeft;
        scrollStart = track.scrollLeft;

        track.style.cursor = 'grabbing';
        track.style.userSelect = 'none';
      });

      document.addEventListener('mouseup', function () {

        if (!isDown) return;

        isDown = false;

        track.style.cursor = '';
        track.style.userSelect = '';
      });

      track.addEventListener('mouseleave', function () {

        if (!isDown) return;

        isDown = false;

        track.style.cursor = '';
        track.style.userSelect = '';
      });

      track.addEventListener('mousemove', function (e) {

        if (!isDown) return;

        e.preventDefault();

        const x = e.pageX - track.offsetLeft;
        const walk = (x - startX) * 1.2;

        track.scrollLeft = scrollStart - walk;
      });
    }

  })();

  if (!document.getElementById('__banner_carousel_css')) {
    const s = document.createElement('style');
    s.id = '__banner_carousel_css';
    s.textContent = `
      .hero-banner{position:relative;overflow:hidden;border-radius:20px;height:clamp(175px,25vw,340px);background:#111;cursor:pointer;margin-bottom:36px;user-select:none}
      .b-slide{position:absolute;inset:0;opacity:0;transition:opacity .9s cubic-bezier(.4,0,.2,1);pointer-events:none}
      .b-slide.active{opacity:1;pointer-events:auto}
      .b-slide img{width:100%;height:100%;object-fit:cover;display:block;transition:transform 9s ease;transform-origin:center}
      .b-slide.active img{transform:scale(1.06)}
      .b-slide::after{content:'';position:absolute;inset:0;background:linear-gradient(105deg,rgba(0,0,0,.82) 0%,rgba(0,0,0,.35) 55%,transparent 82%);pointer-events:none}
      .b-text{position:absolute;top:50%;left:clamp(20px,4vw,52px);transform:translateY(-50%);z-index:2;max-width:min(740px,58%)}
      .b-text h2{font-family:'sneak','Archivo Black',sans-serif;font-size:clamp(28px,4.2vw,62px);line-height:.97;margin-bottom:4px;color:#fff;letter-spacing:-1.5px;text-shadow:0 3px 24px rgba(0,0,0,.65)}
      .b-text p{font-size:clamp(12px,1.1vw,15px);color:rgba(255,255,255,.85);margin-bottom:20px;line-height:1.5;max-width:400px}
      .b-btn{display:inline-flex;align-items:center;gap:8px;padding:clamp(10px,1.3vw,14px) clamp(20px,2.6vw,32px);font-weight:800;font-size:clamp(12px,1.1vw,15px);border:none;border-radius:100px;cursor:pointer;transition:transform .2s,box-shadow .2s;white-space:nowrap}
      .b-btn:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(0,0,0,.45)}
      .b-dots{position:absolute;bottom:14px;right:18px;display:flex;gap:7px;z-index:3}
      .b-dot{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.35);border:none;cursor:pointer;transition:background .3s,transform .3s,width .3s;padding:0}
      .b-dot.active{background:#fff;transform:scale(1.2);width:22px;border-radius:4px}
      .b-arrows{position:absolute;top:50%;transform:translateY(-50%);width:100%;display:flex;justify-content:space-between;padding:0 14px;z-index:3;pointer-events:none}
      .b-arrow{pointer-events:auto;background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.18);backdrop-filter:blur(8px);color:#fff;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;opacity:0;transition:opacity .2s,background .2s;font-size:14px}
      .hero-banner:hover .b-arrow{opacity:1}
      .b-arrow:hover{background:rgba(255,255,255,.18)}
      @media(max-width:900px){.b-text{max-width:70%}.b-text h2{font-size:clamp(22px,5vw,38px)}}
      @media(max-width:768px){.b-text{max-width:78%}.b-text h2{font-size:clamp(20px,5.5vw,34px)}.b-text p{font-size:clamp(11px,2vw,13px)}.b-arrows{display:none}.hero-banner{border-radius:14px}}
      @media(max-width:480px){.hero-banner{height:clamp(165px,48vw,230px);border-radius:12px}.b-text{max-width:86%;left:16px}.b-text h2{font-size:clamp(18px,6.5vw,28px)}.b-text p{font-size:12px;max-width:100%;-webkit-line-clamp:2;display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden}.b-btn{font-size:11px;padding:8px 16px}}
    `;
    document.head.appendChild(s);
  }

  const n = _bannerSlides.length;
  el.innerHTML =
    _bannerSlides.map((slide, i) => `
      <div class="b-slide${i === 0 ? ' active' : ''}" id="b-slide-${i}">
        <img src="${slide.imagen || '/img/banner-1.jpeg'}"
             onerror="this.src='/img/banner-1.jpeg'" alt="">
        <div class="b-text">
          <h2>${(slide.titulo || '').replace(/\n/g, '<br>')}</h2>
          <p>${slide.subtitulo || ''}</p>
          ${slide.btnTexto ? `<button class="b-btn"
            style="background:${slide.btnBg || '#FF6200'};color:${slide.btnColor || '#000'}"
            onclick="event.stopPropagation();window.location.href='${slide.link || '#'}'">
            ${slide.btnTexto}
          </button>` : ''}
        </div>
      </div>`).join('') +
    `<div class="b-dots">${_bannerSlides.map((_, i) => `<button class="b-dot${i === 0 ? ' active' : ''}" id="b-dot-${i}" onclick="event.stopPropagation();_bannerGoTo(${i})"></button>`).join('')}</div>` +
    `<div class="b-arrows">
      <button class="b-arrow" onclick="event.stopPropagation();_bannerGoTo((_bannerIdx-1+${n})%${n})"><i class="fas fa-chevron-left"></i></button>
      <button class="b-arrow" onclick="event.stopPropagation();_bannerGoTo((_bannerIdx+1)%${n})"><i class="fas fa-chevron-right"></i></button>
    </div>`;

  el.onclick = () => { const s = _bannerSlides[_bannerIdx]; if (s?.link && s.link !== '#') window.location.href = s.link; };

  _startBannerAuto();
}

window._bannerGoTo = function (idx) {
  const slides = document.querySelectorAll('.b-slide');
  const dots = document.querySelectorAll('.b-dot');
  if (!slides.length) return;
  slides[_bannerIdx]?.classList.remove('active');
  dots[_bannerIdx]?.classList.remove('active');
  _bannerIdx = ((idx % slides.length) + slides.length) % slides.length;
  slides[_bannerIdx]?.classList.add('active');
  dots[_bannerIdx]?.classList.add('active');
  _startBannerAuto();
};

function _startBannerAuto() {
  if (_bannerTimer) clearInterval(_bannerTimer);
  if (_bannerSlides.length < 2) return;
  _bannerTimer = setInterval(() => window._bannerGoTo((_bannerIdx + 1) % _bannerSlides.length), 5500);
}

const SVG_SG_PLAY = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393"/></svg>`;
const SVG_SG_PAUSE = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5m5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5"/></svg>`;
let _sgActivoIdx = null;
const _sgCancionesCache = {};

const _SG_GENEROS = [
  { nombre: 'Pop', img: '/img/Pop.jpeg' },
  { nombre: 'Rock', img: '/img/Rock.jpeg' },
  { nombre: 'Electrónica', img: '/img/Electronica.jpeg' },
  { nombre: 'Hip-Hop', img: '/img/Hip-Hop.jpeg' },
  { nombre: 'Jazz & Blues', img: '/img/Jazz.jpeg' },
  { nombre: 'Latina', img: '/img/Latina.jpeg' },
  { nombre: 'Country', img: '/img/Country.jpeg' },
  { nombre: 'Afrobeats', img: '/img/Afrobeats.jpeg' },
  { nombre: 'K-Pop', img: '/img/K-Pop.jpeg' },
  { nombre: 'Salsa', img: '/img/Salsa.jpeg' },
  { nombre: 'Bachata', img: '/img/Bachata.jpeg' },
  { nombre: 'Drill', img: '/img/Drill.jpeg' },
  { nombre: 'PluggnB', img: '/img/PluggnB.jpeg' },
  { nombre: 'Phonk', img: '/img/Phonk.jpeg' },
  { nombre: 'Mexicano', img: '/img/Mexicano.jpeg' },
  { nombre: 'R&B', img: '/img/RnB.jpeg' },
  { nombre: 'Trap', img: '/img/Trap.jpeg' },
  { nombre: 'Reggaeton', img: '/img/Reggaeton.jpeg' },
  { nombre: 'Romántica', img: '/img/Romantica.jpeg' },
];

function _normGenero(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[-_&\s]+/g, '')
    .trim();
}

const _SG_IMG_MAP = {
  'Pop': '/img/Pop.jpeg',
  'Rock': '/img/Rock.jpeg',
  'Electrónica': '/img/Electronica.jpeg',
  'Hip-Hop': '/img/Hip-Hop.jpeg',
  'Hip-hop': '/img/Hip-Hop.jpeg',
  'Jazz & Blues': '/img/Jazz.jpeg',
  'Jazz y Blues': '/img/Jazz.jpeg',
  'Jazz Blues': '/img/Jazz.jpeg',
  'Latina': '/img/Latina.jpeg',
  'Música Latina': '/img/Latina.jpeg',
  'Country': '/img/Country.jpeg',
  'Afrobeats': '/img/Afrobeats.jpeg',
  'K-Pop': '/img/K-Pop.jpeg',
  'Salsa': '/img/Salsa.jpeg',
  'Bachata': '/img/Bachata.jpeg',
  'Drill': '/img/Drill.jpeg',
  'PluggnB': '/img/PluggnB.jpeg',
  'Phonk': '/img/Phonk.jpeg',
  'Mexicano': '/img/Mexicano.jpeg',
  'Regional Mexicano': '/img/Mexicano.jpeg',
  'R&B': '/img/RnB.jpeg',
  'Trap': '/img/Trap.jpeg',
  'Reggaeton': '/img/Reggaeton.jpeg',
  'Romántica': '/img/Romantica.jpeg',
  'Romantica': '/img/Romantica.jpeg',
  'Rap': '/img/Rap.jpeg',
  'Funk': '/img/Funk.jpeg',
  'Soul': '/img/RnB.jpeg',
  'Lo-fi': '/img/Latina.jpeg',
  'Cumbia': '/img/Latina.jpeg',
  'Flamenco': '/img/Latina.jpeg',
  'Tango': '/img/Latina.jpeg',
  'Merengue': '/img/Latina.jpeg',
  'Blues': '/img/Jazz.jpeg',
  'Bossa Nova': '/img/Jazz.jpeg',
  'Clásica': '/img/Jazz.jpeg',
  'Metal': '/img/Rock.jpeg',
  'Punk': '/img/Rock.jpeg',
  'Indie': '/img/Rock.jpeg',
  'Folk': '/img/Country.jpeg',
  'House': '/img/Electronica.jpeg',
  'Techno': '/img/Electronica.jpeg',
  'Drum & Bass': '/img/Electronica.jpeg',
  'Ambient': '/img/Electronica.jpeg',
  'Corridos': '/img/Mexicano.jpeg',
  'Banda': '/img/Mexicano.jpeg',
};

function _imgParaGenero(gen) {
  if (_SG_IMG_MAP[gen]) return _SG_IMG_MAP[gen];
  const norm = _normGenero(gen);
  for (const [key, val] of Object.entries(_SG_IMG_MAP)) {
    if (_normGenero(key) === norm) return val;
  }
  return '/img/home-banner.png';
}

(function () {
  if (document.getElementById('__sg_new_css')) return;
  const s = document.createElement('style');
  s.id = '__sg_new_css';
  s.textContent = `
    /* ── Super-Géneros carrusel ── */
    .sg-carousel-wrap { position: relative; margin-top: 8px; }
    .sg-track {
      display: flex; gap: 14px; overflow-x: auto;
      scroll-behavior: smooth; scrollbar-width: none;
      -webkit-overflow-scrolling: touch; scroll-snap-type: x mandatory;
      padding: 4px 4px 14px;
    }
    .sg-track::-webkit-scrollbar { display: none; }
    /* flechas */
    .sg-arrow {
      display: none;
      position: absolute; top: 50%; transform: translateY(-60%);
      z-index: 10; width: 36px; height: 36px; border-radius: 50%;
      background: rgba(20,20,20,.85); border: 1px solid rgba(255,255,255,.18);
      backdrop-filter: blur(8px); color: #fff; font-size: 13px; cursor: pointer;
      align-items: center; justify-content: center; transition: background .2s;
    }
    .sg-arrow.visible { display: flex; }
    .sg-arrow:hover { background: rgba(255,98,0,.85); }
    .sg-prev { left: 6px; }
    .sg-next { right: 6px; }
    /* tarjeta */
    .sg-card {
      flex: 0 0 auto; scroll-snap-align: start; position: relative;
      border-radius: 16px; overflow: hidden; cursor: pointer;
      width: clamp(220px,28vw,340px); aspect-ratio: 16/9; background: #111;
      transition: transform .22s ease, box-shadow .22s ease;
    }
    .sg-card:hover { transform: translateY(-3px); box-shadow: 0 14px 36px rgba(0,0,0,.7); }
    .sg-card img {
      width: 100%; height: 100%; object-fit: cover; display: block;
      transition: filter .3s ease, transform 6s ease;
      filter: brightness(.6) saturate(1.15);
    }
    .sg-card:hover img { filter: brightness(.45) saturate(1.35); transform: scale(1.05); }
    .sg-card-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,.88) 0%, rgba(0,0,0,.18) 55%, transparent 100%);
      pointer-events: none;
    }
    .sg-badge {
      position: absolute; top: 11px; left: 11px;
      background: rgba(0,0,0,.6); backdrop-filter: blur(8px);
      border-radius: 50px; padding: 4px 10px;
      font-size: 10px; font-weight: 700; color: #fff;
      display: flex; align-items: center; gap: 5px; z-index: 3;
    }
    .sg-info-btn {
      position: absolute; top: 11px; right: 11px;
      width: 26px; height: 26px; border-radius: 50%;
      background: rgba(0,0,0,.55); backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,.2);
      color: #fff; font-size: 11px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; z-index: 3; transition: background .2s;
    }
    .sg-info-btn:hover { background: rgba(255,255,255,.18); }
    .sg-nombre {
      position: absolute; bottom: 44px; left: 14px; right: 14px;
      margin-bottom: 7px;
      font-size: clamp(20px,3vw,32px); font-weight: 900; color: #fff;
      letter-spacing: -0.5px; line-height: 1.05; z-index: 3;
      text-shadow: 0 2px 10px rgba(0,0,0,.7); cursor: pointer;
    }
    .sg-subgen {
      font-size: 11px; font-weight: 400; opacity: .7;
      margin-top: 4px; white-space: nowrap; overflow: hidden;
      text-overflow: ellipsis; letter-spacing: 0;
    }
    .sg-play-btn {
      position: absolute; bottom: 11px; left: 14px;
      background: rgba(0,0,0,.7); 
      border:none;
      color: #fff; border-radius: 50px; padding: 5px 14px;
      font-size: 11px; font-weight: 700; cursor: pointer;
      display: flex; align-items: center; gap: 6px; z-index: 3;
      transition: background .2s, border-color .2s, transform .15s;
      backdrop-filter: blur(6px);
    }
    .sg-play-btn:hover { background: rgba(255,255,255,.15); border-color: rgba(255,255,255,.5); transform: scale(1.03); }
    .sg-play-btn.playing { background: rgba(255,98,0,.9); border-color: transparent; color: #000; }
    .sg-wave { display: flex; align-items: center; gap: 2px; height: 13px; }
    .sg-wave span {
      display: inline-block; width: 3px; border-radius: 2px;
      background: currentColor; animation: sg-wave-anim 0.8s ease-in-out infinite;
    }
    .sg-wave span:nth-child(1){ height:4px; animation-delay:0s }
    .sg-wave span:nth-child(2){ height:10px; animation-delay:.15s }
    .sg-wave span:nth-child(3){ height:7px; animation-delay:.3s }
    .sg-wave span:nth-child(4){ height:12px; animation-delay:.45s }
    @keyframes sg-wave-anim { 0%,100%{transform:scaleY(.5)} 50%{transform:scaleY(1)} }
    @media(max-width:768px){
      .sg-card { width: clamp(190px,62vw,270px); aspect-ratio: 4/3; }
      .sg-nombre { font-size: clamp(17px,5vw,24px); bottom: 40px; }
    }
    @media(max-width:480px){
      .sg-card { width: clamp(170px,80vw,250px); aspect-ratio: 1/1; }
    }
  `;
  document.head.appendChild(s);
})();

const _SUBGENERO_PADRE = {
  'Música Latina': 'Latina', 'Cumbia': 'Latina', 'Flamenco': 'Latina',
  'Tango': 'Latina', 'Merengue': 'Latina',
  'Regional Mexicano': 'Mexicano', 'Corridos': 'Mexicano', 'Banda': 'Mexicano',
  'Metal': 'Rock', 'Punk': 'Rock', 'Indie': 'Rock',
  'House': 'Electrónica', 'Techno': 'Electrónica', 'Drum & Bass': 'Electrónica', 'Ambient': 'Electrónica',
  'Soul': 'R&B', 'Lo-fi': 'R&B',
  'Jazz Blues': 'Jazz & Blues', 'Jazz y Blues': 'Jazz & Blues', 'Bossa Nova': 'Jazz & Blues', 'Blues': 'Jazz & Blues',
  'Folk': 'Country',
  'Clásica': 'Jazz & Blues',
};

function _padreDeGenero(gen) {
  return _SUBGENERO_PADRE[gen] || null;
}

function renderSuperGenerosAuto(todasCanciones) {
  const el = document.getElementById('sec-supergeneros');
  if (!el) return;

  const porGenero = {};
  todasCanciones.forEach(c => {
    if (!c.genero || c.tipo === 'lista' || c.tipo === 'album' || c.tipo === 'ep') return;
    const padre = _padreDeGenero(c.genero);
    const clave = padre || c.genero;
    if (!porGenero[clave]) porGenero[clave] = { canciones: [], subgeneros: new Set() };
    porGenero[clave].canciones.push(c);
    if (padre) porGenero[clave].subgeneros.add(c.genero);
  });

  const genRanking = Object.entries(porGenero)
    .map(([gen, data]) => ({
      gen,
      canciones: data.canciones.sort((a, b) => (b.reproducciones || 0) - (a.reproducciones || 0)),
      totalRepros: data.canciones.reduce((s, c) => s + (c.reproducciones || 0), 0),
      subgeneros: [...data.subgeneros],
    }))
    .filter(g => g.canciones.length >= 1)
    .sort((a, b) => b.totalRepros - a.totalRepros)
    .slice(0, 15);

  if (!genRanking.length) { ocultarSeccionAdmin(el); return; }

  genRanking.forEach(g => { _sgCancionesCache[g.gen] = g.canciones; });
  el.innerHTML =
    `<div class="sg-carousel-wrap">
      <button class="sg-arrow sg-prev" id="sg-arrow-prev" onclick="_sgScroll(-1)" aria-label="Anterior"><i class="fas fa-chevron-left"></i></button>
      <div class="sg-track" id="sg-track">${genRanking.map((g, i) => {
      const img = _imgParaGenero(g.gen);
      const subLabel = g.subgeneros.length ? `<div class="sg-subgen">${g.subgeneros.slice(0, 3).join(' · ')}</div>` : '';
      return `
    <div class="sg-card" id="sg-card-${i}">
      <img src="${img}" onerror="this.src='/img/home-banner.png'" alt="${g.gen}">
      <div class="sg-badge">
        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="currentColor" viewBox="0 0 16 16">
          <path d="M6 13c0 1.105-1.12 2-2.5 2S1 14.105 1 13s1.12-2 2.5-2 2.5.896 2.5 2m9-2c0 1.105-1.12 2-2.5 2s-2.5-.895-2.5-2 1.12-2 2.5-2 2.5.895 2.5 2"/>
          <path fill-rule="evenodd" d="M14 11V2h1v9zM6 3v10H5V3z"/>
          <path d="M5 2.905a1 1 0 0 1 .9-.995l8-.8a1 1 0 0 1 1.1.995V3L5 4z"/>
        </svg>
        ${g.canciones.length} Canciones
      </div>
      <div class="sg-info-btn" onclick="event.stopPropagation();window.location.href='/html/Genero.html?genero=${encodeURIComponent(g.gen)}'">i</div>
      <div class="sg-nombre" onclick="window.location.href='/html/Genero.html?genero=${encodeURIComponent(g.gen)}'">${g.gen}${subLabel}</div>
      <button class="sg-play-btn" id="sg-play-btn-${i}"
        onclick="event.stopPropagation();_toggleSuperGenero(${i},'${g.gen}')">
        <span id="sg-play-ico-${i}">${SVG_SG_PLAY}</span>
        <span id="sg-play-lbl-${i}">Reproducir</span>
      </button>
    </div>`;
    }).join('')}</div>
      <button class="sg-arrow sg-next" id="sg-arrow-next" onclick="_sgScroll(1)" aria-label="Siguiente"><i class="fas fa-chevron-right"></i></button>
    </div>`;

  setTimeout(function () {
    var track = document.getElementById('sg-track');
    var prev = document.getElementById('sg-arrow-prev');
    var next = document.getElementById('sg-arrow-next');
    if (!track) return;
    function updateArrows() {
      var sl = track.scrollLeft;
      var max = track.scrollWidth - track.clientWidth;
      if (prev) prev.classList.toggle('visible', sl > 8);
      if (next) next.classList.toggle('visible', sl < max - 8);
    }
    track.addEventListener('scroll', updateArrows, { passive: true });
    track.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault(); track.scrollLeft += e.deltaY;
      }
    }, { passive: false });
    setTimeout(updateArrows, 100);
  }, 50);
}

function renderSuperGeneros(lista) {

  return;
  const top6 = lista.slice(0, 6).map((g, i) => ({
    gen: g.titulo || g.genero || `Género ${i + 1}`,
    canciones: g.canciones_data || [],
    totalRepros: g.reproducciones || 0,
    imagen: g.imagen || null,
  }));
  top6.forEach(g => {
    if (g.canciones.length) _sgCancionesCache[g.gen] = g.canciones;
  });
  el.innerHTML = `<div class="sg-grid">${top6.map((g, i) => {
    const img = g.imagen || _SG_IMG_MAP[g.gen] || '/img/home-banner.png';
    return `
    <div class="sg-card" id="sg-card-${i}">
      <img src="${img}" onerror="this.src='/img/home-banner.png'" alt="${g.gen}">
      <div class="sg-card-overlay"></div>
      <div class="sg-badge">
        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="currentColor" viewBox="0 0 16 16"><path d="M6 13c0 1.105-1.12 2-2.5 2S1 14.105 1 13s1.12-2 2.5-2 2.5.896 2.5 2m9-2c0 1.105-1.12 2-2.5 2s-2.5-.895-2.5-2 1.12-2 2.5-2 2.5.895 2.5 2"/><path fill-rule="evenodd" d="M14 11V2h1v9zM6 3v10H5V3z"/><path d="M5 2.905a1 1 0 0 1 .9-.995l8-.8a1 1 0 0 1 1.1.995V3L5 4z"/></svg>
        ${g.canciones.length} Canciones
      </div>
      <div class="sg-info-btn" onclick="event.stopPropagation();window.location.href='/html/Genero.html?genero=${encodeURIComponent(g.gen)}'">i</div>
      <div class="sg-nombre" onclick="window.location.href='/html/Genero.html?genero=${encodeURIComponent(g.gen)}'">${g.gen}</div>
      <button class="sg-play-btn" id="sg-play-btn-${i}"
        onclick="event.stopPropagation();_toggleSuperGenero(${i},'${g.gen}')">
        <span id="sg-play-ico-${i}">${SVG_SG_PLAY}</span>
        <span id="sg-play-lbl-${i}">Reproducir</span>
      </button>
    </div>`;
  }).join('')}</div>`;
}

window._sgScroll = function (dir) {
  var track = document.getElementById('sg-track');
  if (!track) return;
  var card = track.querySelector('.sg-card');
  var amount = card ? card.offsetWidth + 16 : 280;
  track.scrollBy({ left: dir * amount, behavior: 'smooth' });
};

window._toggleSuperGenero = function (idx, genero) {
  let canciones = genero && _sgCancionesCache[genero]
    ? _sgCancionesCache[genero].filter(c => c.audio)
    : (_adminCfg.supergeneros?.[idx]?.canciones_data || []);

  if (_sgActivoIdx === idx && typeof window._togglePlayerPause === 'function') {
    window._togglePlayerPause();
    return;
  }



  if (_sgActivoIdx !== null) {
    const prevBtn = document.getElementById(`sg-play-btn-${_sgActivoIdx}`);
    const prevIco = document.getElementById(`sg-play-ico-${_sgActivoIdx}`);
    const prevLbl = document.getElementById(`sg-play-lbl-${_sgActivoIdx}`);
    if (prevBtn) prevBtn.classList.remove('playing');
    if (prevIco) prevIco.innerHTML = SVG_SG_PLAY;
    if (prevLbl) prevLbl.textContent = 'Reproducir';
  }

  _sgActivoIdx = idx;
  const btn = document.getElementById(`sg-play-btn-${idx}`);
  const ico = document.getElementById(`sg-play-ico-${idx}`);
  const lbl = document.getElementById(`sg-play-lbl-${idx}`);
  if (btn) btn.classList.add('playing');
  if (ico) ico.innerHTML = `<span class="sg-wave"><span></span><span></span><span></span><span></span></span>`;
  if (lbl) lbl.textContent = 'Reproduciendo';

  if (!canciones.length) {
    window.location.href = `../html/Genero.html?genero=${encodeURIComponent(genero || '')}`;
    return;
  }
  if (typeof window.cargarCola === 'function') window.cargarCola(canciones, 0);
};
window._playSuperGenero = window._toggleSuperGenero;

window._onSgPauseChange = function (isPaused) {
  if (_sgActivoIdx === null) return;
  const btn = document.getElementById(`sg-play-btn-${_sgActivoIdx}`);
  const ico = document.getElementById(`sg-play-ico-${_sgActivoIdx}`);
  const lbl = document.getElementById(`sg-play-lbl-${_sgActivoIdx}`);
  if (isPaused) {
    if (btn) btn.classList.remove('playing');
    if (ico) ico.innerHTML = SVG_SG_PLAY;
    if (lbl) lbl.textContent = 'Reproducir';
  } else {
    if (btn) btn.classList.add('playing');
    if (ico) ico.innerHTML = `<span class="sg-wave"><span></span><span></span><span></span><span></span></span>`;
    if (lbl) lbl.textContent = 'Reproduciendo';
  }
};

let _mixItems = [];

let _mixActivo = 0;

function renderMix(mix) {
  const el = document.getElementById('sec-mix');
  if (!el) return;
  if (!mix) { ocultarSeccionAdmin(el); return; }



  _mixItems = Array.isArray(mix) ? mix : [mix];
  _mixActivo = 0;
  _renderMixSlide(el);
}

function _renderMixSlide(el) {
  const mix = _mixItems[_mixActivo];
  if (!mix) return;
  const total = _mixItems.length;

  el.innerHTML = `
    <div class="bar-sup-colab" style="position:relative">
      <div class="super-colab-bg"><div class="conten-sup-colab"><div class="img-super-colab">
        <img src="${mix.imagen || '/img/home-banner.png'}"
          onerror="this.src='/img/home-banner.png'" alt="${mix.titulo || ''}">
        <div class="play-prev-sup-colab" onclick="_playMix()" style="cursor:pointer">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-caret-right-fill" viewBox="0 0 16 16">
            <path d="m12.14 8.753-5.482 4.796c-.646.566-1.658.106-1.658-.753V3.204a1 1 0 0 1 1.659-.753l5.48 4.796a1 1 0 0 1 0 1.506z"/>
          </svg>
        </div>
      </div></div></div>
      <div class="conten-user-info">
        <div class="tit-super-colab"><h1>${mix.titulo || '#1 Mix'}</h1></div>
        <div class="disc-p-super-calab"><p style= "
        color: #fffff">${mix.descripcion || ''}</p></div>
        <div class="tags-sup-colab">${(mix.tags || []).map(t => `<a href=""><p>#${t}</p></a>`).join('')}</div>
        <div class="users-sup-colab">
          <div class="user-images-sup-colab">
            ${(mix.artistas || []).slice(0, 3).map((a, i) => `
              <div class="user-colab${i + 1}">
                <a href="${a.link || '#'}">
                  <img src="${a.foto || '/img/porfile.jpeg'}"
                    onerror="this.src='/img/porfile.jpeg'" alt="${a.nombre || ''}">
                </a>
              </div>`).join('')}
          </div>
          <div class="users-names-colab">
            ${(mix.artistas || []).map((a, i, arr) => `
              <div class="user-name-colab${i + 1}"><a href="${a.link || '#'}">${a.nombre || ''}</a></div>
              ${i < arr.length - 1 ? '<div class="com-user">,</div>' : ''}`).join('')}
          </div>
        </div>
        ${total > 1 ? `
        <div style="display:flex;align-items:center;gap:12px;margin-top:14px">
          <button onclick="_mixPrev()"
            style="background:rgba(0,0,0,.2);border:1px solid rgba(0,0,0,.15);border-radius:50%;width:30px;height:30px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#000;font-size:13px">
            <i class="fas fa-chevron-left"></i>
          </button>
          <div style="display:flex;gap:6px">
            ${_mixItems.map((_, j) => `<div onclick="_mixIr(${j})"
              style="width:8px;height:8px;border-radius:50%;background:${j === _mixActivo ? '#FF6200' : 'rgba(0,0,0,.2)'};cursor:pointer;transition:background .2s"></div>`).join('')}
          </div>
          <button onclick="_mixNext()"
            style="background:rgba(0,0,0,.2);border:1px solid rgba(0,0,0,.15);border-radius:50%;width:30px;height:30px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#000;font-size:13px">
            <i class="fas fa-chevron-right"></i>
          </button>
          <span style="font-size:11px;color:rgba(0,0,0,.4)">${_mixActivo + 1}/${total}</span>
        </div>` : ''}
      </div>
    </div>`;
}

window._mixNext = function () {
  const el = document.getElementById('sec-mix');
  _mixActivo = (_mixActivo + 1) % _mixItems.length;
  _renderMixSlide(el);
};
window._mixPrev = function () {
  const el = document.getElementById('sec-mix');
  _mixActivo = (_mixActivo - 1 + _mixItems.length) % _mixItems.length;
  _renderMixSlide(el);
};
window._mixIr = function (idx) {
  const el = document.getElementById('sec-mix');
  _mixActivo = idx;
  _renderMixSlide(el);
};

function renderRadio(items) {
  const el = document.getElementById('sec-radio');
  if (!el) return;
  if (!items.length) { ocultarSeccionAdmin(el); return; }
  el.innerHTML = items.map((item, i) => `
    <div class="conten-list" style="cursor:pointer;position:relative">
      <div class="img-list-radio" style="position:relative" onclick="_playRadioItem(${i})">
        <img src="${item.imagen || ''}" onerror="this.src='/img/TOP- LIST.jpeg'" alt="${item.titulo}">
        <div style="position:absolute;top:6px;right:6px;background:rgba(0,0,0,.6);backdrop-filter:blur(6px);border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .2s"
          onclick="event.stopPropagation();_irARadio(${i})"
          title="Ver canciones">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-list-ul" viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m-3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2"/>
        </svg>
        </div>
      </div>
      <div class="text-nom-list" onclick="_irARadio(${i})" style="cursor:pointer">
        <div class="tit-selec"><h1>${item.titulo}</h1></div>
        <div class="nom-expli"><p>${item.descripcion || ''}</p></div>
      </div>
    </div>`).join('');

}

window._irARadio = function (i) {
  const item = (_adminCfg.radio || [])[i];
  if (!item) return;
  try { sessionStorage.setItem('sneak_radio_item', JSON.stringify({ idx: i, ...item })); } catch (_) { }
  window.location.href = '/radio?radio=' + i;
};

window._verRadioItem = function (i) {
  const item = (_adminCfg.radio || [])[i]; if (!item) return;
  const modal = document.getElementById('modal-radio-canciones'); if (!modal) return;
  document.getElementById('modal-radio-titulo').textContent = item.titulo || 'Radio';
  const lista = document.getElementById('modal-radio-lista');
  const canciones = item.canciones_data || [];
  if (!canciones.length) {
    lista.innerHTML = '<p style="color:#888;font-size:13px;text-align:center;padding:24px 0">Sin canciones en esta entrada.</p>';
  } else {
    lista.innerHTML = canciones.map((c, ci) => `
      <div onclick="_playRadioDesdeModal(${i},${ci})"
        style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.06);cursor:pointer"
        onmouseover="this.style.background='rgba(255,255,255,.04)'"
        onmouseout="this.style.background='transparent'">
        <span style="color:#555;font-size:12px;min-width:20px;text-align:center">${ci + 1}</span>
        <img src="${c.portada || ''}" onerror="this.style.display='none'" alt=""
          style="width:38px;height:38px;border-radius:6px;object-fit:cover;background:#1e1e1e;flex-shrink:0">
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${(c.titulo || '—').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
          <div style="font-size:11px;color:#888;margin-top:2px">${(c.artista || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        </div>
        <i class="fas fa-play" style="color:#555;font-size:12px;flex-shrink:0"></i>
      </div>`).join('');
  }
  document.getElementById('modal-radio-play').onclick = () => {
    _playRadioItem(i);
    modal.style.display = 'none';
  };
  modal.style.display = 'flex';
};

window._playRadioDesdeModal = function (radioIdx, cancionIdx) {
  const item = (_adminCfg.radio || [])[radioIdx]; if (!item) return;
  const canciones = item.canciones_data || []; if (!canciones.length) return;
  if (typeof window.cargarCola === 'function') window.cargarCola(canciones, cancionIdx);
  document.getElementById('modal-radio-canciones').style.display = 'none';
};

let _todosTracksPool = [];

function ordenarParaTi(canciones, user) {
  const gens = user?.generos || [];
  const soloTracks = canciones.filter(c =>
    c.tipo !== 'album' && c.tipo !== 'ep' && c.tipo !== 'lista'
  );
  return soloTracks.map(c => ({
    ...c,
    _s: (gens.includes(c.genero) ? 40 : 0)
      + Math.random() * 10
      + Math.min((c.reproducciones || 0) / 10000, 10)
  })).sort((a, b) => b._s - a._s).map(({ _s, ...c }) => c);
}

const _SNK_L = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/></svg>';
const _SNK_R = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/></svg>';

function _snkAddBtns(track) {
  if (!track || track._snkDone) return;
  track._snkDone = true;
  const wrapper = track.parentElement;
  if (!wrapper) return;

  const btnL = document.createElement('button');
  btnL.setAttribute('aria-label', 'Anterior');
  btnL.innerHTML = _SNK_L;
  btnL.style.cssText = 'position:absolute;left:4px;top:50%;transform:translateY(-50%);background:rgba(20,20,20,.95);border:none;color:#fff;cursor:pointer;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;z-index:1000;opacity:0;transition:opacity .2s;box-shadow:0 2px 10px rgba(0,0,0,.6);pointer-events:none;';

  const btnR = document.createElement('button');
  btnR.setAttribute('aria-label', 'Siguiente');
  btnR.innerHTML = _SNK_R;
  btnR.style.cssText = 'position:absolute;right:4px;top:50%;transform:translateY(-50%);background:rgba(20,20,20,.95);border:none;color:#fff;cursor:pointer;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;z-index:1000;transition:opacity .2s;box-shadow:0 2px 10px rgba(0,0,0,.6);';

  function update() {
    const sl = track.scrollLeft;
    const max = track.scrollWidth - track.clientWidth;
    btnL.style.opacity = sl > 8 ? '1' : '0';
    btnL.style.pointerEvents = sl > 8 ? 'auto' : 'none';
    btnR.style.opacity = sl < max - 8 ? '1' : '0';
    btnR.style.pointerEvents = sl < max - 8 ? 'auto' : 'none';
  }

  btnL.addEventListener('click', () => track.scrollBy({ left: -300, behavior: 'smooth' }));
  btnR.addEventListener('click', () => track.scrollBy({ left: 300, behavior: 'smooth' }));
  track.addEventListener('scroll', update, { passive: true });
  setTimeout(update, 150);

  wrapper.appendChild(btnL);
  wrapper.appendChild(btnR);
}

function renderGrid(secId, canciones, opts) {
  const el = document.getElementById(secId);
  if (!el) return;
  const generoFijo = opts?.generoFijo || null;



  let soloTracks = canciones.filter(c =>
    c.tipo !== 'album' && c.tipo !== 'ep' && c.tipo !== 'lista'
  );



  if (generoFijo) {
    soloTracks = soloTracks.filter(c => c.genero === generoFijo)
      .sort((a, b) => (b.reproducciones || 0) - (a.reproducciones || 0));
    if (!soloTracks.length) {
      el.innerHTML = `<p style="padding:24px 20px;color:#444;font-size:13px">Sin canciones de ${generoFijo} todavía.</p>`;
      return;
    }
    const MIN_TRACKS_GENERO = 32;

    let listaFinal = [...soloTracks];



    if (listaFinal.length < MIN_TRACKS_GENERO && _todosTracksPool.length) {
      const idsEnLista = new Set(listaFinal.map(c => c.id));
      const extras = _todosTracksPool
        .filter(c => c.genero === generoFijo && !idsEnLista.has(c.id) &&
          c.tipo !== 'album' && c.tipo !== 'ep' && c.tipo !== 'lista')
        .sort((a, b) => (b.reproducciones || 0) - (a.reproducciones || 0))
        .slice(0, MIN_TRACKS_GENERO - listaFinal.length);
      listaFinal = [...listaFinal, ...extras];
    }



    const restoGenero = listaFinal.length % 4;
    if (restoGenero !== 0) {
      const idsEnLista = new Set(listaFinal.map(c => c.id));
      const extras = _todosTracksPool
        .filter(c => c.genero === generoFijo && !idsEnLista.has(c.id) &&
          c.tipo !== 'album' && c.tipo !== 'ep' && c.tipo !== 'lista')
        .slice(0, 4 - restoGenero);
      listaFinal = [...listaFinal, ...extras];
    }
    let html = '';
    for (let i = 0; i < listaFinal.length; i += 4) {
      const g = listaFinal.slice(i, i + 4);
      if (g.length === 4) html += `<div class="mus-sec"><div class="musicas">${g.map(c => cardCancion(c, secId)).join('')}</div></div>`;
    }
    el.innerHTML = html || `<p style="padding:24px 20px;color:#444;font-size:13px">Sin canciones de ${generoFijo} todavía.</p>`;
    _snkAddBtns(el);
    return;
  }



  if (!soloTracks.length) {
    el.innerHTML = `<p style="padding:24px 20px;color:#444;font-size:13px">Sin canciones todavía.</p>`;
    return;
  }

  const MIN_TRACKS = 32;

  let listaFinal = [...soloTracks];

  if (listaFinal.length < MIN_TRACKS && _todosTracksPool.length) {
    const idsEnLista = new Set(listaFinal.map(c => c.id));
    const user = getUsuarioLocal();
    const gens = user?.generos || [];
    const candidatos = _todosTracksPool
      .filter(c => !idsEnLista.has(c.id) &&
        c.tipo !== 'album' && c.tipo !== 'ep' && c.tipo !== 'lista')
      .map(c => ({
        ...c,
        _s: (gens.includes(c.genero) ? 40 : 0) + Math.min((c.reproducciones || 0) / 10000, 10)
      }))
      .sort((a, b) => a._s - b._s)

      .map(({ _s, ...c }) => c);
    listaFinal = [...listaFinal, ...candidatos.slice(0, MIN_TRACKS - listaFinal.length)];
  }



  const resto = listaFinal.length % 4;
  if (resto !== 0 && _todosTracksPool.length) {
    const idsEnLista = new Set(listaFinal.map(c => c.id));
    const extras = _todosTracksPool.filter(c =>
      !idsEnLista.has(c.id) && c.tipo !== 'album' && c.tipo !== 'ep' && c.tipo !== 'lista'
    ).slice(0, 4 - resto);
    listaFinal = [...listaFinal, ...extras];
  }

  let html = '';
  for (let i = 0; i < listaFinal.length; i += 4) {
    const grupo = listaFinal.slice(i, i + 4);
    if (grupo.length === 4) {
      html += `<div class="mus-sec"><div class="musicas">${grupo.map(c => cardCancion(c, secId)).join('')}</div></div>`;
    }
  }
  el.innerHTML = html || `<p style="padding:24px 20px;color:#444;font-size:13px">Sin canciones todavía.</p>`;
  _snkAddBtns(el);
}

const SVG_PLAY_CARD = `<svg id="song-ico-SONG_ID" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#ffffff" class="bi bi-play-fill card-play-ico" viewBox="0 0 16 16" style="color:#fff">
  <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393"/></svg>`;
const SVG_PAUSE_CARD = `<svg id="song-ico-SONG_ID" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#ffffff" class="bi bi-pause-fill card-play-ico" viewBox="0 0 16 16" style="color:#fff">
  <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5m5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5"/></svg>`;

let _cancionActivaId = null;

let _cancionActivaUid = null;

function cardCancion(c, secId) {
  _cancionesMap[c.id] = c;
  const user = getUsuarioLocal();
  const esMio = user && (c.uid === user.uid || c.artista === (user.username || user.nombre));
  const pURL = esMio
    ? '/perfil'
    : `../html/Perfil.html?uid=${c.uid || ''}&artista=${encodeURIComponent(c.artista || '')}`;





  const uid = `${secId}__${c.id}`;
  const icoHtml = SVG_PLAY_CARD.replace(/SONG_ID/g, uid);

  return `
    <div class="music1" id="song-card-${uid}" data-song-id="${c.id}" onclick="window._playFromMap('${c.id}','${uid}')" style="cursor:pointer">
      <div class="music2">
        <div class="tit-img">
          ${icoHtml}
          <img src="${c.portada || '/img/home-banner.png'}"
            onerror="this.src='/img/home-banner.png'" alt="">
          <h1>${(c.titulo || '—').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</h1>
        </div>
        <div class="tags">
          ${(c.tags || []).slice(0, 3).map(t => `<p><a href="">#${t}</a></p>`).join('')}
        </div>
        <div class="perf">
          <img src="${c.artistaFoto || '/img/porfile.jpeg'}"
            onerror="this.src='/img/porfile.jpeg'" alt="">
          <p>
            <a href="${pURL}" onclick="event.stopPropagation()"
              style="text-decoration:underline;color:inherit;cursor:pointer">
              ${(c.artista || 'Artista').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
            </a>
          </p>
        </div>
      </div>
    </div>`;
}

function _actualizarIconoUid(uid, pausado) {
  const card = document.getElementById(`song-card-${uid}`);
  if (!card) return;
  const ico = card.querySelector('.card-play-ico');
  if (ico) ico.outerHTML = (pausado ? SVG_PLAY_CARD : SVG_PAUSE_CARD).replace(/SONG_ID/g, uid);
  if (pausado) card.classList.remove('song-playing');
  else card.classList.add('song-playing');
}

function _resetearIconoUid(uid, songId) {
  const card = document.getElementById(`song-card-${uid}`);
  if (!card) return;
  const ico = card.querySelector('.card-play-ico');
  if (ico) ico.outerHTML = SVG_PLAY_CARD.replace(/SONG_ID/g, uid);
  card.classList.remove('song-playing');
}

window._playFromMap = async function (id, uid) {
  const c = _cancionesMap[id];
  if (!c) return;



  if (_cancionActivaUid === uid && typeof window._togglePlayerPause === 'function') {
    window._togglePlayerPause();
    return;
  }



  if (_cancionActivaUid) {
    _resetearIconoUid(_cancionActivaUid, _cancionActivaId);
  }


  if (_cancionActivaId) {
    document.querySelectorAll(`[data-song-id="${_cancionActivaId}"]`).forEach(card => {
      const cardUid = card.id.replace('song-card-', '');
      if (cardUid !== uid) {
        const ico = card.querySelector('.card-play-ico');
        if (ico) ico.outerHTML = SVG_PLAY_CARD.replace(/SONG_ID/g, cardUid);
        card.classList.remove('song-playing');
      }
    });
  }

  _cancionActivaId = id;
  _cancionActivaUid = uid;



  _actualizarIconoUid(uid, false);

  try { updateDoc(doc(await _getDB(), 'canciones', String(id)), { reproducciones: increment(1) }); } catch (_) { }
  if (typeof window.reproducirCancion === 'function') window.reproducirCancion(c);
};

window._onSongPauseChange = function (isPaused) {
  if (!_cancionActivaId) return;
  document.querySelectorAll(`[data-song-id="${_cancionActivaId}"]`).forEach(card => {
    const cardUid = card.id.replace('song-card-', '');
    const ico = card.querySelector('.card-play-ico');
    if (ico) ico.outerHTML = (isPaused ? SVG_PLAY_CARD : SVG_PAUSE_CARD).replace(/SONG_ID/g, cardUid);
    if (isPaused) card.classList.remove('song-playing');
    else card.classList.add('song-playing');
  });


};

window._onSongChange = function (newId) {


  if (_cancionActivaId) {
    document.querySelectorAll(`[data-song-id="${_cancionActivaId}"]`).forEach(card => {
      const cardUid = card.id.replace('song-card-', '');
      const ico = card.querySelector('.card-play-ico');
      if (ico) ico.outerHTML = SVG_PLAY_CARD.replace(/SONG_ID/g, cardUid);
      card.classList.remove('song-playing');
    });
  }
  _cancionActivaId = newId || null;
  _cancionActivaUid = null;


  if (newId) {
    document.querySelectorAll(`[data-song-id="${newId}"]`).forEach(card => {
      const cardUid = card.id.replace('song-card-', '');
      const ico = card.querySelector('.card-play-ico');
      if (ico) ico.outerHTML = SVG_PAUSE_CARD.replace(/SONG_ID/g, cardUid);
      card.classList.add('song-playing');
    });
  }
};

const _albumsMap = {};
let _albumActivoId = null;

const SVG_ALBUM_PLAY = `<i class="fas fa-play"></i>`;
const SVG_ALBUM_PAUSE = `<i class="fas fa-pause"></i>`;

function renderAlbumes(secId, albumes) {
  const el = document.getElementById(secId);
  if (!el) return;
  if (!albumes.length) {


    const titulo = el.previousElementSibling;
    if (titulo) titulo.style.display = 'none';
    el.style.display = 'none';
    return;
  }

  el.style.cssText = 'display:flex;overflow-x:auto;gap:16px;padding:8px 4px 20px;scroll-behavior:smooth;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none;';

  el.innerHTML = albumes.map(a => `
    <div style="flex:0 0 auto;width:clamp(150px,18vw,200px);scroll-snap-align:start;cursor:pointer"
         onclick="window.location.href='/html/Cancion.html?id=${a.id}'"
         id="album-box-${a.id}">
      <div style="position:relative;margin-bottom:10px">
        <img src="${a.portada || '/img/home-banner.png'}"
             onerror="this.src='/img/home-banner.png'"
             alt="${(a.titulo || '').replace(/"/g, '&quot;')}"
             style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:12px;display:block;transition:filter .2s"
             onmouseenter="this.style.filter='brightness(.75)'"
             onmouseleave="this.style.filter=''">
        <button id="album-play-btn-${a.id}"
          onclick="event.stopPropagation();_toggleAlbum('${a.id}')"
          style="position:absolute;bottom:8px;right:8px;background:rgb(0, 0, 0);border:none;color:#ffff;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;opacity:0;transform:translateY(4px);transition:opacity .2s,transform .2s;font-size:13px"
          onmouseenter="this.style.opacity='1';this.style.transform='translateY(0)'"
          onmouseleave="this.style.opacity='0';this.style.transform='translateY(4px)'">
          ${SVG_ALBUM_PLAY}
        </button>
      </div>
      <p style="font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#fff;margin-bottom:3px">${(a.titulo || '—').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
      <p style="font-size:11px;color:#666">${(a.tipo || 'Álbum').toUpperCase()} · ${a.fecha || ''}</p>
    </div>`).join('');
}

window._toggleAlbum = function (albumId) {
  const a = _albumsMap[albumId];
  if (!a) return;



  if (_albumActivoId === albumId && typeof window._togglePlayerPause === 'function') {
    window._togglePlayerPause();
    return;
  }



  if (_albumActivoId) {
    const prevBtn = document.getElementById(`album-play-btn-${_albumActivoId}`);
    if (prevBtn) prevBtn.innerHTML = SVG_ALBUM_PLAY;
  }

  _albumActivoId = albumId;
  const btn = document.getElementById(`album-play-btn-${albumId}`);
  if (btn) btn.innerHTML = SVG_ALBUM_PAUSE;



  const canciones = a.tracksAudio?.length
    ? a.tracksAudio.map((audio, i) => ({
      id: `${a.id}_tr_${i}`,
      titulo: a.tracks?.[i] || `Pista ${i + 1}`,
      audio,
      portada: a.portada || '',
      artista: a.artista || '',
      artistaFoto: a.artistaFoto || '',
    })).filter(c => c.audio)
    : [];

  if (!canciones.length) {
    window.location.href = `../html/Cancion.html?id=${albumId}`;
    return;
  }
  if (typeof window.cargarCola === 'function') window.cargarCola(canciones, 0);
};

window._onAlbumPauseChange = function (isPaused) {
  if (!_albumActivoId) return;
  const btn = document.getElementById(`album-play-btn-${_albumActivoId}`);
  if (btn) btn.innerHTML = isPaused ? SVG_ALBUM_PLAY : SVG_ALBUM_PAUSE;
};

const _listasMap = {};

function renderListas(id, listas) {
  const el = document.getElementById(id);
  if (!el) return;


  const soloListas = listas.filter(l => l.tipo === 'lista' || l.generadaHoy === true);
  if (!soloListas.length) return;

  soloListas.forEach(l => { _listasMap[l.id] = l; });

  el.innerHTML = soloListas.map(l => `
    <div class="listas" id="lista-card-${l.id}"
      onclick="window.location.href='/html/Cancion.html?id=${l.id}'"
      style="cursor:pointer">
      <div class="box"></div><div class="box1"></div>
      <div class="img-lis">
        <img src="${l.portada || '/img/home-banner.png'}"
          onerror="this.src='/img/home-banner.png'" alt="${l.titulo}">
      </div>
      <div class="paly-ic" id="lista-ico-${l.id}"
        onclick="event.stopPropagation();window._playLista('${l.id}')">
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" viewBox="0 0 16 16">
          <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393"/>
        </svg>
      </div>
    </div>`).join('');
}

const SVG_PLAY_BTN = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" viewBox="0 0 16 16">
  <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393"/>
</svg>`;
const SVG_PAUSE_BTN = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" viewBox="0 0 16 16">
  <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5m5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5"/>
</svg>`;

let _listaActivaId = null;

let _listaPlayingIdx = 0;

window._playLista = function (listaId) {
  const lista = _listasMap[listaId];
  if (!lista) return;



  if (_listaActivaId === listaId && typeof window._togglePlayerPause === 'function') {
    window._togglePlayerPause();
    return;
  }



  const canciones = _construirColaDeLista(lista);
  if (!canciones.length) {
    console.warn('Esta lista no tiene canciones con audio.');
    return;
  }



  if (_listaActivaId) {
    const prevIco = document.getElementById(`lista-ico-${_listaActivaId}`);
    if (prevIco) prevIco.innerHTML = SVG_PLAY_BTN;
    const prevCard = document.getElementById(`lista-card-${_listaActivaId}`);
    if (prevCard) prevCard.classList.remove('lista-playing');
  }

  _listaActivaId = listaId;
  _listaPlayingIdx = 0;



  const ico = document.getElementById(`lista-ico-${listaId}`);
  const card = document.getElementById(`lista-card-${listaId}`);
  if (ico) ico.innerHTML = SVG_PAUSE_BTN;
  if (card) card.classList.add('lista-playing');



  if (typeof window.cargarCola === 'function') {
    window.cargarCola(canciones, 0);
  }



  window._onListaTrackChange = function (idx) {
    _listaPlayingIdx = idx;
  };
};

window._onPlayerPauseChange = function (isPaused) {
  if (!_listaActivaId) return;
  const ico = document.getElementById(`lista-ico-${_listaActivaId}`);
  if (ico) ico.innerHTML = isPaused ? SVG_PLAY_BTN : SVG_PAUSE_BTN;
};

window._onListaTerminada = function () {
  if (!_listaActivaId) return;
  const ico = document.getElementById(`lista-ico-${_listaActivaId}`);
  const card = document.getElementById(`lista-card-${_listaActivaId}`);
  if (ico) ico.innerHTML = SVG_PLAY_BTN;
  if (card) card.classList.remove('lista-playing');
  _listaActivaId = null;
};

function _construirColaDeLista(lista) {


  if (lista.tracksAudio?.length) {
    return lista.tracksAudio
      .map((audio, i) => ({
        id: `${lista.id}_track_${i}`,
        titulo: lista.tracks?.[i] || `Pista ${i + 1}`,
        audio,
        portada: lista.portada || '',
        artista: lista.artista || '',
        artistaFoto: lista.artistaFoto || '',
      }))
      .filter(c => c.audio);

  }



  if (lista.tracks?.length) {
    return lista.tracks
      .map(titulo => Object.values(_cancionesMap).find(c => c.titulo === titulo))
      .filter(Boolean);
  }

  return [];
}

let _searchPanel = null;
let _searchTimeout = null;

function _initSearchPanel() {
  if (_searchPanel) return _searchPanel;



  if (!document.getElementById('__sp_css')) {
    const s = document.createElement('style');
    s.id = '__sp_css';
    s.textContent = `
      .busqueda { position: relative; }
      #sp-panel {
        position: absolute; top: calc(100% + 8px); left: 0; right: 60px;
        background: #1c1c1c; border: 1px solid rgba(255,255,255,.1);
        border-radius: 14px; z-index: 9999;
        box-shadow: 0 20px 60px rgba(0,0,0,.85);
        max-height: 70vh; overflow-y: auto;
        scrollbar-width: thin; scrollbar-color: #333 transparent;
      }
      #sp-panel::-webkit-scrollbar { width: 4px; }
      #sp-panel::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
      .sp-sec { padding: 14px 18px 8px; }
      .sp-sec-title { font-size: 10px; font-weight: 700; text-transform: uppercase;
        letter-spacing: 1.5px; color: #777; margin-bottom: 8px; }
      .sp-best {
        display: flex; align-items: center; gap: 14px;
        padding: 12px 14px; border-radius: 10px;
        background: rgba(255,255,255,.05); cursor: pointer;
        transition: background .15s; margin-bottom: 6px;
      }
      .sp-best:hover { background: rgba(255,255,255,.09); }
      .sp-best img { width: 64px; height: 64px; border-radius: 8px;
        object-fit: cover; flex-shrink: 0; }
      .sp-best.is-artist img { border-radius: 50%; }
      .sp-best-info { flex: 1; min-width: 0; }
      .sp-best-title { font-size: 18px; font-weight: 800; margin-bottom: 3px;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .sp-best-sub { font-size: 12px; color: #888; }
      .sp-best-play { width: 44px; height: 44px; border-radius: 50%;
        background: #FF6200; border: none; color: #000; font-size: 15px;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        flex-shrink: 0; transition: transform .15s, background .15s; }
      .sp-best-play:hover { transform: scale(1.06); background: #ff7a20; }
      .sp-row {
        display: flex; align-items: center; gap: 10px;
        padding: 7px 8px; border-radius: 8px; cursor: pointer;
        transition: background .15s;
      }
      .sp-row:hover { background: rgba(255,255,255,.07); }
      .sp-row img { width: 38px; height: 38px; border-radius: 6px;
        object-fit: cover; flex-shrink: 0; }
      .sp-row.is-artist img { border-radius: 50%; }
      .sp-row-info { flex: 1; min-width: 0; }
      .sp-row-title { font-size: 13px; font-weight: 600;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .sp-row-sub { font-size: 11px; color: #888; margin-top: 1px;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .sp-row-right { font-size: 10px; font-weight: 700; color: #555;
        text-transform: uppercase; flex-shrink: 0; }
      .sp-divider { height: 1px; background: rgba(255,255,255,.06); margin: 4px 0; }
      .sp-empty { padding: 26px 18px; text-align: center;
        color: #444; font-size: 13px; }
      .sp-show-all { display: block; padding: 10px 18px; font-size: 12px;
        font-weight: 600; color: #888; cursor: pointer;
        transition: color .15s; }
      .sp-show-all:hover { color: #fff; }
    `;
    document.head.appendChild(s);
  }

  _searchPanel = document.createElement('div');
  _searchPanel.id = 'sp-panel';
  _searchPanel.style.display = 'none';
  document.querySelector('.busqueda')?.appendChild(_searchPanel);

  document.addEventListener('click', function (e) {
    if (!_searchPanel) return;
    if (!_searchPanel.contains(e.target) && e.target.id !== 'buscador-input')
      _searchPanel.style.display = 'none';
  });
  return _searchPanel;
}

function _esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function _restoreSections(todas) {
  const oIds = ['.En-alta', '.Lista-en-alta', '.generos1', '.electronica-sec',
    '.top-cread', '.sup-colab', '.radio-list', '.carousel-wrapper-creators'];
  const oSec = ['sec-en-alta', 'sec-listas', 'sec-genero', 'sec-genero2',
    'sec-supergeneros', 'sec-creadores', 'sec-mix', 'sec-radio'];
  oIds.forEach(s => document.querySelectorAll(s).forEach(e => e.style.display = ''));
  oSec.forEach(id => { const e = document.getElementById(id); if (e) e.style.display = ''; });
  document.querySelectorAll('[id^="sec-gen-"]').forEach(e => {
    e.style.display = ''; e.previousElementSibling?.style.setProperty('display', '');
  });
  const h = document.querySelector('.for-you h1');
  if (h) h.textContent = 'Para ti';
  renderGrid('sec-para-ti', ordenarParaTi(todas, getUsuarioLocal()));
}

function buscar(q, todas) {
  const panel = _initSearchPanel();

  if (!q) {
    panel.style.display = 'none';
    _restoreSections(todas);
    return;
  }

  panel.style.display = 'block';
  const ql = q.toLowerCase();
  const PH = '/img/home-banner.png';
  const PHU = '/img/porfile.jpeg';

  // Filtrar canciones (excluir de usuarios baneados)
  const _baneados2 = window._sneakBaneadosUids || new Set();
  const canciones = todas
    .filter(c => !c.uid || !_baneados2.has(c.uid))
    .filter(c => c.tipo !== 'lista' &&
      (c.titulo?.toLowerCase().includes(ql) ||
        c.artista?.toLowerCase().includes(ql) ||
        c.genero?.toLowerCase().includes(ql) ||
        (c.tags || []).some(t => t.toLowerCase().includes(ql))))
    .sort((a, b) => (b.reproducciones || 0) - (a.reproducciones || 0));

  // Filtrar listas/álbumes
  const listas = todas
    .filter(c => (c.tipo === 'lista' || c.tipo === 'album' || c.tipo === 'ep') &&
      (c.titulo?.toLowerCase().includes(ql) || c.artista?.toLowerCase().includes(ql)));

  // Artistas únicos (excluir baneados)
  const _baneados = window._sneakBaneadosUids || new Set();
  const artMap = {};
  canciones.forEach(c => {
    if (!c.artista) return;
    if (c.uid && _baneados.has(c.uid)) return; // artista baneado
    const k = c.artista.toLowerCase();
    if (!artMap[k]) artMap[k] = { nombre: c.artista, foto: c.artistaFoto || '', uid: c.uid || '', n: 0 };
    artMap[k].n++;
  });
  const artistas = Object.values(artMap)
    .filter(a => a.nombre.toLowerCase().includes(ql))
    .sort((a, b) => b.n - a.n);

  if (!canciones.length && !artistas.length && !listas.length) {
    panel.innerHTML = `<div class="sp-empty">Sin resultados para "<strong>${_esc(q)}</strong>"</div>`;
    return;
  }

  let html = '';

  // ── Mejor resultado ───────────────────────────────────────
  const esArtTop = artistas[0] && artistas[0].nombre.toLowerCase().startsWith(ql);
  const topItem = esArtTop ? null : (canciones[0] || listas[0]);

  if (esArtTop) {
    const a = artistas[0];
    html += `<div class="sp-sec">
      <div class="sp-sec-title">Mejor resultado</div>
      <div class="sp-best is-artist" onclick="window.location.href='/html/Perfil.html?uid=${_esc(a.uid)}'">
        <img src="${_esc(a.foto || PHU)}" onerror="this.src='${PHU}'" alt="">
        <div class="sp-best-info">
          <div class="sp-best-title">${_esc(a.nombre)}</div>
          <div class="sp-best-sub">Artista · ${a.n} cancion${a.n !== 1 ? 'es' : ''}</div>
        </div>
      </div>
    </div>`;
  } else if (topItem) {
    const tl = topItem.tipo === 'album' ? 'Álbum' : topItem.tipo === 'ep' ? 'EP' : topItem.tipo === 'lista' ? 'Lista' : 'Canción';
    html += `<div class="sp-sec">
      <div class="sp-sec-title">Mejor resultado</div>
      <div class="sp-best" onclick="window.location.href='/html/Cancion.html?id=${_esc(topItem.id)}'">
        <img src="${_esc(topItem.portada || PH)}" onerror="this.src='${PH}'" alt="">
        <div class="sp-best-info">
          <div class="sp-best-title">${_esc(topItem.titulo)}</div>
          <div class="sp-best-sub">${tl} · ${_esc(topItem.artista || '')}</div>
        </div>
        ${topItem.audio ? `<button class="sp-best-play" onclick="event.stopPropagation();_spPlay('${_esc(topItem.id)}')"><i class="fas fa-play"></i></button>` : ''}
      </div>
    </div>`;
  }

  // ── Canciones ─────────────────────────────────────────────
  if (canciones.length) {
    html += `<div class="sp-divider"></div><div class="sp-sec">
      <div class="sp-sec-title">Canciones</div>
      ${canciones.slice(0, 6).map(c => `
        <div class="sp-row" onclick="_spPlay('${_esc(c.id)}')">
          <img src="${_esc(c.portada || PH)}" onerror="this.src='${PH}'" alt="">
          <div class="sp-row-info">
            <div class="sp-row-title">${_esc(c.titulo || '—')}</div>
            <div class="sp-row-sub">${_esc(c.artista || '')}${c.genero ? ' · ' + _esc(c.genero) : ''}</div>
          </div>
          <span class="sp-row-right">${fmtNum(c.reproducciones || 0)}</span>
        </div>`).join('')}
      ${canciones.length > 6 ? `<div class="sp-show-all" onclick="_spVerTodos('${_esc(q)}')">Ver todos los resultados</div>` : ''}
    </div>`;
  }

  // ── Artistas ──────────────────────────────────────────────
  if (artistas.length) {
    html += `<div class="sp-divider"></div><div class="sp-sec">
      <div class="sp-sec-title">Artistas</div>
      ${artistas.slice(0, 4).map(a => `
        <div class="sp-row is-artist" onclick="window.location.href='/html/Perfil.html?uid=${_esc(a.uid)}'">
          <img src="${_esc(a.foto || PHU)}" onerror="this.src='${PHU}'" alt="">
          <div class="sp-row-info">
            <div class="sp-row-title">${_esc(a.nombre)}</div>
            <div class="sp-row-sub">${a.n} cancion${a.n !== 1 ? 'es' : ''}</div>
          </div>
          <span class="sp-row-right"><i class="fas fa-user" style="font-size:9px"></i></span>
        </div>`).join('')}
    </div>`;
  }

  // ── Listas / Álbumes ──────────────────────────────────────
  if (listas.length) {
    html += `<div class="sp-divider"></div><div class="sp-sec" style="padding-bottom:14px">
      <div class="sp-sec-title">Listas y Álbumes</div>
      ${listas.slice(0, 4).map(c => {
      const tl = c.tipo === 'album' ? 'Álbum' : c.tipo === 'ep' ? 'EP' : 'Lista';
      return `<div class="sp-row" onclick="window.location.href='/html/Cancion.html?id=${_esc(c.id)}'">
          <img src="${_esc(c.portada || PH)}" onerror="this.src='${PH}'" alt="" style="border-radius:8px">
          <div class="sp-row-info">
            <div class="sp-row-title">${_esc(c.titulo || '—')}</div>
            <div class="sp-row-sub">${tl} · ${_esc(c.artista || '')}</div>
          </div>
          <span class="sp-row-right">${tl}</span>
        </div>`;
    }).join('')}
    </div>`;
  }

  panel.innerHTML = html;

  // Helpers
  window._spPlay = function (id) {
    const c = todas.find(x => x.id === id);
    if (c && window.reproducirCancion) window.reproducirCancion(c);
    panel.style.display = 'none';
  };
  window._spVerTodos = function (query) {
    panel.style.display = 'none';
    const oIds = ['.En-alta', '.Lista-en-alta', '.generos1', '.electronica-sec',
      '.top-cread', '.sup-colab', '.radio-list', '.carousel-wrapper-creators'];
    const oSec = ['sec-en-alta', 'sec-listas', 'sec-genero', 'sec-genero2',
      'sec-supergeneros', 'sec-creadores', 'sec-mix', 'sec-radio'];
    oIds.forEach(s => document.querySelectorAll(s).forEach(e => e.style.display = 'none'));
    oSec.forEach(id => { const e = document.getElementById(id); if (e) e.style.display = 'none'; });
    document.querySelectorAll('[id^="sec-gen-"]').forEach(e => {
      e.style.display = 'none'; e.previousElementSibling?.style.setProperty('display', 'none');
    });
    const h = document.querySelector('.for-you h1');
    if (h) h.textContent = `Resultados para "${query}"`;
    renderGrid('sec-para-ti', canciones.slice(0, 40));
  };
}

// ═══════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════
function fmtNum(n) {
  if (!n) return '0';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'k';
  return String(n);
}
// ═══════════════════════════════════════════════════════════
// ROUTER INIT — expone iniciarInicio() para el router SPA
// El router llama esta función al navegar a inicio.html
// sin recargar la página.
// ═══════════════════════════════════════════════════════════
window.iniciarInicio = async function () {
  const user = getUsuarioLocal();
  if (!user) return;

  // ── Cargar baneados primero ───────────────────────────────
  let _baneadosUids = window._sneakBaneadosUids || new Set();
  if (!_baneadosUids.size) {
    try {
      const snapBan = await getDocs(collection(await _getDB(), 'usuarios'));
      snapBan.forEach(d => { if (d.data().baneado === true) _baneadosUids.add(d.id); });
      window._sneakBaneadosUids = _baneadosUids;
    } catch (_) { }
  }

  let todas = [], listas = [];
  try {
    const snap = await getDocs(query(
      collection(await _getDB(), 'canciones'),
      orderBy('creadoEn', 'desc'),
      limit(300)
    ));
    snap.forEach(d => {
      const c = { id: d.id, ...d.data() };
      if (c.tipo === 'lista') listas.push(c);
      else todas.push(c);
    });
  } catch (err) {
    console.warn('Firestore inicio (router):', err.message);
    try {
      const snap2 = await getDocs(collection(await _getDB(), 'canciones'));
      snap2.forEach(d => {
        const c = { id: d.id, ...d.data() };
        if (c.tipo === 'lista') listas.push(c);
        else todas.push(c);
      });
    } catch (err2) { console.error('Firestore error total:', err2.message); }
  }

  // ── Filtrar inactivas y de usuarios baneados ──────────────
  todas = todas.filter(c => c.activo !== false && !_baneadosUids.has(c.uid));
  listas = listas.filter(l => l.activo !== false && !_baneadosUids.has(l.uid));

  _todosTracksPool = todas.filter(c =>
    c.tipo !== 'album' && c.tipo !== 'ep' && c.tipo !== 'lista'
  );

  renderSuperGenerosAuto(todas);
  renderGrid('sec-para-ti', ordenarParaTi(todas, user));
  const enAlta = [...todas].sort((a, b) => (b.reproducciones || 0) - (a.reproducciones || 0));
  renderGrid('sec-en-alta', enAlta);
  renderListas('sec-listas', listas.slice(0, 8));

  // ── Álbumes en alta ──
  const albumesData = [...todas]
    .filter(c => c.tipo === 'album' || c.tipo === 'ep')
    .sort((a, b) => (b.reproducciones || 0) - (a.reproducciones || 0))
    .slice(0, 20);
  albumesData.forEach(a => { _albumsMap[a.id] = a; });
  renderAlbumes('sec-generos-alta', albumesData);

  const genFav1 = user.generos?.[0] || null;
  const genFav2 = user.generos?.[1] || null;
  if (genFav1) {
    const por1 = todas.filter(c => c.genero === genFav1).slice(0, 16);
    const t1 = document.getElementById('gen-fav-titulo');
    if (t1) t1.textContent = genFav1;
    if (por1.length) renderGrid('sec-genero', por1, { generoFijo: genFav1 });
    else document.getElementById('sec-generos1-titulo')?.style.setProperty('display', 'none');
  } else {
    document.getElementById('sec-generos1-titulo')?.style.setProperty('display', 'none');
  }
  if (genFav2) {
    const por2 = todas.filter(c => c.genero === genFav2).slice(0, 16);
    const t2 = document.getElementById('gen-fav2-titulo');
    if (t2) t2.textContent = genFav2;
    if (por2.length) renderGrid('sec-genero2', por2, { generoFijo: genFav2 });
    else document.getElementById('sec-electronica-titulo')?.style.setProperty('display', 'none');
  } else {
    document.getElementById('sec-electronica-titulo')?.style.setProperty('display', 'none');
  }

  renderSeccionesGenero(todas, user);
  await renderTopArtistas(todas, 'sec-creadores');

  try {
    const snap = await getDoc(doc(await _getDB(), 'admin_config', 'inicio'));
    const cfg = snap.exists() ? snap.data() : {};
    _adminCfg = cfg;
    renderBanner(cfg.banner || null);
    renderSuperGeneros(cfg.supergeneros || []);
    const mixData = cfg.mixes?.length ? cfg.mixes : (cfg.mix ? [cfg.mix] : null);
    renderMix(mixData ? (mixData.length === 1 ? mixData[0] : mixData) : null);
    renderRadio(cfg.radio || []);
  } catch (err) {
    renderBanner(null); renderSuperGeneros([]); renderMix(null); renderRadio([]);
  }

  const _inp2 = document.getElementById('buscador-input');
  if (_inp2) {
    _inp2.addEventListener('input', e => {
      clearTimeout(_searchTimeout);
      _searchTimeout = setTimeout(() => buscar(e.target.value.trim().toLowerCase(), todas), 200);
    });
    _inp2.addEventListener('focus', e => {
      if (e.target.value.trim()) buscar(e.target.value.trim().toLowerCase(), todas);
    });
    _inp2.addEventListener('keydown', e => {
      if (e.key === 'Escape') { buscar('', todas); _inp2.value = ''; _inp2.blur(); }
    });
  }
};

document.addEventListener('DOMContentLoaded', function () {
  setTimeout(function () {
    ['.listas44', '.List-radio'].forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        el.addEventListener('wheel', function (e) {
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            const max = el.scrollWidth - el.clientWidth;
            if ((e.deltaY < 0 && el.scrollLeft <= 0) || (e.deltaY > 0 && el.scrollLeft >= max)) return;
            e.preventDefault();
            el.scrollLeft += e.deltaY;
          }
        }, { passive: false });
      });
    });
  }, 1000);
});