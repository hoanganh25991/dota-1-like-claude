// ============================================================
// scene.js — Three.js scene, camera, renderer, lighting
// Three.js r160 loaded from CDN as global `THREE`
// ============================================================

export let scene, camera, renderer, clock;

// Lights stored for day/night adjustment
let dirLight, hemiLight;

// Camera follow state
let _camPos = { x: 0, y: 30, z: 22 };   // current camera world pos
const CAM_OFFSET   = { x: 0, y: 30, z: 20 }; // offset from hero


// ── initScene ─────────────────────────────────────────────────
export function initScene(canvas) {
  // ── Scene ────────────────────────────────────────────────
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07070f);
  scene.fog = new THREE.FogExp2(0x07070f, 0.012);

  // ── Clock ────────────────────────────────────────────────
  clock = new THREE.Clock();

  // ── Camera ───────────────────────────────────────────────
  // Isometric-style perspective: wide FOV, high position
  const aspect = canvas.clientWidth / canvas.clientHeight || 16 / 9;
  camera = new THREE.PerspectiveCamera(55, aspect, 0.5, 500);
  camera.position.set(0, 30, 22);
  camera.lookAt(0, 0, 0);

  // ── Renderer ─────────────────────────────────────────────
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // ── Directional light (sun / moon) ───────────────────────
  dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(25, 40, 10);  // top-right angle
  dirLight.castShadow = true;
  // Shadow camera covers the full map
  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.far  = 200;
  dirLight.shadow.camera.left   = -60;
  dirLight.shadow.camera.right  =  60;
  dirLight.shadow.camera.top    =  60;
  dirLight.shadow.camera.bottom = -60;
  dirLight.shadow.mapSize.set(2048, 2048);
  dirLight.shadow.bias = -0.0005;
  scene.add(dirLight);

  // Soft target so shadows follow correctly
  dirLight.target.position.set(0, 0, 0);
  scene.add(dirLight.target);

  // ── Hemisphere ambient (sky / ground fill) ────────────────
  hemiLight = new THREE.HemisphereLight(0x2a2a4a, 0x1a1208, 0.6);
  scene.add(hemiLight);

  // ── Resize handler ────────────────────────────────────────
  const ro = new ResizeObserver(() => _onResize(canvas));
  ro.observe(canvas);
  _onResize(canvas);
}

function _onResize(canvas) {
  if (!renderer || !camera) return;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

// ── updateCamera ──────────────────────────────────────────────
// Call each frame with the hero's world position {x, y, z}.
// Smoothly follows using lerp.
export function updateCamera(heroPos) {
  if (!camera) return;

  const targetX = heroPos.x + CAM_OFFSET.x;
  const targetY = (heroPos.y || 0) + CAM_OFFSET.y;
  const targetZ = heroPos.z + CAM_OFFSET.z;

  const alpha = 0.08; // lerp factor — lower = smoother but more lag
  _camPos.x += (targetX - _camPos.x) * alpha;
  _camPos.y += (targetY - _camPos.y) * alpha;
  _camPos.z += (targetZ - _camPos.z) * alpha;

  camera.position.set(_camPos.x, _camPos.y, _camPos.z);
  camera.lookAt(
    _camPos.x - CAM_OFFSET.x,
    (heroPos.y || 0),
    _camPos.z - CAM_OFFSET.z,
  );
}

// ── setDayNight ───────────────────────────────────────────────
// Adjusts scene lighting for day/night phase.
export function setDayNight(phase) {
  if (!dirLight || !hemiLight) return;

  if (phase === 'day') {
    // Bright daylight
    dirLight.intensity  = 1.2;
    dirLight.color.set(0xfff5e8);      // warm white
    hemiLight.intensity = 0.6;
    hemiLight.color.set(0x2a2a4a);     // sky
    hemiLight.groundColor.set(0x1a1208);
    scene.fog.density = 0.012;
  } else {
    // Night — dimmer, cooler
    dirLight.intensity  = 0.3;
    dirLight.color.set(0x8899cc);      // cold moonlight
    hemiLight.intensity = 0.25;
    hemiLight.color.set(0x10102a);     // dark sky
    hemiLight.groundColor.set(0x080808);
    scene.fog.density = 0.018;
  }
}

// ── snapCamera ───────────────────────────────────────────────
// Instantly move camera with no lerp (use on match start/respawn).
export function snapCamera(heroPos) {
  if (!camera) return;
  _camPos.x = heroPos.x + CAM_OFFSET.x;
  _camPos.y = (heroPos.y || 0) + CAM_OFFSET.y;
  _camPos.z = heroPos.z + CAM_OFFSET.z;
  camera.position.set(_camPos.x, _camPos.y, _camPos.z);
  camera.lookAt(heroPos.x, heroPos.y || 0, heroPos.z);
}
