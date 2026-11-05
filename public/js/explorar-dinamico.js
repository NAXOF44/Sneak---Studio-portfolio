import { getUsuarioLocal } from '/js/firebase-auth.js';
import { leerFeedGlobal } from '/js/sneak-db.js';

const PH = '/img/home-banner.png';
const PH_USER = '/img/porfile.jpeg';

const GENEROS = [
  { nombre: 'Pop', img: '/img/Pop.jpeg', featured: true },
  { nombre: 'Rock', img: '/img/Rock.jpeg', featured: true },
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
  { nombre: 'Rap', img: '/img/Rap.jpeg' },
  { nombre: 'Funk', img: '/img/Funk.jpeg' },
];

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ══════════════════════════════════════════════════════════
// CARRUSEL — igual que biblioteca-dinamico.js
// ══════════════════════════════════════════════════════════
const SVG_L = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/></svg>';

const SVG_R = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/></svg>';

function buildCarousel(containerId, items, renderFn, maxItems, emptyMsg) {
  maxItems = maxItems || 10;
  emptyMsg = emptyMsg || 'Sin contenido aún.';

  var wrapper = document.getElementById(containerId);
  if (!wrapper) return;
  wrapper.innerHTML = '';

  var capped = items.slice(0, maxItems);
  if (!capped.length) {
    wrapper.innerHTML = '<p style="color:#555;font-size:13px;padding:8px 0">' + emptyMsg + '</p>';
    return;
  }

  wrapper.style.position = 'relative';
  wrapper.style.zIndex = '0';

  if (!document.getElementById('snk-scroll-hide')) {
    var s = document.createElement('style');
    s.id = 'snk-scroll-hide';
    s.textContent = '.snk-track::-webkit-scrollbar{display:none}.snk-track{scrollbar-width:none;-ms-overflow-style:none}';
    document.head.appendChild(s);
  }

  var track = document.createElement('div');
  track.className = 'snk-track';
  track.style.cssText = 'display:flex;gap:10px;overflow-x:auto;scroll-behavior:smooth;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:6px;padding-left:2px;padding-right:2px;';

  capped.forEach(function (item) {
    var card = renderFn(item);
    card.style.flexShrink = '0';
    track.appendChild(card);
  });

  var btnL = document.createElement('button');
  btnL.setAttribute('aria-label', 'Anterior');
  btnL.innerHTML = SVG_L;
  btnL.style.cssText = 'position:absolute;left:4px;top:42%;transform:translateY(-50%);background:rgba(20,20,20,.95);border:none;color:#fff;cursor:pointer;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;z-index:1000;opacity:0;transition:opacity .2s;box-shadow:0 2px 10px rgba(0,0,0,.6);pointer-events:none;';

  var btnR = document.createElement('button');
  btnR.setAttribute('aria-label', 'Siguiente');
  btnR.innerHTML = SVG_R;
  btnR.style.cssText = 'position:absolute;right:4px;top:42%;transform:translateY(-50%);background:rgba(20,20,20,.95);border:none;color:#fff;cursor:pointer;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;z-index:1000;transition:opacity .2s;box-shadow:0 2px 10px rgba(0,0,0,.6);';

  function updateBtns() {
    var sl = track.scrollLeft;
    var maxSl = track.scrollWidth - track.clientWidth;
    btnL.style.opacity = sl > 8 ? '1' : '0';
    btnL.style.pointerEvents = sl > 8 ? 'auto' : 'none';
    btnR.style.opacity = sl < maxSl - 8 ? '1' : '0';
    btnR.style.pointerEvents = sl < maxSl - 8 ? 'auto' : 'none';
  }

  btnL.addEventListener('click', function () { track.scrollBy({ left: -300, behavior: 'smooth' }); });
  btnR.addEventListener('click', function () { track.scrollBy({ left: 300, behavior: 'smooth' }); });
  track.addEventListener('scroll', updateBtns, { passive: true });
  setTimeout(updateBtns, 150);

  wrapper.appendChild(btnL);
  wrapper.appendChild(track);
  wrapper.appendChild(btnR);
}

function initSidebar(u) {
  document.querySelectorAll('.nombre-user h1').forEach(function (el) {
    el.textContent = u.username || u.nombre || 'Usuario';
  });
  document.querySelectorAll('.user-img img').forEach(function (el) {
    if (u.foto && !u.foto.startsWith('data:')) {
      el.src = u.foto;
      el.onerror = function () { el.src = PH_USER; };
    }
  });
  var btn = document.getElementById('btn-logout');
  if (btn) {
    btn.addEventListener('click', async function (e) {
      e.preventDefault();
      try {
        var { initializeApp, getApps } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
        var { getAuth, signOut } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
        var FB = { apiKey: 'AIzaSyAreMBZ0Rm-5UIm9QmcZFPdSUqZeJRXWR4', authDomain: 'sneak-studio-9546b.firebaseapp.com', projectId: 'sneak-studio-9546b' };
        var app = getApps().length ? getApps()[0] : initializeApp(FB);
        await signOut(getAuth(app));
      } catch (_) { }
      localStorage.removeItem('sneak_user');
      window.location.href = '/login';
    });
  }
}

function makeCard(item) {
  var div = document.createElement('div');
  div.className = 'conten-list';
  div.style.cursor = 'pointer';
  div.innerHTML =
    '<div class="img-list-radio">'
    + '<img src="' + esc(item.portada || PH) + '" alt="' + esc(item.titulo) + '" '
    + 'onerror="this.src=\'' + PH + '\'" style="width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:10px;display:block">'
    + '</div>'
    + '<div class="text-nom-list">'
    + '<div class="tit-selec"><h1>' + esc(item.titulo || 'Sin título') + '</h1></div>'
    + '<div class="nom-expli"><p>' + esc(item.artista || item.descripcion || '') + '</p></div>'
    + '</div>';
  div.addEventListener('click', function () {
    window.location.href = '/cancion?id=' + item.id;
  });
  return div;
}

function makeCardArtista(artista) {
  var div = document.createElement('div');
  div.className = 'artist-card';
  div.style.flexShrink = '0';
  div.style.cursor = 'pointer';
  div.innerHTML =
    '<div class="artist-image-container">'
    + '<img src="' + esc(artista.foto || PH_USER) + '" alt="' + esc(artista.nombre) + '" '
    + 'onerror="this.src=\'' + PH_USER + '\'">'
    + '</div>'
    + '<div class="artist-info">'
    + '<h2>' + esc(artista.nombre) + '</h2>'
    + '<p>' + artista.canciones + ' ' + (artista.canciones === 1 ? 'creación' : 'creaciones') + '</p>'
    + '</div>';
  div.addEventListener('click', function () {
    window.location.href = '/perfil?uid=' + artista.uid;
  });
  return div;
}

async function buildArtistas(todoFeed) {
  var mapa = {};
  todoFeed.forEach(function (c) {
    if (!c.uid) return;
    if (!mapa[c.uid]) mapa[c.uid] = { uid: c.uid, nombre: c.artista || 'Artista', foto: null, canciones: 0, baneado: false };
    mapa[c.uid].canciones++;
  });
  try {
    var { collection, getDocs, query, where, documentId } =
      await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    var { db } = await import('/js/firebase-auth.js');
    var uids = Object.keys(mapa);
    for (var i = 0; i < uids.length; i += 30) {
      var chunk = uids.slice(i, i + 30);
      var snap = await getDocs(query(collection(db, 'usuarios'), where(documentId(), 'in', chunk)));
      snap.forEach(function (doc) {
        var d = doc.data();
        if (!mapa[doc.id]) return;
        if (d.foto && !d.foto.startsWith('data:')) mapa[doc.id].foto = d.foto;
        mapa[doc.id].nombre = d.username || d.nombre || mapa[doc.id].nombre;
        mapa[doc.id].baneado = d.baneado === true;
      });
    }
  } catch (err) {
    console.warn('[explorar] artistas:', err.message);
  }
  return Object.values(mapa).filter(function (a) { return a.baneado !== true; }).sort(function (a, b) { return b.canciones - a.canciones; });
}

async function buscarUsuarios(q, todoFeed) {
  try {
    var { collection, getDocs } =
      await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    var { db } = await import('/js/firebase-auth.js');
    var snap = await getDocs(collection(db, 'usuarios'));
    var ql = q.toLowerCase();
    var res = [];


    var conteoReal = {};
    (todoFeed || []).forEach(function (c) {
      if (c.uid && c.tipo !== 'lista' && c.tipo !== 'album' && c.tipo !== 'ep') {
        conteoReal[c.uid] = (conteoReal[c.uid] || 0) + 1;
      }
    });
    snap.forEach(function (doc) {
      var d = doc.data();
      if (d.baneado === true) return;
      var nombre = d.username || d.nombre || '';
      if (nombre.toLowerCase().includes(ql)) {
        res.push({
          uid: doc.id,
          nombre: nombre,
          foto: (!d.foto || d.foto.startsWith('data:')) ? null : d.foto,
          canciones: conteoReal[doc.id] || 0
        });
      }
    });
    return res;
  } catch (err) {
    console.warn('[explorar] buscarUsuarios:', err.message);
    return [];
  }
}

function renderGeneros() {
  var grid = document.getElementById('exp-generos');
  if (!grid) return;
  grid.innerHTML = '';
  GENEROS.forEach(function (g) {
    var a = document.createElement('a');
    a.href = '#';
    a.className = 'gen-card' + (g.featured ? ' featured' : '');
    a.innerHTML =
      '<img src="' + g.img + '" alt="' + esc(g.nombre) + '" onerror="this.style.display=\'none\'">'
      + '<div class="gen-label"><h1>' + esc(g.nombre) + '</h1>'
      + '<div class="gen-play"><i class="fas fa-play"></i></div></div>';
    a.addEventListener('click', function (e) {
      e.preventDefault();
      window.location.href = '/genero?genero=' + encodeURIComponent(g.nombre);
    });
    grid.appendChild(a);
  });
}

function mostrarResultados() {
  document.getElementById('exp-search-results').style.display = 'block';
  document.getElementById('exp-search-results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function ocultarResultados() {
  document.getElementById('exp-search-results').style.display = 'none';
  document.getElementById('exp-search-usuarios-wrap').style.display = 'none';
  document.getElementById('exp-search-canciones-wrap').style.display = 'none';
}

async function ejecutarBusqueda(q, todoFeed) {
  var ql = (q || '').trim();
  if (!ql) { ocultarResultados(); return; }

  mostrarResultados();
  document.getElementById('exp-search-title').textContent = '"' + ql + '"';

  var qlLow = ql.toLowerCase();

  var resCanciones = todoFeed.filter(function (c) {
    return (c.titulo || '').toLowerCase().includes(qlLow)
      || (c.artista || '').toLowerCase().includes(qlLow)
      || (c.genero || '').toLowerCase().includes(qlLow)
      || (c.descripcion || '').toLowerCase().includes(qlLow);
  });

  var resUsuarios = await buscarUsuarios(qlLow, todoFeed);

  var wrapU = document.getElementById('exp-search-usuarios-wrap');
  if (resUsuarios.length) {
    buildCarousel('exp-search-usuarios', resUsuarios, makeCardArtista, 20, 'Sin usuarios.');
    wrapU.style.display = 'block';
  } else {
    wrapU.style.display = 'none';
  }

  var wrapC = document.getElementById('exp-search-canciones-wrap');
  var listC = document.getElementById('exp-search-list');
  if (resCanciones.length) {
    listC.innerHTML = '';
    resCanciones.slice(0, 20).forEach(function (item) { listC.appendChild(makeCard(item)); });
    wrapC.style.display = 'block';
  } else {
    wrapC.style.display = 'none';
  }

  if (!resUsuarios.length && !resCanciones.length) {
    document.getElementById('exp-search-title').textContent = 'Sin resultados para "' + ql + '"';
  }
}

async function cargarExplorar() {
  var u = getUsuarioLocal();
  if (!u || !u.uid) { window.location.replace('/login'); return; }
  initSidebar(u);

  var todoFeed = [];
  try { todoFeed = await leerFeedGlobal({ limite: 300 }); }
  catch (err) { console.warn('[explorar] feed:', err.message); }



  var _baneadosExp = window._sneakBaneadosUids || new Set();
  if (!_baneadosExp.size) {
    try {
      var { collection: _col, getDocs: _getDocs } =
        await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      var { db: _db } = await import('/js/firebase-auth.js');
      var _snapBan = await _getDocs(_col(_db, 'usuarios'));
      _snapBan.forEach(function (d) { if (d.data().baneado === true) _baneadosExp.add(d.id); });
      window._sneakBaneadosUids = _baneadosExp;
    } catch (_) { }
  }
  todoFeed = todoFeed.filter(function (c) {
    return c.activo !== false && !_baneadosExp.has(c.uid);
  });

  var artistas = await buildArtistas(todoFeed);
  var listas = todoFeed.filter(function (c) { return c.tipo === 'lista' || c.tipo === 'playlist'; });
  var exitos = todoFeed
    .filter(function (c) { return c.tipo !== 'lista' && c.tipo !== 'playlist'; })
    .sort(function (a, b) { return (b.reproducciones || 0) - (a.reproducciones || 0); });

  buildCarousel('explo-artists', artistas, makeCardArtista, 20, 'Sin artistas aún.');
  buildCarousel('exp-listas', listas, makeCard, 8, 'Sin listas aún.');
  buildCarousel('exp-exitos', exitos, makeCard, 8, 'Sin éxitos aún.');
  renderGeneros();

  var input = document.getElementById('exp-search-input');
  var btn = document.getElementById('exp-search-btn');
  if (btn && input) {
    btn.addEventListener('click', function () { ejecutarBusqueda(input.value, todoFeed); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') ejecutarBusqueda(input.value, todoFeed); });
    input.addEventListener('input', function () { if (!input.value.trim()) ocultarResultados(); });
  }
}

document.addEventListener('DOMContentLoaded', cargarExplorar);

window.iniciarExplorar = cargarExplorar;