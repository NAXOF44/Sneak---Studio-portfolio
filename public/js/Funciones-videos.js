document.addEventListener('DOMContentLoaded', () => {

  const allVideos  = document.querySelectorAll('video');
  const audioPlayer = document.getElementById('audio-player');

  const PAUSE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M6.25 5C5.56 5 5 5.56 5 6.25v3.5a1.25 1.25 0 1 0 2.5 0v-3.5C7.5 5.56 6.94 5 6.25 5m3.5 0c-.69 0-1.25.56-1.25 1.25v3.5a1.25 1.25 0 1 0 2.5 0v-3.5C11 5.56 10.44 5 9.75 5"/></svg>`;
  const PLAY_SVG  = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M6.79 5.093A.5.5 0 0 0 6 5.5v5a.5.5 0 0 0 .79.407l3.5-2.5a.5.5 0 0 0 0-.814z"/></svg>`;

  

  allVideos.forEach(video => {
    const container = video.parentElement;
    const icon = container.querySelector('.icon-play, .play-icon-elec, .play-icon');
    const pauseOthers = () => allVideos.forEach(v => { if (v !== video) v.pause(); });

    video.addEventListener('play', () => {
      pauseOthers();
      if (audioPlayer) audioPlayer.pause();
      if (icon) {
        if (icon.classList.contains('icon-play')) icon.innerHTML = PAUSE_SVG;
        setTimeout(() => {
          if (!video.paused) { icon.style.opacity = '0'; icon.style.pointerEvents = 'none'; }
        }, 400);
      }
    });

    video.addEventListener('pause', () => {
      if (icon) {
        if (icon.classList.contains('icon-play')) icon.innerHTML = PLAY_SVG;
        icon.style.opacity = '1'; icon.style.pointerEvents = 'auto';
      }
    });

    container.style.cursor = 'pointer';
    container.addEventListener('click', () => video.paused ? video.play() : video.pause());
    container.addEventListener('mouseenter', () => { if (icon) { icon.style.opacity = '1'; icon.style.pointerEvents = 'auto'; } });
    container.addEventListener('mouseleave', () => { if (icon && !video.paused) { icon.style.opacity = '0'; icon.style.pointerEvents = 'none'; } });
  });

  

  ['.clas-creadores-best', '.list-gen'].forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      el.addEventListener('wheel', e => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          const max = el.scrollWidth - el.clientWidth;
          if ((e.deltaY < 0 && el.scrollLeft === 0) || (e.deltaY > 0 && el.scrollLeft >= max)) return;
          e.preventDefault();
          el.scrollLeft += e.deltaY;
        }
      }, { passive: false });
    });
  });

  

  if (audioPlayer) {
    const tracks       = document.querySelectorAll('.track:not(.track-head)');
    const playPauseBtn = document.getElementById('playPause');
    const progress     = document.getElementById('progress');
    const volume       = document.getElementById('volume');
    const currentTimeEl = document.getElementById('current-time');
    const durationEl   = document.getElementById('duration');
    const playerTitle  = document.getElementById('player-title');
    let currentIndex = -1;

    function playTrack(index) {
      if (index < 0 || index >= tracks.length) return;
      const track = tracks[index];
      currentIndex = index;
      tracks.forEach(t => t.classList.remove('active'));
      track.classList.add('active');
      audioPlayer.src = track.getAttribute('data-src');
      playerTitle.textContent = track.children[1].textContent;
      allVideos.forEach(v => v.pause());
      audioPlayer.play();
      if (playPauseBtn) playPauseBtn.classList.replace('fa-play', 'fa-pause');
    }

    tracks.forEach((track, index) => track.addEventListener('click', () => playTrack(index)));

    if (playPauseBtn) {
      playPauseBtn.addEventListener('click', () => {
        if (audioPlayer.paused) { audioPlayer.play(); playPauseBtn.classList.replace('fa-play', 'fa-pause'); }
        else { audioPlayer.pause(); playPauseBtn.classList.replace('fa-pause', 'fa-play'); }
      });
    }

    audioPlayer.addEventListener('timeupdate', () => {
      if (progress) progress.value = (audioPlayer.currentTime / audioPlayer.duration) * 100 || 0;
      const min = Math.floor(audioPlayer.currentTime / 60);
      const sec = Math.floor(audioPlayer.currentTime % 60);
      if (currentTimeEl) currentTimeEl.textContent = `${min}:${sec < 10 ? '0' + sec : sec}`;
    });

    audioPlayer.addEventListener('loadedmetadata', () => {
      const min = Math.floor(audioPlayer.duration / 60);
      const sec = Math.floor(audioPlayer.duration % 60);
      if (durationEl) durationEl.textContent = `${min}:${sec < 10 ? '0' + sec : sec}`;
    });

    if (progress) progress.addEventListener('input', () => { audioPlayer.currentTime = (progress.value / 100) * audioPlayer.duration; });
    if (volume)   volume.addEventListener('input',   () => { audioPlayer.volume = volume.value; });
    audioPlayer.addEventListener('ended', () => { if (currentIndex < tracks.length - 1) playTrack(currentIndex + 1); });
  }

  

  document.querySelectorAll('.like-btn').forEach((btn, index) => {
    if (localStorage.getItem('liked_' + index)) { btn.classList.add('liked', 'fa-solid'); btn.classList.remove('fa-regular'); }
    btn.addEventListener('click', e => {
      e.stopPropagation();
      btn.classList.toggle('liked'); btn.classList.toggle('fa-regular'); btn.classList.toggle('fa-solid');
      btn.classList.contains('liked') ? localStorage.setItem('liked_' + index, true) : localStorage.removeItem('liked_' + index);
    });
  });

  document.addEventListener('contextmenu', e => {
    if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') e.preventDefault();
  });

  console.log('Videos, Audio y Likes funcionando ✅');
});

const volumeBar = document.querySelector('.volume-bar');
if (volumeBar) {
  volumeBar.addEventListener('input', e => {
    const prog = (e.target.value / e.target.max) * 100;
    e.target.style.backgroundSize = `${prog}% 100%`;
  });
}

function initCarousel(wrapperSelector, containerSelector, prevBtnSelector, nextBtnSelector) {
  const wrapper = document.querySelector(wrapperSelector);
  if (!wrapper) return;
  const container = wrapper.querySelector(containerSelector);
  const prevBtn   = wrapper.querySelector(prevBtnSelector);
  const nextBtn   = wrapper.querySelector(nextBtnSelector);
  if (!container || !prevBtn || !nextBtn) return;
  const scrollAmount = () => container.offsetWidth * 0.8;
  prevBtn.addEventListener('click', () => container.scrollBy({ left: -scrollAmount(), behavior: 'smooth' }));
  nextBtn.addEventListener('click', () => container.scrollBy({ left:  scrollAmount(), behavior: 'smooth' }));
}

initCarousel('.carousel-wrapper-creators', '.clas-creadores-best', '.prev-creators', '.next-creators');
