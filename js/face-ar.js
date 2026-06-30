/* ─────────────────────────────────────────────
   face-ar.js
   Jeeliz FaceFilter + Three.js GLB face filters
   Tab 2 — hat and sunglasses
   Scripts are loaded dynamically by main.js before init() is called
   ───────────────────────────────────────────── */

const FaceAR = (() => {

  const MODEL_URLS = {
    hat:        'models/black-leather-hat-high-poly/source/model.glb',
    sunglasses: 'models/SunglassesKhronos.glb',
  };

  let _initialized   = false;
  let _currentEffect = 'hat';
  let _threeScene    = null;
  let _threeCamera   = null;
  let _renderer      = null;
  let _currentMesh   = null;
  let _faceDetected  = false;
  let _pendingEffect = null;

  const _modelCache = {};

  // ── Public: init (called after Jeeliz scripts are loaded) ──
  function init(effectKey) {
    if (effectKey) _currentEffect = effectKey;
    _setStatus('amber', 'Requesting camera…');

    // Hide hint until Jeeliz is ready
    const hint = document.getElementById('face-hint');
    if (hint) hint.classList.add('hidden');

    _preloadModels(() => {
      JeelizResizer.size_canvas({
        canvasId:     'jeeFaceFilterCanvas',
        isFullScreen: false,
        callback: (isError, videoSettings) => {
          if (isError) { _setStatus('red', 'Camera error'); return; }

          JEELIZFACEFILTER.init({
            canvasId:         'jeeFaceFilterCanvas',
            NNCPath:          'https://appstatic.jeeliz.com/faceFilter/',
            maxFacesDetected: 1,
            videoSettings:    { ...videoSettings, facingMode: 'user' },
            callbackReady:    _onReady,
            callbackTrack:    _onTrack,
          });
        }
      });
    });
  }

  // ── Preload both GLBs ──
  function _preloadModels(done) {
    const keys = Object.keys(MODEL_URLS);
    let remaining = keys.length;

    keys.forEach((key) => {
      if (_modelCache[key]) { if (--remaining === 0) done(); return; }

      const loader = new THREE.GLTFLoader();
      loader.load(
        MODEL_URLS[key],
        (gltf) => {
          _modelCache[key] = gltf.scene;
          if (--remaining === 0) done();
        },
        undefined,
        (err) => {
          console.warn('[FaceAR] Failed to load', key, err);
          if (--remaining === 0) done();
        }
      );
    });
  }

  // ── Jeeliz ready callback ──
  function _onReady(errCode, spec) {
    if (errCode) {
      console.error('[FaceAR] Jeeliz error:', errCode);
      _setStatus('red', 'Jeeliz error: ' + errCode);
      return;
    }

    const threeCanvas = document.getElementById('threeCanvas');
    _renderer = new THREE.WebGLRenderer({ canvas: threeCanvas, alpha: true });
    _renderer.setPixelRatio(window.devicePixelRatio);
    _renderer.setSize(threeCanvas.clientWidth, threeCanvas.clientHeight);

    _threeScene  = new THREE.Scene();
    _threeCamera = new THREE.PerspectiveCamera(40, threeCanvas.clientWidth / threeCanvas.clientHeight, 0.01, 100);

    const ambient  = new THREE.AmbientLight(0xffffff, 0.8);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(0, 1, 2);
    _threeScene.add(ambient, dirLight);

    JeelizThreeHelper.init(spec, () => {});

    _loadEffect(_currentEffect);

    if (_pendingEffect) {
      _loadEffect(_pendingEffect);
      _pendingEffect = null;
    }

    (function animate() {
      requestAnimationFrame(animate);
      JeelizThreeHelper.render(_threeScene, _threeCamera);
      _renderer.render(_threeScene, _threeCamera);
    })();

    _initialized = true;
    _setStatus('green', 'Face AR ready');
  }

  // ── Per-frame tracking callback ──
  function _onTrack(detectState) {
    const detected = detectState.detected > 0.5;

    if (detected !== _faceDetected) {
      _faceDetected = detected;
      const hint = document.getElementById('face-hint');
      if (hint) hint.classList.toggle('hidden', detected);
    }

    if (_currentMesh) {
      _currentMesh.visible = detected;
      if (detected) {
        const s = detectState.scale;
        _currentMesh.position.set(
          detectState.rx * 0.5,
          detectState.ry * 0.3 + s * _getYOffset(_currentEffect),
          -detectState.rz || 0
        );
        _currentMesh.scale.setScalar(s * _getScale(_currentEffect));
        _currentMesh.rotation.set(
          detectState.headX || 0,
          detectState.headY || 0,
          detectState.headZ || 0
        );
      }
    }
  }

  function _getYOffset(effect) { return effect === 'hat' ? 0.45 : 0.05; }
  function _getScale(effect)   { return effect === 'hat' ? 0.4  : 0.35; }

  function _loadEffect(key) {
    if (_currentMesh) { _threeScene.remove(_currentMesh); _currentMesh = null; }
    const model = _modelCache[key];
    if (!model) { console.warn('[FaceAR] Not cached:', key); return; }
    _currentMesh = model.clone();
    _currentMesh.visible = false;
    _threeScene.add(_currentMesh);
    _currentEffect = key;
  }

  // ── Public: switch effect ──
  function switchEffect(key) {
    if (key === _currentEffect && _currentMesh) return;
    if (!_initialized) { _pendingEffect = key; return; }
    _loadEffect(key);
  }

  // ── Public: destroy ──
  function destroy() {
    if (!_initialized) return;
    try { JEELIZFACEFILTER.destroy(); } catch (e) {}
    _initialized  = false;
    _currentMesh  = null;
    _threeScene   = null;
    _threeCamera  = null;
    _renderer     = null;
  }

  // ── Status ──
  function _setStatus(color, text) {
    const dot  = document.getElementById('face-status-dot');
    const span = document.getElementById('face-status-text');
    if (dot)  dot.className = 'status-dot ' + color;
    if (span) span.textContent = text;
  }

  return { init, switchEffect, destroy };

})();
