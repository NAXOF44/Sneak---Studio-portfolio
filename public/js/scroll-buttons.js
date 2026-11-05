(function () {

  const EXCLUIDOS = ['clas-creadores-best', 'list-gen'];

  const SELECTOR = [
    '.musicas44', '.videos', '.listas44',
    '.List-radio', '.List-radio2', '.List-radio3',
    '.List-artist-explo', '.elects',
    '.list-sensillo44', '.list-album', '.listas-artist',
    '.listas-biblioteca', '.top3-day',
  ].join(', ');

  const BTN_STYLE_BASE = [
    'position:absolute',
    'top:42%',
    'transform:translateY(-50%)',
    'background:rgba(20,20,20,.95)',
    'border:none',
    'color:#fff',
    'cursor:pointer',
    'width:34px',
    'height:34px',
    'border-radius:50%',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'z-index:10',
    'transition:opacity .2s',
    'box-shadow:0 2px 10px rgba(0,0,0,.6)',
  ].join(';');

  const SVG_L = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/></svg>';
  const SVG_R = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/></svg>';

  function esExcluido(el) {
    return EXCLUIDOS.some(cls => el.classList.contains(cls));
  }

  function init(track) {
    if (esExcluido(track)) return;
    if (track.dataset.snkDone) return;
    track.dataset.snkDone = '1';

    var wrapper = track.parentElement;
    if (!wrapper) return;
    if (getComputedStyle(wrapper).position === 'static') {
      wrapper.style.position = 'relative';
    }

    

    track.style.scrollbarWidth = 'none';
    track.style.msOverflowStyle = 'none';
    if (!document.getElementById('snk-scroll-hide')) {
      var s = document.createElement('style');
      s.id = 'snk-scroll-hide';
      s.textContent = '.musicas44::-webkit-scrollbar,.videos::-webkit-scrollbar,.listas44::-webkit-scrollbar,.List-radio::-webkit-scrollbar,.List-radio2::-webkit-scrollbar,.List-radio3::-webkit-scrollbar,.List-artist-explo::-webkit-scrollbar,.elects::-webkit-scrollbar,.list-sensillo44::-webkit-scrollbar,.list-album::-webkit-scrollbar,.listas-artist::-webkit-scrollbar,.listas-biblioteca::-webkit-scrollbar,.top3-day::-webkit-scrollbar{display:none}';
      document.head.appendChild(s);
    }

    

    var isWide = track.classList.contains('List-radio') ||
                 track.classList.contains('list-album') ||
                 track.classList.contains('listas44') ||
                 track.classList.contains('List-radio2') ||
                 track.classList.contains('List-radio3');
    var offsetBtn = isWide ? '6px' : '-14px';

    

    var btnL = document.createElement('button');
    btnL.setAttribute('aria-label', 'Anterior');
    btnL.innerHTML = SVG_L;
    btnL.style.cssText = BTN_STYLE_BASE + ';left:' + offsetBtn + ';opacity:0;pointer-events:none;';

    

    var btnR = document.createElement('button');
    btnR.setAttribute('aria-label', 'Siguiente');
    btnR.innerHTML = SVG_R;
    btnR.style.cssText = BTN_STYLE_BASE + ';right:' + offsetBtn + ';opacity:1;';

    function updateBtns() {
      var sl    = track.scrollLeft;
      var maxSl = track.scrollWidth - track.clientWidth;
      btnL.style.opacity       = sl > 8 ? '1' : '0';
      btnL.style.pointerEvents = sl > 8 ? 'auto' : 'none';
      btnR.style.opacity       = sl < maxSl - 8 ? '1' : '0';
      btnR.style.pointerEvents = sl < maxSl - 8 ? 'auto' : 'none';
    }

    btnL.addEventListener('click', function() { track.scrollBy({ left: -300, behavior: 'smooth' }); });
    btnR.addEventListener('click', function() { track.scrollBy({ left:  300, behavior: 'smooth' }); });
    track.addEventListener('scroll', updateBtns, { passive: true });
    setTimeout(updateBtns, 150);

    wrapper.appendChild(btnL);
    wrapper.appendChild(btnR);
  }

  

  function addDragScroll(track) {
    if (track.dataset.snkDrag) return;
    track.dataset.snkDrag = '1';
    let isDown = false, startX, scrollStart;
    track.addEventListener('mousedown', function(e) {
      if (e.button !== 0) return;
      isDown = true;
      startX = e.pageX - track.offsetLeft;
      scrollStart = track.scrollLeft;
      track.style.cursor = 'grabbing';
      track.style.userSelect = 'none';
    });
    document.addEventListener('mouseup', function() {
      if (!isDown) return;
      isDown = false;
      track.style.cursor = '';
      track.style.userSelect = '';
    });
    track.addEventListener('mouseleave', function() {
      if (!isDown) return;
      isDown = false;
      track.style.cursor = '';
      track.style.userSelect = '';
    });
    track.addEventListener('mousemove', function(e) {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - track.offsetLeft;
      const walk = (x - startX) * 1.2;
      track.scrollLeft = scrollStart - walk;
    });
  }

  function initAll() {
    document.querySelectorAll(SELECTOR).forEach(function(el) {
      init(el);
      addDragScroll(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(initAll, 600); });
  } else {
    setTimeout(initAll, 600);
  }

  window.__initScrollButtons = initAll;

  var observer = new MutationObserver(function() {
    clearTimeout(observer._t);
    observer._t = setTimeout(initAll, 300);
  });
  observer.observe(document.body, { childList: true, subtree: true });

})();
