import { getUsuarioLocal } from '/js/firebase-auth.js';
import {
  leerMisCanciones,
  getMisLikes,
  leerFeedGlobal,
  getSeguidoresCount,
} from '/js/sneak-db.js';

const $ = id => document.getElementById(id);
const fmt = n =>
  !n ? '0'
  : n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M'
  : n >= 1_000     ? (n / 1_000).toFixed(0) + 'k'
  : String(n);

const PH = '/img/home-banner.png';
const VINYL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16">
  <path d="M8 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4m0 3a1 1 0 1 1 0-2 1 1 0 0 1 0 2"/>
  <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M4 8a4 4 0 1 0 8 0 4 4 0 0 0-8 0"/>
</svg>`;

function buildCarousel(containerId, items, renderFn, maxItems, emptyMsg) {
  maxItems = maxItems || 10;
  emptyMsg = emptyMsg || 'Sin contenido aún.';

  const wrapper = $(containerId);
  if (!wrapper) return;
  wrapper.innerHTML = '';

  const capped = items.slice(0, maxItems);

  if (!capped.length) {
    wrapper.innerHTML = '<p style="color:#555;font-size:13px;padding:8px 0">' + emptyMsg + '</p>';
    return;
  }

  wrapper.style.position = 'relative';

  

  if (!document.getElementById('bib-scroll-hide')) {
    const s = document.createElement('style');
    s.id = 'bib-scroll-hide';
    s.textContent = '.bib-track::-webkit-scrollbar{display:none}';
    document.head.appendChild(s);
  }

  

  const track = document.createElement('div');
  track.className = 'bib-track';
  track.style.cssText = [
    'display:flex',
    'gap:10px',
    'overflow-x:auto',
    'scroll-behavior:smooth',
    '-webkit-overflow-scrolling:touch',
    'scrollbar-width:none',
    'padding-bottom:6px',
    'padding-left:2px',
    'padding-right:2px',
  ].join(';');

  capped.forEach(function(item) {
    var card = renderFn(item);
    card.style.flexShrink = '0';
    track.appendChild(card);
  });

  

  const btnL = document.createElement('button');
  btnL.setAttribute('aria-label', 'Anterior');
  btnL.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/></svg>';
  btnL.style.cssText = 'position:absolute;left:-14px;top:42%;transform:translateY(-50%);background:rgba(20,20,20,.95);border:none;color:#fff;cursor:pointer;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;z-index:10;opacity:0;transition:opacity .2s;box-shadow:0 2px 10px rgba(0,0,0,.6);pointer-events:none;';

  

  const btnR = document.createElement('button');
  btnR.setAttribute('aria-label', 'Siguiente');
  btnR.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/></svg>';
  btnR.style.cssText = 'position:absolute;right:-14px;top:42%;transform:translateY(-50%);background:rgba(20,20,20,.95);border:none;color:#fff;cursor:pointer;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;z-index:10;transition:opacity .2s;box-shadow:0 2px 10px rgba(0,0,0,.6);';

  function updateBtns() {
    var sl = track.scrollLeft;
    var maxSl = track.scrollWidth - track.clientWidth;
    btnL.style.opacity  = sl > 8 ? '1' : '0';
    btnL.style.pointerEvents = sl > 8 ? 'auto' : 'none';
    btnR.style.opacity  = sl < maxSl - 8 ? '1' : '0';
    btnR.style.pointerEvents = sl < maxSl - 8 ? 'auto' : 'none';
  }

  btnL.addEventListener('click', function() { track.scrollBy({ left: -300, behavior: 'smooth' }); });
  btnR.addEventListener('click', function() { track.scrollBy({ left: 300, behavior: 'smooth' }); });
  track.addEventListener('scroll', updateBtns, { passive: true });
  setTimeout(updateBtns, 150);

  wrapper.appendChild(btnL);
  wrapper.appendChild(track);
  wrapper.appendChild(btnR);
}

function cardFavorita(c) {
  var div = document.createElement('div');
  div.style.cssText = 'display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:10px;cursor:pointer;transition:background .15s;min-width:240px;max-width:280px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);';
  div.innerHTML = '<img src="' + (c.portada || PH) + '" style="width:44px;height:44px;border-radius:8px;object-fit:cover;flex-shrink:0" onerror="this.src=\'' + PH + '\'">'
    + '<div style="flex:1;min-width:0;overflow:hidden">'
    + '<p style="color:#eee;font-size:13px;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + (c.titulo || 'Sin título') + '</p>'
    + '<p style="color:#666;font-size:11px;margin:3px 0 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer" onclick="event.stopPropagation();if(\'' + (c.uid||'') + '\')window.location.href=\'/perfil?uid=' + (c.uid||'') + '\'">' + (c.artista || '') + '</p>'
    + '</div>'
    + '<i class="fa-solid fa-heart" style="color:#ff4466;font-size:13px;flex-shrink:0"></i>';
  div.addEventListener('click', function() { window.location.href = '/cancion?id=' + c.id; });
  div.addEventListener('mouseenter', function() { div.style.background = 'rgba(255,255,255,.09)'; });
  div.addEventListener('mouseleave', function() { div.style.background = 'rgba(255,255,255,.04)'; });
  return div;
}

function cardLista(item) {
  var div = document.createElement('div');
  div.className = 'lista-bib';
  div.style.cursor = 'pointer';
  div.innerHTML = '<div class="img-lista"><img src="' + (item.portada || PH) + '" alt="' + (item.titulo || '') + '" onerror="this.src=\'' + PH + '\'" style="width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:10px;display:block"></div>'
    + '<div class="tit-list"><h1>' + (item.titulo || 'Sin título') + '</h1></div>'
    + '<div class="discripcion-lista"><p>' + (item.descripcion || 'Lista de la plataforma.') + '</p></div>';
  div.addEventListener('click', function() { window.location.href = '/cancion?id=' + item.id; });
  return div;
}

function cardArtista(item) {
  var foto = item.foto || item.portada || '/img/porfile.jpeg';
  var div  = document.createElement('div');
  div.className = 'lista-bib-artist';
  div.style.cursor = 'pointer';
  div.innerHTML = '<div class="img-lista-artist"><img src="' + foto + '" alt="' + (item.nombre || item.artista || 'Artista') + '" onerror="this.src=\'/img/porfile.jpeg\'" style="width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:50%;display:block"></div>'
    + '<div class="tit-list-artist"><h1>' + (item.nombre || item.artista || 'Artista') + '</h1></div>'
    + '<div class="discripcion-lista-artist"><p>' + (item.tipo || item.rol || 'Artista') + '</p></div>';
  if (item.uid) div.addEventListener('click', function() { window.location.href = '/perfil?uid=' + item.uid; });
  return div;
}

function cardAlbum(c) {
  var div = document.createElement('div');
  div.className = 'lista-bib-albumes';
  div.style.cursor = 'pointer';
  var tipoLabel = (c.tipo === 'album' || c.tipo === 'ep') ? (c.tipo === 'ep' ? 'EP' : 'Álbum') : 'Álbum';
  div.innerHTML = '<div class="img-lista-albumes"><img src="' + (c.portada || PH) + '" alt="' + (c.titulo || '') + '" onerror="this.src=\'' + PH + '\'" style="width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:10px;display:block"></div>'
    + '<div class="tit-list-albumes"><h1>' + (c.titulo || 'Sin título') + '</h1></div>'
    + '<div class="discripcion-lista-albumes">'
    + '<div><p style="color:rgba(212,212,212,.85);font-size:11px;margin-top:4px">' + tipoLabel + '</p></div>'
    + '<div class="punto-album"><p>·</p></div>'
    + '<div class="name-artist-album"><p style="color:rgba(212,212,212,.85);font-size:11px;margin-top:4px">' + (c.artista || '') + '</p></div>'
    + '</div>';
  div.addEventListener('click', function() { window.location.href = '/cancion?id=' + c.id; });
  return div;
}

function cardSencillo(c) {
  var div = document.createElement('div');
  div.className = 'lista-bib-sensillos';
  div.style.cursor = 'pointer';
  div.innerHTML = '<div class="img-lista-sensillos"><img src="' + (c.portada || PH) + '" alt="' + (c.titulo || '') + '" onerror="this.src=\'' + PH + '\'" style="width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:10px;display:block"></div>'
    + '<div class="tit-list-sensillos"><h1>' + (c.titulo || 'Sin título') + '</h1></div>'
    + '<div class="discripcion-lista-sensillos"><p>' + (c.artista || '') + (c.genero ? ' · ' + c.genero : '') + '</p></div>';
  div.addEventListener('click', function() { window.location.href = '/cancion?id=' + c.id; });
  return div;
}

var VINYL_SVG_LG = '<svg width="24" height="24" viewBox="0 0 28 28" fill="none">'
  + '<circle cx="14" cy="14" r="13" stroke="black" stroke-width="1"/>'
  + '<circle cx="14" cy="14" r="7" stroke="black" stroke-width="1"/>'
  + '<circle cx="14" cy="14" r="2.5" fill="black"/>'
  + '</svg>';

var VINYL_SVG_SM = '<svg width="20" height="20" viewBox="0 0 28 28" fill="none">'
  + '<circle cx="14" cy="14" r="13" stroke="black" stroke-width="1"/>'
  + '<circle cx="14" cy="14" r="7" stroke="black" stroke-width="1"/>'
  + '<circle cx="14" cy="14" r="2.5" fill="black"/>'
  + '</svg>';

function renderTop3(todoFeed) {
  var container = document.getElementById('bib-top3');
  if (!container) return;
  container.innerHTML = '';

  var top = todoFeed
    .filter(function(c) { return c.tipo !== 'lista' && c.tipo !== 'playlist'; })
    .sort(function(a, b) { return (b.reproducciones || 0) - (a.reproducciones || 0); })
    .slice(0, 3);

  if (!top.length) {
    container.innerHTML = '<p style="color:#000;font-size:13px;padding:16px 0">Sin datos aún.</p>';
    return;
  }

  if (!document.getElementById('top3-styles')) {
    var style = document.createElement('style');
    style.id = 'top3-styles';
    style.textContent = [
      '.top3-wrap{display:flex;flex-wrap:wrap;gap:12px;align-items:stretch}',
      '.top3-card{flex:1 1 200px;border-radius:12px;overflow:hidden;text-decoration:none;display:flex;flex-direction:column;transition:transform .2s ease;cursor:pointer;color:#000}',
      '.top3-card:hover{transform:translateY(-4px)}',
      '.top3-card.primary{flex:1 1 260px;background:#fff}',
      '.top3-card.secondary{background:#fff;border:.5px solid #e0e0e0}',
      '.t3-inner{padding:16px;display:flex;flex-direction:column;flex:1}',
      '.t3-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:12px}',
      '.t3-artists{display:flex;flex-wrap:wrap;gap:6px}',
      '.t3-pill{font-size:11px;font-weight:500;padding:4px 10px;border-radius:50px;white-space:nowrap;line-height:1.2;background:#f0f0f0;color:#000;border:.5px solid #ccc}',
      '.t3-body{flex:1;display:flex;flex-direction:column;justify-content:flex-end}',
      '.t3-title{font-size:clamp(20px,4vw,34px);font-weight:500;color:#000;line-height:1.05;letter-spacing:-.02em;margin:0 0 8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
      '.t3-meta{font-size:11px;line-height:1.4;margin:0 0 12px;color:#000;opacity:.55}',
      '.t3-img-wrap{width:100%;aspect-ratio:1/1;border-radius:8px;overflow:hidden;background:#eee;flex-shrink:0}',
      '.t3-img-wrap img{width:100%;height:100%;object-fit:cover;display:block}',
      '.t3-vinyl{opacity:.35;flex-shrink:0}',
    ].join('');
    document.head.appendChild(style);
  }

  var wrap = document.createElement('div');
  wrap.className = 'top3-wrap';

  top.forEach(function(c, i) {
    var isPrimary = i === 0;

    var artistas = [];
    if (c.artista) artistas.push(c.artista);
    if (c.colaboradores) artistas.push(c.colaboradores);

    var pills = artistas.slice(0, 2).map(function(name) {
      return '<span class="t3-pill">' + esc(name) + '</span>';
    }).join('');

    var portada = esc(c.portada || PH);
    var titulo  = esc(c.titulo  || 'Sin título');

    var card = document.createElement('a');
    card.href      = '/cancion?id=' + c.id;
    card.className = 'top3-card ' + (isPrimary ? 'primary' : 'secondary');

    card.innerHTML =
      '<div class="t3-inner">'
      + '<div class="t3-top">'
      +   '<div class="t3-artists">' + pills + '</div>'
      +   '<span class="t3-vinyl">' + (isPrimary ? VINYL_SVG_LG : VINYL_SVG_SM) + '</span>'
      + '</div>'
      + '<div class="t3-body">'
      +   '<p class="t3-title">' + titulo + '</p>'
      +   '<p class="t3-meta">' + fmt(c.reproducciones || 0) + ' reproducciones · ' + esc(c.genero || 'Música') + '</p>'
      + '</div>'
      + '<div class="t3-img-wrap">'
      +   '<img src="' + portada + '" alt="' + titulo + '" onerror="this.parentElement.style.display=\'none\'">'
      + '</div>'
      + '</div>';

    wrap.appendChild(card);
  });

  container.appendChild(wrap);
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ══════════════════════════════════════════════════════════
// SIDEBAR
// ══════════════════════════════════════════════════════════
function initSidebar(u) {
  document.querySelectorAll('.user-img img').forEach(function(el) {
    if (u.foto && !u.foto.startsWith('data:')) {
      el.src = u.foto;
      el.onerror = function() { el.src = '/img/porfile.jpeg'; };
    }
  });
  document.querySelectorAll('.nombre-user h1').forEach(function(el) {
    el.textContent = u.username || u.nombre || 'Usuario';
  });
  document.querySelectorAll('.log_out a, #btn-logout').forEach(function(el) {
    el.addEventListener('click', async function(e) {
      e.preventDefault();
      try {
        var { initializeApp, getApps } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
        var { getAuth, signOut } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
        var FB = { apiKey: 'AIzaSyAreMBZ0Rm-5UIm9QmcZFPdSUqZeJRXWR4', authDomain: 'sneak-studio-9546b.firebaseapp.com', projectId: 'sneak-studio-9546b' };
        var app = getApps().length ? getApps()[0] : initializeApp(FB);
        await signOut(getAuth(app));
      } catch (_) {}
      localStorage.removeItem('sneak_user');
      window.location.href = '/login';
    });
  });
  var cantEl = document.querySelector('.cant-canciones p');
  if (cantEl && u && u.uid) {
    import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js')
      .then(function(mod) {
        return import('/js/firebase-auth.js').then(function(a) {
          return mod.getDocs(mod.query(mod.collection(a.db, 'canciones'), mod.where('uid', '==', u.uid)))
            .then(function(snap) { cantEl.textContent = snap.size; });
        });
      }).catch(function() {});
  }
}

// ══════════════════════════════════════════════════════════
// STATS
// ══════════════════════════════════════════════════════════
async function cargarStats(u, canciones) {
  var elC = $('stat-creaciones'); if (elC) elC.textContent = canciones.length;
  var elL = $('stat-likes');      if (elL) elL.textContent = fmt(canciones.reduce(function(a, c) { return a + (c.likes || 0); }, 0));
  var elV = $('stat-vistas');     if (elV) elV.textContent = fmt(canciones.reduce(function(a, c) { return a + (c.reproducciones || 0); }, 0));
  var elS = $('stat-seguidores');
  if (elS) {
    var seg = u.seguidores || 0;
    try { seg = await getSeguidoresCount(u.uid); } catch (_) {}
    elS.textContent = fmt(seg);
  }
}

// ══════════════════════════════════════════════════════════
// FAVORITAS
// ══════════════════════════════════════════════════════════
async function cargarFavoritas(u) {
  var nomFav  = $('bib-nombre-usuario');
  var fotoFav = $('bib-foto-usuario');
  if (nomFav)  nomFav.textContent = u.username || u.nombre || 'Usuario';
  if (fotoFav && u.foto && !u.foto.startsWith('data:')) {
    fotoFav.src = u.foto;
    fotoFav.onerror = function() { fotoFav.src = '/img/porfile.jpeg'; };
  }

  var container = $('bib-favoritas');
  if (!container) return;

  try {
    var likes = await getMisLikes();
    if (!likes.length) {
      container.innerHTML = '<p style="color:#666;font-size:13px;padding:12px 0">Aún no has marcado canciones como favoritas. ❤️</p>';
      return;
    }
    // bib-favoritas moved to Favoritas.html
  } catch (err) {
    console.warn('[biblioteca] favoritas:', err.message);
    container.innerHTML = '<p style="color:#555;font-size:13px">No se pudieron cargar favoritas.</p>';
  }
}

// ══════════════════════════════════════════════════════════
// ARTISTAS
// ══════════════════════════════════════════════════════════
async function cargarArtistas(u, todoFeed) {
  var mapa = {};
  todoFeed.forEach(function(c) {
    if (!c.uid || c.uid === u.uid) return;
    if (!mapa[c.uid]) mapa[c.uid] = { uid: c.uid, nombre: c.artista || 'Artista', foto: null, tipo: 'Artista', canciones: 0 };
    mapa[c.uid].canciones++;
  });

  // Obtener foto real de perfil desde Firestore para cada artista
  try {
    var { getFirestore, collection, getDocs, query, where, documentId } =
      await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    var { db } = await import('/js/firebase-auth.js');

    var uids = Object.keys(mapa);
    // Firestore admite máx 30 ids por consulta 'in'
    var chunks = [];
    for (var i = 0; i < uids.length; i += 30) chunks.push(uids.slice(i, i + 30));

    await Promise.all(chunks.map(async function(chunk) {
      var snap = await getDocs(query(collection(db, 'usuarios'), where(documentId(), 'in', chunk)));
      snap.forEach(function(doc) {
        var data = doc.data();
        if (mapa[doc.id]) {
          if (data.foto && !data.foto.startsWith('data:')) mapa[doc.id].foto = data.foto;
          mapa[doc.id].nombre   = data.username || data.nombre || mapa[doc.id].nombre;
          mapa[doc.id].baneado  = data.baneado === true;
        }
      });
    }));
  } catch (err) {
    console.warn('[biblioteca] fotos de artistas:', err.message);
  }

  var artistas = Object.values(mapa).filter(function(a){ return a.baneado !== true; }).sort(function(a, b) { return b.canciones - a.canciones; });

  var siguiendoIds = u.siguiendo_ids || [];
  if (siguiendoIds.length) {
    var seguidos   = siguiendoIds.filter(function(uid) { return mapa[uid]; }).map(function(uid) { return mapa[uid]; });
    var noSeguidos = artistas.filter(function(a) { return siguiendoIds.indexOf(a.uid) === -1; });
    artistas = seguidos.concat(noSeguidos);
  }

  buildCarousel('bib-artistas', artistas, cardArtista, 10, 'Aún no hay artistas.');
}

// ══════════════════════════════════════════════════════════
// ÁLBUMES
// ══════════════════════════════════════════════════════════
async function cargarAlbumes(misCanciones, todoFeed) {
  try {
    // Álbumes con like del usuario
    var likedIds = await getMisLikes();
    if (!likedIds.length) {
      var el = document.getElementById('bib-albums');
      if (el) el.innerHTML = '<p style="color:#555;font-size:13px;padding:16px">Aún no has marcado álbumes como favoritos.</p>';
      return;
    }

    // Buscar en el feed los álbumes/eps que coincidan con los likes
    var albumsLiked = todoFeed.filter(function(c) {
      return (c.tipo === 'album' || c.tipo === 'ep') && likedIds.includes(c.id);
    });

    // También incluir los propios del usuario que tengan like
    var propiosConLike = misCanciones.filter(function(c) {
      return (c.tipo === 'album' || c.tipo === 'ep') && likedIds.includes(c.id);
    });

    // Combinar sin duplicados
    var vistos = {};
    var todos = [];
    propiosConLike.concat(albumsLiked).forEach(function(c) {
      if (!vistos[c.id]) { vistos[c.id] = true; todos.push(c); }
    });

    if (!todos.length) {
      var el = document.getElementById('bib-albums');
      if (el) el.innerHTML = '<p style="color:#555;font-size:13px;padding:16px">Aún no has marcado álbumes como favoritos. ❤️</p>';
      return;
    }

    buildCarousel('bib-albums', todos, cardAlbum, 15, 'Sin álbumes favoritos aún.');
  } catch(e) {
    console.warn('[biblioteca] álbumes con like:', e.message);
    var el = document.getElementById('bib-albums');
    if (el) el.innerHTML = '<p style="color:#555;font-size:13px;padding:16px">No se pudieron cargar álbumes.</p>';
  }
}

// ══════════════════════════════════════════════════════════
// SENCILLOS
// ══════════════════════════════════════════════════════════
function cargarSencillos(misCanciones, todoFeed) {
  var propios = misCanciones.filter(function(c) {
    return c.tipo !== 'album' && c.tipo !== 'ep' && c.tipo !== 'lista' && c.tipo !== 'playlist';
  });
  var populares = todoFeed
    .filter(function(c) { return c.tipo !== 'album' && c.tipo !== 'ep' && c.tipo !== 'lista' && c.tipo !== 'playlist'; })
    .sort(function(a, b) { return (b.reproducciones || 0) - (a.reproducciones || 0); });

  var propiosIds = {};
  propios.forEach(function(c) { propiosIds[c.id] = true; });
  var resto = populares.filter(function(c) { return !propiosIds[c.id]; });
  var todos = propios.concat(resto);

  buildCarousel('bib-sencillos-1', todos, cardSencillo, 20, 'Sin sencillos aún.');

  var s2 = $('bib-sencillos-2');
  if (s2) s2.style.display = 'none';
}

// ══════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async function() {
  var u = getUsuarioLocal();
  if (!u || !u.uid) { window.location.replace('/login'); return; }

  initSidebar(u);

  var results = await Promise.all([
    leerMisCanciones().catch(function() { return []; }),
    leerFeedGlobal({ limite: 200 }).catch(function() { return []; }),
  ]);
  var misCanciones = results[0];
  var todoFeed     = results[1];

  // ── Filtrar baneados e inactivos del feed ─────────────────
  var _ban = window._sneakBaneadosUids || new Set();
  if (!_ban.size) {
    try {
      var { collection: _c2, getDocs: _g2 } =
        await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      var { db: _db2 } = await import('/js/firebase-auth.js');
      var _sb = await _g2(_c2(_db2, 'usuarios'));
      _sb.forEach(function(d){ if (d.data().baneado === true) _ban.add(d.id); });
      window._sneakBaneadosUids = _ban;
    } catch(_) {}
  }
  todoFeed = todoFeed.filter(function(c){ return c.activo !== false && !_ban.has(c.uid); });
  // ─────────────────────────────────────────────────────────

  cargarStats(u, misCanciones);
  cargarFavoritas(u);

  var listas = todoFeed.filter(function(c) { return c.tipo === 'lista' || c.tipo === 'playlist'; });
  buildCarousel('bib-listas', listas, cardLista, 10, 'Aún no hay listas en la plataforma.');

  cargarArtistas(u, todoFeed); // async, no bloqueante
  await cargarAlbumes(misCanciones, todoFeed);
  cargarSencillos(misCanciones, todoFeed);
  renderTop3(todoFeed);
});
// ═══════════════════════════════════════════════════════════
// ROUTER INIT — expone iniciarBiblioteca() para el router SPA
// ═══════════════════════════════════════════════════════════
window.iniciarBiblioteca = async function () {
  var u = getUsuarioLocal();
  if (!u || !u.uid) return;

  initSidebar(u);

  var results = await Promise.all([
    leerMisCanciones().catch(function() { return []; }),
    leerFeedGlobal({ limite: 200 }).catch(function() { return []; }),
  ]);
  var misCanciones = results[0];
  var todoFeed     = results[1];

  // ── Filtrar baneados e inactivos del feed ─────────────────
  var _ban = window._sneakBaneadosUids || new Set();
  if (!_ban.size) {
    try {
      var { collection: _c2, getDocs: _g2 } =
        await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      var { db: _db2 } = await import('/js/firebase-auth.js');
      var _sb = await _g2(_c2(_db2, 'usuarios'));
      _sb.forEach(function(d){ if (d.data().baneado === true) _ban.add(d.id); });
      window._sneakBaneadosUids = _ban;
    } catch(_) {}
  }
  todoFeed = todoFeed.filter(function(c){ return c.activo !== false && !_ban.has(c.uid); });
  // ─────────────────────────────────────────────────────────

  cargarStats(u, misCanciones);
  cargarFavoritas(u);

  var listas = todoFeed.filter(function(c) { return c.tipo === 'lista' || c.tipo === 'playlist'; });
  buildCarousel('bib-listas', listas, cardLista, 10, 'Aún no hay listas en la plataforma.');

  cargarArtistas(u, todoFeed);
  await cargarAlbumes(misCanciones, todoFeed);
  cargarSencillos(misCanciones, todoFeed);
  renderTop3(todoFeed);
};
