/* SADEE compact video controls: applies to homepage hero and customer tutorial videos. */
(function () {
  'use strict';
  const SPEEDS = [1, 1.5, 2];

  function attach(video) {
    if (!(video instanceof HTMLVideoElement) || video.dataset.sadeeControls === '1') return;
    video.dataset.sadeeControls = '1';
    video.removeAttribute('controls');

    const panel = document.createElement('div');
    panel.className = 'sadee-video-controls';
    panel.setAttribute('aria-label', 'Video controls');
    panel.innerHTML = `
      <button type="button" data-sv="play" aria-label="Play video">▶</button>
      <button type="button" data-sv="mute" aria-label="Turn sound on">🔇</button>
      <button type="button" data-sv="speed" aria-label="Playback speed">1x</button>
      <input data-sv="seek" type="range" min="0" max="1000" value="0" step="1" aria-label="Seek video">
      <button type="button" data-sv="replay" aria-label="Replay video">↻</button>
      <button type="button" data-sv="fullscreen" aria-label="Fullscreen">⛶</button>`;
    video.insertAdjacentElement('afterend', panel);

    const play = panel.querySelector('[data-sv="play"]');
    const mute = panel.querySelector('[data-sv="mute"]');
    const speed = panel.querySelector('[data-sv="speed"]');
    const seek = panel.querySelector('[data-sv="seek"]');
    let speedIndex = 0;

    function refresh() {
      play.textContent = video.paused ? '▶' : 'Ⅱ';
      play.setAttribute('aria-label', video.paused ? 'Play video' : 'Pause video');
      mute.textContent = video.muted ? '🔇' : '🔊';
      mute.setAttribute('aria-label', video.muted ? 'Turn sound on' : 'Mute video');
      if (Number.isFinite(video.duration) && video.duration > 0 && !seek.matches(':active')) {
        seek.value = String(Math.round(video.currentTime / video.duration * 1000));
      }
    }

    play.addEventListener('click', async () => {
      if (video.paused) {
        try { await video.play(); } catch (_) { /* Browser may require another user gesture. */ }
      } else video.pause();
      refresh();
    });
    mute.addEventListener('click', async () => {
      video.muted = !video.muted;
      if (!video.muted && video.paused) {
        try { await video.play(); } catch (_) { video.muted = true; }
      }
      refresh();
    });
    speed.addEventListener('click', () => {
      speedIndex = (speedIndex + 1) % SPEEDS.length;
      video.playbackRate = SPEEDS[speedIndex];
      speed.textContent = SPEEDS[speedIndex] + 'x';
    });
    seek.addEventListener('input', () => {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        video.currentTime = Number(seek.value) / 1000 * video.duration;
      }
    });
    panel.querySelector('[data-sv="replay"]').addEventListener('click', async () => {
      try { video.currentTime = 0; await video.play(); } catch (_) { /* Wait for media readiness. */ }
      refresh();
    });
    panel.querySelector('[data-sv="fullscreen"]').addEventListener('click', async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else if (video.requestFullscreen) await video.requestFullscreen();
        else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
      } catch (_) { /* Fullscreen can be unavailable in some embedded browsers. */ }
    });

    ['play', 'pause', 'volumechange', 'timeupdate', 'loadedmetadata', 'durationchange', 'ended'].forEach(event => video.addEventListener(event, refresh));
    const syncVisibility = () => { panel.hidden = video.hidden; };
    new MutationObserver(syncVisibility).observe(video, { attributes: true, attributeFilter: ['hidden'] });
    syncVisibility();
    refresh();
  }

  function scan(node) {
    if (!node || node.nodeType !== 1) return;
    if (node.matches('video')) attach(node);
    node.querySelectorAll?.('video').forEach(attach);
  }

  function start() {
    scan(document.body);
    new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(scan)))
      .observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
