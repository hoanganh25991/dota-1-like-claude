// ============================================================
// hero-viewer.js — 3D hero preview system inside Hero Viewer tab
// All viewer UI lives in #hero-viewer-panel (already in index.html)
// IDs use hv- prefix.
// THREE is a global.
// ============================================================

import { ALL_HERO_IDS, HERO_DEFS, loadHeroModule } from './heroes/registry.js';

// ── Module state ──────────────────────────────────────────────
let _scene    = null;
let _camera   = null;
let _renderer = null;
let _clock    = { prev: 0 };

let _currentHeroId    = ALL_HERO_IDS[0];
let _currentModel     = null;
let _autoRotate       = true;
let _animState        = 'idle';
let _attackSpeedOverride = 100;
let _levelOverride    = 1;

let _mouseDown  = false;
let _lastMouseX = 0;
let _lastMouseY = 0;
let _cameraTheta = 0;   // horizontal angle
let _cameraPhi   = 0.3; // vertical angle
let _cameraRadius = 4;

let _rafId = null;
let _animTime = 0;

// Skill detail overlay state
let _selectedSkillIdx = null;

// ── initHeroViewer ────────────────────────────────────────────
export async function initHeroViewer() {
  const canvas = document.getElementById('hv-hero-canvas');
  if (!canvas) {
    console.warn('[hero-viewer] #hv-hero-canvas not found.');
    return;
  }

  // Set up Three.js scene
  _scene = new THREE.Scene();
  _scene.background = new THREE.Color(0x0d0d1a);

  // Camera
  const w = canvas.clientWidth  || 400;
  const h = canvas.clientHeight || 400;
  _camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
  _updateCameraFromSpherical();

  // Renderer
  _renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  _renderer.setSize(w, h, false);
  _renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Lighting
  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  _scene.add(ambient);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(3, 6, 4);
  _scene.add(dirLight);

  const fillLight = new THREE.DirectionalLight(0x4466ff, 0.4);
  fillLight.position.set(-3, 2, -2);
  _scene.add(fillLight);

  // Ground disc
  const groundGeo = new THREE.CircleGeometry(2, 32);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.9 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  _scene.add(ground);

  // Wire up UI
  _wireViewerUI();

  // Load first hero
  await _loadHero(_currentHeroId);

  // Start render loop
  _startRenderLoop();
}

// ── _loadHero ─────────────────────────────────────────────────
async function _loadHero(id) {
  _currentHeroId = id;

  // Remove current model from scene
  if (_currentModel) {
    _scene.remove(_currentModel);
    _currentModel = null;
  }

  try {
    const mod = await loadHeroModule(id);
    const group = mod.buildModel();

    // Center model at y=0 roughly
    group.position.set(0, 0, 0);
    _scene.add(group);
    _currentModel = group;

    // Reset animation state
    _animState = 'idle';
    _animTime  = 0;
    if (!group.userData) group.userData = {};
    if (!group.state) group.state = {};
    group.state.anim    = 'idle';
    group.state._animAge = 0;

    // Update UI panels
    const heroDef = HERO_DEFS[id] ?? {};
    _updateStatsPanel(heroDef);

    if (typeof mod.getSkillTemplates === 'function') {
      _updateSkillsGrid(mod.getSkillTemplates());
    } else {
      _updateSkillsGrid([]);
    }

    // Update active portrait strip
    _highlightPortrait(id);

  } catch (err) {
    console.warn('[hero-viewer] Failed to load hero:', id, err);
  }
}

// ── _wireViewerUI ─────────────────────────────────────────────
function _wireViewerUI() {
  // ── Hero portrait strip ──────────────────────────────────────
  const strip = document.getElementById('hv-portrait-strip');
  if (strip) {
    // Build portrait buttons
    strip.innerHTML = '';
    for (const id of ALL_HERO_IDS) {
      const btn = document.createElement('button');
      btn.className = 'hv-portrait';
      btn.dataset.heroId = id;
      btn.title = HERO_DEFS[id]?.name ?? id;

      const label = document.createElement('span');
      label.textContent = (HERO_DEFS[id]?.name ?? id).slice(0, 3).toUpperCase();
      btn.appendChild(label);

      btn.addEventListener('click', () => _loadHero(id));
      strip.appendChild(btn);
    }
  }

  // ── Nav arrows ───────────────────────────────────────────────
  const prevBtn = document.getElementById('hv-prev-hero');
  const nextBtn = document.getElementById('hv-next-hero');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      const idx = ALL_HERO_IDS.indexOf(_currentHeroId);
      const newIdx = (idx - 1 + ALL_HERO_IDS.length) % ALL_HERO_IDS.length;
      _loadHero(ALL_HERO_IDS[newIdx]);
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const idx = ALL_HERO_IDS.indexOf(_currentHeroId);
      const newIdx = (idx + 1) % ALL_HERO_IDS.length;
      _loadHero(ALL_HERO_IDS[newIdx]);
    });
  }

  // ── Animation buttons ─────────────────────────────────────────
  const animBtns = document.querySelectorAll('[data-hv-anim]');
  animBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      _setViewerAnim(btn.dataset.hvAnim);
    });
  });

  // ── Skill cast buttons (Q/W/E/R) ─────────────────────────────
  const skillBtns = document.querySelectorAll('[data-hv-skill]');
  skillBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      _setViewerAnim('cast');
      // Flash back to idle after cast
      setTimeout(() => _setViewerAnim('idle'), 800);
    });
  });

  // ── Attack speed slider ───────────────────────────────────────
  const atkSlider = document.getElementById('hv-attack-speed');
  const atkLabel  = document.getElementById('hv-attack-speed-val');
  if (atkSlider) {
    atkSlider.min = '50';
    atkSlider.max = '400';
    atkSlider.value = String(_attackSpeedOverride);
    atkSlider.addEventListener('input', () => {
      _attackSpeedOverride = parseInt(atkSlider.value, 10);
      if (atkLabel) atkLabel.textContent = _attackSpeedOverride;
    });
  }

  // ── Level slider ──────────────────────────────────────────────
  const lvlSlider = document.getElementById('hv-level');
  const lvlLabel  = document.getElementById('hv-level-val');
  if (lvlSlider) {
    lvlSlider.min = '1';
    lvlSlider.max = '25';
    lvlSlider.value = String(_levelOverride);
    lvlSlider.addEventListener('input', () => {
      _levelOverride = parseInt(lvlSlider.value, 10);
      if (lvlLabel) lvlLabel.textContent = _levelOverride;
      // Recalculate and display stats at new level
      const heroDef = HERO_DEFS[_currentHeroId] ?? {};
      _updateStatsPanel(heroDef);
    });
  }

  // ── Auto-rotate toggle ────────────────────────────────────────
  const rotateToggle = document.getElementById('hv-auto-rotate');
  if (rotateToggle) {
    rotateToggle.addEventListener('change', () => {
      _autoRotate = rotateToggle.checked;
    });
  }

  // ── Mouse drag to rotate ──────────────────────────────────────
  const canvas = document.getElementById('hv-hero-canvas');
  if (canvas) {
    canvas.addEventListener('mousedown', e => {
      _mouseDown  = true;
      _lastMouseX = e.clientX;
      _lastMouseY = e.clientY;
      _autoRotate = false;
    });
    canvas.addEventListener('mousemove', e => {
      if (!_mouseDown) return;
      const dx = e.clientX - _lastMouseX;
      const dy = e.clientY - _lastMouseY;
      _cameraTheta -= dx * 0.01;
      _cameraPhi    = Math.max(0.05, Math.min(Math.PI / 2 - 0.05, _cameraPhi - dy * 0.01));
      _lastMouseX = e.clientX;
      _lastMouseY = e.clientY;
      _updateCameraFromSpherical();
    });
    canvas.addEventListener('mouseup',    () => { _mouseDown = false; });
    canvas.addEventListener('mouseleave', () => { _mouseDown = false; });

    // Touch support
    canvas.addEventListener('touchstart', e => {
      if (e.touches.length === 1) {
        _mouseDown  = true;
        _lastMouseX = e.touches[0].clientX;
        _lastMouseY = e.touches[0].clientY;
        _autoRotate = false;
      }
    }, { passive: true });
    canvas.addEventListener('touchmove', e => {
      if (!_mouseDown || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - _lastMouseX;
      const dy = e.touches[0].clientY - _lastMouseY;
      _cameraTheta -= dx * 0.01;
      _cameraPhi    = Math.max(0.05, Math.min(Math.PI / 2 - 0.05, _cameraPhi - dy * 0.01));
      _lastMouseX = e.touches[0].clientX;
      _lastMouseY = e.touches[0].clientY;
      _updateCameraFromSpherical();
    }, { passive: true });
    canvas.addEventListener('touchend', () => { _mouseDown = false; });

    // Scroll to zoom
    canvas.addEventListener('wheel', e => {
      _cameraRadius = Math.max(1.5, Math.min(10, _cameraRadius + e.deltaY * 0.01));
      _updateCameraFromSpherical();
      e.preventDefault();
    }, { passive: false });
  }

  // ── Keyboard shortcuts ────────────────────────────────────────
  window.addEventListener('keydown', e => {
    // Only handle when hero viewer panel is visible
    const panel = document.getElementById('hero-viewer-panel');
    if (!panel || panel.style.display === 'none') return;

    switch (e.key) {
      case 'ArrowLeft': {
        const idx = ALL_HERO_IDS.indexOf(_currentHeroId);
        _loadHero(ALL_HERO_IDS[(idx - 1 + ALL_HERO_IDS.length) % ALL_HERO_IDS.length]);
        break;
      }
      case 'ArrowRight': {
        const idx = ALL_HERO_IDS.indexOf(_currentHeroId);
        _loadHero(ALL_HERO_IDS[(idx + 1) % ALL_HERO_IDS.length]);
        break;
      }
      case 'q': case 'Q': _setViewerAnim('cast'); setTimeout(() => _setViewerAnim('idle'), 800); break;
      case 'w': case 'W': _setViewerAnim('cast'); setTimeout(() => _setViewerAnim('idle'), 800); break;
      case 'e': case 'E': _setViewerAnim('cast'); setTimeout(() => _setViewerAnim('idle'), 800); break;
      case 'r': case 'R': _setViewerAnim('cast'); setTimeout(() => _setViewerAnim('idle'), 800); break;
    }
  });
}

// ── _setViewerAnim ────────────────────────────────────────────
function _setViewerAnim(anim) {
  _animState = anim;
  if (_currentModel) {
    if (!_currentModel.state) _currentModel.state = {};
    _currentModel.state.anim    = anim;
    _currentModel.state._animAge = 0;
  }
}

// ── _updateStatsPanel ─────────────────────────────────────────
function _updateStatsPanel(heroDef) {
  const level = _levelOverride;

  // Derived stats at current level
  const strGrow = heroDef.strGrow ?? 2;
  const agiGrow = heroDef.agiGrow ?? 2;
  const intGrow = heroDef.intGrow ?? 2;

  const str = (heroDef.str ?? 20) + strGrow * (level - 1);
  const agi = (heroDef.agi ?? 20) + agiGrow * (level - 1);
  const int = (heroDef.int ?? 20) + intGrow * (level - 1);

  const maxHp = (heroDef.hp ?? 500) + str * 19;
  const maxMp = (heroDef.mp ?? 300) + int * 13;
  const armor  = (heroDef.armor ?? 2) + agi * 0.14;
  const atkSpd = 1.0 + agi * 0.01;

  const primaryAttr = heroDef.primary ?? 'str';
  let attrBonus = 0;
  if (primaryAttr === 'str') attrBonus = str;
  else if (primaryAttr === 'agi') attrBonus = agi;
  else attrBonus = int;
  const damage = (heroDef.attackDamage ?? 40) + attrBonus * 0.5;

  // Helper to safely set text content
  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  setText('hv-hero-name',    heroDef.name ?? _currentHeroId);
  setText('hv-hero-primary', primaryAttr.toUpperCase());
  setText('hv-hero-faction', heroDef.faction ?? '—');
  setText('hv-hero-level',   `Level ${level}`);

  setText('hv-stat-hp',      Math.round(maxHp));
  setText('hv-stat-mp',      Math.round(maxMp));
  setText('hv-stat-armor',   armor.toFixed(1));
  setText('hv-stat-range',   heroDef.attackRange ?? '—');
  setText('hv-stat-movespd', heroDef.moveSpeed ?? '—');
  setText('hv-stat-atkspd',  atkSpd.toFixed(2));
  setText('hv-stat-damage',  Math.round(damage));

  // Attribute display with grow
  const strEl = document.getElementById('hv-stat-str');
  const agiEl = document.getElementById('hv-stat-agi');
  const intEl = document.getElementById('hv-stat-int');
  if (strEl) {
    strEl.textContent = `${Math.round(str)} (+${strGrow})`;
    strEl.style.fontWeight = primaryAttr === 'str' ? 'bold' : 'normal';
    strEl.style.color = primaryAttr === 'str' ? '#ff8844' : '';
  }
  if (agiEl) {
    agiEl.textContent = `${Math.round(agi)} (+${agiGrow})`;
    agiEl.style.fontWeight = primaryAttr === 'agi' ? 'bold' : 'normal';
    agiEl.style.color = primaryAttr === 'agi' ? '#44ff88' : '';
  }
  if (intEl) {
    intEl.textContent = `${Math.round(int)} (+${intGrow})`;
    intEl.style.fontWeight = primaryAttr === 'int' ? 'bold' : 'normal';
    intEl.style.color = primaryAttr === 'int' ? '#44aaff' : '';
  }
}

// ── _updateSkillsGrid ─────────────────────────────────────────
function _updateSkillsGrid(skills) {
  const grid = document.getElementById('hv-skill-grid');
  if (!grid) return;

  grid.innerHTML = '';

  const slots = ['Q', 'W', 'E', 'R'];
  const displayed = skills.slice(0, 4);

  // Pad to 4 if fewer skills
  while (displayed.length < 4) displayed.push(null);

  displayed.forEach((skill, i) => {
    const slotKey = slots[i];
    const card = document.createElement('div');
    card.className = 'hv-skill-card';
    card.dataset.skillIdx = i;

    if (!skill) {
      card.innerHTML = `
        <div class="hv-skill-slot">${slotKey}</div>
        <div class="hv-skill-name">—</div>
      `;
      grid.appendChild(card);
      return;
    }

    const manaCost = skill.manaCostByLevel?.[0] ?? 0;
    const cooldown  = skill.cooldownByLevel?.[0] ?? 0;
    const type      = skill.skillType ?? 'active';

    const typeBadgeColor = {
      active:  '#44aaff',
      passive: '#888',
      toggle:  '#ffaa44',
      channel: '#ff4444',
    }[type] ?? '#44aaff';

    card.innerHTML = `
      <div class="hv-skill-slot">${slotKey}</div>
      <div class="hv-skill-name">${skill.name ?? '?'}</div>
      <div class="hv-skill-type-badge" style="color:${typeBadgeColor}">${type.toUpperCase()}</div>
      <div class="hv-skill-meta">
        ${manaCost > 0 ? `<span class="hv-mana">💧${manaCost}</span>` : ''}
        ${cooldown > 0  ? `<span class="hv-cd">⏱${cooldown}s</span>` : ''}
      </div>
    `;

    // Click to expand detail
    card.addEventListener('click', () => _showSkillDetail(skill, slotKey, card));
    grid.appendChild(card);
  });
}

// ── _showSkillDetail ──────────────────────────────────────────
function _showSkillDetail(skill, slotKey, cardEl) {
  // Remove any existing detail overlay
  const existing = document.querySelector('.hv-skill-detail');
  if (existing) existing.remove();

  if (_selectedSkillIdx === skill) {
    _selectedSkillIdx = null;
    return;
  }
  _selectedSkillIdx = skill;

  const detail = document.createElement('div');
  detail.className = 'hv-skill-detail';

  const manaCosts = (skill.manaCostByLevel ?? [0]).join(' / ');
  const cooldowns  = (skill.cooldownByLevel  ?? [0]).join(' / ');
  const ranges    = (skill.castRangeByLevel  ?? [0]).join(' / ');

  detail.innerHTML = `
    <div class="hv-detail-header">
      <strong>[${slotKey}] ${skill.name ?? '?'}</strong>
      <button class="hv-detail-close">✕</button>
    </div>
    <div class="hv-detail-type">${(skill.skillType ?? 'active').toUpperCase()} — ${skill.castType ?? '—'}</div>
    <div class="hv-detail-desc">${skill.description ?? ''}</div>
    <div class="hv-detail-stats">
      <span>Mana: ${manaCosts}</span>
      <span>CD: ${cooldowns}s</span>
      <span>Range: ${ranges}</span>
    </div>
  `;

  detail.querySelector('.hv-detail-close').addEventListener('click', () => {
    detail.remove();
    _selectedSkillIdx = null;
  });

  // Position below the card
  const grid = document.getElementById('hv-skill-grid');
  if (grid) {
    grid.appendChild(detail);
  } else {
    cardEl.parentElement.appendChild(detail);
  }
}

// ── _highlightPortrait ────────────────────────────────────────
function _highlightPortrait(id) {
  const strip = document.getElementById('hv-portrait-strip');
  if (!strip) return;
  strip.querySelectorAll('.hv-portrait').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.heroId === id);
  });
}

// ── _updateCameraFromSpherical ────────────────────────────────
function _updateCameraFromSpherical() {
  if (!_camera) return;
  const r    = _cameraRadius;
  const phi  = _cameraPhi;
  const theta = _cameraTheta;
  _camera.position.set(
    r * Math.sin(theta) * Math.cos(phi),
    r * Math.sin(phi) + 1.0,   // look slightly up at model center
    r * Math.cos(theta) * Math.cos(phi)
  );
  _camera.lookAt(0, 1.0, 0);
}

// ── _startRenderLoop ──────────────────────────────────────────
function _startRenderLoop() {
  if (_rafId) cancelAnimationFrame(_rafId);

  function loop(now) {
    _rafId = requestAnimationFrame(loop);

    const dt = Math.min((now - (_clock.prev || now)) / 1000, 0.1);
    _clock.prev = now;
    _animTime  += dt;

    // Auto rotate
    if (_autoRotate) {
      _cameraTheta += dt * 0.4;
      _updateCameraFromSpherical();
    }

    // Handle window resize
    _handleResize();

    // Animate current model
    if (_currentModel) {
      _animateViewerModel(_currentModel, dt, _animTime);
    }

    if (_renderer && _scene && _camera) {
      _renderer.render(_scene, _camera);
    }
  }

  _rafId = requestAnimationFrame(loop);
}

// ── _animateViewerModel ───────────────────────────────────────
// Drives animation on the preview model using the same logic as animations.js
// but standalone (no import to avoid cycles).
function _animateViewerModel(group, dt, t) {
  if (!group.state) group.state = {};
  group.state._animAge = (group.state._animAge ?? 0) + dt;
  const age  = group.state._animAge;
  const anim = _animState;

  // Collect named parts
  const parts = { body: null, head: null, armL: null, armR: null, legL: null, legR: null, weapon: null };
  group.traverse(child => {
    if (child === group) return;
    const n = child.name;
    if (n && Object.prototype.hasOwnProperty.call(parts, n)) parts[n] = child;
  });

  switch (anim) {
    case 'idle':   _pvIdle(parts, group, t);        break;
    case 'walk':   _pvWalk(parts, group, t);        break;
    case 'attack': _pvAttack(parts, group, t, age); break;
    case 'cast':   _pvCast(parts, group, t, age);   break;
    case 'die':    _pvDie(parts, group, age);        break;
    default:       _pvIdle(parts, group, t);        break;
  }
}

function _pvGetBaseY(group) {
  if (group.userData._baseY === undefined) group.userData._baseY = group.position.y;
  return group.userData._baseY;
}

function _pvIdle(parts, group, t) {
  const by = _pvGetBaseY(group);
  group.position.y = by + Math.sin(t * 1.5) * 0.04;
  if (parts.body)   { parts.body.rotation.z = Math.sin(t * 1.2) * 0.02; parts.body.rotation.x = 0; }
  if (parts.head)   { parts.head.rotation.y = Math.sin(t * 0.7) * 0.08; parts.head.rotation.x = 0; }
  if (parts.armL)   { parts.armL.rotation.x = Math.sin(t * 1.3 + 0.5) * 0.06; parts.armL.rotation.z =  0.1; }
  if (parts.armR)   { parts.armR.rotation.x = Math.sin(t * 1.3) * 0.06; parts.armR.rotation.z = -0.1; }
  if (parts.legL)   parts.legL.rotation.x = 0;
  if (parts.legR)   parts.legR.rotation.x = 0;
  if (parts.weapon) { parts.weapon.rotation.x = 0; parts.weapon.rotation.z = 0; }
}

function _pvWalk(parts, group, t) {
  const by = _pvGetBaseY(group);
  const freq = 4.5;
  group.position.y = by + Math.abs(Math.sin(t * freq)) * 0.055;
  if (parts.body)   { parts.body.rotation.x =  0.08; parts.body.rotation.z = Math.sin(t * freq * 0.5) * 0.03; }
  if (parts.head)   { parts.head.rotation.x = -0.05; parts.head.rotation.y = 0; }
  if (parts.legL)   parts.legL.rotation.x =  Math.sin(t * freq) * 0.55;
  if (parts.legR)   parts.legR.rotation.x = -Math.sin(t * freq) * 0.55;
  if (parts.armL)   { parts.armL.rotation.x = -Math.sin(t * freq) * 0.38; parts.armL.rotation.z =  0.12; }
  if (parts.armR)   { parts.armR.rotation.x =  Math.sin(t * freq) * 0.38; parts.armR.rotation.z = -0.12; }
  if (parts.weapon) parts.weapon.rotation.x =  Math.sin(t * freq) * 0.19;
}

function _pvAttack(parts, group, _t, age) {
  const CYCLE = 0.5 / (_attackSpeedOverride / 100);
  const phase = (age % CYCLE) / CYCLE;
  let lunge = 0, armFwd = 0;
  if (phase < 0.35)      { lunge = -phase / 0.35 * 0.06;       armFwd = -phase / 0.35 * 0.4; }
  else if (phase < 0.65) { const sp = (phase - 0.35) / 0.3;    lunge = sp * 0.12;  armFwd = sp * 1.1; }
  else                   { const sp = (phase - 0.65) / 0.35;   lunge = 0.12 * (1 - sp); armFwd = 1.1 * (1 - sp); }

  const by = _pvGetBaseY(group);
  group.position.y = by;
  if (parts.body)   { parts.body.rotation.x = lunge; parts.body.rotation.z = -0.06; }
  if (parts.armR)   { parts.armR.rotation.x = armFwd; parts.armR.rotation.z = -0.05; }
  if (parts.armL)   { parts.armL.rotation.x = -armFwd * 0.3; parts.armL.rotation.z = 0.15; }
  if (parts.weapon) { parts.weapon.rotation.x = armFwd * 0.8; parts.weapon.rotation.z = armFwd * 0.15; }
  if (parts.legL)   parts.legL.rotation.x =  lunge * 0.4;
  if (parts.legR)   parts.legR.rotation.x = -lunge * 0.6;
}

function _pvCast(parts, group, t, age) {
  const raiseT = Math.min(age / 0.2, 1.0);
  const armAngle = -1.1 * raiseT + Math.sin(t * 3.0) * 0.08 * raiseT;
  const by = _pvGetBaseY(group);
  group.position.y = by + Math.sin(t * 2.0) * 0.03;
  if (parts.body)   { parts.body.rotation.x = 0.12 * raiseT; parts.body.rotation.z = 0; }
  if (parts.armL)   { parts.armL.rotation.x = armAngle; parts.armL.rotation.z =  0.25 * raiseT; }
  if (parts.armR)   { parts.armR.rotation.x = armAngle; parts.armR.rotation.z = -0.25 * raiseT; }
  if (parts.weapon) { parts.weapon.rotation.x = armAngle * 0.6; parts.weapon.rotation.z = Math.sin(t * 4) * 0.1; }
}

function _pvDie(_parts, group, age) {
  if (group.userData._dieComplete) return;
  const prog = Math.min(age / 1.2, 1.0);
  group.rotation.x = prog * Math.PI / 2 * 1.05;
  group.position.y = (_pvGetBaseY(group)) - prog * 0.8;
  if (prog >= 1.0) { group.userData._dieComplete = true; group.visible = false; }
}

// ── _handleResize ─────────────────────────────────────────────
function _handleResize() {
  const canvas = document.getElementById('hv-hero-canvas');
  if (!canvas || !_renderer || !_camera) return;

  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w === 0 || h === 0) return;

  if (_renderer.domElement.width !== w || _renderer.domElement.height !== h) {
    _renderer.setSize(w, h, false);
    _camera.aspect = w / h;
    _camera.updateProjectionMatrix();
  }
}

// ── stopHeroViewer ────────────────────────────────────────────
export function stopHeroViewer() {
  if (_rafId) {
    cancelAnimationFrame(_rafId);
    _rafId = null;
  }
}
