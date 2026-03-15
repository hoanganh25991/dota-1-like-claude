// ============================================================
// animations.js — Hero animation system for Crimson Lane
// Drives leg/arm/body movement based on hero animation state.
// THREE is a global loaded via CDN script tag.
// ============================================================

// ── Animation state names ─────────────────────────────────────
export const ANIM = {
  IDLE:   'idle',
  WALK:   'walk',
  ATTACK: 'attack',
  DIE:    'die',
  CAST:   'cast',
  STUN:   'stun',
};

// ── setAnim ───────────────────────────────────────────────────
// Change the animation state of a hero unit. Stores previous anim
// for transition logic. Resets phase timer on state change.
export function setAnim(heroUnit, anim) {
  if (!heroUnit.state) heroUnit.state = {};
  if (heroUnit.state.anim === anim) return; // no-op if already in this state
  heroUnit.state._prevAnim = heroUnit.state.anim;
  heroUnit.state.anim      = anim;
  heroUnit.state._animAge  = 0; // time in current anim state
}

// ── faceDirection ─────────────────────────────────────────────
// Rotate the hero group to face a movement or attack direction.
export function faceDirection(heroUnit, dx, dz) {
  if (!heroUnit.group) return;
  if (Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01) {
    const targetY = Math.atan2(dx, dz);
    // Smooth rotation toward target angle
    const cur = heroUnit.group.rotation.y;
    let delta = targetY - cur;
    // Wrap to [-π, π]
    while (delta >  Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    heroUnit.group.rotation.y += delta * 0.25;
  }
}

// ── animateHero ───────────────────────────────────────────────
// Master animation driver. Call each frame.
// heroUnit = { group: THREE.Group, state: {anim, facing, _prevAnim, _animAge}, def: heroStats }
export function animateHero(heroUnit, dt, t) {
  if (!heroUnit || !heroUnit.group) return;
  if (!heroUnit.state) heroUnit.state = {};

  // Advance animation age
  heroUnit.state._animAge = (heroUnit.state._animAge || 0) + dt;
  const age = heroUnit.state._animAge;

  const anim = heroUnit.state.anim || ANIM.IDLE;
  const group = heroUnit.group;

  // Grab named part sub-groups from hero model (set during buildModel)
  const parts = _getParts(group);

  switch (anim) {
    case ANIM.IDLE:   _animIdle(parts, group, t, age);   break;
    case ANIM.WALK:   _animWalk(parts, group, t, age);   break;
    case ANIM.ATTACK: _animAttack(parts, group, t, age); break;
    case ANIM.CAST:   _animCast(parts, group, t, age);   break;
    case ANIM.DIE:    _animDie(parts, group, t, age);    break;
    case ANIM.STUN:   _animStun(parts, group, t, age);   break;
    default:          _animIdle(parts, group, t, age);   break;
  }
}

// ── _getParts ─────────────────────────────────────────────────
// Extract named child groups from hero THREE.Group.
// Hero models built in hero-models.js name their children via
// child.name = 'body' | 'head' | 'armL' | 'armR' | 'legL' | 'legR' | 'weapon'
function _getParts(group) {
  const parts = {
    body:   null,
    head:   null,
    armL:   null,
    armR:   null,
    legL:   null,
    legR:   null,
    weapon: null,
  };
  group.traverse(child => {
    if (child === group) return;
    const n = child.name;
    if (n && parts.hasOwnProperty(n)) {
      parts[n] = child;
    }
  });
  return parts;
}

// ── _baseY ────────────────────────────────────────────────────
// Each hero group rests at y=0 (getGroundY). We store the original
// y on first call so we can restore it.
function _getBaseY(group) {
  if (group.userData._baseY === undefined) {
    group.userData._baseY = group.position.y;
  }
  return group.userData._baseY;
}

// ── _animIdle ────────────────────────────────────────────────
function _animIdle(parts, group, t, _age) {
  // Gentle body bob
  const baseY = _getBaseY(group);
  group.position.y = baseY + Math.sin(t * 1.5) * 0.04;

  // Subtle body sway
  if (parts.body) {
    parts.body.rotation.z = Math.sin(t * 1.2) * 0.02;
    parts.body.rotation.x = 0;
  }
  // Head slight look-around
  if (parts.head) {
    parts.head.rotation.y = Math.sin(t * 0.7) * 0.08;
    parts.head.rotation.x = 0;
  }
  // Arms hang with subtle swing
  if (parts.armL) {
    parts.armL.rotation.x = Math.sin(t * 1.3 + 0.5) * 0.06;
    parts.armL.rotation.z =  0.1;
  }
  if (parts.armR) {
    parts.armR.rotation.x = Math.sin(t * 1.3) * 0.06;
    parts.armR.rotation.z = -0.1;
  }
  // Legs relaxed
  if (parts.legL) parts.legL.rotation.x = 0.0;
  if (parts.legR) parts.legR.rotation.x = 0.0;
  // Weapon at rest
  if (parts.weapon) {
    parts.weapon.rotation.x = 0;
    parts.weapon.rotation.z = 0;
  }
}

// ── _animWalk ─────────────────────────────────────────────────
function _animWalk(parts, group, t, _age) {
  const walkFreq  = 4.5;
  const legSwing  = 0.55;
  const armSwing  = 0.38;

  // Slight body bob while walking
  const baseY = _getBaseY(group);
  group.position.y = baseY + Math.abs(Math.sin(t * walkFreq)) * 0.055;

  // Body lean forward slightly
  if (parts.body) {
    parts.body.rotation.x =  0.08;
    parts.body.rotation.z = Math.sin(t * walkFreq * 0.5) * 0.03;
  }
  // Head remains relatively stable
  if (parts.head) {
    parts.head.rotation.x = -0.05;
    parts.head.rotation.y = 0;
  }
  // Legs alternate fore/aft swing
  if (parts.legL) parts.legL.rotation.x =  Math.sin(t * walkFreq) * legSwing;
  if (parts.legR) parts.legR.rotation.x = -Math.sin(t * walkFreq) * legSwing;

  // Arms swing opposite to legs
  if (parts.armL) {
    parts.armL.rotation.x = -Math.sin(t * walkFreq) * armSwing;
    parts.armL.rotation.z =  0.12;
  }
  if (parts.armR) {
    parts.armR.rotation.x =  Math.sin(t * walkFreq) * armSwing;
    parts.armR.rotation.z = -0.12;
  }

  // Weapon follows arm R
  if (parts.weapon) {
    parts.weapon.rotation.x = Math.sin(t * walkFreq) * armSwing * 0.5;
  }
}

// ── _animAttack ───────────────────────────────────────────────
// Attack is a quick lunge forward then return over ~0.4s cycle.
function _animAttack(parts, group, _t, age) {
  const CYCLE = 0.5;
  const phase = (age % CYCLE) / CYCLE; // 0..1 within one swing

  // Wind up (0..0.35), follow-through (0.35..0.65), return (0.65..1)
  let lunge = 0;
  let armFwd = 0;
  if (phase < 0.35) {
    // Wind back
    lunge  = -phase / 0.35 * 0.06;
    armFwd = -phase / 0.35 * 0.4;
  } else if (phase < 0.65) {
    // Strike
    const sp = (phase - 0.35) / 0.3;
    lunge  =  sp * 0.12;
    armFwd =  sp * 1.1;
  } else {
    // Return
    const sp = (phase - 0.65) / 0.35;
    lunge  = 0.12 * (1 - sp);
    armFwd = 1.1  * (1 - sp);
  }

  const baseY = _getBaseY(group);
  group.position.y = baseY;

  if (parts.body) {
    parts.body.rotation.x =  lunge;
    parts.body.rotation.z = -0.06;
  }
  if (parts.head) {
    parts.head.rotation.x = -lunge * 0.5;
    parts.head.rotation.y =  0;
  }
  // Attack arm (right) lunges forward
  if (parts.armR) {
    parts.armR.rotation.x =  armFwd;
    parts.armR.rotation.z = -0.05;
  }
  // Off-hand stays relatively back
  if (parts.armL) {
    parts.armL.rotation.x = -armFwd * 0.3;
    parts.armL.rotation.z =  0.15;
  }
  if (parts.legL) parts.legL.rotation.x =  lunge * 0.4;
  if (parts.legR) parts.legR.rotation.x = -lunge * 0.6;

  if (parts.weapon) {
    parts.weapon.rotation.x = armFwd * 0.8;
    parts.weapon.rotation.z = armFwd * 0.15;
  }
}

// ── _animCast ─────────────────────────────────────────────────
// Both arms raise, slight lean forward, held for cast duration.
function _animCast(parts, group, t, age) {
  const RAISE_TIME = 0.2;
  const raiseT = Math.min(age / RAISE_TIME, 1.0); // 0..1 ramp up

  // Hold pose then gently pulse
  const armAngle = -1.1 * raiseT + Math.sin(t * 3.0) * 0.08 * raiseT;
  const lean     = 0.12 * raiseT;

  const baseY = _getBaseY(group);
  group.position.y = baseY + Math.sin(t * 2.0) * 0.03;

  if (parts.body) {
    parts.body.rotation.x = lean;
    parts.body.rotation.z = 0;
  }
  if (parts.head) {
    parts.head.rotation.x = -lean * 0.4;
    parts.head.rotation.y = Math.sin(t * 1.5) * 0.06;
  }
  if (parts.armL) {
    parts.armL.rotation.x = armAngle;
    parts.armL.rotation.z =  0.25 * raiseT;
  }
  if (parts.armR) {
    parts.armR.rotation.x = armAngle;
    parts.armR.rotation.z = -0.25 * raiseT;
  }
  if (parts.legL) parts.legL.rotation.x =  0.05;
  if (parts.legR) parts.legR.rotation.x = -0.05;

  if (parts.weapon) {
    parts.weapon.rotation.x = armAngle * 0.6;
    parts.weapon.rotation.z = Math.sin(t * 4.0) * 0.1;
  }
}

// ── _animDie ─────────────────────────────────────────────────
// Hero tips forward and sinks into the ground over ~1.2s.
// Once finished the group is invisible (scale 0 / hidden).
function _animDie(_parts, group, _t, age) {
  // Prevent animation overwrite once completed
  if (group.userData._dieComplete) return;

  const DIE_DURATION = 1.2;
  const progress = Math.min(age / DIE_DURATION, 1.0);

  // Tip forward (rotate group on x axis)
  const tipAngle = progress * (Math.PI / 2) * 1.05; // just past horizontal
  group.rotation.x = tipAngle;

  // Sink into ground as we tip
  const baseY = _getBaseY(group);
  group.position.y = baseY - progress * 0.8;

  // Fade emissive out on all meshes (no opacity — avoid transparency sorting issues)
  group.traverse(child => {
    if (child.isMesh && child.material && child.material.emissiveIntensity !== undefined) {
      child.material.emissiveIntensity = Math.max(0, child.material.emissiveIntensity - 0.015);
    }
  });

  if (progress >= 1.0) {
    group.userData._dieComplete = true;
    group.visible = false;
  }
}

// ── _animStun ─────────────────────────────────────────────────
// Hero staggers/shakes in place while stunned.
function _animStun(parts, group, t, _age) {
  const baseY = _getBaseY(group);
  // Rapid small shake
  group.position.y = baseY + Math.sin(t * 18) * 0.06;
  group.position.x += Math.sin(t * 22 + 1.1) * 0.005;
  group.position.z += Math.cos(t * 20 + 0.5) * 0.005;

  if (parts.body) {
    parts.body.rotation.x = Math.sin(t * 15) * 0.1;
    parts.body.rotation.z = Math.sin(t * 13) * 0.08;
  }
  if (parts.head) {
    parts.head.rotation.z = Math.sin(t * 12) * 0.15;
  }
  if (parts.armL) parts.armL.rotation.x = Math.sin(t * 10) * 0.2;
  if (parts.armR) parts.armR.rotation.x = Math.cos(t * 10) * 0.2;
}

// ── resetHeroPose ─────────────────────────────────────────────
// Snap all parts back to default pose (use on respawn).
export function resetHeroPose(heroUnit) {
  if (!heroUnit || !heroUnit.group) return;
  const group = heroUnit.group;

  group.rotation.set(0, group.rotation.y, 0);
  group.visible = true;
  group.userData._dieComplete = false;

  const baseY = _getBaseY(group);
  group.position.y = baseY;

  const parts = _getParts(group);
  for (const part of Object.values(parts)) {
    if (part) {
      part.rotation.set(0, 0, 0);
    }
  }

  if (heroUnit.state) {
    heroUnit.state.anim     = ANIM.IDLE;
    heroUnit.state._prevAnim = null;
    heroUnit.state._animAge  = 0;
  }
}

// ── animateCreep ──────────────────────────────────────────────
// Simplified version of hero animation for creep units.
// Creep groups may have fewer named parts.
export function animateCreep(creepUnit, dt, t) {
  if (!creepUnit || !creepUnit.group) return;
  const group = creepUnit.group;
  const anim  = creepUnit.state?.anim || ANIM.WALK;
  const parts = _getParts(group);

  switch (anim) {
    case ANIM.IDLE:
      _animIdle(parts, group, t, creepUnit.state?._animAge || 0);
      break;
    case ANIM.WALK:
      _animWalk(parts, group, t, creepUnit.state?._animAge || 0);
      break;
    case ANIM.ATTACK:
      _animAttack(parts, group, t, creepUnit.state?._animAge || 0);
      break;
    case ANIM.DIE:
      _animDie(parts, group, t, creepUnit.state?._animAge || 0);
      break;
    default:
      _animWalk(parts, group, t, 0);
  }

  if (creepUnit.state) {
    creepUnit.state._animAge = (creepUnit.state._animAge || 0) + dt;
  }
}

// ── animateTower ──────────────────────────────────────────────
// Towers have a simple "aim" animation — top cap rotates to face target.
export function animateTower(towerGroup, targetPos, dt) {
  if (!towerGroup) return;
  if (!targetPos) {
    // Idle — slow spin
    towerGroup.rotation.y += dt * 0.4;
    return;
  }

  const dx = targetPos.x - towerGroup.position.x;
  const dz = targetPos.z - towerGroup.position.z;
  const targetY = Math.atan2(dx, dz);
  let delta = targetY - towerGroup.rotation.y;
  while (delta >  Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  towerGroup.rotation.y += delta * Math.min(dt * 5.0, 1.0);
}
