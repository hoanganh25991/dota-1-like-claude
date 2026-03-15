// ============================================================
// skills.js — Skill casting pipeline for Crimson Lane
// ============================================================

import { G } from './state.js';
import { applyDamage, applyStatusEffect } from './combat.js';
import { spawnProjectile, spawnRing, spawnBurst, fxFrostNova, fxFireball, spawnDamageFloat } from './particles.js';
import { playSFX } from './audio.js';
import { setAnim } from './animations.js';

// ── Helpers ───────────────────────────────────────────────────
function _getLevelIndex(skill) {
  // level 1-4 → index 0-3
  return Math.max(0, (skill.level ?? 1) - 1);
}

function _getByLevel(arr, idx) {
  if (!arr) return 0;
  return arr[Math.min(idx, arr.length - 1)] ?? 0;
}

// ── Cast pipeline ─────────────────────────────────────────────
export function castSkill(caster, slotKey, _castMode, targetPos, targetUnit) {
  if (!caster || !caster.alive) return { success: false, reason: 'caster_invalid' };

  // 1. Get skill def
  const skill = caster.skills?.[slotKey];
  if (!skill) return { success: false, reason: 'no_skill' };

  // Passive/no-target skills can't be manually activated
  if (skill.skillType === 'passive') return { success: false, reason: 'passive_skill' };

  // 2. Check skill level
  if ((skill.level ?? 0) < 1) return { success: false, reason: 'skill_not_learned' };

  // 3. Check cooldown
  if ((skill.cdRemaining ?? 0) > 0) return { success: false, reason: 'on_cooldown' };

  // 4. Check stun/silence
  if (caster.stunned) return { success: false, reason: 'stunned' };
  if (caster.silenced && slotKey !== 'R') return { success: false, reason: 'silenced' };

  const lvlIdx = _getLevelIndex(skill);

  const def = skill.def ?? skill;
  const manaCost = _getByLevel(def.manaCostByLevel, lvlIdx);
  const cooldown  = _getByLevel(def.cooldownByLevel, lvlIdx);
  const castRange = _getByLevel(def.castRangeByLevel, lvlIdx);

  // 5. Check mana
  if (caster.mp < manaCost) return { success: false, reason: 'no_mana' };

  // 6. Range check (skip for self / global / no-target skills)
  const castType = def.castType ?? skill.castType;
  if (castType !== 'self' && castType !== 'self-radius' && castType !== 'no-target' &&
      castType !== 'global' && castRange > 0) {
    const checkPos = targetUnit
      ? { position: targetUnit.group?.position ?? targetUnit.position }
      : { position: targetPos };
    const casterPos = { position: caster.group?.position ?? caster.position ?? { x: 0, z: 0 } };

    if (checkPos.position && casterPos.position) {
      const dx = casterPos.position.x - checkPos.position.x;
      const dz = casterPos.position.z - checkPos.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      // castRange from skill def is in world units (same coordinate space)
      if (dist > castRange) return { success: false, reason: 'out_of_range' };
    }
  }

  // 7. Spend mana, start cooldown
  caster.mp = Math.max(0, caster.mp - manaCost);
  skill.cdRemaining = cooldown;

  // 8. Execute skill effect
  executeSkillEffect(caster, skill, targetPos, targetUnit);

  // 9. Set cast animation
  setAnim(caster, 'cast');
  // Return to idle after cast animation window
  setTimeout(() => {
    if (caster.alive && caster.state?.anim === 'cast') setAnim(caster, 'idle');
  }, 600);

  // 10. Emit event
  window.dispatchEvent(new CustomEvent('skillCast', {
    detail: { caster, skill, slotKey, targetPos, targetUnit },
  }));

  return { success: true };
}

// ── Update cooldowns ──────────────────────────────────────────
export function updateSkillCooldowns(hero, dt) {
  if (!hero || !hero.skills) return;
  for (const slot of ['Q', 'W', 'E', 'R']) {
    const skill = hero.skills[slot];
    if (skill && skill.cdRemaining > 0) {
      skill.cdRemaining = Math.max(0, skill.cdRemaining - dt);
    }
  }
}

// ── Learn skill ───────────────────────────────────────────────
export function learnSkill(hero, slotKey) {
  if (!canLearnSkill(hero, slotKey)) return false;

  const skill = hero.skills?.[slotKey];
  if (!skill) return false;

  skill.level = (skill.level ?? 0) + 1;
  hero.skillPoints = (hero.skillPoints ?? 0) - 1;

  window.dispatchEvent(new CustomEvent('skillLearned', {
    detail: { hero, slotKey, level: skill.level },
  }));

  return true;
}

export function canLearnSkill(hero, slotKey) {
  if ((hero.skillPoints ?? 0) < 1) return false;

  const skill = hero.skills?.[slotKey];
  if (!skill) return false;

  const maxLevel = slotKey === 'R' ? 3 : 4;
  if ((skill.level ?? 0) >= maxLevel) return false;

  // Level gate for R: learnable at hero levels 6, 11, 16
  if (slotKey === 'R') {
    const heroLevel = hero.level ?? 1;
    const currentRLevel = skill.level ?? 0;
    const requiredHeroLevels = [6, 11, 16];
    if (heroLevel < (requiredHeroLevels[currentRLevel] ?? 999)) return false;
  }

  return true;
}

// ── Skill execution dispatch ──────────────────────────────────
export function executeSkillEffect(caster, skill, targetPos, targetUnit) {
  const id = skill.id ?? skill.def?.id;
  switch (id) {
    case 'frostNova':       return _frostNova(caster, skill, targetPos);
    case 'iceArmor':        return _iceArmor(caster, skill, targetUnit);
    case 'sacrifice':       return _sacrifice(caster, skill, targetUnit);
    case 'chainFrost':      return _chainFrost(caster, skill, targetUnit);
    case 'shrapnel':        return _shrapnel(caster, skill, targetPos);
    case 'assassinate':     return _assassinate(caster, skill, targetUnit);
    case 'dragonTail':      return _dragonTail(caster, skill, targetUnit);
    case 'dragonForm':      return _dragonForm(caster, skill);
    case 'breatheFire':     return _breathFire(caster, skill, targetPos);
    case 'breathFire':      return _breathFire(caster, skill, targetPos);
    case 'shadowrazeNear':  return _shadowraze(caster, skill, 200);
    case 'shadowrazeMid':   return _shadowraze(caster, skill, 450);
    case 'requiemOfSouls':  return _requiem(caster, skill);
    case 'requiem':         return _requiem(caster, skill);
    case 'shackleshot':     return _shackleshot(caster, skill, targetPos);
    case 'powershot':       return _powershot(caster, skill, targetPos);
    case 'windrun':         return _windrun(caster, skill);
    case 'focusFire':       return _focusFire(caster, skill, targetUnit);
    default:                return _genericSkillEffect(caster, skill, targetPos, targetUnit);
  }
}

// ── Target resolver ───────────────────────────────────────────
export function resolveTargetFromPos(caster, targetPos, targetRule, _range) {
  if (!targetPos) return null;

  const casterTeam = caster.team;
  const allUnits = [...G.heroes, ...G.creeps];

  let best = null;
  let bestDist = Infinity;

  for (const unit of allUnits) {
    if (!unit.alive) continue;
    if (unit === caster) continue;

    // Apply target rule
    if (targetRule === 'enemy' && unit.team === casterTeam) continue;
    if (targetRule === 'ally'  && unit.team !== casterTeam) continue;

    const uPos = unit.group?.position ?? unit.position;
    if (!uPos) continue;

    const dx = uPos.x - targetPos.x;
    const dz = uPos.z - targetPos.z;
    const d  = Math.sqrt(dx * dx + dz * dz);

    if (d <= 7 && d < bestDist) {
      bestDist = d;
      best = unit;
    }
  }

  return best;
}

// ── Lich skills ───────────────────────────────────────────────

function _frostNova(caster, skill, targetPos) {
  const lvlIdx = _getLevelIndex(skill);
  const def = skill.def ?? skill;
  const damage      = _getByLevel(def.effectValuesByLevel?.damage,      lvlIdx);
  const aoeRadius   = _getByLevel(def.effectValuesByLevel?.aoeRadius,   lvlIdx) / 100; // convert to world units
  const slowPct     = _getByLevel(def.effectValuesByLevel?.slowPct,     lvlIdx);
  const slowDur     = _getByLevel(def.effectValuesByLevel?.slowDuration, lvlIdx);

  const pos = targetPos ?? caster.group?.position ?? { x: 0, z: 0 };

  // VFX
  fxFrostNova(pos);
  try { playSFX('frostNova'); } catch (_) {}

  // Hit all enemies in radius
  const enemies = _getEnemiesInRadius(caster, pos, aoeRadius || 4);
  for (const enemy of enemies) {
    applyDamage(enemy, damage, 'magical', caster);
    applyStatusEffect(enemy, { type: 'slow', duration: slowDur, value: slowPct });
  }
}

function _iceArmor(caster, skill, targetUnit) {
  const lvlIdx = _getLevelIndex(skill);
  const def = skill.def ?? skill;
  const armorBonus = _getByLevel(def.effectValuesByLevel?.armorBonus, lvlIdx);
  const duration   = _getByLevel(def.effectValuesByLevel?.duration,   lvlIdx);

  const target = targetUnit ?? caster;
  if (!target) return;

  // Apply armor buff
  target.armorBuff = (target.armorBuff ?? 0) + armorBonus;
  target.effectiveArmor = (target.effectiveArmor ?? 0) + armorBonus;

  // Schedule removal
  setTimeout(() => {
    target.armorBuff = Math.max(0, (target.armorBuff ?? 0) - armorBonus);
    target.effectiveArmor = Math.max(0, (target.effectiveArmor ?? 0) - armorBonus);
  }, duration * 1000);

  spawnRing(target.group?.position ?? { x: 0, y: 0, z: 0 }, 0x00ccff, 2, 0.6);
  try { playSFX('iceArmor'); } catch (_) {}
}

function _sacrifice(caster, skill, targetUnit) {
  const lvlIdx = _getLevelIndex(skill);
  const def = skill.def ?? skill;
  const manaGainPct = _getByLevel(def.effectValuesByLevel?.manaGainPct, lvlIdx);

  // targetUnit must be an allied creep
  if (!targetUnit || targetUnit.type === 'hero') return;
  if (targetUnit.team !== caster.team) return;

  const manaGain = Math.floor((targetUnit.hp ?? 0) * manaGainPct);
  const maxMp = caster.effectiveMaxMp ?? caster.def?.maxMp ?? 300;
  caster.mp = Math.min(maxMp, caster.mp + manaGain);

  // Kill the creep (denied, no gold to enemy)
  targetUnit.hp = 0;
  targetUnit.alive = false;

  if (targetUnit.group) {
    spawnBurst(targetUnit.group.position, 0x00ffcc, 6, 4);
  }

  window.dispatchEvent(new CustomEvent('unitDied', { detail: { unit: targetUnit, killer: caster } }));

  spawnDamageFloat(
    caster.group?.position ?? { x: 0, y: 1, z: 0 },
    manaGain, '#44aaff'
  );
  try { playSFX('sacrifice'); } catch (_) {}
}

function _chainFrost(caster, skill, targetUnit) {
  const lvlIdx = _getLevelIndex(skill);
  const def = skill.def ?? skill;
  const damage        = _getByLevel(def.effectValuesByLevel?.damagePerBounce, lvlIdx);
  const maxBounces    = _getByLevel(def.effectValuesByLevel?.maxBounces,       lvlIdx);
  const bounceRadius  = _getByLevel(def.effectValuesByLevel?.bounceRadius,     lvlIdx) / 100;
  const slowPct       = _getByLevel(def.effectValuesByLevel?.slowPct,          lvlIdx);
  const slowDur       = _getByLevel(def.effectValuesByLevel?.slowDuration,     lvlIdx);

  if (!targetUnit) return;

  try { playSFX('chainFrost'); } catch (_) {}

  // Bounce logic: track already-hit targets
  const hit = new Set();
  let currentTarget = targetUnit;
  let bounceCount = 0;

  function doBounce() {
    if (!currentTarget || bounceCount >= maxBounces) return;
    bounceCount++;
    hit.add(currentTarget);

    const fromPos = currentTarget.group?.position ?? { x: 0, y: 0, z: 0 };
    applyDamage(currentTarget, damage * (1 - bounceCount * 0.05), 'magical', caster);
    applyStatusEffect(currentTarget, { type: 'slow', duration: slowDur, value: slowPct });
    spawnRing(fromPos, 0x00ffcc, 2, 0.4);

    // Find next bounce target
    const enemies = _getEnemiesInRadius(caster, fromPos, bounceRadius || 7.5)
      .filter(e => !hit.has(e) && e !== caster);

    if (enemies.length === 0) return;

    const next = enemies[0];
    const toPos = next.group?.position ?? { x: 0, y: 0, z: 0 };

    spawnProjectile(fromPos, toPos, 0x00ffcc, 40, () => {
      currentTarget = next;
      doBounce();
    });
  }

  doBounce();
}

// ── Sniper skills ─────────────────────────────────────────────

function _shrapnel(caster, skill, targetPos) {
  const lvlIdx = _getLevelIndex(skill);
  const def = skill.def ?? skill;
  const dps       = _getByLevel(def.effectValuesByLevel?.damagePerSecond, lvlIdx);
  const aoeRadius = _getByLevel(def.effectValuesByLevel?.aoeRadius, lvlIdx) / 100;
  const slowPct   = _getByLevel(def.effectValuesByLevel?.slowPct, lvlIdx);
  const duration  = _getByLevel(def.effectValuesByLevel?.duration, lvlIdx);

  const pos = targetPos ?? caster.group?.position ?? { x: 0, z: 0 };

  spawnRing(pos, 0xaaaa00, aoeRadius || 4, 0.5);
  try { playSFX('shrapnel'); } catch (_) {}

  // Tick damage and slow for duration
  const TICK_RATE = 0.5; // damage every 0.5s
  let nextTick = TICK_RATE;

  // Register ticking zone in G.activeZones (simple array approach)
  if (!G.activeZones) G.activeZones = [];
  const zone = {
    pos, aoeRadius: aoeRadius || 4, dps, slowPct, duration, elapsed: 0, caster,
    update(dt) {
      this.elapsed += dt;
      nextTick -= dt;
      if (nextTick <= 0) {
        nextTick = TICK_RATE;
        const enemies = _getEnemiesInRadius(caster, pos, this.aoeRadius);
        for (const e of enemies) {
          applyDamage(e, dps * TICK_RATE, 'magical', caster);
          applyStatusEffect(e, { type: 'slow', duration: 1.0, value: slowPct });
        }
      }
      return this.elapsed >= this.duration;
    },
  };
  G.activeZones.push(zone);
}

function _assassinate(caster, skill, targetUnit) {
  const lvlIdx = _getLevelIndex(skill);
  const def = skill.def ?? skill;
  const damage  = _getByLevel(def.effectValuesByLevel?.damage,          lvlIdx);
  const channel = _getByLevel(def.effectValuesByLevel?.channelDuration,  lvlIdx);

  if (!targetUnit) return;

  caster.channeling = true;
  setAnim(caster, 'cast');
  try { playSFX('assassinateChannel'); } catch (_) {}

  setTimeout(() => {
    caster.channeling = false;
    if (!caster.alive || !targetUnit.alive) return;

    const fromPos = caster.group?.position ?? { x: 0, z: 0 };
    const toPos   = targetUnit.group?.position ?? { x: 0, z: 0 };

    spawnProjectile(fromPos, toPos, 0xff4400, 50, () => {
      if (targetUnit.alive) {
        applyDamage(targetUnit, damage, 'magical', caster);
        applyStatusEffect(targetUnit, { type: 'stun', duration: 0.5, value: 0 });
      }
    });
    try { playSFX('assassinate'); } catch (_) {}
  }, channel * 1000);
}

// ── Dragon Knight skills ──────────────────────────────────────

function _dragonTail(caster, skill, targetUnit) {
  const lvlIdx = _getLevelIndex(skill);
  const def = skill.def ?? skill;
  const stunDur = _getByLevel(def.effectValuesByLevel?.stunDuration, lvlIdx);
  const damage  = _getByLevel(def.effectValuesByLevel?.damage,       lvlIdx);

  if (!targetUnit) return;

  applyDamage(targetUnit, damage, 'physical', caster);
  applyStatusEffect(targetUnit, { type: 'stun', duration: stunDur, value: 0 });

  if (targetUnit.group) {
    spawnBurst(targetUnit.group.position, 0xff8800, 5, 4);
  }
  try { playSFX('dragonTail'); } catch (_) {}
}

function _dragonForm(caster, skill) {
  const lvlIdx = _getLevelIndex(skill);
  const def = skill.def ?? skill;
  const bonusDamage = _getByLevel(def.effectValuesByLevel?.bonusDamage, lvlIdx);
  const bonusRange  = _getByLevel(def.effectValuesByLevel?.bonusRange,  lvlIdx) / 100;
  const duration    = _getByLevel(def.effectValuesByLevel?.duration,    lvlIdx);

  caster.inDragonForm = true;
  caster.effectiveDamage = (caster.effectiveDamage ?? caster.def?.attackDamage ?? 50) + bonusDamage;
  caster.effectiveAttackRange = (caster.effectiveAttackRange ?? caster.def?.attackRange ?? 2) + bonusRange;

  spawnRing(caster.group?.position ?? { x: 0, y: 0, z: 0 }, 0xff4400, 3, 0.8);
  spawnBurst(caster.group?.position ?? { x: 0, y: 0, z: 0 }, 0xff6600, 10, 6);
  try { playSFX('dragonForm'); } catch (_) {}

  setTimeout(() => {
    caster.inDragonForm = false;
    caster.effectiveDamage = Math.max(0, (caster.effectiveDamage ?? 0) - bonusDamage);
    caster.effectiveAttackRange = Math.max(
      caster.def?.attackRange ?? 2,
      (caster.effectiveAttackRange ?? 0) - bonusRange
    );
  }, duration * 1000);
}

function _breathFire(caster, skill, targetPos) {
  const lvlIdx = _getLevelIndex(skill);
  const def = skill.def ?? skill;
  const damage     = _getByLevel(def.effectValuesByLevel?.damage,     lvlIdx);
  const coneAngle  = _getByLevel(def.effectValuesByLevel?.coneAngle,  lvlIdx); // degrees
  const coneLength = _getByLevel(def.effectValuesByLevel?.coneLength, lvlIdx) / 100; // world units

  const casterPos = caster.group?.position ?? { x: 0, y: 0, z: 0 };
  const tPos = targetPos ?? casterPos;

  fxFireball(tPos);
  try { playSFX('breathFire'); } catch (_) {}

  // Cone AoE: check angle from caster facing to enemy
  const dx = tPos.x - casterPos.x;
  const dz = tPos.z - casterPos.z;
  const faceAngle = Math.atan2(dx, dz);
  const halfCone  = (coneAngle / 2) * (Math.PI / 180);

  const allEnemies = _getEnemiesInRadius(caster, casterPos, coneLength || 5.5);
  for (const enemy of allEnemies) {
    const ePos = enemy.group?.position ?? enemy.position;
    if (!ePos) continue;
    const ex = ePos.x - casterPos.x;
    const ez = ePos.z - casterPos.z;
    const eAngle = Math.atan2(ex, ez);
    let angleDiff = Math.abs(faceAngle - eAngle);
    while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - Math.PI * 2);
    if (angleDiff <= halfCone) {
      applyDamage(enemy, damage, 'magical', caster);
    }
  }
}

// ── Shadow Fiend skills ───────────────────────────────────────

function _shadowraze(caster, skill, fixedDistance) {
  const lvlIdx = _getLevelIndex(skill);
  const def = skill.def ?? skill;
  const damage    = _getByLevel(def.effectValuesByLevel?.damage,    lvlIdx);
  const aoeRadius = _getByLevel(def.effectValuesByLevel?.aoeRadius, lvlIdx) / 100;

  const casterPos = caster.group?.position ?? { x: 0, y: 0, z: 0 };
  const facing = caster.group?.rotation.y ?? 0;

  // Position at fixed distance ahead of caster
  const razePos = {
    x: casterPos.x + Math.sin(facing) * (fixedDistance / 100),
    y: 0.1,
    z: casterPos.z + Math.cos(facing) * (fixedDistance / 100),
  };

  spawnRing(razePos, 0x880000, aoeRadius || 2.5, 0.5);
  spawnBurst(razePos, 0xff2200, 6, 4);
  try { playSFX('shadowraze'); } catch (_) {}

  const enemies = _getEnemiesInRadius(caster, razePos, aoeRadius || 2.5);
  for (const enemy of enemies) {
    applyDamage(enemy, damage, 'magical', caster);
  }

  // Necromastery soul gain on kill tracking (passive handled separately)
  // Add a soul for each kill done by raze
}

function _requiem(caster, skill) {
  const lvlIdx = _getLevelIndex(skill);
  const def = skill.def ?? skill;
  const damagePerSoul = _getByLevel(def.effectValuesByLevel?.damagePerSoul, lvlIdx);
  const aoeRadius     = _getByLevel(def.effectValuesByLevel?.aoeRadius,     lvlIdx) / 100;
  const slowPct       = _getByLevel(def.effectValuesByLevel?.slowPct,       lvlIdx);
  const slowDur       = _getByLevel(def.effectValuesByLevel?.slowDuration,   lvlIdx);

  const souls = caster.souls ?? 0;
  const totalDamage = souls * damagePerSoul;

  const casterPos = caster.group?.position ?? { x: 0, y: 0, z: 0 };

  spawnRing(casterPos, 0xff0000, aoeRadius || 10, 0.8);
  spawnBurst(casterPos, 0x880000, 12, 8);
  try { playSFX('requiem'); } catch (_) {}

  const enemies = _getEnemiesInRadius(caster, casterPos, aoeRadius || 10);
  for (const enemy of enemies) {
    applyDamage(enemy, totalDamage, 'magical', caster);
    applyStatusEffect(enemy, { type: 'slow', duration: slowDur, value: slowPct });
  }

  // Souls are consumed
  caster.souls = 0;
}

// ── Windrunner skills ─────────────────────────────────────────

function _shackleshot(caster, skill, targetPos) {
  const lvlIdx = _getLevelIndex(skill);
  const def = skill.def ?? skill;
  const stunDur = _getByLevel(def.effectValuesByLevel?.stunDuration, lvlIdx);

  const casterPos = caster.group?.position ?? { x: 0, y: 0, z: 0 };
  const tPos = targetPos ?? casterPos;

  // Find first enemy near targetPos
  const primaryTarget = resolveTargetFromPos(caster, tPos, 'enemy', 7);

  if (!primaryTarget) return;

  const toPos = primaryTarget.group?.position ?? primaryTarget.position ?? tPos;

  spawnProjectile(casterPos, toPos, 0xffdd88, 35, () => {
    if (!primaryTarget.alive) return;
    // Check for second target or tree behind primary
    applyStatusEffect(primaryTarget, { type: 'stun', duration: stunDur, value: 0 });
    spawnBurst(toPos, 0xffaa44, 5, 3);
  });
  try { playSFX('shackleshot'); } catch (_) {}
}

function _powershot(caster, skill, targetPos) {
  const lvlIdx = _getLevelIndex(skill);
  const def = skill.def ?? skill;
  const damage = _getByLevel(def.effectValuesByLevel?.damage, lvlIdx);

  const casterPos = caster.group?.position ?? { x: 0, y: 0, z: 0 };
  const tPos = targetPos ?? { x: casterPos.x, y: 0, z: casterPos.z + 10 };

  const dx = tPos.x - casterPos.x;
  const dz = tPos.z - casterPos.z;
  const len = Math.sqrt(dx * dx + dz * dz) || 1;
  const dirX = dx / len;
  const dirZ = dz / len;

  // Line length: 30 world units
  const lineLen = 30;
  const endPos = {
    x: casterPos.x + dirX * lineLen,
    y: 0,
    z: casterPos.z + dirZ * lineLen,
  };

  spawnProjectile(casterPos, endPos, 0xffff44, 40, null);
  try { playSFX('powershot'); } catch (_) {}

  // Hit all enemies along the line (within 1 unit of the line)
  const enemies = [...G.heroes, ...G.creeps].filter(u =>
    u.alive && u.team !== caster.team
  );

  for (const enemy of enemies) {
    const ePos = enemy.group?.position ?? enemy.position;
    if (!ePos) continue;
    // Distance from point to line segment
    const ex = ePos.x - casterPos.x;
    const ez = ePos.z - casterPos.z;
    const t = Math.max(0, Math.min(lineLen, ex * dirX + ez * dirZ));
    const closestX = casterPos.x + dirX * t;
    const closestZ = casterPos.z + dirZ * t;
    const distToLine = Math.sqrt((ePos.x - closestX) ** 2 + (ePos.z - closestZ) ** 2);

    if (distToLine <= 1.5) {
      applyDamage(enemy, damage, 'magical', caster);
    }
  }
}

function _windrun(caster, skill) {
  const lvlIdx = _getLevelIndex(skill);
  const def = skill.def ?? skill;
  const moveSpeedBonus = _getByLevel(def.effectValuesByLevel?.moveSpeedBonus, lvlIdx);
  const duration       = _getByLevel(def.effectValuesByLevel?.duration,       lvlIdx);

  caster.windrunActive = true;
  caster.evasion = 1.0; // 100% evasion
  const prevSpeed = caster.effectiveMoveSpeed ?? caster.def?.moveSpeed ?? 300;
  caster.effectiveMoveSpeed = Math.min(550, prevSpeed + moveSpeedBonus);
  caster.currentMoveSpeed   = caster.effectiveMoveSpeed;

  spawnRing(caster.group?.position ?? { x: 0, y: 0, z: 0 }, 0x44ff88, 2, 0.5);
  try { playSFX('windrun'); } catch (_) {}

  setTimeout(() => {
    caster.windrunActive = false;
    caster.evasion = 0;
    caster.effectiveMoveSpeed = prevSpeed;
    caster.currentMoveSpeed = Math.min(550, Math.max(100, prevSpeed));
  }, duration * 1000);
}

function _focusFire(caster, skill, targetUnit) {
  const lvlIdx = _getLevelIndex(skill);
  const def = skill.def ?? skill;
  const attackSpeedBonus = _getByLevel(def.effectValuesByLevel?.attackSpeedBonus, lvlIdx);
  const damagePenPct     = _getByLevel(def.effectValuesByLevel?.damagePenaltyPct, lvlIdx);
  const duration         = _getByLevel(def.effectValuesByLevel?.duration,         lvlIdx);

  if (!targetUnit) return;

  caster.focusFireTarget = targetUnit;
  const origMult = caster.effectiveAttackSpeedMult ?? 1.0;
  const origDmg  = caster.effectiveDamage ?? caster.def?.attackDamage ?? 50;

  caster.effectiveAttackSpeedMult = origMult + attackSpeedBonus / 100;
  caster.effectiveDamage = origDmg * (1 - damagePenPct / 100);

  spawnRing(targetUnit.group?.position ?? { x: 0, y: 0, z: 0 }, 0xff4400, 1.5, 0.4);
  try { playSFX('focusFire'); } catch (_) {}

  setTimeout(() => {
    caster.focusFireTarget = null;
    caster.effectiveAttackSpeedMult = origMult;
    caster.effectiveDamage = origDmg;
  }, duration * 1000);
}

// ── Generic skill effect (heroes 6-20) ───────────────────────
function _genericSkillEffect(caster, skill, targetPos, targetUnit) {
  const lvlIdx = _getLevelIndex(skill);
  const def = skill.def ?? skill;
  const damage    = _getByLevel(def.effectValuesByLevel?.damage,    lvlIdx);
  const aoeRadius = _getByLevel(def.effectValuesByLevel?.aoeRadius, lvlIdx) / 100;
  const damageType = def.damageType ?? 'magical';

  const casterPos = caster.group?.position ?? { x: 0, y: 0, z: 0 };
  const targetPos2 = targetPos ?? casterPos;

  if (damage <= 0) return;

  // If AoE
  if (aoeRadius > 0) {
    spawnRing(targetPos2, 0xaa44ff, aoeRadius, 0.5);
    const enemies = _getEnemiesInRadius(caster, targetPos2, aoeRadius);
    for (const enemy of enemies) {
      applyDamage(enemy, damage, damageType, caster);
    }
  } else if (targetUnit) {
    // Single target
    spawnProjectile(casterPos, targetUnit.group?.position ?? targetUnit.position ?? targetPos2, 0xaa44ff, 30, () => {
      if (targetUnit.alive) {
        applyDamage(targetUnit, damage, damageType, caster);
      }
    });
  } else {
    // Point target — damage nearest enemy
    const nearest = resolveTargetFromPos(caster, targetPos2, 'enemy', 5);
    if (nearest) applyDamage(nearest, damage, damageType, caster);
  }

  spawnBurst(targetPos2, 0xaa44ff, 6, 4);
}

// ── Internal helpers ──────────────────────────────────────────
function _getEnemiesInRadius(caster, pos, radius) {
  const result = [];
  const allUnits = [...G.heroes, ...G.creeps];
  for (const unit of allUnits) {
    if (!unit.alive) continue;
    if (unit === caster) continue;
    if (unit.team === caster.team) continue;
    const uPos = unit.group?.position ?? unit.position;
    if (!uPos) continue;
    const dx = uPos.x - pos.x;
    const dz = uPos.z - pos.z;
    if (Math.sqrt(dx * dx + dz * dz) <= radius) {
      result.push(unit);
    }
  }
  return result;
}

// Re-export resolveTargetFromPos (already defined above, used by castSkill)
