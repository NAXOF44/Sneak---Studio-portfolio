const _audio = new Audio();
_audio.volume = 0.7;
window.__sneakAudio = _audio;

let _cancion = null;
let _playing = false;
let _queue = [];
let _qi = 0;
let _repeat = false;
let _shuffle = false;

const STATE_KEY = 'sneak_player_state';

function save() {
  if (!_cancion || !_audio.src) return;
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify({
      cancion: _cancion, src: _audio.src,
      t: _audio.currentTime || 0, vol: _audio.volume, ts: Date.now(),
    }));
  } catch (_) { }
}

window.addEventListener('beforeunload', save);
document.addEventListener('click', function (e) {
  const a = e.target.closest('a[href]');
  if (!a) return;
  const h = a.getAttribute('href') || '';
  if (h && h !== '#' && !h.startsWith('http') && !h.startsWith('mailto')) save();
});

function restore() {
  let s;
  try { s = JSON.parse(localStorage.getItem(STATE_KEY)); } catch (_) { return; }
  if (!s?.src || !s?.cancion) return;
  if (Date.now() - (s.ts || 0) > 86400000) return;

  _cancion = s.cancion;
  _audio.volume = s.vol ?? 0.7;
  _audio.src = s.src;

  _audio.addEventListener('loadedmetadata', function () {
    if (s.t > 1) _audio.currentTime = s.t;
    updateUI(_cancion, false);
    

    const p = document.querySelector('.master-player-container');
    if (p) { p.style.zIndex = '8888'; p.style.opacity = '1'; p.style.pointerEvents = 'auto'; }
    const main = document.querySelector('.home-section, .crear-section, .profile-wrapper, .fav-list, .album-hero');
    if (main && !main.style.paddingBottom) main.style.paddingBottom = '110px';
    const sidebar = document.querySelector('.sidebar');
    const playerH = p ? p.offsetHeight || 88 : 88;
    if (sidebar && window.innerWidth <= 768) sidebar.style.bottom = playerH + 'px';
    sincronizarLike(_cancion.id);
    sincronizarSeguir(_cancion.uid);
  }, { once: true });

  _audio.load();
}

window.reproducirCancion = function (c) {
  if (!c || !c.audio) return;
  if (_cancion && String(_cancion.id) === String(c.id)) { togglePause(); return; }
  _cancion = c;
  const idx = _queue.findIndex(x => String(x.id) === String(c.id));
  if (idx >= 0) { _qi = idx; } else { _queue.push(c); _qi = _queue.length - 1; }
  loadAndPlay(c);
};

window.cargarCola = function (canciones, inicio) {
  _queue = Array.isArray(canciones) ? [...canciones] : [];
  _qi = inicio || 0;
  if (_queue[_qi]) loadAndPlay(_queue[_qi]);
};

window._togglePlayerPause = togglePause;

function loadAndPlay(c) {
  

  const art = document.getElementById('player-art');
  const tit = document.getElementById('player-titulo');
  const art2 = document.getElementById('player-artista');

  

  if (_cancion && art) art.style.opacity = '0';

  _audio.pause();
  _audio.src = c.audio;
  _audio.currentTime = 0;
  _audio.load();
  _audio.play().catch(e => console.warn('[Player] play blocked:', e.message));
  _playing = true;
  _cancion = c;
  updateUI(c, true);
  showPlayer();

  

  setTimeout(() => {
    if (art) art.style.opacity = '1';
  }, 120);

  if (typeof window._onSongChange === 'function') window._onSongChange(String(c.id));
  save();
  registrarReproduccionDB(c.id);
  sincronizarLike(c.id);
  sincronizarSeguir(c.uid);
}

function togglePause() {
  if (_playing) {
    _audio.pause(); _playing = false; setPlayIcon(false);
    if (typeof window._onSongPauseChange === 'function') window._onSongPauseChange(true);
    if (typeof window._onPlayerPauseChange === 'function') window._onPlayerPauseChange(true);
    if (typeof window._onSgPauseChange === 'function') window._onSgPauseChange(true);
    if (typeof window._onAlbumPauseChange === 'function') window._onAlbumPauseChange(true);
  } else {
    _audio.play().catch(e => console.warn('[Player] resume:', e.message));
    _playing = true; setPlayIcon(true);
    if (typeof window._onSongPauseChange === 'function') window._onSongPauseChange(false);
    if (typeof window._onPlayerPauseChange === 'function') window._onPlayerPauseChange(false);
    if (typeof window._onSgPauseChange === 'function') window._onSgPauseChange(false);
    if (typeof window._onAlbumPauseChange === 'function') window._onAlbumPauseChange(false);
  }
}

function registrarReproduccionDB(id) {
  if (!id) return;
  const key = 'snk_repro_' + id;
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, '1');
  import('/js/sneak-db.js').then(db => db.registrarReproduccion(id).catch(() => { })).catch(() => { });
}

function sincronizarLike(cancionId) {
  if (!cancionId) return;
  const ico = document.getElementById('heart-icon');
  if (!ico) return;
  ico.className = 'fa-regular fa-heart';
  ico.style.color = '';
  import('/js/sneak-db.js').then(db => {
    db.isLiked(cancionId).then(liked => {
      ico.className = liked ? 'fas fa-heart' : 'fa-regular fa-heart';
      ico.style.color = liked ? '#ff4400' : '';
    }).catch(() => { });
  }).catch(() => { });
}

function toggleLikePlayer() {
  if (!_cancion?.id) return;
  const ico = document.getElementById('heart-icon');
  if (!ico) return;
  import('/js/sneak-db.js').then(db => {
    db.toggleLike(_cancion.id).then(nuevo => {
      ico.className = nuevo ? 'fas fa-heart' : 'fa-regular fa-heart';
      ico.style.color = nuevo ? '#ff4400' : '';
      

      if (typeof window._onPlayerLikeChange === 'function') {
        window._onPlayerLikeChange(_cancion.id, nuevo);
      }
    }).catch(e => console.warn('[Player] toggleLike:', e.message));
  }).catch(() => { });
}

function sincronizarSeguir(artistaUid) {
  if (!artistaUid) return;
  const btn = document.getElementById('player-follow');
  if (!btn) return;
  const user = JSON.parse(localStorage.getItem('sneak_user') || 'null');
  if (user?.uid === artistaUid) { btn.style.display = 'none'; return; }
  btn.style.display = '';
  import('/js/sneak-db.js').then(db => {
    db.isSiguiendo(artistaUid).then(sig => setBtnSeguir(btn, sig)).catch(() => { });
  }).catch(() => { });
}

function toggleSeguirPlayer() {
  if (!_cancion?.uid) return;
  const btn = document.getElementById('player-follow');
  if (!btn) return;
  import('/js/sneak-db.js').then(db => {
    db.toggleSeguir(_cancion.uid).then(nuevo => {
      setBtnSeguir(btn, nuevo);
      if (typeof window._onPlayerSeguirChange === 'function') {
        window._onPlayerSeguirChange(_cancion.uid, nuevo);
      }
    }).catch(e => console.warn('[Player] toggleSeguir:', e.message));
  }).catch(() => { });
}

function updateUI(c, isPlaying) {
  if (!c) return;

  const art = document.getElementById('player-art');
  if (art) {
    art.crossOrigin = 'anonymous'; 

    art.src = c.portada || '/img/home-banner.png';
    art.onerror = () => {
      art.crossOrigin = null;
      art.src = '/img/home-banner.png';
    };
    art.onload = () => extractAndApplyColor(art);
  }

  const tit = document.getElementById('player-titulo');
  if (tit) tit.textContent = c.titulo || '—';

  const art2 = document.getElementById('player-artista');
  if (art2) {
    art2.textContent = c.artista || '—';
    art2.style.cursor = 'pointer';
    art2.onclick = function () {
      save();
      const user = JSON.parse(localStorage.getItem('sneak_user') || 'null');
      const esMio = user && c.uid === user.uid;
      window.location.href = esMio
        ? '/perfil'
        : `../html/Perfil.html?uid=${c.uid || ''}`;
    };
  }

  setPlayIcon(isPlaying);

  const vol = document.getElementById('volume-bar');
  if (vol) { vol.value = Math.round(_audio.volume * 100); vol.style.backgroundSize = vol.value + '% 100%'; }
}

function extractAndApplyColor(img) {
  try {
    const canvas = document.createElement('canvas');
    const size = 16; 

    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, size, size);
    const data = ctx.getImageData(0, 0, size, size).data;

    

    let r = 0, g = 0, b = 0, count = 0;
    for (let i = 0; i < data.length; i += 4) {
      const pr = data[i], pg = data[i + 1], pb = data[i + 2];
      const brightness = (pr + pg + pb) / 3;
      if (brightness > 30 && brightness < 230) { 

        r += pr; g += pg; b += pb; count++;
      }
    }
    if (!count) return;
    r = Math.round(r / count); g = Math.round(g / count); b = Math.round(b / count);

    

    const dr = Math.round(r * 0.25);
    const dg = Math.round(g * 0.25);
    const db = Math.round(b * 0.25);

    const player = document.querySelector('.master-player-container');
    if (player) {
      player.style.background = `linear-gradient(135deg, rgba(${dr},${dg},${db},0.95) 0%, rgba(12,12,12,0.97) 60%)`;
      player.style.transition = 'background 0.8s ease';
    }

    

    if (typeof window._onPlayerColorChange === 'function') {
      window._onPlayerColorChange(r, g, b, dr, dg, db);
    }

    

    const style = document.getElementById('__sneak_color_style') || (() => {
      const s = document.createElement('style');
      s.id = '__sneak_color_style';
      document.head.appendChild(s);
      return s;
    })();
    style.textContent = `
      .home-section::after, .fav-container::before {
        background: radial-gradient(ellipse 60% 20% at 50% 100%,
          rgba(${r},${g},${b},0.08) 0%, transparent 70%) !important;
      }
    `;
  } catch (e) {
    

  }
}

function setPlayIcon(on) {
  const btn = document.getElementById('btn-playpause');
  if (btn) btn.innerHTML = on ? '<i class="fas fa-pause-circle"></i>' : '<i class="fas fa-play-circle"></i>';
}

function setBtnSeguir(btn, sig) {
  if (!btn) return;
  btn.textContent = sig ? 'Siguiendo' : 'Seguir';
  btn.style.background = sig ? 'rgba(255,255,255,.15)' : '';
  btn.style.borderColor = sig ? 'rgba(255,255,255,.4)' : '';
}

function showPlayer() {
  const p = document.querySelector('.master-player-container');
  if (!p) return;
  const wasHidden = p.style.zIndex !== '8888';
  p.style.zIndex = '8888';
  p.style.opacity = '1';
  p.style.pointerEvents = 'auto';
  if (wasHidden) {
    p.setAttribute('data-visible', 'true');
    

    const main = document.querySelector('.home-section, .crear-section, .profile-wrapper, .fav-list, .album-hero');
    if (main && !main.style.paddingBottom) main.style.paddingBottom = '110px';
    

    const sidebar = document.querySelector('.sidebar');
    const playerH = p.offsetHeight || 88;
    if (sidebar && window.innerWidth <= 768) sidebar.style.bottom = playerH + 'px';
  }
}

document.addEventListener('DOMContentLoaded', function () {

  const btnPlay = document.getElementById('btn-playpause');
  if (btnPlay) btnPlay.addEventListener('click', togglePause);

  const btnNext = document.getElementById('btn-next');
  if (btnNext) btnNext.addEventListener('click', function () {
    if (!_queue.length) return;
    _qi = _shuffle ? Math.floor(Math.random() * _queue.length) : (_qi + 1) % _queue.length;
    loadAndPlay(_queue[_qi]);
  });

  const btnPrev = document.getElementById('btn-prev');
  if (btnPrev) btnPrev.addEventListener('click', function () {
    if (_audio.currentTime > 3) { _audio.currentTime = 0; return; }
    if (!_queue.length) return;
    _qi = (_qi - 1 + _queue.length) % _queue.length;
    loadAndPlay(_queue[_qi]);
  });

  const btnShuffle = document.getElementById('btn-shuffle');
  if (btnShuffle) btnShuffle.addEventListener('click', function () {
    _shuffle = !_shuffle;
    this.style.color = _shuffle ? '#FF6200' : '';
  });

  const btnRepeat = document.getElementById('btn-repeat');
  if (btnRepeat) btnRepeat.addEventListener('click', function () {
    _repeat = !_repeat;
    _audio.loop = _repeat;
    this.style.color = _repeat ? '#FF6200' : '';
  });

  const seekBar = document.getElementById('seek-bar');
  if (seekBar) seekBar.addEventListener('input', function () {
    if (_audio.duration) { _audio.currentTime = (this.value / 100) * _audio.duration; save(); }
  });

  const volBar = document.getElementById('volume-bar');
  if (volBar) volBar.addEventListener('input', function () {
    _audio.volume = this.value / 100;
    this.style.backgroundSize = this.value + '% 100%';
    save();
  });

  

  const likeBtn = document.getElementById('player-like');
  if (likeBtn) likeBtn.addEventListener('click', toggleLikePlayer);

  

  const followBtn = document.getElementById('player-follow');
  if (followBtn) followBtn.addEventListener('click', toggleSeguirPlayer);

  

  _audio.addEventListener('timeupdate', function () {
    if (!_audio.duration) return;
    const pct = (_audio.currentTime / _audio.duration) * 100;
    const seek = document.getElementById('seek-bar');
    if (seek && !seek.matches(':active')) {
      seek.value = pct;
      seek.style.backgroundSize = pct + '% 100%';
    }
    const cur = document.getElementById('time-current');
    const tot = document.getElementById('time-total');
    if (cur) cur.textContent = fmt(_audio.currentTime);
    if (tot) tot.textContent = fmt(_audio.duration);
  });

  

  _audio.addEventListener('ended', function () {
    if (_repeat) return;
    if (typeof window._onSongPauseChange === 'function') window._onSongPauseChange(true);
    _qi = _shuffle ? Math.floor(Math.random() * _queue.length) : _qi + 1;
    if (_qi >= _queue.length) {
      _playing = false; _qi = 0; setPlayIcon(false);
      if (typeof window._onListaTerminada === 'function') window._onListaTerminada();
      if (typeof window._onSongChange === 'function') window._onSongChange(null);
      return;
    }
    if (typeof window._onListaTrackChange === 'function') window._onListaTrackChange(_qi);
    loadAndPlay(_queue[_qi]);
  });

  setInterval(function () { if (_playing) save(); }, 5000);
  restore();
});

function fmt(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m + ':' + (sec < 10 ? '0' : '') + sec;
}
