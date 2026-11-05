import { iniciarObservador, cerrarSesion, getUsuarioLocal }
  from '/js/firebase-auth.js';

const paginaActual = window.location.pathname.replace(/\/+$/, '') || '/';
const PUBLICAS     = ['/login', '/signup', '/onboarding', '/', '/index'];
const esPublica    = PUBLICAS.some(p => paginaActual === p);

const PAGE_MAP = {
  '/inicio':           'Inicio',
  '/proyectos':        'Proyectos',
  '/explorar':         'Explorar',
  '/biblioteca':       'Biblioteca',
  '/favoritas':        'Biblioteca',
  '/creacion':         'Crear',
  '/crear':            'Crear',
  '/perfil':           'Perfil',
  '/notificaciones':   'Notificaciones',
};

const loader = document.createElement('div');
loader.id = '__sneak_loader';
loader.style.cssText = [
  'position:fixed', 'inset:0', 'background:#080808', 'z-index:999999',
  'display:flex', 'flex-direction:column', 'align-items:center',
  'justify-content:center', 'gap:24px',
  'transition:opacity .5s ease, visibility .5s ease',
].join(';');

loader.innerHTML = `
  <img src="/img/logo- Sneak.svg" alt=""
    style="height:48px;animation:__snk_pulse 2s ease-in-out infinite"
    onerror="this.src='/img/logo sk.png';this.onerror=null">
  <div style="width:160px;height:2px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden">
    <div id="__snk_bar" style="height:100%;width:0%;background:#fff;transition:width .3s ease-out;border-radius:2px"></div>
  </div>
  <style>
    @keyframes __snk_pulse {
      0%,100%{transform:scale(1);opacity:.8}
      50%{transform:scale(1.04);opacity:1}
    }
  </style>`;

document.body.prepend(loader);

const bar = document.getElementById('__snk_bar');
let _progress = 0;
let _barInterval = setInterval(() => {
  if (_progress < 85) {
    _progress += Math.random() * 6;
    if (_progress > 85) _progress = 85;
    bar.style.width = _progress + '%';
  }
}, 120);

function completeLoader() {
  clearInterval(_barInterval);
  bar.style.width = '100%';
  setTimeout(() => {
    loader.style.opacity = '0';
    loader.style.visibility = 'hidden';
    setTimeout(() => loader.remove(), 500);
  }, 300);
}

window.__sneakReady = completeLoader;

const _maxTimeout = setTimeout(completeLoader, 5000);

window.addEventListener('load', () => {
  clearTimeout(_maxTimeout);
  

  setTimeout(completeLoader, 800);
}, { once: true });

if (!esPublica) {
  iniciarObservador(
    user => {
      if (!user?.onboarding && paginaActual !== 'Onboarding.html') {
        window.location.replace('/onboarding'); return;
      }
      inyectarSidebar(user);
      

      

    },
    () => window.location.replace('/login')
  );
} else {
  

  window.addEventListener('load', () => {
    clearTimeout(_maxTimeout);
    completeLoader();
  }, { once: true });
}

function inyectarSidebar(user) {
  if (!user) return;

  const foto   = (user.foto && !user.foto.startsWith('data:')) ? user.foto : '/img/porfile.jpeg';
  const nombre = user.username || user.nombre || 'Usuario';

  const sideImg = document.querySelector('.user-img img');
  const sideNom = document.querySelector('.nombre-user h1');
  const mobImg  = document.querySelector('.mobile-profile-btn img');

  if (sideImg) { sideImg.src = foto; sideImg.onerror = () => { sideImg.src = '/img/porfile.jpeg'; }; }
  if (sideNom)   sideNom.textContent = nombre;
  if (mobImg)  { mobImg.src  = foto; mobImg.onerror  = () => { mobImg.src  = '/img/porfile.jpeg'; }; }

  setTimeout(() => {
    import('/js/sneak-db.js').then(mod => {
      mod.leerMisCanciones().then(canciones => {
        const cantEl  = document.querySelector('.cant-canciones p');
        const creacEl = document.querySelector('.creaciones p');
        if (cantEl)  cantEl.textContent  = canciones.length;
        if (creacEl) creacEl.textContent = canciones.length === 1 ? 'creación' : 'creaciones';
      }).catch(() => {});
    }).catch(() => {});
  }, 1500);

  const activo = PAGE_MAP[paginaActual] || '';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const txt = a.querySelector('.links_name')?.textContent?.trim();
    if (!txt) return;
    a.classList.toggle('active',    txt === activo);
    a.classList.toggle('no-active', txt !== activo);
  });

  

  document.addEventListener('click', async function(e) {
    const btn = e.target.closest('.log_out a, #btn-logout');
    if (btn) { e.preventDefault(); await cerrarSesion(); }
  });
}

export { inyectarSidebar };
