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
    sunglasses: { position: [-0.03, 0.08, 0.25], rotation: [0, 0, -0.05], scale: 8.0  },
  };

  // ── base64 assets from production (snowflake + sparkle) ──
  const FLAKE_B64 = 'data:image/png;base64,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';
  const SPARKLE_B64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAMAAAD04JH5AAAC7lBMVEUAAAD/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////jtXoAAAA+XRSTlMAAQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiMkJSYnKCkqKywtLi8wMTIzNDU2Nzg5Ojs8PT4/QEFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaW1xdXl9g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';

  let _initialized   = false;
  let _currentEffect = 'hat';
  let _threeCamera   = null;
  let _faceObj3D     = null;   // pivot added to faceObject — Jeeliz tracks this
  let _faceDetected  = false;
  let _pendingEffect = null;

  const _modelCache  = {};

  // ── 2D overlay state ──
  let _current2DEffect = 'none';
  let _overlayCanvas   = null;
  let _overlayCtx      = null;
  let _flakeImage      = null;
  let _sparkleImage    = null;
  let _flakes          = [];
  let _sparkles        = [];
  let _rafId2D         = null;

  // ── Public: init (called after Jeeliz scripts are loaded) ──
  function init(effectKey) {
    if (effectKey) _currentEffect = effectKey;
    _setStatus('amber', 'Requesting camera…');

    const hint = document.getElementById('face-hint');
    if (hint) hint.classList.add('hidden');

    _overlayCanvas = document.getElementById('overlay2DCanvas');
    if (_overlayCanvas) _overlayCtx = _overlayCanvas.getContext('2d');

    _load2DImages();

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

  // ── Preload snowflake + sparkle images ──
  function _load2DImages() {
    const fi = new Image();
    fi.onload = () => { _flakeImage = fi; };
    fi.src = FLAKE_B64;

    const si = new Image();
    si.onload = () => { _sparkleImage = si; };
    si.onerror = () => { console.warn('[FaceAR] sparkle image failed to load'); };
    si.src = SPARKLE_B64;
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
    _setStatus('red', 'No face detected');
  }

  // ── Per-frame tracking callback ──
  function _onTrack(detectState) {
    const detected = detectState.detected > 0.5;

    if (detected !== _faceDetected) {
      _faceDetected = detected;
      const hint = document.getElementById('face-hint');
      if (hint) hint.classList.toggle('hidden', detected);
      if (_faceObj3D) _faceObj3D.visible = detected;
      _setStatus(detected ? 'green' : 'red', detected ? 'Face detected' : 'No face detected');
    }

    if (_initialized && _threeCamera) {
      JeelizThreeHelper.render(detectState, _threeCamera);
    }

  }

  // ── 2D overlay: snow + sparkle (ported from production) ──
  function _getContext2D(width, height) {
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var obj = canvas.getContext('2d');
    if (obj) obj.clearRect(0, 0, width, height);
    return obj;
  }

  function _clampedArray(e, A, t, i) {
    var r = new Float32Array(t * i);
    for (var s = e.length - 4; s >= 0; s -= 4) {
      e[s] = e[s] * .3 + e[s + 1] * .59 + e[s + 2] * .11;
    }
    for (var o = t; o--;) {
      for (var a = i; a--;) {
        var n = 0;
        for (var c = 3; c--;) {
          for (var h = 3; h--;) {
            var u = o + c - 1;
            var l = a + h - 1;
            if (l >= 0 && l < i && u >= 0 && u < t) {
              n += e[(u + l * t) * 4] * A[c + h * 3];
            }
          }
        }
        r[o + a * t] = n;
      }
    }
    return r;
  }

  function _draw2DEffect() {
    if (!_overlayCtx) return;

    const jeeCanvas = document.getElementById('jeeFaceFilterCanvas');
    if (!jeeCanvas) return;

    var width  = jeeCanvas.width;
    var height = jeeCanvas.height;
    if (!width || !height) return;

    // Sync overlay size
    if (_overlayCanvas.width !== width)  _overlayCanvas.width  = width;
    if (_overlayCanvas.height !== height) _overlayCanvas.height = height;

    if (_current2DEffect === 'none') {
      _overlayCtx.clearRect(0, 0, width, height);
      return;
    }

    // Copy Jeeliz WebGL canvas to 2D overlay (makes pixels readable for sampling)
    _overlayCtx.clearRect(0, 0, width, height);
    _overlayCtx.drawImage(jeeCanvas, 0, 0, width, height);

    var minLength = Math.min(width, height);
    var maxLength = Math.max(width, height);

    if (_current2DEffect === 'snow' && _flakeImage) {
      var anotherCanvasWidth  = Math.max(60, Math.floor(minLength / 4));
      var anotherCanvasHeight = Math.floor(anotherCanvasWidth * maxLength / minLength);
      var anotherCanvas = _getContext2D(anotherCanvasWidth, anotherCanvasHeight);
      var g = [2, 2, 2, 0, 0, 0, -2, -2, -2];
      var sampling, newClampedArray, flake, i, u;
      var l = Math.floor(Math.max(1200, Math.floor(2400 / height * height)) * 0.8);
      var maxCorrespondenceHeight = Math.max(6, Math.floor(12 / height * height));
      var m = 1;

      anotherCanvas.drawImage(_overlayCtx.canvas, 0, 0, anotherCanvasWidth, anotherCanvasHeight);
      newClampedArray = anotherCanvas.getImageData(0, 0, anotherCanvasWidth, anotherCanvasHeight);
      if (newClampedArray && newClampedArray.data) {
        sampling = _clampedArray(newClampedArray.data, g, anotherCanvasWidth, anotherCanvasHeight);
      }

      while (_flakes.length < l && maxCorrespondenceHeight) {
        maxCorrespondenceHeight--;
        u = (Math.random() + .2) * 10 + 1;
        _flakes.push({
          x:      Math.random() * width,
          y:      4 - u * 4,
          width:  u * 1.2 * m,
          height: u / m,
          vx:     Math.random() - .5,
          vy:     height * .001,
          melt:   1,
        });
      }

      for (i = 0; i < _flakes.length; i++) {
        flake = _flakes[i];
        if (flake.y < anotherCanvasHeight / 16 || flake.y > anotherCanvasHeight - anotherCanvasHeight / 16 || sampling[Math.floor(flake.x) + Math.floor(flake.y) * anotherCanvasWidth] < 204) {
          flake.vx *= .997;
          flake.vy *= .997;
          flake.x  += flake.vx;
          flake.y  += flake.vy;
          if (flake.melt < 1) flake.melt += 1 / 16;
          else flake.melt = 1;
          if (flake.x > width + flake.width) flake.x -= width + flake.width;
          if (flake.x < -flake.width)         flake.x += width + flake.width;
          if (flake.y > anotherCanvasHeight + flake.height) { _flakes.splice(i++, 1); }
        } else {
          if (flake.melt > 0) {
            flake.melt -= 1 / 128;
            flake.vy = flake.height * .3;
          } else {
            _flakes.splice(i++, 1);
          }
        }
        _overlayCtx.save();
        _overlayCtx.globalAlpha = Math.min(1, flake.melt * 4);
        _overlayCtx.drawImage(_flakeImage,
          flake.x * width / anotherCanvasWidth  - flake.width  / 2,
          flake.y * height / anotherCanvasHeight - flake.height / 2,
          flake.width, flake.height
        );
        _overlayCtx.restore();
      }
    }

    if (_current2DEffect === 'sparkle' && _sparkleImage) {
      var anotherCanvasWidth  = Math.max(60, Math.floor(minLength / 4));
      var anotherCanvasHeight = Math.floor(anotherCanvasWidth * maxLength / minLength);
      var anotherCanvas = _getContext2D(anotherCanvasWidth, anotherCanvasHeight);
      var g = [1, 2, 1, 2, -12, 2, 1, 2, 1];
      var sampling, newClampedArray, sparkle, i, l;
      var maxCorrespondenceHeight = 0;
      var m = width / height;

      anotherCanvas.drawImage(_overlayCtx.canvas, 0, 0, anotherCanvasWidth, anotherCanvasHeight);
      newClampedArray = anotherCanvas.getImageData(0, 0, anotherCanvasWidth, anotherCanvasHeight);
      if (newClampedArray && newClampedArray.data) {
        sampling = _clampedArray(newClampedArray.data, g, anotherCanvasWidth, anotherCanvasHeight);
      }

      do {
        maxCorrespondenceHeight++;
        var dx = Math.floor(anotherCanvasWidth  * Math.random());
        var dy = Math.floor(anotherCanvasHeight * Math.random());
        if (Math.abs(sampling[dx + dy * anotherCanvasWidth]) > 8) {
          _sparkles.push({ x: dx, y: dy, isBig: Math.random() < .05 });
        }
      } while (_sparkles.length < 32 && maxCorrespondenceHeight < 64);

      for (i = 0; i < _sparkles.length; i++) {
        sparkle = _sparkles[i];
        if (sparkle.isBig) {
          sparkle.isBig = false;
          l = 512;
        } else {
          l = newClampedArray.data[(sparkle.x + sparkle.y * anotherCanvasWidth) * 4] + (Math.random() - .5) * 16;
        }
        if (l < 4 || Math.abs(sampling[sparkle.x + sparkle.y * anotherCanvasWidth]) < 8) {
          (function(s) { setTimeout(function() { var j = _sparkles.indexOf(s); if (j !== -1) _sparkles.splice(j, 1); }, 2000); })(sparkle);
        } else {
          l *= height / 150000;
          var sparkleImageWidth  = _sparkleImage.width  * l / m;
          var sparkleImageHeight = _sparkleImage.height * l / m;
          _overlayCtx.drawImage(_sparkleImage,
            sparkle.x * width  / anotherCanvasWidth  - sparkleImageWidth  / 2,
            sparkle.y * height / anotherCanvasHeight - sparkleImageHeight / 2,
            sparkleImageWidth, sparkleImageHeight
          );
        }
      }
    }
  }

  // ── Load effect into the face pivot ──
  function _loadEffect(key) {
    if (!_faceObj3D) return;

    // Clear previous model
    while (_faceObj3D.children.length) _faceObj3D.remove(_faceObj3D.children[0]);

    const model = _modelCache[key];
    if (!model) return;

    const cfg  = EFFECT_CONFIG[key];
    const mesh = model.clone();
    mesh.position.set(...cfg.position);
    mesh.rotation.set(...cfg.rotation);
    mesh.scale.setScalar(cfg.scale);
    _faceObj3D.add(mesh);
    _currentEffect = key;
  }

  // ── Public: switch 3D effect ──
  function switchEffect(key) {
    if (key === _currentEffect && _faceObj3D && _faceObj3D.children.length) return;
    if (!_initialized) { _pendingEffect = key; return; }
    _loadEffect(key);
  }

  // ── 2D RAF loop (independent of Jeeliz so detection is never blocked) ──
  function _start2DRAF() {
    if (_rafId2D) return;
    function loop() {
      _draw2DEffect();
      _rafId2D = requestAnimationFrame(loop);
    }
    _rafId2D = requestAnimationFrame(loop);
  }

  function _stop2DRAF() {
    if (_rafId2D) { cancelAnimationFrame(_rafId2D); _rafId2D = null; }
    if (_overlayCtx) _overlayCtx.clearRect(0, 0, _overlayCanvas.width, _overlayCanvas.height);
  }

  // ── Public: switch 2D effect ──
  function switch2DEffect(key) {
    _current2DEffect = key;
    _flakes   = [];
    _sparkles = [];
    if (key === 'none') _stop2DRAF();
    else _start2DRAF();
  }

  // ── Public: destroy ──
  function destroy() {
    if (!_initialized) return;
    try { JEELIZFACEFILTER.destroy(); } catch (e) {}
    _stop2DRAF();
    _initialized = false;
    _faceObj3D   = null;
    _threeCamera = null;
    _flakes      = [];
    _sparkles    = [];
  }

  // ── Status ──
  function _setStatus(color, text) {
    const dot  = document.getElementById('face-status-dot');
    const span = document.getElementById('face-status-text');
    if (dot)  dot.className = 'status-dot ' + color;
    if (span) span.textContent = text;
  }

  return { init, switchEffect, switch2DEffect, destroy };

})();
