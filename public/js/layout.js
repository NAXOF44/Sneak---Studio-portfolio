(function () {

  const SIDEBAR_HTML = `
  <nav class="sidebar" id="sneak-sidebar">
    <div class="logo-details">
      <a href="/inicio" data-page="inicio">
        <span class="logo_name">
          <img src="/img/Logo SK.gif" style="width:90px;height:90px" alt="" onerror="this.style.display='none'">
        </span>
      </a>
    </div>

    <div class="user">
      <a href="/perfil" data-page="Perfil">
        <div class="fond">
          <div class="perf-usuario">
            <div class="user-img">
              <img src="/img/porfile.jpeg" alt="" id="sidebar-foto" onerror="this.src='/img/porfile.jpeg'">
            </div>
            <div class="nombre-user">
              <h1 id="sidebar-nombre">Cargando...</h1>
            </div>
          </div>
          <div class="div-sub">
            <div class="cant-canciones">
              <p id="sidebar-cant">0</p>
            </div>
            <div class="creaciones">
              <p>creaciones</p>
            </div>
          </div>
        </div>
      </a>
    </div>

    <ul class="nav-links">
      <li>
        <a href="/inicio" data-page="inicio" class="no-active">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M6.5 14.5v-3.505c0-.245.25-.495.5-.495h2c.25 0 .5.25.5.5v3.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5"/>
          </svg>
          <span class="links_name">Inicio</span>
        </a>
      </li>
      <li>
        <a href="/proyectos" data-page="proyectos" class="no-active">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M6 13c0 1.105-1.12 2-2.5 2S1 14.105 1 13s1.12-2 2.5-2 2.5.896 2.5 2m9-2c0 1.105-1.12 2-2.5 2s-2.5-.895-2.5-2 1.12-2 2.5-2 2.5.895 2.5 2"/>
            <path fill-rule="evenodd" d="M14 11V2h1v9zM6 3v10H5V3z"/>
            <path d="M5 2.905a1 1 0 0 1 .9-.995l8-.8a1 1 0 0 1 1.1.995V3L5 4z"/>
          </svg>
          <span class="links_name">Proyectos</span>
        </a>
      </li>
      <li>
        <a href="/explorar" data-page="Explorar" class="no-active">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
          </svg>
          <span class="links_name">Explorar</span>
        </a>
      </li>
      <li>
        <a href="/biblioteca" data-page="Biblioteca" class="no-active">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M0 13a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 16 13V6a1.5 1.5 0 0 0-1.5-1.5h-13A1.5 1.5 0 0 0 0 6zM2 3a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 0-1h-11A.5.5 0 0 0 2 3m2-2a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 0-1h-7A.5.5 0 0 0 4 1"/>
          </svg>
          <span class="links_name">Biblioteca</span>
        </a>
      </li>
      <li>
        <a href="/notificaciones" data-page="Notificaciones" class="no-active">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2m.995-14.901a1 1 0 1 0-1.99 0A5 5 0 0 0 3 6c0 1.098-.5 6-2 7h14c-1.5-1-2-5.902-2-7 0-2.42-1.72-4.44-4.005-4.901"/>
          </svg>
          <span class="links_name">Notificaciones</span>
        </a>
      </li>
      <li>
        <a href="/creacion" data-page="Creacion" class="no-active">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2"/>
          </svg>
          <span class="links_name">Crear</span>
        </a>
      </li>
      <li class="log_out">
        <a href="#" id="btn-logout">
          <span class="links_name">Cerrar Sesión</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z"/>
            <path fill-rule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z"/>
          </svg>
        </a>
      </li>
    </ul>
  </nav>`;

  const PLAYER_HTML = `
  <div class="master-player-container" id="sneak-player">
    <div class="current-track-info">
      <img src="/img/home-banner.png" alt="Portada" class="album-art" id="player-art" onerror="this.src='/img/home-banner.png'">
      <div class="track-details">
        <h4 class="track-title" id="player-titulo">—</h4>
        <div class="artist-row">
          <span class="artist-name" id="player-artista">—</span>
          <button class="btn-follow" id="player-follow">Seguir</button>
        </div>
      </div>
      <button class="btn-like" id="player-like">
        <i class="fa-regular fa-heart" id="heart-icon"></i>
      </button>
    </div>
    <div class="player-controls-section">
      <div class="control-buttons">
        <button class="ctrl-btn" id="btn-shuffle"><i class="fas fa-random"></i></button>
        <button class="ctrl-btn" id="btn-prev"><i class="fas fa-step-backward"></i></button>
        <button class="play-pause-btn" id="btn-playpause"><i class="fas fa-play-circle"></i></button>
        <button class="ctrl-btn" id="btn-next"><i class="fas fa-step-forward"></i></button>
        <button class="ctrl-btn" id="btn-repeat"><i class="fas fa-redo"></i></button>
      </div>
      <div class="progress-bar-wrapper">
        <span class="time" id="time-current">0:00</span>
        <input type="range" class="seek-bar" id="seek-bar" min="0" max="100" value="0">
        <span class="time" id="time-total">0:00</span>
      </div>
    </div>
    <div class="extra-controls">
      <i class="fas fa-volume-up"></i>
      <input type="range" class="volume-bar" id="volume-bar" min="0" max="100" value="70">
    </div>
  </div>`;

  

  if (!document.getElementById('sneak-sidebar')) {
    const sidebarRoot = document.getElementById('sidebar-root');
    if (sidebarRoot) {
      sidebarRoot.outerHTML = SIDEBAR_HTML;
    } else {
      document.body.insertAdjacentHTML('afterbegin', SIDEBAR_HTML);
    }
  }

  

  if (!document.getElementById('sneak-player')) {
    const playerRoot = document.getElementById('player-root');
    if (playerRoot) {
      playerRoot.outerHTML = PLAYER_HTML;
    } else {
      document.body.insertAdjacentHTML('beforeend', PLAYER_HTML);
    }
  }

  

  const pagina = window.location.pathname.replace(/\/+$/, '');
  const PAGE_MAP = {
    '/inicio': 'inicio',
    '/proyectos': 'proyectos',
    '/explorar': 'Explorar',
    '/biblioteca': 'Biblioteca',
    '/notificaciones': 'Notificaciones',
    '/creacion': 'Creacion',
    '/crear': 'Creacion',
    '/perfil': 'Perfil',
  };
  const paginaKey = PAGE_MAP[pagina] || '';
  document.querySelectorAll('.nav-links a[data-page]').forEach(a => {
    const esActiva = a.dataset.page === paginaKey;
    a.classList.toggle('active', esActiva);
    a.classList.toggle('no-active', !esActiva);
  });

  


})();
