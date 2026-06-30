/* ─────────────────────────────────────────────
   armanager.js
   MindAR image tracking + A-Frame
   Tab 1 — 7 target images, slider with 15s auto-advance
   Targets in .mind: 1,3,5,6,7  (indices 0-4)
   Not in .mind (show "Not Antoni Gaudí"): 2, 4
   ───────────────────────────────────────────── */

const ImageAR = (() => {

  const TARGETS = [
    { src: 'targets/target1.jpeg', detectable: true  },
    { src: 'targets/target2.jpg',  detectable: false },
    { src: 'targets/target3.webp', detectable: true  },
    { src: 'targets/target4.jpg',  detectable: false },
    { src: 'targets/target5.webp', detectable: true  },
    { src: 'targets/target6.jpg',  detectable: true  },
    { src: 'targets/target7.jpg',  detectable: true  },
  ];

  const SLIDE_DURATION = 15; // seconds

  let _sceneEl    = null;
  let _audioEl    = null;
  let _isRunning  = false;

  // Slider state
  let _slideIndex    = 0;
  let _timerInterval = null;
  let _timerSeconds  = SLIDE_DURATION;

  // ── Public: init ──
  function _isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      || navigator.maxTouchPoints > 1;
  }

  function init() {
    if (_isRunning) return;
    _buildSlider();

    if (!_isMobile()) {
      _setStatus('', 'Open on a mobile device to use AR');
      _showDesktopNotice();
      return;
    }

    _setStatus('amber', 'Loading image tracking…');
    _loadMindARScripts().then(() => _buildScene());
  }

  function _showDesktopNotice() {
    const container = document.getElementById('mindar-container');
    if (!container) return;
    const notice = document.createElement('div');
    notice.style.cssText = [
      'position:absolute;inset:0;display:flex;flex-direction:column',
      'align-items:center;justify-content:center;z-index:5',
      'gap:12px;pointer-events:none',
    ].join(';');
    notice.innerHTML = `
      <div style="background:rgba(10,10,20,0.8);border:1px solid #2a2d3e;border-radius:12px;
                  padding:24px 32px;text-align:center;backdrop-filter:blur(6px)">
        <div style="font-size:32px;margin-bottom:8px">📱</div>
        <div style="font-size:15px;font-weight:600;color:#e8e8f0;margin-bottom:6px">Mobile only</div>
        <div style="font-size:13px;color:#7a7a9a">Open this page on your phone to use AR image tracking</div>
      </div>`;
    container.appendChild(notice);
  }

  // ── Slider ──
  function _buildSlider() {
    _buildDots();
    _showSlide(0);
    _startTimer();
  }

  function _buildDots() {
    const dotsEl = document.getElementById('slider-dots');
    if (!dotsEl) return;
    dotsEl.innerHTML = '';
    TARGETS.forEach((_, i) => {
      const d = document.createElement('button');
      d.className = 'slider-dot' + (i === 0 ? ' active' : '');
      d.setAttribute('aria-label', `Target ${i + 1}`);
      d.addEventListener('click', () => _goToSlide(i));
      dotsEl.appendChild(d);
    });
  }

  function _showSlide(index) {
    _slideIndex = index;
    const t = TARGETS[index];

    const img     = document.getElementById('slider-img');
    const label   = document.getElementById('slider-label');
    const overlay = document.getElementById('not-gaudi-overlay');
    const card    = document.getElementById('slider-card');

    if (img)     img.src = t.src;
    if (label) {
      label.textContent = t.detectable ? 'Should Detect' : 'Should Not Detect';
      label.className   = 'slider-label ' + (t.detectable ? 'detectable' : 'not-detectable');
    }
    if (overlay) overlay.classList.toggle('hidden', t.detectable);
    if (card)    card.classList.toggle('not-detectable', !t.detectable);

    // Update dots
    document.querySelectorAll('.slider-dot').forEach((d, i) => {
      d.classList.toggle('active', i === index);
    });
  }

  function _goToSlide(index) {
    _showSlide(index);
    _resetTimer();
  }

  function _nextSlide() {
    _showSlide((_slideIndex + 1) % TARGETS.length);
  }

  // ── Circular countdown timer ──
  function _startTimer() {
    _timerSeconds = SLIDE_DURATION;
    _updateTimerUI();

    _timerInterval = setInterval(() => {
      _timerSeconds--;
      _updateTimerUI();
      if (_timerSeconds <= 0) {
        _nextSlide();
        _timerSeconds = SLIDE_DURATION;
      }
    }, 1000);
  }

  function _resetTimer() {
    clearInterval(_timerInterval);
    _startTimer();
  }

  function _stopTimer() {
    clearInterval(_timerInterval);
    _timerInterval = null;
  }

  function _updateTimerUI() {
    const fill  = document.getElementById('timer-fill');
    const count = document.getElementById('timer-count');
    const circumference = 2 * Math.PI * 15; // r=15 → ~94.25

    if (count) count.textContent = _timerSeconds;
    if (fill) {
      const progress = _timerSeconds / SLIDE_DURATION;
      fill.style.strokeDashoffset = circumference * (1 - progress);
    }
  }

  // ── Dynamically load MindAR + A-Frame ──
  function _loadMindARScripts() {
    return new Promise((resolve) => {
      if (window.AFRAME) { resolve(); return; }

      const urls = [
        'https://cdn.jsdelivr.net/npm/aframe@1.4.2/dist/aframe.min.js',
        'https://cdn.jsdelivr.net/npm/mind-ar@1.2.3/dist/mindar-image-aframe.prod.js',
      ];

      let loaded = 0;
      // Must load sequentially — MindAR depends on A-Frame
      function loadNext(i) {
        if (i >= urls.length) { resolve(); return; }
        const s = document.createElement('script');
        s.src = urls[i];
        s.onload = () => loadNext(i + 1);
        s.onerror = () => loadNext(i + 1);
        document.head.appendChild(s);
      }
      loadNext(0);
    });
  }

  // ── Build A-Frame scene ──
  function _buildScene() {
    const container = document.getElementById('mindar-container');
    if (!container) return;

    const scene = document.createElement('a-scene');
    scene.setAttribute('mindar-image', [
      'imageTargetSrc: minds/targets.mind',
      'autoStart: true',
      'uiLoading: no',
      'uiError: no',
      'uiScanning: no',
    ].join('; '));
    scene.setAttribute('embedded', '');
    scene.setAttribute('renderer', 'logarithmicDepthBuffer: true');
    scene.setAttribute('vr-mode-ui', 'enabled: false');
    scene.setAttribute('device-orientation-permission-ui', 'enabled: false');
    scene.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';

    // Camera
    const camera = document.createElement('a-camera');
    camera.setAttribute('position', '0 0 0');
    camera.setAttribute('look-controls', 'enabled: false');
    scene.appendChild(camera);

    // Assets
    const assets = document.createElement('a-assets');

    const modelAsset = document.createElement('a-asset-item');
    modelAsset.setAttribute('id', 'gaudi-model');
    modelAsset.setAttribute('src', 'models/busto-antoni-gaudi/source/busto_antoni_gaud%C3%AD.glb');
    assets.appendChild(modelAsset);

    const audioAsset = document.createElement('audio');
    audioAsset.setAttribute('id', 'gaudi-audio');
    audioAsset.setAttribute('src', 'audio/antonio.mp3');
    audioAsset.setAttribute('preload', 'auto');
    _audioEl = audioAsset;
    assets.appendChild(audioAsset);

    scene.appendChild(assets);

    // One image-target entity covers all 5 indices (all show same model)
    // We add 5 target entities, one per compiled index
    for (let i = 0; i < 5; i++) {
      const targetEl = document.createElement('a-entity');
      targetEl.setAttribute('mindar-image-target', `targetIndex: ${i}`);

      const modelEl = document.createElement('a-gltf-model');
      modelEl.setAttribute('src', '#gaudi-model');
      modelEl.setAttribute('position', '0 0.6 0');
      modelEl.setAttribute('scale', '0.8 0.8 0.8');
      modelEl.setAttribute('rotation', '0 0 0');
      targetEl.appendChild(modelEl);

      targetEl.addEventListener('targetFound', (e) => {
        _setStatus('green', 'Antoni Gaudí detected — AR active');
        _playAudio();
      });

      targetEl.addEventListener('targetLost', (e) => {
        _setStatus('amber', 'Scanning… point at a target image');
        _pauseAudio();
      });

      scene.appendChild(targetEl);
    }

    scene.addEventListener('loaded', () => {
      _setStatus('amber', 'Scanning… point at a target image');
      _isRunning = true;
    });

    // Insert scene behind the slider overlay
    container.insertBefore(scene, container.firstChild);
    _sceneEl = scene;
  }

  // ── Audio ──
  function _playAudio() {
    if (!_audioEl) return;
    _audioEl.currentTime = 0;
    _audioEl.play().catch(() => {});
  }

  function _pauseAudio() {
    if (!_audioEl) return;
    _audioEl.pause();
  }

  // ── Public: destroy ──
  function destroy() {
    _stopTimer();
    _pauseAudio();

    if (_sceneEl) {
      try {
        const sys = _sceneEl.systems['mindar-image-system'];
        if (sys) sys.stop();
      } catch (e) {}
      _sceneEl.parentNode && _sceneEl.parentNode.removeChild(_sceneEl);
      _sceneEl = null;
    }

    _audioEl   = null;
    _isRunning = false;
    _setStatus('', 'Waiting for camera…');
  }

  // ── Status ──
  function _setStatus(color, text) {
    const dot  = document.getElementById('image-status-dot');
    const span = document.getElementById('image-status-text');
    if (dot)  dot.className = 'status-dot' + (color ? ' ' + color : '');
    if (span) span.textContent = text;
  }

  return { init, destroy };

})();
