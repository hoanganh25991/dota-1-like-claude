// ============================================================
// ai.js — Bot hero AI using a finite state machine
// One AI controller per bot hero.
// ============================================================

import { G } from './state.js';
import { attackUnit, SPAWN_POS } from './combat.js';
import { castSkill } from './skills.js';
import { buyItem } from './items.js';
import { setAnim } from './animations.js';
import { LANES } from './constants.js';

// ── Bot difficulty profiles ────────────────────────────────────
export const BOT_DIFFICULTY = {
  easy:   { retreatHpPct: 0.45, castReactionMs: 800,  spellAccuracy: 0.5,  buyFreqS: 20 },
  normal: { retreatHpPct: 0.30, castReactionMs: 400,  spellAccuracy: 0.75, buyFreqS: 12 },
  hard:   { retreatHpPct: 0.20, castReactionMs: 150,  spellAccuracy: 0.90, buyFreqS: 6  },
};

// ── Lane waypoints helper ─────────────────────────────────────
// Returns ordered waypoints from hero's base toward enemy base.
function _getLaneWaypoints(hero, lane) {
  const laneDef = LANES[lane] ?? LANES.mid;
  const wps = laneDef.waypoints;
  // Scourge walks 0→last, Sentinel walks last→0
  if (hero.team === 'scourge') return wps;
  return [...wps].reverse();
}

// ── createBotAI ───────────────────────────────────────────────
export function createBotAI(hero) {
  return {
    hero,
    state: 'idle',
    prevState: 'idle',
    target: null,          // current attack/move target (unit or {x,z} pos)
    lane: 'mid',
    difficulty: BOT_DIFFICULTY[G.botDifficulty || 'normal'],
    timers: {
      castCooldown: 0,
      buyTimer: 0,
      stuckTimer: 0,
      retreatTimer: 0,
      idleTimer: 0,
    },
    buildPath: [],
    skillQueue: null,      // { slotKey, targetPos, targetUnit }
    lastPos: { x: 0, z: 0 },
    waypointIndex: 0,      // current lane waypoint index
    waypoints: [],         // cached waypoints for assigned lane
  };
}

// ── updateBotAI ───────────────────────────────────────────────
export function updateBotAI(ai, dt) {
  const hero = ai.hero;
  if (!hero || !hero.alive) return;
  if (hero.stunned) return;

  // Tick timers
  ai.timers.castCooldown = Math.max(0, ai.timers.castCooldown - dt);
  ai.timers.buyTimer     = Math.max(0, ai.timers.buyTimer - dt);
  ai.timers.idleTimer    = Math.max(0, ai.timers.idleTimer - dt);

  // Update skill cooldowns are handled by the main game loop via updateSkillCooldowns
  // We just respect cdRemaining on each skill here

  switch (ai.state) {
    case 'idle':    _stateIdle(ai, dt);    break;
    case 'move':    _stateMove(ai, dt);    break;
    case 'attack':  _stateAttack(ai, dt);  break;
    case 'retreat': _stateRetreat(ai, dt); break;
    case 'cast':    _stateCast(ai, dt);    break;
    case 'farm':    _stateFarm(ai, dt);    break;
    case 'push':    _statePush(ai, dt);    break;
    case 'buy':     _stateBuy(ai, dt);     break;
    default:        ai.state = 'idle';     break;
  }
}

// ── _setState ─────────────────────────────────────────────────
function _setState(ai, newState) {
  if (ai.state !== newState) {
    ai.prevState = ai.state;
    ai.state = newState;
  }
}

// ── _heroPos ──────────────────────────────────────────────────
function _heroPos(hero) {
  return hero.group?.position ?? hero.position ?? { x: 0, y: 0, z: 0 };
}

// ── _moveToward ───────────────────────────────────────────────
// Move the hero group toward a world {x,z} point.
// Returns true when arrived (within threshold).
function _moveToward(ai, targetX, targetZ, threshold = 1.0) {
  const hero = ai.hero;
  const pos  = _heroPos(hero);

  const dx = targetX - pos.x;
  const dz = targetZ - pos.z;
  const dist = Math.sqrt(dx * dx + dz * dz);

  if (dist <= threshold) return true;  // arrived

  const speed = (hero.currentMoveSpeed ?? hero.effectiveMoveSpeed ?? hero.def?.moveSpeed ?? 295) / 100; // units/s in world space
  const step  = Math.min(speed * (1 / 60), dist); // frame step (approx 60fps or use fixed dt)
  const nx = pos.x + (dx / dist) * step;
  const nz = pos.z + (dz / dist) * step;

  if (hero.group) {
    hero.group.position.x = nx;
    hero.group.position.z = nz;
    // Face direction
    hero.group.rotation.y = Math.atan2(dx, dz);
  }
  if (hero.position) {
    hero.position.x = nx;
    hero.position.z = nz;
  }

  setAnim(hero, 'walk');
  return false;
}

// ── _findNearestEnemy ─────────────────────────────────────────
function _findNearestEnemy(hero, maxRange = 20) {
  const pos = _heroPos(hero);
  let best  = null;
  let bestD = Infinity;

  const candidates = [...G.heroes, ...G.creeps];
  for (const unit of candidates) {
    if (!unit.alive) continue;
    if (unit === hero) continue;
    if (unit.team === hero.team) continue;

    const uPos = unit.group?.position ?? unit.position;
    if (!uPos) continue;
    const dx = uPos.x - pos.x;
    const dz = uPos.z - pos.z;
    const d  = Math.sqrt(dx * dx + dz * dz);
    if (d < bestD && d <= maxRange) {
      bestD = d;
      best  = unit;
    }
  }
  return best;
}

// ── _findNearestEnemyHero ─────────────────────────────────────
function _findNearestEnemyHero(hero, maxRange = 25) {
  const pos = _heroPos(hero);
  let best  = null;
  let bestD = Infinity;

  for (const unit of G.heroes) {
    if (!unit.alive) continue;
    if (unit === hero) continue;
    if (unit.team === hero.team) continue;

    const uPos = unit.group?.position ?? unit.position;
    if (!uPos) continue;
    const dx = uPos.x - pos.x;
    const dz = uPos.z - pos.z;
    const d  = Math.sqrt(dx * dx + dz * dz);
    if (d < bestD && d <= maxRange) {
      bestD = d;
      best  = unit;
    }
  }
  return best;
}

// ── _hpPct ────────────────────────────────────────────────────
function _hpPct(hero) {
  const maxHp = hero.effectiveMaxHp ?? hero.def?.maxHp ?? 500;
  return hero.hp / maxHp;
}

// ── _mpPct ────────────────────────────────────────────────────
function _mpPct(hero) {
  const maxMp = hero.effectiveMaxMp ?? hero.def?.maxMp ?? 300;
  return hero.mp / maxMp;
}

// ── _nearBase ─────────────────────────────────────────────────
function _nearBase(hero, threshold = 8) {
  const spawn = SPAWN_POS[hero.team];
  if (!spawn) return false;
  const pos = _heroPos(hero);
  const dx  = pos.x - spawn.x;
  const dz  = pos.z - spawn.z;
  return Math.sqrt(dx * dx + dz * dz) <= threshold;
}

// ── State: Idle ───────────────────────────────────────────────
function _stateIdle(ai, dt) {
  const hero = ai.hero;

  // Check HP — retreat if low
  if (_hpPct(hero) < ai.difficulty.retreatHpPct) {
    _setState(ai, 'retreat');
    return;
  }

  // Check buy timer
  if (ai.timers.buyTimer <= 0 && _nearBase(hero, 12)) {
    _setState(ai, 'buy');
    return;
  }

  // Scan for nearby enemy heroes within aggro range
  const enemyHero = _findNearestEnemyHero(hero, 18);
  if (enemyHero) {
    ai.target = enemyHero;
    _setState(ai, 'attack');
    return;
  }

  // Scan for any nearby enemy (creeps too)
  const enemy = _findNearestEnemy(hero, 12);
  if (enemy) {
    ai.target = enemy;
    _setState(ai, 'attack');
    return;
  }

  // After short idle pause, go farm/push
  ai.timers.idleTimer -= dt;
  if (ai.timers.idleTimer <= 0) {
    ai.timers.idleTimer = 0.5 + Math.random() * 0.5;
    _setState(ai, Math.random() < 0.6 ? 'farm' : 'push');
  }

  setAnim(hero, 'idle');
}

// ── State: Move ───────────────────────────────────────────────
function _stateMove(ai, _dt) {
  if (!ai.moveTarget) {
    _setState(ai, ai.prevState === 'move' ? 'idle' : ai.prevState);
    return;
  }

  const arrived = _moveToward(ai, ai.moveTarget.x, ai.moveTarget.z, ai.moveThreshold ?? 1.5);
  if (arrived) {
    ai.moveTarget = null;
    _setState(ai, ai.afterMoveState ?? 'idle');
  }
}

// ── State: Attack ─────────────────────────────────────────────
function _stateAttack(ai, _dt) {
  const hero = ai.hero;
  const target = ai.target;

  // Validate target
  if (!target || !target.alive) {
    ai.target = null;
    _setState(ai, 'idle');
    return;
  }

  // Retreat if low HP
  if (_hpPct(hero) < ai.difficulty.retreatHpPct) {
    _setState(ai, 'retreat');
    return;
  }

  // Evaluate skills — may queue a cast
  if (ai.timers.castCooldown <= 0 && !hero.silenced) {
    _evaluateSkills(ai);
  }

  // If a skill is queued and reaction timer elapsed, go cast
  if (ai.skillQueue && ai.timers.castCooldown <= 0) {
    _setState(ai, 'cast');
    return;
  }

  const attackRange = hero.effectiveAttackRange ?? hero.def?.attackRange ?? 2;
  const targetPos   = target.group?.position ?? target.position;

  if (!targetPos) {
    ai.target = null;
    _setState(ai, 'idle');
    return;
  }

  const heroPos = _heroPos(hero);
  const dx = targetPos.x - heroPos.x;
  const dz = targetPos.z - heroPos.z;
  const dist = Math.sqrt(dx * dx + dz * dz);

  if (dist <= attackRange + 0.5) {
    // In range — attack
    // Face the target
    if (hero.group) hero.group.rotation.y = Math.atan2(dx, dz);

    const attacked = attackUnit(hero, target);
    if (attacked) {
      setAnim(hero, 'attack');
    } else {
      setAnim(hero, 'idle');
    }
  } else {
    // Chase target
    _moveToward(ai, targetPos.x, targetPos.z, attackRange * 0.8);
  }
}

// ── State: Retreat ────────────────────────────────────────────
function _stateRetreat(ai, _dt) {
  const hero = ai.hero;
  const spawn = SPAWN_POS[hero.team] ?? { x: 0, y: 0, z: 0 };

  if (_nearBase(hero, 8)) {
    // We are at base — regen passively (handled by combat.js fountain regen)
    setAnim(hero, 'idle');

    // Recovered enough HP → return to idle
    if (_hpPct(hero) > 0.7) {
      // Also trigger buy if timer expired
      if (ai.timers.buyTimer <= 0) {
        _setState(ai, 'buy');
      } else {
        _setState(ai, 'idle');
      }
    }
    return;
  }

  _moveToward(ai, spawn.x, spawn.z, 2.0);
}

// ── State: Cast ───────────────────────────────────────────────
function _stateCast(ai, _dt) {
  const hero = ai.hero;
  const queue = ai.skillQueue;

  if (!queue) {
    _setState(ai, 'attack');
    return;
  }

  const { slotKey, targetPos, targetUnit } = queue;
  ai.skillQueue = null;

  // Execute the skill
  castSkill(hero, slotKey, 'auto', targetPos, targetUnit);

  // Set cast reaction cooldown so bot doesn't spam cast
  ai.timers.castCooldown = 1.5 + Math.random();

  // Return to previous meaningful state
  const returnState = (ai.prevState === 'cast' || ai.prevState === 'idle') ? 'attack' : ai.prevState;
  _setState(ai, returnState);
}

// ── State: Farm ───────────────────────────────────────────────
function _stateFarm(ai, _dt) {
  const hero = ai.hero;

  // Retreat if low HP
  if (_hpPct(hero) < ai.difficulty.retreatHpPct) {
    _setState(ai, 'retreat');
    return;
  }

  // If enemy hero gets close, switch to attack
  const enemyHero = _findNearestEnemyHero(hero, 14);
  if (enemyHero) {
    ai.target = enemyHero;
    _setState(ai, 'attack');
    return;
  }

  // Find lowest HP creep for last-hit
  let lastHitTarget = null;
  let lastHitThreshold = 0;
  const heroPos = _heroPos(hero);
  const attackRange = hero.effectiveAttackRange ?? hero.def?.attackRange ?? 2;
  const damage = hero.effectiveDamage ?? hero.def?.attackDamage ?? 40;

  for (const creep of G.creeps) {
    if (!creep.alive) continue;
    if (creep.team === hero.team) continue;
    const cPos = creep.group?.position ?? creep.position;
    if (!cPos) continue;

    const dx = cPos.x - heroPos.x;
    const dz = cPos.z - heroPos.z;
    const d = Math.sqrt(dx * dx + dz * dz);
    if (d > 20) continue; // not in farm range

    // Prefer creeps we can last-hit (hp <= our damage)
    if (creep.hp <= damage * 1.5 && creep.hp > lastHitThreshold) {
      lastHitThreshold = creep.hp;
      lastHitTarget = creep;
    }
  }

  if (lastHitTarget) {
    ai.target = lastHitTarget;
    const targetPos = lastHitTarget.group?.position ?? lastHitTarget.position;
    if (targetPos) {
      const dx = targetPos.x - heroPos.x;
      const dz = targetPos.z - heroPos.z;
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d <= attackRange + 0.5) {
        if (hero.group) hero.group.rotation.y = Math.atan2(dx, dz);
        attackUnit(hero, lastHitTarget);
      } else {
        _moveToward(ai, targetPos.x, targetPos.z, attackRange * 0.8);
      }
    }
    return;
  }

  // No last-hit target — march along lane waypoints
  _marchLane(ai);
}

// ── State: Push ───────────────────────────────────────────────
function _statePush(ai, _dt) {
  const hero = ai.hero;

  // Retreat if low HP
  if (_hpPct(hero) < ai.difficulty.retreatHpPct) {
    _setState(ai, 'retreat');
    return;
  }

  // Attack any nearby enemy in range first
  const enemy = _findNearestEnemy(hero, 14);
  if (enemy) {
    ai.target = enemy;
    const attackRange = hero.effectiveAttackRange ?? hero.def?.attackRange ?? 2;
    const targetPos = enemy.group?.position ?? enemy.position;
    if (targetPos) {
      const heroPos = _heroPos(hero);
      const dx = targetPos.x - heroPos.x;
      const dz = targetPos.z - heroPos.z;
      const d  = Math.sqrt(dx * dx + dz * dz);
      if (d <= attackRange + 0.5) {
        if (hero.group) hero.group.rotation.y = Math.atan2(dx, dz);
        attackUnit(hero, enemy);
        return;
      }
    }
  }

  // March along lane
  _marchLane(ai);

  // After reaching end of waypoints, go back to idle
  if (ai.waypointIndex >= ai.waypoints.length) {
    ai.waypointIndex = 0;
    _setState(ai, 'idle');
  }
}

// ── _marchLane ────────────────────────────────────────────────
// Move to next waypoint in the bot's assigned lane.
function _marchLane(ai) {
  if (!ai.waypoints || ai.waypoints.length === 0) {
    ai.waypoints = _getLaneWaypoints(ai.hero, ai.lane);
    ai.waypointIndex = 0;
  }

  if (ai.waypointIndex >= ai.waypoints.length) {
    ai.waypointIndex = ai.waypoints.length - 1;
    return;
  }

  const wp = ai.waypoints[ai.waypointIndex];
  const arrived = _moveToward(ai, wp[0], wp[1], 2.5);

  if (arrived) {
    ai.waypointIndex = Math.min(ai.waypointIndex + 1, ai.waypoints.length - 1);
  }
}

// ── State: Buy ────────────────────────────────────────────────
function _stateBuy(ai, _dt) {
  const hero = ai.hero;

  // Buy next affordable item in build path
  while (ai.buildPath.length > 0) {
    const itemId = ai.buildPath[0];

    // Skip items already in inventory
    const alreadyOwned = (hero.inventory ?? []).some(i => i.id === itemId);
    if (alreadyOwned) {
      ai.buildPath.shift();
      continue;
    }

    const result = buyItem(hero, itemId);
    if (result.success) {
      ai.buildPath.shift();
      // item bought
    } else if (result.reason === 'insufficient_gold') {
      // Can't afford yet — wait
      break;
    } else if (result.reason === 'inventory_full') {
      break;
    } else {
      // requirements_missing or invalid_item — skip this item
      ai.buildPath.shift();
    }
  }

  // Reset buy timer
  ai.timers.buyTimer = ai.difficulty.buyFreqS;

  // Return to previous useful state
  const returnState = (ai.prevState === 'buy' || ai.prevState === 'idle')
    ? (_hpPct(hero) < 0.8 ? 'retreat' : 'farm')
    : ai.prevState;
  _setState(ai, returnState);
}

// ── _evaluateSkills ───────────────────────────────────────────
function _evaluateSkills(ai) {
  const hero = ai.hero;
  const target = ai.target;
  if (!target) return;

  const slots = ['Q', 'W', 'E', 'R'];
  const heroPos = _heroPos(hero);
  const mpPct = _mpPct(hero);

  for (const slotKey of slots) {
    const skill = hero.skills?.[slotKey];
    if (!skill) continue;
    if ((skill.level ?? 0) < 1) continue;
    if ((skill.cdRemaining ?? 0) > 0) continue;

    const def = skill.def ?? skill;
    const hints = def.aiHints;
    if (!hints) continue;

    // Check mana
    const lvlIdx = Math.max(0, (skill.level ?? 1) - 1);
    const manaCost = (def.manaCostByLevel ?? [0])[Math.min(lvlIdx, (def.manaCostByLevel?.length ?? 1) - 1)] ?? 0;
    const minManaPct = hints.minManaPct ?? 0.2;
    if (mpPct < minManaPct) continue;
    if (hero.mp < manaCost) continue;

    // Determine target position
    let targetPos = null;
    let targetUnit = null;
    const castType = def.castType ?? skill.castType;

    if (castType === 'self' || castType === 'no-target' || castType === 'self-radius') {
      // Self-cast — always OK if hints met
    } else if (castType === 'unit-target') {
      const targetRule = def.targetRule ?? 'enemy';
      if (targetRule === 'enemy') {
        targetUnit = target;
      } else {
        // Ally target — target self
        targetUnit = hero;
      }
    } else if (castType === 'area-target' || castType === 'point-target') {
      const tPos = target.group?.position ?? target.position;
      if (tPos) {
        targetPos = { x: tPos.x, y: tPos.y ?? 0, z: tPos.z };
        // Add inaccuracy based on difficulty
        const acc = ai.difficulty.spellAccuracy;
        const spread = (1 - acc) * 4;
        targetPos.x += (Math.random() - 0.5) * spread;
        targetPos.z += (Math.random() - 0.5) * spread;
      }
    } else {
      const tPos = target.group?.position ?? target.position;
      if (tPos) targetPos = { x: tPos.x, y: tPos.y ?? 0, z: tPos.z };
    }

    // Check enemy radius hint
    if (hints.useWhenEnemiesInRadiusAtLeast) {
      const checkPos = targetPos ?? (targetUnit ? (targetUnit.group?.position ?? targetUnit.position) : heroPos);
      const aoeRadius = ((def.effectValuesByLevel?.aoeRadius ?? [400])[Math.min(lvlIdx, 3)] ?? 400) / 100;
      const count = _countEnemiesInRadius(hero, checkPos, aoeRadius);
      if (count < hints.useWhenEnemiesInRadiusAtLeast) continue;
    }

    // If checking allied creep for sacrifice-style skills
    if (hints.useOnAlliedCreepWhenLowMana && mpPct > 0.5) continue;

    // Queue the skill cast with reaction delay
    ai.skillQueue = { slotKey, targetPos, targetUnit };
    ai.timers.castCooldown = ai.difficulty.castReactionMs / 1000;
    return; // only queue one skill per evaluation
  }
}

// ── _countEnemiesInRadius ─────────────────────────────────────
function _countEnemiesInRadius(hero, pos, radius) {
  if (!pos) return 0;
  let count = 0;
  const all = [...G.heroes, ...G.creeps];
  for (const u of all) {
    if (!u.alive || u === hero || u.team === hero.team) continue;
    const uPos = u.group?.position ?? u.position;
    if (!uPos) continue;
    const dx = uPos.x - pos.x;
    const dz = uPos.z - pos.z;
    if (Math.sqrt(dx * dx + dz * dz) <= radius) count++;
  }
  return count;
}

// ── getBuildPath ───────────────────────────────────────────────
export function getBuildPath(heroId) {
  const builds = {
    'lich':            ['ironBranch', 'magicCharm', 'arcaneBoots', 'voidStaff'],
    'sniper':          ['bootsOfSpeed', 'bladesOfAttack', 'powerBoots', 'lifeStealBlade'],
    'dragon-knight':   ['ironBranch', 'vitalityGem', 'powerBoots', 'auraShield'],
    'shadow-fiend':    ['bladesOfAttack', 'bootsOfSpeed', 'lifeStealBlade', 'powerBoots'],
    'windrunner':      ['bootsOfSpeed', 'magicCharm', 'arcaneBoots', 'voidStaff'],
    'axe':             ['ironBranch', 'vitalityGem', 'powerBoots', 'auraShield'],
    'pudge':           ['ironBranch', 'vitalityGem', 'powerBoots', 'auraShield'],
    'sven':            ['ironBranch', 'bladesOfAttack', 'powerBoots', 'lifeStealBlade'],
    'tidehunter':      ['ironBranch', 'vitalityGem', 'auraShield', 'powerBoots'],
    'earthshaker':     ['ironBranch', 'vitalityGem', 'powerBoots', 'auraShield'],
    'phantom-assassin':['bladesOfAttack', 'bootsOfSpeed', 'lifeStealBlade', 'powerBoots'],
    'juggernaut':      ['bladesOfAttack', 'bootsOfSpeed', 'lifeStealBlade', 'powerBoots'],
    'drow-ranger':     ['bladesOfAttack', 'bootsOfSpeed', 'lifeStealBlade', 'voidStaff'],
    'bounty-hunter':   ['bladesOfAttack', 'bootsOfSpeed', 'powerBoots', 'lifeStealBlade'],
    'vengeful-spirit': ['bootsOfSpeed', 'magicCharm', 'arcaneBoots', 'voidStaff'],
    'crystal-maiden':  ['ironBranch', 'magicCharm', 'arcaneBoots', 'voidStaff'],
    'zeus':            ['ironBranch', 'magicCharm', 'arcaneBoots', 'voidStaff'],
    'lina':            ['ironBranch', 'magicCharm', 'arcaneBoots', 'voidStaff'],
    'lion':            ['ironBranch', 'magicCharm', 'arcaneBoots', 'voidStaff'],
    'enigma':          ['ironBranch', 'magicCharm', 'arcaneBoots', 'voidStaff'],
    '_default':        ['ironBranch', 'bootsOfSpeed', 'powerBoots'],
  };
  return [...(builds[heroId] || builds['_default'])];
}

// ── initBots ──────────────────────────────────────────────────
export function initBots() {
  G._bots = [];
  for (const hero of G.heroes) {
    if (hero.isPlayer) continue;
    const ai = createBotAI(hero);
    ai.lane      = _assignLane(hero);
    ai.waypoints = _getLaneWaypoints(hero, ai.lane);
    ai.buildPath = getBuildPath(hero.def?.id || '_default');
    G._bots.push(ai);
  }
}

// ── updateAllBots ─────────────────────────────────────────────
export function updateAllBots(dt) {
  if (!G._bots) return;
  for (const ai of G._bots) {
    updateBotAI(ai, dt);
  }
}

// ── _assignLane ───────────────────────────────────────────────
function _assignLane(hero) {
  // Distribute bots across lanes evenly using their index
  const idx = G.heroes.filter(h => !h.isPlayer).indexOf(hero);
  const lanes = ['top', 'mid', 'bot'];
  if (idx < 0) return lanes[Math.floor(Math.random() * 3)];
  return lanes[idx % 3];
}
