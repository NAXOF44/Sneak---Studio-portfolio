// ══════════════════════════════════════════════════════════════
//  cookies.js — Banner de consentimiento GDPR — Sneak Studio
//
//  CÓMO INCLUIRLO:
//  Añade esta línea en todas las páginas, antes de </body>:
//  <script src="/js/cookies.js"></script>
//
//  O añádelo en layout.js para que sea automático en toda la app.
// ══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  var STORAGE_KEY   = 'snk_cookies_v1';
  var BRAND_ORANGE  = '#FF6200';

  // ── Ya aceptado / rechazado → no mostrar ─────────────────────
  function getConsent() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); }
    catch (e) { return null; }
  }

  function saveConsent(obj) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(obj)); }
    catch (e) {}
  }

  // Si ya hay decisión guardada, no hacer nada
  if (getConsent() !== null) return;

  // ── CSS ───────────────────────────────────────────────────────
  var style = document.createElement('style');
  style.id  = 'snk-cookies-css';
  style.textContent = `
    /* ── Overlay de desenfoque ── */
    #snk-ck-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,.55);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      z-index: 199998;
      opacity: 0;
      animation: snk-ck-fadein .4s .1s ease forwards;
    }
    @keyframes snk-ck-fadein {
      to { opacity: 1; }
    }

    /* ── Panel principal ── */
    #snk-ck-panel {
      position: fixed;
      bottom: 24px; left: 50%;
      transform: translateX(-50%) translateY(30px);
      width: min(96vw, 560px);
      background: #0e0e11;
      border: 1px solid rgba(255,255,255,.09);
      border-radius: 20px;
      padding: 28px 28px 24px;
      z-index: 199999;
      box-shadow: 0 32px 80px rgba(0,0,0,.75), 0 0 0 1px rgba(255,255,255,.04) inset;
      opacity: 0;
      animation: snk-ck-slidein .45s .15s cubic-bezier(.34,1.56,.64,1) forwards;
      font-family: 'DM Sans', system-ui, sans-serif;
    }
    @keyframes snk-ck-slidein {
      to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }

    /* ── Salida ── */
    #snk-ck-panel.snk-ck-out,
    #snk-ck-overlay.snk-ck-out {
      animation: snk-ck-slideout .35s cubic-bezier(.4,0,.2,1) forwards;
    }
    @keyframes snk-ck-slideout {
      to { opacity: 0; transform: translateX(-50%) translateY(20px); }
    }
    #snk-ck-overlay.snk-ck-out {
      animation: snk-ck-fadeout .35s cubic-bezier(.4,0,.2,1) forwards;
    }
    @keyframes snk-ck-fadeout { to { opacity: 0; } }

    /* ── Logo + título ── */
    .snk-ck-header {
      display: flex; align-items: center; gap: 12px;
      margin-bottom: 14px;
    }
    .snk-ck-logo {
      width: 36px; height: 36px; flex-shrink: 0;
    }
    .snk-ck-brand {
      font-size: 11px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 1.2px;
      color: rgba(255,255,255,.35);
    }
    .snk-ck-title {
      font-size: 15px; font-weight: 700;
      color: #fff; line-height: 1.2;
    }

    /* ── Texto ── */
    .snk-ck-body {
      font-size: 13px; color: rgba(255,255,255,.45);
      line-height: 1.7; margin-bottom: 20px;
    }
    .snk-ck-body a {
      color: ${BRAND_ORANGE};
      text-decoration: none;
    }
    .snk-ck-body a:hover { text-decoration: underline; }

    /* ── Toggles de categorías ── */
    .snk-ck-cats {
      display: flex; flex-direction: column; gap: 9px;
      margin-bottom: 20px;
    }
    .snk-ck-cat {
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px;
      padding: 11px 14px;
      background: rgba(255,255,255,.035);
      border: 1px solid rgba(255,255,255,.07);
      border-radius: 11px;
      transition: border-color .2s;
    }
    .snk-ck-cat:hover { border-color: rgba(255,255,255,.12); }
    .snk-ck-cat-info { flex: 1; }
    .snk-ck-cat-name {
      font-size: 13px; font-weight: 600; color: #fff;
      margin-bottom: 2px;
    }
    .snk-ck-cat-desc {
      font-size: 11px; color: rgba(255,255,255,.35);
      line-height: 1.45;
    }

    /* Toggle switch */
    .snk-ck-toggle {
      position: relative; flex-shrink: 0;
      width: 38px; height: 22px;
    }
    .snk-ck-toggle input {
      opacity: 0; width: 0; height: 0; position: absolute;
    }
    .snk-ck-slider {
      position: absolute; inset: 0;
      background: rgba(255,255,255,.1);
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 50px;
      cursor: pointer;
      transition: background .22s, border-color .22s;
    }
    .snk-ck-slider::before {
      content: '';
      position: absolute;
      width: 14px; height: 14px; border-radius: 50%;
      background: rgba(255,255,255,.4);
      left: 3px; top: 3px;
      transition: transform .22s cubic-bezier(.34,1.56,.64,1), background .22s;
    }
    .snk-ck-toggle input:checked + .snk-ck-slider {
      background: rgba(255,98,0,.18);
      border-color: ${BRAND_ORANGE};
    }
    .snk-ck-toggle input:checked + .snk-ck-slider::before {
      transform: translateX(16px);
      background: ${BRAND_ORANGE};
    }
    .snk-ck-toggle input:disabled + .snk-ck-slider {
      opacity: .5; cursor: not-allowed;
    }

    /* ── Botones ── */
    .snk-ck-actions {
      display: flex; gap: 9px; align-items: center;
    }
    .snk-ck-btn-all {
      flex: 1;
      background: ${BRAND_ORANGE}; color: #fff;
      border: none; border-radius: 50px;
      padding: 11px 20px; font-size: 13px; font-weight: 700;
      cursor: pointer; font-family: inherit;
      transition: background .18s, transform .14s;
      position: relative; overflow: hidden;
    }
    .snk-ck-btn-all::before {
      content: '';
      position: absolute; inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,.15) 0%, transparent 55%);
      opacity: 0; transition: opacity .18s;
    }
    .snk-ck-btn-all:hover { background: #ff7a1a; transform: translateY(-1px); }
    .snk-ck-btn-all:hover::before { opacity: 1; }

    .snk-ck-btn-sel {
      background: transparent;
      border: 1px solid rgba(255,255,255,.12);
      color: rgba(255,255,255,.55);
      border-radius: 50px;
      padding: 11px 20px; font-size: 13px; font-weight: 600;
      cursor: pointer; font-family: inherit;
      transition: all .18s;
    }
    .snk-ck-btn-sel:hover {
      border-color: rgba(255,255,255,.25);
      color: #fff;
    }

    .snk-ck-btn-rej {
      background: transparent; border: none;
      color: rgba(255,255,255,.25);
      font-size: 12px; font-weight: 500;
      cursor: pointer; font-family: inherit;
      padding: 0 4px;
      transition: color .18s;
      text-decoration: underline;
      white-space: nowrap;
    }
    .snk-ck-btn-rej:hover { color: rgba(255,255,255,.55); }

    /* ── Detalles expandibles ── */
    .snk-ck-details-toggle {
      display: block;
      font-size: 12px; color: rgba(255,255,255,.28);
      cursor: pointer; margin-bottom: 16px;
      user-select: none;
      transition: color .18s;
    }
    .snk-ck-details-toggle:hover { color: rgba(255,255,255,.55); }

    .snk-ck-cats { display: none; }
    .snk-ck-cats.open { display: flex; }

    /* ── Divider ── */
    .snk-ck-divider {
      height: 1px; background: rgba(255,255,255,.06);
      margin: 16px 0;
    }

    /* ── Responsive ── */
    @media (max-width: 520px) {
      #snk-ck-panel {
        bottom: 0; left: 0; right: 0;
        transform: translateY(30px);
        border-radius: 20px 20px 0 0;
        width: 100%;
        animation: snk-ck-slidein-mob .45s .15s cubic-bezier(.34,1.56,.64,1) forwards;
      }
      #snk-ck-panel.snk-ck-out {
        animation: snk-ck-slideout-mob .35s cubic-bezier(.4,0,.2,1) forwards;
      }
      @keyframes snk-ck-slidein-mob { to { opacity:1; transform:translateY(0); } }
      @keyframes snk-ck-slideout-mob { to { opacity:0; transform:translateY(40px); } }

      .snk-ck-actions { flex-wrap: wrap; }
      .snk-ck-btn-all { width: 100%; justify-content: center; order: 0; }
      .snk-ck-btn-sel { width: 100%; justify-content: center; order: 1; }
      .snk-ck-btn-rej { width: 100%; text-align: center; order: 2; }
    }
  `;
  document.head.appendChild(style);

  // ── HTML ──────────────────────────────────────────────────────
  var logoSVG = `<svg class="snk-ck-logo" viewBox="0 0 136 111" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M54.9943 4.84222C49.5223 9.68458 49.2617 11.8636 49.2617 49.634V84.5835C49.2617 87.3449 51.5003 89.5835 54.2617 89.5835H80.7421C83.5035 89.5835 85.7421 87.3449 85.7421 84.5835V49.634C85.7421 11.8636 85.4815 9.68458 80.0094 4.84222C76.8826 2.17892 71.1499 0 67.5019 0C63.8539 0 58.1212 2.17892 54.9943 4.84222Z" fill="${BRAND_ORANGE}"/>
    <path d="M24.7545 17.675C20.3248 19.1278 13.2893 23.4859 9.12009 27.3598C2.08459 34.1391 1.82402 35.5918 1.0423 62.2247L0.274312 82.562C0.124518 86.5288 3.29975 89.8262 7.26933 89.8262H30.0015C33.8675 89.8262 37.0015 86.6922 37.0015 82.8262V52.2979C37.0015 31.7179 36.2198 14.7696 35.1775 15.0118C33.8746 15.2539 29.4449 16.4645 24.7545 17.675Z" fill="white"/>
    <path d="M98 53.3264V82.644C98 86.51 101.134 89.644 105 89.644H127.241C130.888 89.644 133.925 86.843 134.218 83.2072L135.262 70.2746C136.826 51.1473 135.523 43.8838 128.748 36.136C124.579 31.2936 103.211 17.0087 100.085 17.0087C99.0423 17.0087 98 33.2306 98 53.3264Z" fill="white"/>
    <rect y="96.0088" width="133" height="15" rx="7.5" fill="white"/>
  </svg>`;

  var overlay = document.createElement('div');
  overlay.id  = 'snk-ck-overlay';

  var panel = document.createElement('div');
  panel.id  = 'snk-ck-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-label', 'Preferencias de cookies');

  panel.innerHTML = `
    <div class="snk-ck-header">
      ${logoSVG}
      <div>
        <div class="snk-ck-brand">Sneak Studio</div>
        <div class="snk-ck-title">Tu privacidad, tus reglas</div>
      </div>
    </div>

    <p class="snk-ck-body">
      Usamos cookies propias y de terceros para mejorar tu experiencia, analizar el uso de la plataforma y personalizar el contenido. Puedes aceptarlas todas, configurarlas según tus preferencias o rechazar las no esenciales.
      <br><br>
      <a href="/html/Privacidad.html" target="_blank">Política de privacidad</a>
      &nbsp;·&nbsp;
      <a href="/html/Cookies.html" target="_blank">Política de cookies</a>
    </p>

    <span class="snk-ck-details-toggle" id="snk-ck-toggle-details">
      ▸ Configurar mis preferencias
    </span>

    <div class="snk-ck-cats" id="snk-ck-cats">
      <div class="snk-ck-cat">
        <div class="snk-ck-cat-info">
          <div class="snk-ck-cat-name">Esenciales</div>
          <div class="snk-ck-cat-desc">Necesarias para que la plataforma funcione. No se pueden desactivar.</div>
        </div>
        <label class="snk-ck-toggle">
          <input type="checkbox" checked disabled>
          <span class="snk-ck-slider"></span>
        </label>
      </div>

      <div class="snk-ck-cat">
        <div class="snk-ck-cat-info">
          <div class="snk-ck-cat-name">Analíticas</div>
          <div class="snk-ck-cat-desc">Nos ayudan a entender cómo usas Sneak para mejorar la experiencia.</div>
        </div>
        <label class="snk-ck-toggle">
          <input type="checkbox" id="snk-ck-analytics" checked>
          <span class="snk-ck-slider"></span>
        </label>
      </div>

      <div class="snk-ck-cat">
        <div class="snk-ck-cat-info">
          <div class="snk-ck-cat-name">Personalización</div>
          <div class="snk-ck-cat-desc">Permiten recordar tus preferencias y personalizar el contenido musical.</div>
        </div>
        <label class="snk-ck-toggle">
          <input type="checkbox" id="snk-ck-personal" checked>
          <span class="snk-ck-slider"></span>
        </label>
      </div>
    </div>

    <div class="snk-ck-divider"></div>

    <div class="snk-ck-actions">
      <button class="snk-ck-btn-all" id="snk-ck-accept-all">
        Aceptar todas
      </button>
      <button class="snk-ck-btn-sel" id="snk-ck-accept-sel">
        Guardar selección
      </button>
      <button class="snk-ck-btn-rej" id="snk-ck-reject">
        Solo esenciales
      </button>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(panel);

  // Bloquear scroll mientras el banner está visible
  document.body.style.overflow = 'hidden';

  // ── Toggle detalles ───────────────────────────────────────────
  var detailsToggle = document.getElementById('snk-ck-toggle-details');
  var catsEl        = document.getElementById('snk-ck-cats');
  var open          = false;

  detailsToggle.addEventListener('click', function () {
    open = !open;
    catsEl.classList.toggle('open', open);
    detailsToggle.textContent = open
      ? '▾ Ocultar preferencias'
      : '▸ Configurar mis preferencias';
  });

  // ── Cerrar con animación ──────────────────────────────────────
  function _dismiss() {
    panel.classList.add('snk-ck-out');
    overlay.classList.add('snk-ck-out');
    document.body.style.overflow = '';
    setTimeout(function () {
      panel.remove();
      overlay.remove();
      style.remove();
    }, 380);
  }

  // ── Guardar y cerrar ─────────────────────────────────────────
  function _save(consent) {
    saveConsent({
      essential   : true,
      analytics   : consent.analytics,
      personal    : consent.personal,
      date        : new Date().toISOString(),
    });

    // Disparar evento para que otros scripts puedan reaccionar
    try {
      window.dispatchEvent(new CustomEvent('snkCookiesConsent', { detail: consent }));
    } catch (e) {}

    _dismiss();
  }

  // ── Botón: Aceptar todas ─────────────────────────────────────
  document.getElementById('snk-ck-accept-all').addEventListener('click', function () {
    // Marcar todos los toggles visualmente
    var analytics = document.getElementById('snk-ck-analytics');
    var personal  = document.getElementById('snk-ck-personal');
    if (analytics) analytics.checked = true;
    if (personal)  personal.checked  = true;

    _save({ essential: true, analytics: true, personal: true });
  });

  // ── Botón: Guardar selección ──────────────────────────────────
  document.getElementById('snk-ck-accept-sel').addEventListener('click', function () {
    var analyticsChecked = document.getElementById('snk-ck-analytics')?.checked ?? true;
    var personalChecked  = document.getElementById('snk-ck-personal')?.checked  ?? true;
    _save({ essential: true, analytics: analyticsChecked, personal: personalChecked });
  });

  // ── Botón: Solo esenciales ────────────────────────────────────
  document.getElementById('snk-ck-reject').addEventListener('click', function () {
    _save({ essential: true, analytics: false, personal: false });
  });

  // ── Cerrar con click fuera (en overlay) ──────────────────────
  // No se cierra con click fuera — el usuario debe elegir explícitamente (GDPR)

  // ── Focus trap básico ─────────────────────────────────────────
  panel.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      // Escape = solo esenciales (decisión conservadora)
      _save({ essential: true, analytics: false, personal: false });
    }
  });

  // Focus al primer botón interactivo
  setTimeout(function () {
    var firstBtn = document.getElementById('snk-ck-accept-all');
    if (firstBtn) firstBtn.focus();
  }, 500);

})();
