/* ─────────────────────────────────────────────
   main.js — boot, routing, tab switching
   Route: /        → Image AR (Tab 1)
          /face    → Face AR  (Tab 2)
   ───────────────────────────────────────────── */

const App = (() => {

  const MODE_IMAGE = 'image';
  const MODE_FACE  = 'face';

  let _currentMode = null;

  // ── Boot ──
  async function boot() {
    _setLoadingText('Initialising AR runtime…');

    const mode = _detectMode();
    _currentMode = mode;

    _setLoadingText('Starting AR runtime…');
    _hideLoading();
    _activateTab(mode);

    if (mode === MODE_FACE) {
      await _loadJeelizScripts();
      FaceAR.init(document.getElementById('effect-select')?.value || 'hat');
    } else {
      ImageAR.init();
    }
  }

  // ── Detect mode from URL path ──
  function _detectMode() {
    const path = window.location.pathname;
    return path === '/face' || path.endsWith('/face') ? MODE_FACE : MODE_IMAGE;
  }

  // ── Tab switching — always full reload for clean WebGL/camera state ──
  function switchTab(mode) {
    if (mode === _currentMode) return;
    window.location.href = mode === MODE_FACE ? '/face' : '/';
  }

  function onEffectChange(value) {
    FaceAR.switchEffect(value);
  }

  // ── Dynamically load Jeeliz scripts (only for Face tab) ──
  function _loadJeelizScripts() {
    return new Promise((resolve) => {
      if (window.JEELIZFACEFILTER) { resolve(); return; }

      const urls = [
        'https://appstatic.jeeliz.com/faceFilter/jeelizFaceFilter.js',
        'https://appstatic.jeeliz.com/faceFilter/JeelizResizer.js',
        'https://cdnjs.cloudflare.com/ajax/libs/three.js/r112/three.min.js',
        'https://cdn.jsdelivr.net/npm/three@0.112/examples/js/loaders/GLTFLoader.js',
        'https://appstatic.jeeliz.com/faceFilter/JeelizThreeHelper.js',
      ];

      _loadSequential(urls, resolve);
    });
  }

  function _loadSequential(urls, done) {
    if (!urls.length) { done(); return; }
    const s = document.createElement('script');
    s.src = urls[0];
    s.onload = () => _loadSequential(urls.slice(1), done);
    s.onerror = () => _loadSequential(urls.slice(1), done);
    document.head.appendChild(s);
  }

  // ── Loading screen ──
  function _setLoadingText(msg) {
    const el = document.getElementById('loading-text');
    if (el) el.textContent = msg;
  }

  function _hideLoading() {
    const screen = document.getElementById('loading-screen');
    const app    = document.getElementById('app');
    if (screen) {
      screen.classList.add('fade-out');
      setTimeout(() => screen.style.display = 'none', 420);
    }
    if (app) app.classList.remove('hidden');
  }

  // ── Activate correct tab UI ──
  function _activateTab(mode) {
    const imagePanel = document.getElementById('panel-image');
    const facePanel  = document.getElementById('panel-face');
    const imageBtn   = document.getElementById('tab-image');
    const faceBtn    = document.getElementById('tab-face');

    if (mode === MODE_FACE) {
      imagePanel.classList.remove('active'); imagePanel.classList.add('hidden');
      facePanel.classList.remove('hidden');  facePanel.classList.add('active');
      imageBtn.classList.remove('active');
      faceBtn.classList.add('active');
    } else {
      facePanel.classList.remove('active');  facePanel.classList.add('hidden');
      imagePanel.classList.remove('hidden'); imagePanel.classList.add('active');
      faceBtn.classList.remove('active');
      imageBtn.classList.add('active');
    }
  }

  return { boot, switchTab, onEffectChange };

})();

window.addEventListener('DOMContentLoaded', () => App.boot());
