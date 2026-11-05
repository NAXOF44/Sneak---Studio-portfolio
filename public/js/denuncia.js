(function () {

  

  

  

  var _cfg = window.SNEAK_EMAILJS || {};
  const EMAILJS_SERVICE  = _cfg.service  || 'TU_SERVICE_ID';
  const EMAILJS_TEMPLATE = _cfg.template || 'TU_TEMPLATE_ID';
  const EMAILJS_KEY      = _cfg.key      || 'TU_PUBLIC_KEY';
  

  

  const IC = {
    flag: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`,
    close: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    send: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    spin: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`,
    illegal: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`,
    copy: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M14.83 14.83a4 4 0 1 1 0-5.66"/></svg>`,
    warn: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    spam: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    shield: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    help: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  };

  

  const CSS = `
    .snk-overlay{position:fixed;inset:0;background:rgba(0,0,0,.84);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;opacity:0;pointer-events:none;transition:opacity .26s cubic-bezier(.4,0,.2,1)}
    .snk-overlay.open{opacity:1;pointer-events:all}
    .snk-box{background:#0e0e10;border:1px solid rgba(255,255,255,.09);border-radius:22px;padding:28px 26px 24px;width:100%;max-width:480px;position:relative;transform:translateY(30px) scale(.96);transition:transform .28s cubic-bezier(.34,1.56,.64,1);box-shadow:0 30px 80px rgba(0,0,0,.75),0 0 0 1px rgba(255,255,255,.04) inset}
    .snk-overlay.open .snk-box{transform:translateY(0) scale(1)}
    .snk-close{position:absolute;top:14px;right:14px;width:30px;height:30px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);border-radius:50%;color:#666;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s,color .15s}
    .snk-close:hover{background:rgba(255,255,255,.13);color:#fff}
    .snk-header{display:flex;align-items:center;gap:11px;margin-bottom:5px}
    .snk-hicon{width:36px;height:36px;border-radius:10px;background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.2);display:flex;align-items:center;justify-content:center;color:#ef4444;flex-shrink:0}
    .snk-title{font-size:15px;font-weight:700;color:#fff;font-family:'DM Sans',system-ui,sans-serif;margin:0}
    .snk-sub{font-size:12.5px;color:#5a5a5a;line-height:1.6;margin:0 0 20px;padding-left:47px;font-family:'DM Sans',system-ui,sans-serif}
    .snk-lbl{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#4a4a4a;margin-bottom:9px;display:block;font-family:'DM Sans',system-ui,sans-serif}
    .snk-reasons{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:16px}
    .snk-r{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);color:rgba(255,255,255,.55);padding:9px 11px;border-radius:10px;font-size:12.5px;cursor:pointer;transition:all .16s;text-align:left;font-family:'DM Sans',system-ui,sans-serif;display:flex;align-items:center;gap:8px}
    .snk-r:hover{background:rgba(239,68,68,.08);border-color:rgba(239,68,68,.28);color:#fff}
    .snk-r.sel{background:rgba(239,68,68,.12);border-color:rgba(239,68,68,.55);color:#fff;font-weight:600}
    .snk-r.sel svg{color:#ef4444}
    .snk-r svg{flex-shrink:0;opacity:.65}
    .snk-r.sel svg{opacity:1}
    .snk-divider{height:1px;background:rgba(255,255,255,.06);margin:14px 0}
    .snk-ta{width:100%;box-sizing:border-box;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:12px;color:#fff;padding:11px 13px;font-size:13px;font-family:'DM Sans',system-ui,sans-serif;resize:vertical;min-height:78px;outline:none;transition:border-color .2s;margin-bottom:13px}
    .snk-ta:focus{border-color:rgba(239,68,68,.4)}
    .snk-ta::placeholder{color:#333}
    .snk-chk{display:flex;align-items:center;gap:9px;margin-bottom:20px;font-size:12.5px;color:#5a5a5a;font-family:'DM Sans',system-ui,sans-serif;cursor:pointer;user-select:none}
    .snk-chk input{accent-color:#ef4444;width:14px;height:14px;cursor:pointer;flex-shrink:0}
    .snk-actions{display:flex;gap:8px;justify-content:flex-end;align-items:center}
    .snk-cancel{background:transparent;border:1px solid rgba(255,255,255,.1);color:#666;padding:9px 20px;border-radius:50px;font-size:13px;font-weight:600;cursor:pointer;transition:background .18s,color .18s;font-family:'DM Sans',system-ui,sans-serif}
    .snk-cancel:hover{background:rgba(255,255,255,.07);color:#ccc}
    .snk-send{background:#dc2626;color:#fff;border:none;padding:9px 20px;border-radius:50px;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:7px;transition:background .18s,opacity .18s;font-family:'DM Sans',system-ui,sans-serif}
    .snk-send:hover:not(:disabled){background:#ef4444}
    .snk-send:disabled{opacity:.36;cursor:not-allowed}
    @keyframes snk-spin{to{transform:rotate(360deg)}}
    .snk-spinning{animation:snk-spin .7s linear infinite;display:flex}
    .snk-ok{text-align:center;padding:18px 10px 10px}
    .snk-ok-ico{color:#22c55e;margin-bottom:14px;display:flex;justify-content:center}
    .snk-ok h3{font-size:15px;font-weight:700;color:#fff;margin:0 0 8px;font-family:'DM Sans',system-ui,sans-serif}
    .snk-ok p{font-size:13px;color:#5a5a5a;line-height:1.65;margin:0;font-family:'DM Sans',system-ui,sans-serif}

    /* ── BOTÓN FOOTER ── */
    .snk-foot-btn{display:inline-flex;align-items:center;gap:6px;background:none;border:none;padding:0;color:rgba(255,255,255,.22);font-size:12px;font-family:inherit;cursor:pointer;text-decoration:none;transition:color .22s;line-height:1;vertical-align:middle}
    .snk-foot-btn svg{width:11px;height:11px;flex-shrink:0;transition:color .22s}
    .snk-foot-btn:hover{color:#ef4444!important;text-decoration:underline}

    /* ── BOTÓN PERFIL ── */
    .snk-profile-btn{background:transparent;border:1px solid rgba(239,68,68,.28);color:rgba(239,68,68,.7);padding:8px 16px;border-radius:50px;font-size:13px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:7px;transition:all .18s;font-family:'DM Sans',system-ui,sans-serif}
    .snk-profile-btn:hover{background:rgba(239,68,68,.1);border-color:rgba(239,68,68,.6);color:#ef4444}

    /* ── TOAST ── */
    .snk-toast{position:fixed;bottom:26px;left:50%;transform:translateX(-50%);background:#181818;border:1px solid rgba(239,68,68,.38);color:#fff;padding:10px 18px;border-radius:12px;font-size:13px;font-family:'DM Sans',system-ui,sans-serif;z-index:100001;white-space:nowrap;box-shadow:0 8px 32px rgba(0,0,0,.6);display:flex;align-items:center;gap:8px;animation:snk-tin .22s ease}
    @keyframes snk-tin{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}

    /* ── RESPONSIVE ── */
    @media(max-width:540px){
      .snk-box{padding:22px 18px 20px;border-radius:18px}
      .snk-reasons{grid-template-columns:1fr}
      .snk-sub{padding-left:0}
      .snk-actions{flex-direction:column-reverse}
      .snk-cancel,.snk-send{width:100%;justify-content:center}
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.id = 'snk-denuncia-css';
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  

  document.body.insertAdjacentHTML('beforeend', `
  <div class="snk-overlay" id="snk-overlay" role="dialog" aria-modal="true" aria-label="Denunciar contenido">
    <div class="snk-box">
      <button class="snk-close" id="snk-close" aria-label="Cerrar">${IC.close}</button>

      <div id="snk-form">
        <div class="snk-header">
          <div class="snk-hicon">${IC.flag}</div>
          <p class="snk-title">Denunciar contenido</p>
        </div>
        <p class="snk-sub">Tu denuncia llegará al equipo de Sneak Studio y será revisada en un máximo de 48 horas.</p>

        <span class="snk-lbl">Motivo principal</span>
        <div class="snk-reasons">
          <button class="snk-r" data-motivo="Contenido ilegal">${IC.illegal} Contenido ilegal</button>
          <button class="snk-r" data-motivo="Derechos de autor">${IC.copy} Derechos de autor</button>
          <button class="snk-r" data-motivo="Contenido inapropiado">${IC.warn} Inapropiado</button>
          <button class="snk-r" data-motivo="Spam o engaño">${IC.spam} Spam o engaño</button>
          <button class="snk-r" data-motivo="Acoso o violencia">${IC.shield} Acoso o violencia</button>
          <button class="snk-r" data-motivo="Otro motivo">${IC.help} Otro motivo</button>
        </div>

        <div class="snk-divider"></div>

        <span class="snk-lbl">Descripción <span style="text-transform:none;letter-spacing:0;font-weight:400;color:#383838">(opcional)</span></span>
        <textarea class="snk-ta" id="snk-desc" placeholder="Describe con más detalle lo que encontraste…" maxlength="800"></textarea>

        <label class="snk-chk">
          <input type="checkbox" id="snk-incl-user" checked>
          Incluir mi información de usuario en la denuncia
        </label>

        <div class="snk-actions">
          <button class="snk-cancel" id="snk-cancel">Cancelar</button>
          <button class="snk-send" id="snk-send" disabled>
            <span id="snk-ico">${IC.send}</span>
            <span id="snk-txt">Enviar denuncia</span>
          </button>
        </div>
      </div>

      <div id="snk-ok" style="display:none">
        <div class="snk-ok">
          <div class="snk-ok-ico">${IC.check}</div>
          <h3>Denuncia enviada</h3>
          <p>Nuestro equipo la revisará en un máximo de 48 horas.<br>Gracias por hacer de Sneak Studio un lugar más seguro.</p>
        </div>
      </div>
    </div>
  </div>`);

  

  let _motivo = '';
  let _ctx    = {};

  

  const overlay   = document.getElementById('snk-overlay');
  const sendBtn   = document.getElementById('snk-send');
  const reasons   = document.querySelectorAll('.snk-r');

  

  reasons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      reasons.forEach(function (b) { b.classList.remove('sel'); });
      btn.classList.add('sel');
      _motivo = btn.dataset.motivo;
      sendBtn.disabled = false;
    });
  });

  document.getElementById('snk-cancel').addEventListener('click', _cerrar);
  document.getElementById('snk-close').addEventListener('click', _cerrar);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) _cerrar(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') _cerrar(); });
  sendBtn.addEventListener('click', _enviar);

  

  function _cerrar() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  

  function _reset() {
    _motivo = '';
    reasons.forEach(function (b) { b.classList.remove('sel'); });
    document.getElementById('snk-desc').value = '';
    document.getElementById('snk-incl-user').checked = true;
    sendBtn.disabled = true;
    document.getElementById('snk-ico').innerHTML = IC.send;
    document.getElementById('snk-ico').className = '';
    document.getElementById('snk-txt').textContent = 'Enviar denuncia';
    document.getElementById('snk-form').style.display = '';
    document.getElementById('snk-ok').style.display = 'none';
  }

  

  function _toast(msg) {
    var t = document.querySelector('.snk-toast');
    if (t) t.remove();
    t = document.createElement('div');
    t.className = 'snk-toast';
    t.innerHTML = IC.flag + ' ' + msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 4200);
  }

  

  async function _enviar() {
    if (!_motivo) return;

    sendBtn.disabled = true;
    document.getElementById('snk-ico').innerHTML = IC.spin;
    document.getElementById('snk-ico').className = 'snk-spinning';
    document.getElementById('snk-txt').textContent = 'Enviando…';

    var desc    = document.getElementById('snk-desc').value.trim();
    var incluir = document.getElementById('snk-incl-user').checked;
    var usuario = incluir ? (window.getUsuarioLocal?.() || null) : null;

    var params = {
      motivo      : _motivo,
      descripcion : desc || '(sin descripción adicional)',
      tipo_pagina : _ctx.tipo   || document.title || 'Desconocido',
      nombre_item : _ctx.nombre || '—',
      id_item     : _ctx.id     || '—',
      url_pagina  : location.href,
      usuario_uid : (usuario && usuario.uid)         || 'anónimo',
      usuario_nom : (usuario && (usuario.nombre || usuario.displayName)) || 'anónimo',
      fecha       : new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' }),
    };

    try {
      if (typeof emailjs === 'undefined') {
        throw new Error('EmailJS SDK no encontrado. Incluye el script del SDK antes de denuncia.js.');
      }
      await emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, params, EMAILJS_KEY);

      document.getElementById('snk-form').style.display = 'none';
      document.getElementById('snk-ok').style.display = '';
      setTimeout(_cerrar, 3600);

    } catch (err) {
      console.error('[Sneak·Denuncia]', err);
      sendBtn.disabled = false;
      document.getElementById('snk-ico').innerHTML = IC.send;
      document.getElementById('snk-ico').className = '';
      document.getElementById('snk-txt').textContent = 'Enviar denuncia';
      _toast('Error al enviar. Inténtalo de nuevo.');
    }
  }

  

  window.snkAbrirDenuncia = function (ctx) {
    _ctx = ctx || {};
    _reset();
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(function () {
      document.getElementById('snk-close').focus();
    }, 80);
  };

  window.snkCerrarDenuncia = _cerrar;

  

  

  function _injectFooter() {
    var derechos = document.querySelector('.derechos-footer');
    if (!derechos || derechos.querySelector('.snk-foot-btn')) return;

    var params = new URLSearchParams({
      tipo  : 'Página',
      nombre: document.title,
      id    : location.href,
    });

    var btn = document.createElement('a');
    btn.className = 'snk-foot-btn';
    btn.href = '/denuncia?' + params.toString();
    btn.title = 'Ir al centro de denuncias';
    btn.innerHTML = IC.flag + '<span>Denunciar contenido</span>';
    derechos.appendChild(btn);
  }

  

  

  

  

  

  

  function _injectPerfilBtn(nombre, uid) {
    if (document.getElementById('snk-perfil-report')) return;
    var btnSeguir = document.getElementById('btn-seguir');
    if (!btnSeguir) return;

    var params = new URLSearchParams({
      tipo  : 'Perfil',
      motivo: '',
      nombre: nombre || 'Perfil desconocido',
      id    : uid || new URLSearchParams(location.search).get('uid') || '—',
    });

    var btn = document.createElement('a');
    btn.id = 'snk-perfil-report';
    btn.className = 'snk-profile-btn';
    btn.href = '/denuncia?' + params.toString();
    btn.innerHTML = IC.flag + ' Denunciar perfil';
    btnSeguir.insertAdjacentElement('afterend', btn);
  }

  

  window.snkActivarReportPerfil = function (nombre, uid) {
    _injectPerfilBtn(nombre, uid);
  };

  

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      _injectFooter();
    });
  } else {
    _injectFooter();
  }

})();
