// ============================================================
// combat.js — Combat system for Crimson Lane
// ============================================================

import { G } from './state.js';
import { spawnProjectile, spawnDamageFloat, spawnDeathFlash, fxBloodSplat, fxMeleeHit } from './particles.js';
import { setAnim, resetHeroPose } from './animations.js';
import { playSFX } from './audio.js';
import { grantBounty } from './items.js';

// ── Base spawn positions ──────────────────────────────────────
export const SPAWN_POS = {
  scourge:  { x: -38, y: 0, z: 38 },
  sentinel: { x: 38,  y: 0, z: -38 },
};

// ── Utility ───────────────────────────────────────────────────
export function isInRange(a, b, range) {
  const dx = a.position.x - b.position.x;
  const dz = a.position.z - b.position.z;
  return Math.sqrt(dx * dx + dz * dz) <= range;
}

export function distance(a, b) {
  const dx = a.position.x - b.position.x;
  const dz = a.position.z - b.position.z;
  return Math.sqrt(dx * dx + dz * dz);
}

// ── Damage application ────────────────────────────────────────
export function applyDamage(target, amount, damageType, source) {
  if (!target || !target.alive) return 0;

  let finalDamage = amount;

  if (damageType === 'physical') {
    // PhysicalDamageTaken = damage * 100 / (100 + armor * 6)
    const armor = target.effectiveArmor ?? target.def?.armor ?? 0;
    finalDamage = amount * 100 / (100 + armor * 6);
  } else if (damageType === 'magical') {
    // Default 25% magic resistance
    const magicResist = target.magicResist ?? 0.25;
    // Check for spell pen from attacker items (handled on source side)
    const spellPen = source?.effectiveSpellPen ?? 0;
    const effectiveResist = Math.max(0, magicResist - spellPen);
    finalDamage = amount * (1 - effectiveResist);
  }
  // 'pure' — no mitigation

  finalDamage = Math.max(0, Math.floor(finalDamage));

  target.hp = Math.max(0, target.hp - finalDamage);

  // Life steal passive (from attacker items)
  if (source && source.effectiveLifeSteal > 0 && damageType === 'physical') {
    const heal = finalDamage * source.effectiveLifeSteal;
    source.hp = Math.min(source.effectiveMaxHp ?? source.def?.maxHp ?? source.hp, source.hp + heal);
  }

  window.dispatchEvent(new CustomEvent('damageApplied', {
    detail: { target, amount: finalDamage, damageType, source },
  }));

  // Damage float VFX
  if (target.group) {
    const floatPos = {
      x: target.group.position.x,
      y: target.group.position.y + 1.5,
      z: target.group.position.z,
    };
    const color = damageType === 'magical' ? '#44aaff' : damageType === 'pure' ? '#ffffff' : '#ff4444';
    spawnDamageFloat(floatPos, finalDamage, color);
  }

  // Hit SFX
  try { playSFX('hit'); } catch (_) {}

  // Blood splat on physical hits
  if (damageType === 'physical' && target.group) {
    fxBloodSplat(target.group.position);
  }

  // Check death
  if (target.hp <= 0) {
    killUnit(target, source);
  }

  return finalDamage;
}

// ── Attack ────────────────────────────────────────────────────
export function attackUnit(attacker, target) {
  if (!attacker || !target) return false;
  if (!target.alive || target.hp <= 0) return false;

  const attackRange = attacker.effectiveAttackRange ?? attacker.def?.attackRange ?? 2;
  if (!isInRange(attacker, target, attackRange + 0.5)) return false;

  // Respect attack interval
  const now = performance.now() / 1000;
  const lastAttack = attacker._lastAttackTime ?? 0;
  const baseAttackTime = attacker.def?.baseAttackTime ?? 1.7;
  const attackSpeedMult = attacker.effectiveAttackSpeedMult ?? 1.0;
  const attackInterval = baseAttackTime / attackSpeedMult;

  if (now - lastAttack < attackInterval) return false;

  attacker._lastAttackTime = now;

  // Calculate damage with ±5 variance
  const baseDamage = attacker.effectiveDamage ?? attacker.def?.attackDamage ?? 20;
  const variance = (Math.random() - 0.5) * 10;
  const rawDamage = Math.max(1, baseDamage + variance);

  // Set attack animation
  setAnim(attacker, 'attack');

  const isRanged = (attacker.def?.attackType === 'ranged') || ((attacker.effectiveAttackRange ?? attacker.def?.attackRange ?? 2) > 3);

  if (isRanged) {
    // Spawn projectile that calls applyDamage on arrival
    const fromPos = attacker.group ? attacker.group.position : attacker.position;
    const toPos   = target.group   ? target.group.position   : target.position;
    spawnProjectile(
      fromPos, toPos, 0xffdd88, 30,
      () => {
        if (target.alive) {
          applyDamage(target, rawDamage, 'physical', attacker);
        }
      }
    );
  } else {
    // Melee: apply damage with slight delay
    setTimeout(() => {
      if (target.alive) {
        applyDamage(target, rawDamage, 'physical', attacker);
        if (target.group) fxMeleeHit(target.group.position);
      }
    }, 150);
  }

  try { playSFX('attack'); } catch (_) {}
  return true;
}

// ── Kill ──────────────────────────────────────────────────────
export function killUnit(unit, killer) {
  if (!unit || !unit.alive) return;

  unit.hp = 0;
  unit.alive = false;

  setAnim(unit, 'die');

  if (unit.group) {
    spawnDeathFlash(unit.group);
  }

  // Grant bounty gold + XP
  if (killer) {
    grantBounty(killer, unit, unit.type ?? 'creep');
    awardKillRewards(killer, unit);
  }

  window.dispatchEvent(new CustomEvent('unitDied', {
    detail: { unit, killer },
  }));

  try { playSFX('death'); } catch (_) {}

  // Schedule respawn for heroes
  if (unit.type === 'hero') {
    const respawnTime = 5 + (unit.level ?? 1) * 2;

    // Lose necromastery souls on death (Shadow Fiend)
    if (unit.souls !== undefined) {
      const necroSkill = unit.skills?.E;
      if (necroSkill && necroSkill.id === 'necromastery') {
        const lvl = Math.max(0, necroSkill.level - 1);
        const soulsLost = necroSkill.def?.effectValuesByLevel?.soulsLostOnDeath?.[lvl] ?? 12;
        unit.souls = Math.max(0, (unit.souls ?? 0) - soulsLost);
      }
    }

    setTimeout(() => respawnHero(unit), respawnTime * 1000);
  }
}

// ── Respawn ───────────────────────────────────────────────────
function respawnHero(hero) {
  if (!hero) return;

  // Reset HP and mana to max
  hero.hp = hero.effectiveMaxHp ?? hero.def?.maxHp ?? 500;
  hero.mp = hero.effectiveMaxMp ?? hero.def?.maxMp ?? 300;
  hero.alive = true;

  // Teleport to base spawn point
  const spawn = SPAWN_POS[hero.team] ?? SPAWN_POS.sentinel;
  if (hero.group) {
    hero.group.position.set(spawn.x, spawn.y, spawn.z);
    hero.group.visible = true;
    hero.group.userData._dieComplete = false;
  }
  if (hero.position) {
    hero.position.x = spawn.x;
    hero.position.y = spawn.y;
    hero.position.z = spawn.z;
  }

  resetHeroPose(hero);

  try { playSFX('respawn'); } catch (_) {}

  window.dispatchEvent(new CustomEvent('heroRespawned', { detail: { hero } }));
}

// ── XP grant ──────────────────────────────────────────────────
export function grantXP(hero, amount) {
  if (!hero || !hero.alive) return;

  hero.xp = (hero.xp ?? 0) + amount;

  window.dispatchEvent(new CustomEvent('xpGranted', {
    detail: { hero, amount },
  }));

  // XP needed = level * 100 + 200
  const level = hero.level ?? 1;
  const xpNeeded = level * 100 + 200;

  if (hero.xp >= xpNeeded) {
    hero.xp -= xpNeeded;
    hero.level = level + 1;
    hero.skillPoints = (hero.skillPoints ?? 0) + 1;

    // Recalculate stats on level up
    if (typeof recalcHeroStats === 'function') {
      // imported via items.js cycle — call it after module loads
    }

    window.dispatchEvent(new CustomEvent('heroLevelUp', {
      detail: { hero, level: hero.level },
    }));

    try { playSFX('levelup'); } catch (_) {}
  }
}

// ── Gold grant ────────────────────────────────────────────────
export function grantGold(hero, amount) {
  if (!hero) return;
  hero.gold = (hero.gold ?? 0) + amount;

  window.dispatchEvent(new CustomEvent('goldGranted', { detail: { hero, amount } }));

  try { playSFX('gold'); } catch (_) {}
}

// ── Kill rewards ──────────────────────────────────────────────
export function awardKillRewards(killer, victim) {
  if (!killer || !victim) return;

  const victimLevel = victim.level ?? 1;

  // Gold reward: base 200 + level * 10, creeps handled by grantBounty
  // Only apply hero kill bonus here if victim is a hero
  if (victim.type === 'hero') {
    const killStreak = killer.killStreak ?? 0;
    const streakBonus = Math.min(killStreak * 50, 400);
    const goldAmount = 200 + victimLevel * 10 + streakBonus;
    grantGold(killer, goldAmount);

    killer.killStreak = (killer.killStreak ?? 0) + 1;
    if (victim.killStreak) victim.killStreak = 0;
  }

  // XP: shared among nearby allied heroes within 1000 world units
  const baseXP = 150 + victimLevel * 20;
  const XP_RADIUS = 1000;

  const nearbyAllies = G.heroes.filter(h =>
    h !== killer &&
    h.alive &&
    h.team === killer.team &&
    distance(h, victim) <= XP_RADIUS
  );

  // killer + nearby allies share XP equally
  const recipients = [killer, ...nearbyAllies];
  const xpEach = Math.floor(baseXP / recipients.length);

  for (const hero of recipients) {
    grantXP(hero, xpEach);
  }
}

// ── Status effects ────────────────────────────────────────────
export function applyStatusEffect(target, effect) {
  // effect: { type: 'stun'|'slow'|'silence'|'root', duration, value }
  if (!target) return;
  if (!target.statusEffects) target.statusEffects = [];

  // Remove existing effect of the same type (refresh)
  target.statusEffects = target.statusEffects.filter(e => e.type !== effect.type);
  target.statusEffects.push({ ...effect, elapsed: 0 });

  // Stun: cancel current action
  if (effect.type === 'stun') {
    target.stunned = true;
    target.casting = false;
    target.channeling = false;
    setAnim(target, 'stun');
  }

  // Slow: reduce moveSpeed
  if (effect.type === 'slow') {
    _recomputeSlowedSpeed(target);
  }

  window.dispatchEvent(new CustomEvent('statusEffectApplied', { detail: { target, effect } }));
}

export function updateStatusEffects(unit, dt) {
  if (!unit || !unit.statusEffects || unit.statusEffects.length === 0) return;

  let hadStun = unit.stunned;

  for (let i = unit.statusEffects.length - 1; i >= 0; i--) {
    const e = unit.statusEffects[i];
    e.elapsed = (e.elapsed ?? 0) + dt;

    if (e.elapsed >= e.duration) {
      unit.statusEffects.splice(i, 1);
    } else {
      if (e.type === 'slow') hadSlow = true;
    }
  }

  // Recompute stun state
  const stillStunned = unit.statusEffects.some(e => e.type === 'stun');
  if (hadStun && !stillStunned) {
    unit.stunned = false;
    if (unit.alive) setAnim(unit, 'idle');
  }

  // Recompute silence
  unit.silenced = unit.statusEffects.some(e => e.type === 'silence');

  // Recompute move speed after slow expiry
  _recomputeSlowedSpeed(unit);
}

function _recomputeSlowedSpeed(unit) {
  const baseSpeed = unit.effectiveMoveSpeed ?? unit.def?.moveSpeed ?? 300;
  const slowEffects = (unit.statusEffects ?? []).filter(e => e.type === 'slow');
  if (slowEffects.length === 0) {
    unit.currentMoveSpeed = Math.min(550, Math.max(100, baseSpeed));
    return;
  }
  // Apply largest slow
  const maxSlowPct = Math.max(...slowEffects.map(e => e.value ?? 0));
  const slowedSpeed = baseSpeed * (1 - maxSlowPct / 100);
  unit.currentMoveSpeed = Math.min(550, Math.max(100, slowedSpeed));
}

// ── Combat update (per frame) ─────────────────────────────────
export function updateCombat(dt) {
  // Update status effects for all units
  const allUnits = [...G.heroes, ...G.creeps];
  for (const unit of allUnits) {
    if (!unit.alive) continue;
    updateStatusEffects(unit, dt);
  }

  // Passive HP/mana regen for heroes
  for (const hero of G.heroes) {
    if (!hero.alive) continue;

    const hpRegen  = hero.effectiveHpRegen  ?? hero.def?.hpRegen  ?? 1;
    const mpRegen  = hero.effectiveMpRegen  ?? hero.def?.mpRegen  ?? 0.5;
    const maxHp    = hero.effectiveMaxHp    ?? hero.def?.maxHp    ?? 500;
    const maxMp    = hero.effectiveMaxMp    ?? hero.def?.maxMp    ?? 300;

    hero.hp = Math.min(maxHp, hero.hp + hpRegen * dt);
    hero.mp = Math.min(maxMp, hero.mp + mpRegen * dt);

    // Fountain regen (if hero near base — within 8 world units)
    const spawn = SPAWN_POS[hero.team];
    if (spawn) {
      const dx = (hero.group?.position.x ?? hero.position?.x ?? 0) - spawn.x;
      const dz = (hero.group?.position.z ?? hero.position?.z ?? 0) - spawn.z;
      const distToSpawn = Math.sqrt(dx * dx + dz * dz);
      if (distToSpawn <= 8) {
        // Fountain: fast regen
        hero.hp = Math.min(maxHp, hero.hp + maxHp * 0.04 * dt);
        hero.mp = Math.min(maxMp, hero.mp + maxMp * 0.04 * dt);
      }
    }
  }
}
