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

  // Per-effect position (face-local) and scale — tune these
  const EFFECT_CONFIG = {
    hat:        { position: [-0.05, 1.0, 0  ], rotation: [0, 0, 0     ], scale: 1.42 },
    sunglasses: { position: [0, 0.08, 0.2], rotation: [0, 0, -0.05], scale: 8.0  },
  };

  let _initialized   = false;
  let _currentEffect = 'hat';
  let _threeCamera   = null;
  let _faceObj3D     = null;   // pivot added to faceObject — Jeeliz tracks this
  let _faceDetected  = false;
  let _pendingEffect = null;

  const _modelCache = {};

  // ── Public: init (called after Jeeliz scripts are loaded) ──
  function init(effectKey) {
    if (effectKey) _currentEffect = effectKey;
    _setStatus('amber', 'Requesting camera…');

    const hint = document.getElementById('face-hint');
    if (hint) hint.classList.add('hidden');

    _preloadModels(() => {
      if (_initialized && _faceObj3D && !_faceObj3D.children.length) _loadEffect(_currentEffect);
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
    if (errCode) {
      console.error('[FaceAR] Jeeliz error:', errCode);
      _setStatus('red', 'Jeeliz error: ' + errCode);
      return;
    }

    const threeStuffs = JeelizThreeHelper.init(spec, null);
    _threeCamera = JeelizThreeHelper.create_camera();

    const ambient  = new THREE.AmbientLight(0xffffff, 0.8);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(0, 1, 2);
    threeStuffs.scene.add(ambient, dirLight);

    // Pivot attached to faceObject — Jeeliz moves faceObject to track the face
    _faceObj3D = new THREE.Object3D();
    threeStuffs.faceObject.add(_faceObj3D);

    _loadEffect(_currentEffect);

    if (_pendingEffect) {
      _loadEffect(_pendingEffect);
      _pendingEffect = null;
    }

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
      if (_faceObj3D) _faceObj3D.visible = detected;
    }

    if (_initialized && _threeCamera) {
      JeelizThreeHelper.render(detectState, _threeCamera);
    }
  }

  // ── Load effect into the face pivot ──
  function _loadEffect(key) {
    if (!_faceObj3D) return;

    // Clear previous model
    while (_faceObj3D.children.length) _faceObj3D.remove(_faceObj3D.children[0]);

    const model = _modelCache[key];
    if (!model) return;

    const cfg   = EFFECT_CONFIG[key];
    const mesh  = model.clone();
    mesh.position.set(...cfg.position);
    mesh.rotation.set(...cfg.rotation);
    mesh.scale.setScalar(cfg.scale);
    _faceObj3D.add(mesh);
    _currentEffect = key;
  }

  // ── Public: switch effect ──
  function switchEffect(key) {
    if (key === _currentEffect && _faceObj3D && _faceObj3D.children.length) return;
    if (!_initialized) { _pendingEffect = key; return; }
    _loadEffect(key);
  }

  // ── Public: destroy ──
  function destroy() {
    if (!_initialized) return;
    try { JEELIZFACEFILTER.destroy(); } catch (e) {}
    _initialized = false;
    _faceObj3D   = null;
    _threeCamera = null;
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
