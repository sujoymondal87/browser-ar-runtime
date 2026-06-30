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

    // Start camera immediately — preload models in parallel
    _preloadModels(() => {
      // If Jeeliz already ready but model wasn't cached yet, load it now
      if (_initialized && !_currentMesh) _loadEffect(_currentEffect);
    });

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
    console.log('[FaceAR] _onReady called, errCode:', errCode, 'spec:', spec);
    if (errCode) {
      console.error('[FaceAR] Jeeliz error:', errCode);
      _setStatus('red', 'Jeeliz error: ' + errCode);
      return;
    }

    console.log('[FaceAR] calling JeelizThreeHelper.init');
    const threeStuffs = JeelizThreeHelper.init(spec, null);
    console.log('[FaceAR] JeelizThreeHelper.init returned:', threeStuffs);

    _threeScene  = threeStuffs.scene;
    _threeCamera = new THREE.PerspectiveCamera(40, spec.canvasElement.width / spec.canvasElement.height, 0.01, 100);

    const ambient  = new THREE.AmbientLight(0xffffff, 0.8);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(0, 1, 2);
    _threeScene.add(ambient, dirLight);

    console.log('[FaceAR] calling _loadEffect, cache keys:', Object.keys(_modelCache));
    _loadEffect(_currentEffect);

    if (_pendingEffect) {
      _loadEffect(_pendingEffect);
      _pendingEffect = null;
    }

    // No separate rAF loop — render is called from _onTrack (Jeeliz's own loop)
    _initialized = true;
    _setStatus('green', 'Face AR ready');
  }

  // ── Per-frame tracking callback ──
  let _dbgCount = 0;
  function _onTrack(detectState) {
    console.log('[FaceAR] _onTrack fired, detected:', detectState.detected);
    const detected = detectState.detected > 0.5;

    // Log every state change + first 3 detected frames
    if (detected !== _faceDetected || (_dbgCount < 3 && detected)) {
      console.log('[FaceAR] detected:', detected, 'detectState:', JSON.stringify(detectState));
      console.log('[FaceAR] _currentMesh:', !!_currentMesh, '_threeScene children:', _threeScene ? _threeScene.children.length : 'null');
      if (detected) _dbgCount++;
    }

    if (detected !== _faceDetected) {
      _faceDetected = detected;
      const hint = document.getElementById('face-hint');
      if (hint) hint.classList.toggle('hidden', detected);
    }

    if (_currentMesh) {
      _currentMesh.visible = detected;
      if (detected) {
        const s = detectState.s;
        console.log('[FaceAR] positioning mesh s:', s, 'pos:', detectState.x, detectState.y, 'z:-1 mesh.visible:', _currentMesh.visible);
        _currentMesh.position.set(
          detectState.x,
          detectState.y + s * _getYOffset(_currentEffect),
          -1
        );
        _currentMesh.scale.setScalar(s * _getScale(_currentEffect));
        _currentMesh.rotation.set(
          detectState.rx || 0,
          detectState.ry || 0,
          detectState.rz || 0
        );
      }
    } else {
      if (detected) console.warn('[FaceAR] face detected but _currentMesh is null');
    }

    // Render Three.js scene in sync with Jeeliz's own loop
    if (_initialized && _threeCamera) {
      JeelizThreeHelper.render(detectState, _threeCamera);
    }
  }

  function _getYOffset(effect) { return effect === 'hat' ? 1.3  : 0.7;  }
  function _getScale(effect)   { return effect === 'hat' ? 1.0  : 6.0;  }

  function _loadEffect(key) {
    if (_currentMesh) { _threeScene.remove(_currentMesh); _currentMesh = null; }
    const model = _modelCache[key];
    console.log('[FaceAR] _loadEffect key:', key, 'model found:', !!model);
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
