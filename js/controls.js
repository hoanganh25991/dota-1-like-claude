// ============================================================
// controls.js — Input handling for Crimson Lane (desktop + mobile)
// ============================================================

import { G } from './state.js';
import { castSkill } from './skills.js';
import { announce }  from './hud.js';
import { openShop, closeShop } from './items.js';

// ── Internal state ────────────────────────────────────────────

// Camera pan from keyboard arrow keys
const _arrowKeys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false };
const CAM_PAN_SPEED = 0.25; // world units per frame at 60fps

// Click-to-move (state stored on hero.moveTarget / hero.attackTarget directly)

// Mobile joystick state
const _joystick = {
  active:  false,
  baseX:   0, baseY:   0,
  knobX:   0, knobY:   0,
  dx:      0, dz:      0,
  touchId: -1,
  radius:  56,  // px — half of joystick-base element
};

// Mobile skill drag state
const _skillDrag = {
  active:      false,
  slot:        null,
  startX:      0,
  startY:      0,
  lastX:       0,
  lastY:       0,
  aimIndicator: null,
};

// Skill double-tap detection
const _skillTap = { slot: null, time: 0 };

// Scroll zoom
let _zoomLevel   = 1.0;  // multiplier; will adjust camera via G.camZoom
const ZOOM_MIN   = 0.5;
const ZOOM_MAX   = 2.0;

// THREE raycaster (created once)
let _raycaster   = null;
let _rayPlane    = null; // THREE.Plane for ground (y=0)
let _canvas      = null;
let _camera      = null; // cached camera reference

// ── initControls ─────────────────────────────────────────────
export function initControls(canvas) {
  _canvas = canvas;
  _initDesktop(canvas);
  _initMobile(canvas);
  _initTargetingMode();

  // Cache camera lazily (scene module may not be ready yet)
  // Controls will fetch it on first raycast
}

// ── Desktop ───────────────────────────────────────────────────
function _initDesktop(canvas) {
  // Mouse
  canvas.addEventListener('click',       _onCanvasClick);
  canvas.addEventListener('contextmenu', _onCanvasRightClick);
  canvas.addEventListener('wheel',       _onWheel, { passive: false });

  // Keyboard
  window.addEventListener('keydown', _onKeyDown);
  window.addEventListener('keyup',   _onKeyUp);
}

function _onCanvasClick(e) {
  if (!G.playerHero?.alive) return;

  const rect = _canvas.getBoundingClientRect();
  const sx   = e.clientX - rect.left;
  const sy   = e.clientY - rect.top;

  // If in targeting mode, resolve skill cast
  if (G.targetingSkill) {
    const pos  = raycastGround(sx, sy);
    const unit = pos ? raycastUnits(sx, sy, [...G.heroes, ...G.creeps, ...G.neutrals]) : null;
    if (pos || unit) {
      issueSkill(G.targetingSkill, 'point', pos, unit);
    }
    exitTargetingMode();
    return;
  }

  // Check if clicking on an enemy unit
  const allUnits = [...G.heroes, ...G.creeps, ...G.neutrals, ...G.structures];
  const hitUnit  = raycastUnits(sx, sy, allUnits);

  if (hitUnit && hitUnit.team !== G.playerHero.team) {
    issueAttack(hitUnit);
    return;
  }

  // Move to ground position
  const pos = raycastGround(sx, sy);
  if (pos) {
    issueMove(pos.x, pos.z);
    _spawnClickIndicator(e.clientX, e.clientY);
  }
}

function _onCanvasRightClick(e) {
  e.preventDefault();
  if (!G.playerHero?.alive) return;

  const rect = _canvas.getBoundingClientRect();
  const sx   = e.clientX - rect.left;
  const sy   = e.clientY - rect.top;

  // Right-click attacks enemy, or moves to ground
  const allUnits = [...G.heroes, ...G.creeps, ...G.neutrals];
  const hitUnit  = raycastUnits(sx, sy, allUnits);

  if (hitUnit && hitUnit.team !== G.playerHero.team) {
    issueAttack(hitUnit);
  } else {
    const pos = raycastGround(sx, sy);
    if (pos) issueMove(pos.x, pos.z);
  }

  // Exit targeting mode on right-click
  if (G.targetingSkill) exitTargetingMode();
}

function _onWheel(e) {
  e.preventDefault();
  const delta   = e.deltaY > 0 ? 0.1 : -0.1;
  _zoomLevel    = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, _zoomLevel + delta));
  G.camZoom     = _zoomLevel;
}

function _onKeyDown(e) {
  if (_isTypingTarget(e.target)) return;

  // Track arrow keys
  if (_arrowKeys.hasOwnProperty(e.key)) {
    _arrowKeys[e.key] = true;
    return;
  }

  if (e.repeat) return;

  switch (e.key.toUpperCase()) {
    case 'Q': case 'W': case 'E': case 'R': {
      // Handled by hud.js keydown listener for skill casting
      // But if Ctrl: handled there for learn. Do nothing extra here.
      break;
    }
    case ' ':
      e.preventDefault();
      issueStop();
      break;
    case 'B':
      if (!e.ctrlKey && !e.metaKey) {
        if (G.shopOpen) closeShop();
        else             openShop(G.playerHero);
      }
      break;
    case 'F':
      // Attack nearest enemy
      _attackNearest();
      break;
    case 'H':
      // Hold position (stop and don't auto-aggro)
      issueStop();
      break;
    default:
      break;
  }
}

function _onKeyUp(e) {
  if (_arrowKeys.hasOwnProperty(e.key)) {
    _arrowKeys[e.key] = false;
  }
}

function _attackNearest() {
  if (!G.playerHero?.alive) return;
  const heroPos = G.playerHero.group?.position ?? G.playerHero.position;
  if (!heroPos) return;

  let nearest = null;
  let bestDist = Infinity;
  const enemies = [...G.heroes, ...G.creeps, ...G.neutrals].filter(u =>
    u.alive && u.team !== G.playerHero.team
  );

  for (const e of enemies) {
    const ePos = e.group?.position ?? e.position;
    if (!ePos) continue;
    const dx = heroPos.x - ePos.x;
    const dz = heroPos.z - ePos.z;
    const d  = Math.sqrt(dx * dx + dz * dz);
    if (d < bestDist) { bestDist = d; nearest = e; }
  }

  if (nearest) issueAttack(nearest);
}

// ── Mobile ────────────────────────────────────────────────────
function _initMobile(canvas) {
  // Touch events for left joystick zone and skill buttons
  canvas.addEventListener('touchstart',  _onTouchStart,  { passive: false });
  canvas.addEventListener('touchmove',   _onTouchMove,   { passive: false });
  canvas.addEventListener('touchend',    _onTouchEnd,    { passive: false });
  canvas.addEventListener('touchcancel', _onTouchEnd,    { passive: false });

  // Skill button touch events (in HUD, outside canvas)
  _wireSkillTouches();

  // Attack button
  window.addEventListener('attackBtnPressed', _onAttackBtnPressed);
}

function _wireSkillTouches() {
  const SLOTS = ['Q', 'W', 'E', 'R'];
  SLOTS.forEach(slot => {
    const el = document.getElementById(`skill-${slot}`);
    if (!el) return;

    el.addEventListener('touchstart', e => {
      e.preventDefault();
      _skillDrag.slot   = slot;
      _skillDrag.startX = e.touches[0].clientX;
      _skillDrag.startY = e.touches[0].clientY;
      _skillDrag.lastX  = e.touches[0].clientX;
      _skillDrag.lastY  = e.touches[0].clientY;
      _skillDrag.active = false;
    }, { passive: false });

    el.addEventListener('touchmove', e => {
      e.preventDefault();
      if (_skillDrag.slot !== slot) return;
      const dx = e.touches[0].clientX - _skillDrag.startX;
      const dy = e.touches[0].clientY - _skillDrag.startY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      _skillDrag.lastX = e.touches[0].clientX;
      _skillDrag.lastY = e.touches[0].clientY;

      if (dist > 20) {
        _skillDrag.active = true;
        _showAimIndicator(_skillDrag.lastX, _skillDrag.lastY);
      }
    }, { passive: false });

    el.addEventListener('touchend', e => {
      e.preventDefault();
      if (_skillDrag.slot !== slot) return;

      if (_skillDrag.active) {
        // Aim-mode cast: cast at drag release point
        _hideAimIndicator();
        const rect   = _canvas.getBoundingClientRect();
        const sx     = _skillDrag.lastX - rect.left;
        const sy     = _skillDrag.lastY - rect.top;
        const pos    = raycastGround(sx, sy);
        const unit   = pos ? raycastUnits(sx, sy, [...G.heroes, ...G.creeps, ...G.neutrals]) : null;
        issueSkill(slot, 'drag', pos, unit);
      } else {
        // Check double-tap
        const now = performance.now();
        if (_skillTap.slot === slot && now - _skillTap.time < 300) {
          // Double-tap: smart-cast nearest enemy
          _skillTap.slot = null;
          _smartCastNearest(slot);
        } else {
          _skillTap.slot = slot;
          _skillTap.time = now;
          // Single tap: check if needs targeting
          const h     = G.playerHero;
          const skill = h?.skills?.[slot];
          const def   = skill?.def ?? skill ?? {};
          const cType = def.castType ?? 'self';
          if (cType === 'point' || cType === 'unit' || cType === 'direction') {
            // Enter tap-targeting mode — next tap on canvas = cast point
            enterTargetingMode(slot);
            announce('TAP TARGET', '#44aaff', 1.5);
          } else {
            issueSkill(slot, 'quick', null, null);
          }
        }
      }

      _skillDrag.active = false;
      _skillDrag.slot   = null;
    }, { passive: false });
  });
}

function _smartCastNearest(slot) {
  const h = G.playerHero;
  if (!h?.alive) return;
  const heroPos = h.group?.position ?? h.position;
  if (!heroPos) return;

  const enemies = [...G.heroes, ...G.creeps, ...G.neutrals].filter(u =>
    u.alive && u.team !== h.team
  );
  let nearest = null;
  let bestDist = Infinity;
  for (const e of enemies) {
    const ePos = e.group?.position ?? e.position;
    if (!ePos) continue;
    const dx = heroPos.x - ePos.x;
    const dz = heroPos.z - ePos.z;
    const d  = Math.sqrt(dx * dx + dz * dz);
    if (d < bestDist) { bestDist = d; nearest = e; }
  }

  issueSkill(slot, 'smart', nearest?.group?.position ?? nearest?.position ?? heroPos, nearest);
}

// Aim indicator (visual arrow on canvas overlay)
function _showAimIndicator(clientX, clientY) {
  if (!_skillDrag.aimIndicator) {
    const el = document.createElement('div');
    el.id    = 'aim-indicator';
    el.style.cssText = `
      position:fixed;width:24px;height:24px;border-radius:50%;
      background:rgba(255,204,68,0.8);border:2px solid #ffcc44;
      pointer-events:none;z-index:9999;transform:translate(-50%,-50%);
      box-shadow:0 0 12px rgba(255,204,68,0.6);
    `;
    document.body.appendChild(el);
    _skillDrag.aimIndicator = el;
  }
  _skillDrag.aimIndicator.style.left = clientX + 'px';
  _skillDrag.aimIndicator.style.top  = clientY + 'px';
  _skillDrag.aimIndicator.style.display = '';
}

function _hideAimIndicator() {
  if (_skillDrag.aimIndicator) {
    _skillDrag.aimIndicator.style.display = 'none';
  }
}

// ── Canvas touch (joystick) ───────────────────────────────────
function _onTouchStart(e) {
  e.preventDefault();
  for (const touch of e.changedTouches) {
    const vw = window.innerWidth;
    // Left 46% of screen: joystick zone
    if (touch.clientX < vw * 0.46 && !_joystick.active) {
      _joystick.active  = true;
      _joystick.touchId = touch.identifier;
      _joystick.baseX   = touch.clientX;
      _joystick.baseY   = touch.clientY;
      _joystick.knobX   = touch.clientX;
      _joystick.knobY   = touch.clientY;
      _joystick.dx      = 0;
      _joystick.dz      = 0;
      _updateJoystickUI();

      G.input.joystickActive = true;
    }
    // Right side: targeting resolve if in targeting mode
    else if (touch.clientX >= vw * 0.46 && G.targetingSkill) {
      const rect = _canvas.getBoundingClientRect();
      const sx   = touch.clientX - rect.left;
      const sy   = touch.clientY - rect.top;
      const pos  = raycastGround(sx, sy);
      const unit = pos ? raycastUnits(sx, sy, [...G.heroes, ...G.creeps, ...G.neutrals]) : null;
      issueSkill(G.targetingSkill, 'point', pos, unit);
      exitTargetingMode();
    }
  }
}

function _onTouchMove(e) {
  e.preventDefault();
  for (const touch of e.changedTouches) {
    if (touch.identifier === _joystick.touchId) {
      _joystick.knobX = touch.clientX;
      _joystick.knobY = touch.clientY;

      const rawDx = touch.clientX - _joystick.baseX;
      const rawDy = touch.clientY - _joystick.baseY;
      const dist  = Math.sqrt(rawDx * rawDx + rawDy * rawDy);
      const r     = _joystick.radius;
      const dead  = r * 0.18;

      if (dist < dead) {
        _joystick.dx = 0;
        _joystick.dz = 0;
      } else {
        // Clamp knob to radius
        const clampedDist = Math.min(dist, r);
        const normX = rawDx / dist;
        const normY = rawDy / dist;
        _joystick.knobX = _joystick.baseX + normX * clampedDist;
        _joystick.knobY = _joystick.baseY + normY * clampedDist;

        // Map to move dir (X = world X, Y = world Z)
        const strength = (clampedDist - dead) / (r - dead);
        _joystick.dx   = normX * strength;
        _joystick.dz   = normY * strength;
      }

      // Update G.input.moveDir
      G.input.moveDir.x = _joystick.dx;
      G.input.moveDir.z = _joystick.dz;
      _updateJoystickUI();
    }
  }
}

function _onTouchEnd(e) {
  for (const touch of e.changedTouches) {
    if (touch.identifier === _joystick.touchId) {
      _joystick.active   = false;
      _joystick.touchId  = -1;
      _joystick.dx       = 0;
      _joystick.dz       = 0;
      G.input.moveDir.x  = 0;
      G.input.moveDir.z  = 0;
      G.input.joystickActive = false;
      _resetJoystickUI();
    }
  }
}

function _updateJoystickUI() {
  const base = document.getElementById('joystick-base');
  const knob = document.getElementById('joystick-knob');
  if (!base || !knob) return;

  if (!_joystick.active) {
    base.style.display = 'none';
    return;
  }

  const rect = document.body.getBoundingClientRect();
  base.style.display = '';
  base.style.left    = (_joystick.baseX - rect.left - _joystick.radius) + 'px';
  base.style.top     = (_joystick.baseY - rect.top  - _joystick.radius) + 'px';

  const relX = _joystick.knobX - _joystick.baseX;
  const relY = _joystick.knobY - _joystick.baseY;
  knob.style.transform = `translate(${relX}px, ${relY}px)`;
}

function _resetJoystickUI() {
  const base = document.getElementById('joystick-base');
  const knob = document.getElementById('joystick-knob');
  if (base) base.style.display = 'none';
  if (knob) knob.style.transform = 'translate(0, 0)';
}

// ── Attack button ─────────────────────────────────────────────
function _onAttackBtnPressed() {
  _attackNearest();
}

// ── Targeting mode ────────────────────────────────────────────
function _initTargetingMode() {
  // Listen for targeting mode requests from hud.js
  window.addEventListener('enterTargetingMode', e => {
    enterTargetingMode(e.detail?.slot);
  });

  // Also track canvas cursor during targeting mode
  _canvas.addEventListener('mousemove', e => {
    if (!G.targetingSkill) return;
    const rect = _canvas.getBoundingClientRect();
    const pos  = raycastGround(e.clientX - rect.left, e.clientY - rect.top);
    if (pos) {
      G.input.pointerWorld.x = pos.x;
      G.input.pointerWorld.z = pos.z;
    }
    _canvas.style.cursor = 'crosshair';
  });
}

export function enterTargetingMode(slot) {
  G.targetingSkill = slot;
  if (_canvas) _canvas.style.cursor = 'crosshair';

  // Show targeting banner
  const banner = _getOrCreateTargetBanner();
  banner.textContent = `TARGETING ${slot} — Click to cast`;
  banner.style.display = '';

  // Escape to cancel
  const cancelOnEsc = e => {
    if (e.key === 'Escape') {
      exitTargetingMode();
      window.removeEventListener('keydown', cancelOnEsc);
    }
  };
  window.addEventListener('keydown', cancelOnEsc);
}

export function exitTargetingMode() {
  G.targetingSkill = null;
  if (_canvas) _canvas.style.cursor = '';

  const banner = document.getElementById('targeting-banner');
  if (banner) banner.style.display = 'none';
}

function _getOrCreateTargetBanner() {
  let el = document.getElementById('targeting-banner');
  if (!el) {
    el = document.createElement('div');
    el.id = 'targeting-banner';
    el.style.cssText = `
      position:fixed;top:55%;left:50%;transform:translateX(-50%);
      background:rgba(68,170,255,0.18);border:1px solid #44aaff;
      color:#44aaff;font-size:12px;letter-spacing:2px;text-transform:uppercase;
      padding:6px 18px;border-radius:4px;pointer-events:none;z-index:9000;display:none;
    `;
    document.body.appendChild(el);
  }
  return el;
}

// ── Click indicator ───────────────────────────────────────────
function _spawnClickIndicator(clientX, clientY) {
  const el = document.createElement('div');
  el.style.cssText = `
    position:fixed;left:${clientX}px;top:${clientY}px;
    width:20px;height:20px;border-radius:50%;border:2px solid #ffcc44;
    transform:translate(-50%,-50%);pointer-events:none;z-index:8000;
    animation:clickIndicatorFade 0.5s forwards;
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 520);

  // Inject keyframe if not already present
  if (!document.getElementById('click-indicator-style')) {
    const style = document.createElement('style');
    style.id = 'click-indicator-style';
    style.textContent = '@keyframes clickIndicatorFade{from{opacity:1;transform:translate(-50%,-50%) scale(1)}to{opacity:0;transform:translate(-50%,-50%) scale(1.8)}}';
    document.head.appendChild(style);
  }
}

// ── Issue commands ────────────────────────────────────────────
export function issueMove(worldX, worldZ) {
  const h = G.playerHero;
  if (!h?.alive) return;
  h.moveTarget    = { x: worldX, z: worldZ };
  h.attackTarget  = null;
  h.state         = h.state ?? {};
  h.state.moving  = true;
  G.input.moveDir.x = 0;
  G.input.moveDir.z = 0;
}

export function issueAttack(target) {
  const h = G.playerHero;
  if (!h?.alive || !target?.alive) return;
  h.attackTarget  = target;
  h.moveTarget    = null;
  h.state         = h.state ?? {};
  h.state.moving  = false;
  window.dispatchEvent(new CustomEvent('heroAttackCommand', { detail: { hero: h, target } }));
}

export function issueSkill(slot, castMode, targetPos, targetUnit) {
  const h = G.playerHero;
  if (!h?.alive) return;
  castSkill(h, slot, castMode, targetPos, targetUnit);
}

export function issueStop() {
  const h = G.playerHero;
  if (!h) return;
  h.moveTarget    = null;
  h.attackTarget  = null;
  h.tpChanneling  = false;
  if (h.state) h.state.moving = false;
  G.input.moveDir.x = 0;
  G.input.moveDir.z = 0;
  window.dispatchEvent(new CustomEvent('heroStop', { detail: { hero: h } }));
}

// ── Raycasting ────────────────────────────────────────────────
function _getCamera() {
  if (_camera) return _camera;
  // Try to import camera from scene module dynamically
  try {
    // scene.js exports camera as a named export; we cache it here
    // The main game loop should set window._gameCamera after initScene
    _camera = window._gameCamera ?? null;
  } catch (_) {}
  return _camera;
}

function _getRaycaster() {
  if (!_raycaster && typeof THREE !== 'undefined') {
    _raycaster = new THREE.Raycaster();
    _rayPlane  = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // y = 0 ground plane
  }
  return _raycaster;
}

/**
 * Cast a ray from screen position to ground plane (y=0).
 * @param {number} screenX - pixels from canvas left
 * @param {number} screenY - pixels from canvas top
 * @returns {{ x: number, z: number } | null}
 */
export function raycastGround(screenX, screenY) {
  const cam = _getCamera();
  const ray = _getRaycaster();
  if (!cam || !ray || typeof THREE === 'undefined') return _fallbackScreenToWorld(screenX, screenY);

  const w = _canvas.clientWidth  || _canvas.width;
  const h = _canvas.clientHeight || _canvas.height;
  const ndc = new THREE.Vector2(
    (screenX / w) * 2 - 1,
    -(screenY / h) * 2 + 1,
  );

  ray.setFromCamera(ndc, cam);

  const target = new THREE.Vector3();
  const hit    = ray.ray.intersectPlane(_rayPlane, target);
  if (!hit) return null;
  return { x: target.x, z: target.z };
}

/**
 * Find the unit from unitList closest to the ray.
 * @param {number} screenX
 * @param {number} screenY
 * @param {Array}  unitList
 * @returns {object|null} closest unit within 2 world units of ray
 */
export function raycastUnits(screenX, screenY, unitList) {
  const cam = _getCamera();
  const ray = _getRaycaster();
  if (!cam || !ray || typeof THREE === 'undefined') return null;

  const w = _canvas.clientWidth  || _canvas.width;
  const h = _canvas.clientHeight || _canvas.height;
  const ndc = new THREE.Vector2(
    (screenX / w) * 2 - 1,
    -(screenY / h) * 2 + 1,
  );
  ray.setFromCamera(ndc, cam);

  let bestUnit = null;
  let bestDist = 2.5; // world unit threshold

  for (const unit of unitList) {
    if (!unit.alive) continue;
    const pos = unit.group?.position ?? unit.position;
    if (!pos) continue;

    const uVec  = new THREE.Vector3(pos.x, pos.y ?? 0, pos.z);
    const dist  = ray.ray.distanceToPoint(uVec);
    if (dist < bestDist) {
      bestDist = dist;
      bestUnit = unit;
    }
  }

  return bestUnit;
}

// Fallback when THREE is not ready — simple screen→world approximation
function _fallbackScreenToWorld(screenX, screenY) {
  const w = _canvas.clientWidth  || window.innerWidth;
  const h = _canvas.clientHeight || window.innerHeight;
  // Rough affine approximation for the isometric camera (Y=30, Z=22 offset, ~55° FOV)
  const aspect = w / h;
  const scale  = 42; // tuned for 55° FOV at Y=30
  const nx = (screenX / w - 0.5) * scale * aspect;
  const nz = (screenY / h - 0.5) * scale - 11; // account for camera Z offset
  return { x: nx, z: nz };
}

// ── updateControls ────────────────────────────────────────────
/**
 * Called each frame with dt in seconds.
 * Handles: joystick move application, keyboard camera pan, hero move-toward-target.
 */
export function updateControls(dt) {
  _updateCameraPan(dt);
  _updateHeroMovement(dt);
  _updateCameraRef();
}

function _updateCameraRef() {
  // Keep camera reference fresh from scene module's export
  if (!_camera && typeof window._gameCamera !== 'undefined') {
    _camera = window._gameCamera;
    if (_camera && typeof THREE !== 'undefined' && !_rayPlane) {
      _raycaster = new THREE.Raycaster();
      _rayPlane  = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    }
  }
}

function _updateCameraPan(dt) {
  const speed = CAM_PAN_SPEED * 60 * dt; // normalized for 60fps
  if (_arrowKeys.ArrowLeft)  G.camTarget.x -= speed;
  if (_arrowKeys.ArrowRight) G.camTarget.x += speed;
  if (_arrowKeys.ArrowUp)    G.camTarget.z -= speed;
  if (_arrowKeys.ArrowDown)  G.camTarget.z += speed;
}

function _updateHeroMovement(dt) {
  const h = G.playerHero;
  if (!h?.alive) return;

  const heroPos = h.group?.position ?? h.position;
  if (!heroPos) return;

  // Joystick / keyboard move direction (from G.input.moveDir)
  const jx = G.input.moveDir.x;
  const jz = G.input.moveDir.z;

  if (Math.abs(jx) > 0.01 || Math.abs(jz) > 0.01) {
    // Joystick active — move in direction
    const spd = ((h.effectiveMoveSpeed ?? h.def?.moveSpeed ?? 295) / 100) * dt;
    const len  = Math.sqrt(jx * jx + jz * jz);
    const nx   = jx / len;
    const nz   = jz / len;

    if (h.group) {
      h.group.position.x += nx * spd;
      h.group.position.z += nz * spd;
      // Face movement direction
      h.group.rotation.y = Math.atan2(nx, nz);
    }
    if (h.position) {
      h.position.x = h.group?.position.x ?? h.position.x;
      h.position.z = h.group?.position.z ?? h.position.z;
    }

    _clearMoveTarget(h);
    return;
  }

  // Click-to-move: lerp toward moveTarget
  if (!h.moveTarget) return;
  if (h.tpChanneling) return;

  const tx  = h.moveTarget.x;
  const tz  = h.moveTarget.z;
  const dx  = tx - heroPos.x;
  const dz  = tz - heroPos.z;
  const dist = Math.sqrt(dx * dx + dz * dz);

  if (dist < 0.15) {
    _clearMoveTarget(h);
    return;
  }

  const spd  = ((h.effectiveMoveSpeed ?? h.def?.moveSpeed ?? 295) / 100) * dt;
  const move = Math.min(spd, dist);
  const nx   = dx / dist;
  const nz   = dz / dist;

  if (h.group) {
    h.group.position.x += nx * move;
    h.group.position.z += nz * move;
    h.group.rotation.y  = Math.atan2(nx, nz);
  }
  if (h.position) {
    h.position.x = h.group?.position.x ?? (h.position.x + nx * move);
    h.position.z = h.group?.position.z ?? (h.position.z + nz * move);
  }

  // Update G.input.pointerWorld to follow hero's destination
  G.input.pointerWorld.x = tx;
  G.input.pointerWorld.z = tz;
}

function _clearMoveTarget(h) {
  h.moveTarget = null;
  if (h.state) h.state.moving = false;
}

// ── Utilities ─────────────────────────────────────────────────
function _isTypingTarget(el) {
  return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
}
