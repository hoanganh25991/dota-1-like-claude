// ============================================================
// creeps.js — Lane creep waves + neutral camps for Crimson Lane
// THREE is a global loaded via CDN script tag.
// ============================================================

import { scene } from './scene.js';
import { G } from './state.js';
import { CREEP_STATS, NEUTRAL_CAMPS } from './constants.js';
import { LANE_WAYPOINTS } from './map.js';
import { spawnProjectile, spawnBurst } from './particles.js';

// ── Constants ────────────────────────────────────────────────
export const CREEP_SPAWN_INTERVAL = 30; // seconds

const TEAM_COLORS = {
  sentinel: 0x00cc55,
  scourge:  0xcc2200,
  neutral:  0x888866,
};

const MEGA_COLORS = {
  sentinel: 0x00ffaa,
  scourge:  0xff4400,
};

// Tracks which barracks have fallen per team+lane
const _fallenBarracks = {
  sentinel: { top: false, mid: false, bot: false },
  scourge:  { top: false, mid: false, bot: false },
};

// Neutral camp state registry (keyed by campId)
const _neutralCampState = {};

let _creepIdCounter = 0;
let _neutralIdCounter = 0;

// ── Utility ──────────────────────────────────────────────────
function _dist(a, b) {
  const dx = a.x - b.x;
  const dz = (a.z ?? 0) - (b.z ?? 0);
  return Math.sqrt(dx * dx + dz * dz);
}

function _dist2(ax, az, bx, bz) {
  const dx = ax - bx;
  const dz = az - bz;
  return Math.sqrt(dx * dx + dz * dz);
}

function _randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function _applyDamageSimple(target, rawDamage) {
  if (!target || !target.alive) return 0;
  // Physical damage reduction: effective_damage = raw * (1 - armor/(armor+14))
  const armorReduction = target.armor / (target.armor + 14);
  const effective = rawDamage * (1 - armorReduction);
  target.hp -= effective;
  return effective;
}

function _grantGold(hero, amount) {
  if (!hero) return;
  hero.gold = (hero.gold || 0) + amount;
}

function _grantXP(hero, amount) {
  if (!hero) return;
  hero.xp = (hero.xp || 0) + amount;
  // Level up check (100 * level XP per level, simple curve)
  const needed = (hero.level || 1) * 100;
  if (hero.xp >= needed) {
    hero.xp -= needed;
    hero.level = (hero.level || 1) + 1;
  }
}

function _nearbyHeroes(pos, radius, team) {
  return G.heroes.filter(h => {
    if (!h.alive) return false;
    if (team !== undefined && h.team !== team) return false;
    return _dist(pos, h.position || h.group?.position) <= radius;
  });
}

// ── getCreepModel ─────────────────────────────────────────────
export function getCreepModel(type, team, isMega) {
  const group = new THREE.Group();
  const color = isMega ? (MEGA_COLORS[team] || 0xffaa00) : (TEAM_COLORS[team] || TEAM_COLORS.neutral);

  const bodyMat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.6,
    metalness: isMega ? 0.5 : 0.1,
    emissive: isMega ? new THREE.Color(color) : new THREE.Color(0x000000),
    emissiveIntensity: isMega ? 0.5 : 0.0,
  });

  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.9,
    metalness: 0.0,
  });

  if (type === 'melee') {
    // Body: squat box
    const bodyH = isMega ? 0.85 : 0.6;
    const bodyW = isMega ? 0.75 : 0.55;
    const bodyGeo = new THREE.BoxGeometry(bodyW, bodyH, bodyW * 0.8);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = bodyH / 2 + 0.05;
    body.castShadow = true;
    body.name = 'body';
    group.add(body);

    // Head
    const headGeo = new THREE.BoxGeometry(bodyW * 0.7, bodyW * 0.55, bodyW * 0.65);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.position.y = bodyH + 0.05 + bodyW * 0.3;
    head.castShadow = true;
    head.name = 'head';
    group.add(head);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.15, 0.3, 0.15);
    const legL = new THREE.Mesh(legGeo, darkMat);
    legL.position.set(-0.15, 0.18, 0);
    legL.name = 'legL';
    group.add(legL);

    const legR = new THREE.Mesh(legGeo, darkMat);
    legR.position.set(0.15, 0.18, 0);
    legR.name = 'legR';
    group.add(legR);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.12, 0.35, 0.12);
    const armL = new THREE.Mesh(armGeo, bodyMat);
    armL.position.set(-(bodyW / 2 + 0.1), bodyH * 0.6 + 0.05, 0);
    armL.name = 'armL';
    group.add(armL);

    const armR = new THREE.Mesh(armGeo, bodyMat);
    armR.position.set(bodyW / 2 + 0.1, bodyH * 0.6 + 0.05, 0);
    armR.name = 'armR';
    group.add(armR);

    // Weapon (sword stub)
    const weaponGeo = new THREE.BoxGeometry(0.08, 0.45, 0.08);
    const weapon = new THREE.Mesh(weaponGeo, darkMat);
    weapon.position.set(bodyW / 2 + 0.22, bodyH * 0.5 + 0.05, 0);
    weapon.rotation.z = 0.3;
    weapon.name = 'weapon';
    group.add(weapon);

    if (isMega) {
      // Extra shoulder pads for mega
      const padGeo = new THREE.BoxGeometry(0.2, 0.15, 0.25);
      const padMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.4, metalness: 0.8 });
      for (const sx of [-1, 1]) {
        const pad = new THREE.Mesh(padGeo, padMat);
        pad.position.set(sx * (bodyW / 2 + 0.05), bodyH + 0.0, 0);
        pad.castShadow = true;
        group.add(pad);
      }
    }

  } else if (type === 'ranged') {
    // Slightly taller, slimmer body
    const bodyH = isMega ? 0.9 : 0.7;
    const bodyW = isMega ? 0.6 : 0.45;
    const bodyGeo = new THREE.BoxGeometry(bodyW, bodyH, bodyW * 0.8);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = bodyH / 2 + 0.05;
    body.castShadow = true;
    body.name = 'body';
    group.add(body);

    // Head
    const headGeo = new THREE.BoxGeometry(bodyW * 0.75, bodyW * 0.6, bodyW * 0.7);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.position.y = bodyH + 0.05 + bodyW * 0.35;
    head.castShadow = true;
    head.name = 'head';
    group.add(head);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.12, 0.28, 0.12);
    const legL = new THREE.Mesh(legGeo, darkMat);
    legL.position.set(-0.12, 0.17, 0);
    legL.name = 'legL';
    group.add(legL);

    const legR = new THREE.Mesh(legGeo, darkMat);
    legR.position.set(0.12, 0.17, 0);
    legR.name = 'legR';
    group.add(legR);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.1, 0.3, 0.1);
    const armL = new THREE.Mesh(armGeo, bodyMat);
    armL.position.set(-(bodyW / 2 + 0.08), bodyH * 0.65 + 0.05, 0);
    armL.name = 'armL';
    group.add(armL);

    const armR = new THREE.Mesh(armGeo, bodyMat);
    armR.position.set(bodyW / 2 + 0.08, bodyH * 0.65 + 0.05, 0);
    armR.name = 'armR';
    group.add(armR);

    // Launcher / bow on top
    const launcherGeo = new THREE.BoxGeometry(bodyW * 0.5, 0.2, 0.5);
    const launcherMat = new THREE.MeshStandardMaterial({ color: 0x554422, roughness: 0.8, metalness: 0.2 });
    const launcher = new THREE.Mesh(launcherGeo, launcherMat);
    launcher.position.y = bodyH + 0.05 + bodyW * 0.75;
    launcher.name = 'weapon';
    group.add(launcher);

    // Barrel
    const barrelGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6);
    const barrel = new THREE.Mesh(barrelGeo, darkMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, bodyH + 0.05 + bodyW * 0.75, 0.35);
    group.add(barrel);

  } else {
    // Neutral creep: grey/brown box, size based on type/tier
    const stats = CREEP_STATS[type] || CREEP_STATS.small;
    const scale = stats.scale || 0.5;
    const bodyH = scale * 1.1;
    const bodyW = scale * 0.85;

    const neutralMat = new THREE.MeshStandardMaterial({
      color: TEAM_COLORS.neutral,
      roughness: 0.85,
      metalness: 0.0,
    });

    const bodyGeo = new THREE.BoxGeometry(bodyW, bodyH, bodyW * 0.9);
    const body = new THREE.Mesh(bodyGeo, neutralMat);
    body.position.y = bodyH / 2 + 0.05;
    body.castShadow = true;
    body.name = 'body';
    group.add(body);

    const headGeo = new THREE.BoxGeometry(bodyW * 0.8, bodyW * 0.6, bodyW * 0.75);
    const head = new THREE.Mesh(headGeo, neutralMat);
    head.position.y = bodyH + 0.05 + bodyW * 0.35;
    head.castShadow = true;
    head.name = 'head';
    group.add(head);

    const legGeo = new THREE.BoxGeometry(0.12, 0.25, 0.12);
    const legL = new THREE.Mesh(legGeo, darkMat);
    legL.position.set(-bodyW * 0.3, 0.15, 0);
    legL.name = 'legL';
    group.add(legL);

    const legR = new THREE.Mesh(legGeo, darkMat);
    legR.position.set(bodyW * 0.3, 0.15, 0);
    legR.name = 'legR';
    group.add(legR);
  }

  // HP bar (small flat box above unit)
  const hpBgGeo = new THREE.BoxGeometry(0.7, 0.08, 0.04);
  const hpBgMat = new THREE.MeshStandardMaterial({ color: 0x330000, roughness: 1.0 });
  const hpBg = new THREE.Mesh(hpBgGeo, hpBgMat);
  hpBg.position.y = isMega ? 1.8 : 1.4;
  hpBg.name = '_hpBg';
  group.add(hpBg);

  const hpBarGeo = new THREE.BoxGeometry(0.7, 0.08, 0.05);
  const hpBarMat = new THREE.MeshStandardMaterial({ color: 0x00dd44, roughness: 1.0 });
  const hpBar = new THREE.Mesh(hpBarGeo, hpBarMat);
  hpBar.position.y = isMega ? 1.8 : 1.4;
  hpBar.name = '_hpBar';
  group.add(hpBar);

  return group;
}

// ── _makeCreepUnit ─────────────────────────────────────────────
function _makeCreepUnit(opts) {
  const {
    team, lane, type, waypointIndex, waypointList,
    isMega = false,
    posX, posZ,
    campId = null,
  } = opts;

  const stats = CREEP_STATS[type] || CREEP_STATS.melee;
  const megaMult = isMega ? 2.0 : 1.0;

  const hp     = Math.round(stats.hp * megaMult);
  const damage = Math.round(stats.damage * megaMult);
  const bounty = _randInt(stats.goldBounty[0], stats.goldBounty[1]);

  const group = getCreepModel(type, team, isMega);
  group.position.set(posX, 0, posZ);
  scene.add(group);

  const id = `creep_${++_creepIdCounter}`;

  return {
    id,
    team,
    lane,
    type,
    campId,
    position: group.position,  // live reference to group.position
    hp,
    maxHp: hp,
    damage,
    armor: stats.armor,
    attackRange: stats.attackRange,
    moveSpeed: stats.moveSpeed * (isMega ? 1.1 : 1.0),
    bounty,
    xpReward: stats.xpBounty,
    aggroRadius: stats.aggroRadius || 8,
    waypointIndex,
    waypointList,
    alive: true,
    group,
    lastAttackTime: 0,
    attackInterval: 1.0 / (stats.attackSpeed || 1.0),
    statusEffects: [],
    isMega,
    target: null,         // current attack target
    state: { anim: 'walk', _animAge: 0 },
    campCenter: null,     // for neutrals: home camp position
    leashRadius: 20,
    attackedBy: null,     // tracks if ally hero attacked this
    _aggroFlash: 0,
  };
}

// ── _updateHPBar ───────────────────────────────────────────────
function _updateHPBar(unit) {
  const hpBar = unit.group.getObjectByName('_hpBar');
  if (!hpBar) return;
  const frac = Math.max(0, unit.hp / unit.maxHp);
  hpBar.scale.x = frac;
  hpBar.position.x = (frac - 1.0) * 0.35; // anchor left
  // Color: green -> yellow -> red
  const col = hpBar.material.color;
  if (frac > 0.5) col.set(0x00dd44);
  else if (frac > 0.25) col.set(0xddaa00);
  else col.set(0xdd2200);
}

// ── _killCreep ────────────────────────────────────────────────
function _killCreep(unit, killer) {
  if (!unit.alive) return;
  unit.alive = false;
  unit.hp = 0;

  // VFX
  spawnBurst(unit.position, unit.team === 'sentinel' ? 0x00cc55 : 0xcc2200, 4, 3);

  // Award gold/XP to killer (last hit)
  if (killer) {
    if (killer.gold !== undefined) {
      _grantGold(killer, unit.bounty);
    }
    // XP to nearby allies within 1000 units (1000 world units = effectively map-wide but keep 10-unit radius for gameplay)
    const xpRadius = 10;
    const allies = _nearbyHeroes(unit.position, xpRadius, killer.team);
    const xpEach = allies.length > 0 ? Math.floor(unit.xpReward / allies.length) : unit.xpReward;
    for (const ally of allies) {
      _grantXP(ally, xpEach);
    }
  }

  // Remove after death animation delay
  setTimeout(() => {
    if (unit.group && unit.group.parent) {
      scene.remove(unit.group);
    }
  }, 800);

  // Remove from state arrays
  const arr = unit.campId !== null ? G.neutrals : G.creeps;
  const idx = arr.indexOf(unit);
  if (idx !== -1) arr.splice(idx, 1);

  // Handle neutral camp respawn
  if (unit.campId !== null) {
    const camp = _neutralCampState[unit.campId];
    if (camp) {
      camp.activeUnits = camp.activeUnits.filter(u => u !== unit);
      if (camp.activeUnits.length === 0) {
        // Camp cleared — schedule respawn
        const campDef = NEUTRAL_CAMPS.find(c => c.id === unit.campId);
        if (campDef) {
          camp.respawnTimer = campDef.respawn;
          camp.alive = false;
        }
      }
    }
  }
}

// ── _findTarget ───────────────────────────────────────────────
// Priority for lane creeps: enemy creeps → hero (if attacked) → towers → barracks → ancient
function _findLaneTarget(unit) {
  // 1. Enemy creeps in aggro range
  let best = null;
  let bestDist = Infinity;

  for (const c of G.creeps) {
    if (!c.alive || c.team === unit.team) continue;
    const d = _dist(unit.position, c.position);
    if (d <= unit.aggroRadius && d < bestDist) {
      best = c;
      bestDist = d;
    }
  }
  if (best) return best;

  // 2. Allied hero attacked first (aggro)
  if (unit.attackedBy) {
    const hero = unit.attackedBy;
    if (hero.alive !== false && hero.team !== unit.team) {
      const d = _dist(unit.position, hero.position || hero.group?.position);
      if (d <= unit.aggroRadius * 2) {
        return hero;
      }
    } else {
      unit.attackedBy = null;
    }
  }

  // 3. Enemy heroes in aggro range (only if no creep target)
  for (const h of G.heroes) {
    if (!h.alive && h.alive !== undefined) continue;
    if (h.team === unit.team) continue;
    const hPos = h.position || h.group?.position;
    if (!hPos) continue;
    const d = _dist(unit.position, hPos);
    if (d <= unit.aggroRadius && d < bestDist) {
      best = h;
      bestDist = d;
    }
  }
  if (best) return best;

  // 4. Enemy structures in range
  for (const s of G.structures) {
    if (!s.alive || s.team === unit.team) continue;
    if (s.type === 'tower') {
      const d = _dist2(unit.position.x, unit.position.z, s.position.x, s.position.z);
      if (d <= unit.aggroRadius && d < bestDist) {
        best = s;
        bestDist = d;
      }
    }
  }
  if (best) return best;

  return null;
}

// ── _findNeutralTarget ─────────────────────────────────────────
function _findNeutralTarget(unit) {
  let best = null;
  let bestDist = Infinity;

  for (const h of G.heroes) {
    if (h.alive === false) continue;
    const hPos = h.position || h.group?.position;
    if (!hPos) continue;
    const d = _dist(unit.position, hPos);
    if (d <= unit.aggroRadius && d < bestDist) {
      best = h;
      bestDist = d;
    }
  }

  // Also target enemy creeps that wander near
  for (const c of G.creeps) {
    if (!c.alive) continue;
    const d = _dist(unit.position, c.position);
    if (d <= unit.aggroRadius && d < bestDist) {
      best = c;
      bestDist = d;
    }
  }

  return best;
}

// ── _attackTarget ──────────────────────────────────────────────
function _attackCreepTarget(unit, target, t) {
  if (!target) return;
  const elapsed = t - unit.lastAttackTime;
  if (elapsed < unit.attackInterval) return;
  unit.lastAttackTime = t;

  const targetPos = target.position || (target.group ? target.group.position : null);
  if (!targetPos) return;

  const d = _dist(unit.position, targetPos);
  if (d > unit.attackRange) return;

  // Fire projectile for ranged, immediate for melee
  if (unit.type === 'ranged') {
    const from = { x: unit.position.x, y: 1.0, z: unit.position.z };
    const to   = { x: targetPos.x,     y: 1.0, z: targetPos.z };
    spawnProjectile(from, to, unit.team === 'sentinel' ? 0x44ff88 : 0xff4422, 18, () => {
      if (target.alive !== false) {
        _applyDamageToTarget(unit, target);
      }
    });
  } else {
    _applyDamageToTarget(unit, target);
  }
}

function _applyDamageToTarget(attacker, target) {
  // Deny: allied creep below 50% HP attacked by ally
  const isDeny = (
    target.team === attacker.team &&
    target.hp <= target.maxHp * 0.5 &&
    (target.type === 'melee' || target.type === 'ranged') &&
    target.campId === null
  );

  _applyDamageSimple(target, attacker.damage);

  if (isDeny) {
    // Deny: no gold to enemy, 50% XP to nearby enemies
    const enemyTeam = target.team === 'sentinel' ? 'scourge' : 'sentinel';
    const nearby = _nearbyHeroes(target.position, 8, enemyTeam);
    const xpEach = nearby.length > 0 ? Math.floor(target.xpReward * 0.5 / nearby.length) : 0;
    for (const h of nearby) _grantXP(h, xpEach);
  }

  if (target.hp <= 0) {
    // Determine killer: if attacker is a hero, they get credit
    const killer = (attacker.gold !== undefined) ? attacker : null;
    if (target.alive) {
      if (target.campId !== null || G.neutrals.includes(target)) {
        _killNeutral(target, killer);
      } else {
        _killCreep(target, killer);
      }
    }
  }
}

// ── _killNeutral ───────────────────────────────────────────────
function _killNeutral(unit, killer) {
  if (!unit.alive) return;
  unit.alive = false;
  unit.hp = 0;

  spawnBurst(unit.position, 0xaaaa44, 4, 3);

  if (killer) {
    _grantGold(killer, unit.bounty);
    _grantXP(killer, unit.xpReward);
  }

  setTimeout(() => {
    if (unit.group && unit.group.parent) {
      scene.remove(unit.group);
    }
  }, 800);

  const idx = G.neutrals.indexOf(unit);
  if (idx !== -1) G.neutrals.splice(idx, 1);

  if (unit.campId !== null) {
    const camp = _neutralCampState[unit.campId];
    if (camp) {
      camp.activeUnits = camp.activeUnits.filter(u => u !== unit);
      if (camp.activeUnits.length === 0) {
        const campDef = NEUTRAL_CAMPS.find(c => c.id === unit.campId);
        if (campDef) {
          camp.respawnTimer = campDef.respawn;
          camp.alive = false;
        }
      }
    }
  }
}

// ── _moveCreepTowardWaypoint ──────────────────────────────────
function _moveCreepTowardWaypoint(unit, dt) {
  const wp = unit.waypointList;
  if (!wp || unit.waypointIndex >= wp.length) return;

  const target = wp[unit.waypointIndex];
  const dx = target.x - unit.position.x;
  const dz = target.z - unit.position.z;
  const dist = Math.sqrt(dx * dx + dz * dz);

  if (dist < 0.4) {
    unit.waypointIndex++;
    return;
  }

  const speed = unit.moveSpeed * dt;
  unit.position.x += (dx / dist) * speed;
  unit.position.z += (dz / dist) * speed;

  // Face direction of movement
  if (dist > 0.01) {
    const targetY = Math.atan2(dx, dz);
    let delta = targetY - unit.group.rotation.y;
    while (delta >  Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    unit.group.rotation.y += delta * 0.2;
  }
}

// ── spawnCreepWave ────────────────────────────────────────────
export function spawnCreepWave(lane, team) {
  const waypoints = LANE_WAYPOINTS[lane];
  if (!waypoints || waypoints.length === 0) return;

  // Scourge travels from index 0 → end, Sentinel travels reversed
  let wpList, startWp;
  if (team === 'scourge') {
    wpList = waypoints.slice(); // index 0 = scourge base
    startWp = waypoints[0];
  } else {
    wpList = [...waypoints].reverse(); // reversed: index 0 = sentinel base
    startWp = waypoints[waypoints.length - 1];
  }

  // Mega creeps: opponent's barracks fell for this lane
  const enemyTeam = team === 'sentinel' ? 'scourge' : 'sentinel';
  const mega = _fallenBarracks[enemyTeam]?.[lane] === true;

  // Spawn 3 melee + 1 ranged with slight spread
  const offsets = [
    { x: -0.6, z: -0.6 },
    { x:  0.6, z: -0.6 },
    { x:  0.0, z:  0.0 },
    { x:  0.0, z:  1.0 },  // ranged behind
  ];

  const types = ['melee', 'melee', 'melee', 'ranged'];

  for (let i = 0; i < 4; i++) {
    const creep = _makeCreepUnit({
      team,
      lane,
      type: types[i],
      waypointIndex: 1, // start navigating to second waypoint
      waypointList: wpList,
      isMega: mega,
      posX: startWp.x + offsets[i].x,
      posZ: startWp.z + offsets[i].z,
      campId: null,
    });
    G.creeps.push(creep);
  }
}

// ── spawnNeutralCamp ──────────────────────────────────────────
export function spawnNeutralCamp(campDef) {
  if (!_neutralCampState[campDef.id]) {
    _neutralCampState[campDef.id] = { alive: true, activeUnits: [], respawnTimer: 0 };
  }

  const camp = _neutralCampState[campDef.id];
  camp.alive = true;
  camp.activeUnits = [];

  const centerX = campDef.pos[0];
  const centerZ = campDef.pos[2];

  let spawnedCount = 0;
  for (const unitDef of campDef.units) {
    for (let i = 0; i < unitDef.count; i++) {
      const angle = (spawnedCount / 4) * Math.PI * 2;
      const spread = 1.5;
      const px = centerX + Math.cos(angle) * spread;
      const pz = centerZ + Math.sin(angle) * spread;

      const stats = CREEP_STATS[unitDef.type] || CREEP_STATS.small;
      const bounty = _randInt(
        Math.floor(campDef.goldRange[0] / campDef.units.reduce((a, u) => a + u.count, 0)),
        Math.floor(campDef.goldRange[1] / campDef.units.reduce((a, u) => a + u.count, 0)),
      );

      const group = getCreepModel(unitDef.type, 'neutral', false);
      group.position.set(px, 0, pz);
      scene.add(group);

      const id = `neutral_${++_neutralIdCounter}`;

      const unit = {
        id,
        team: 'neutral',
        lane: null,
        type: unitDef.type,
        campId: campDef.id,
        position: group.position,
        hp: stats.hp,
        maxHp: stats.hp,
        damage: stats.damage,
        armor: stats.armor,
        attackRange: stats.attackRange,
        moveSpeed: stats.moveSpeed,
        bounty,
        xpReward: Math.floor(campDef.xp / campDef.units.reduce((a, u) => a + u.count, 0)),
        aggroRadius: stats.aggroRadius || 6,
        waypointIndex: 0,
        waypointList: null,
        alive: true,
        group,
        lastAttackTime: 0,
        attackInterval: 1.0 / (stats.attackSpeed || 1.0),
        statusEffects: [],
        isMega: false,
        target: null,
        state: { anim: 'idle', _animAge: 0 },
        campCenter: { x: centerX, z: centerZ },
        leashRadius: 20,
        returning: false,
      };

      G.neutrals.push(unit);
      camp.activeUnits.push(unit);
      spawnedCount++;
    }
  }
}

// ── initCreeps ────────────────────────────────────────────────
export function initCreeps() {
  // Spawn first wave for all 3 lanes × 2 teams
  for (const lane of ['top', 'mid', 'bot']) {
    for (const team of ['sentinel', 'scourge']) {
      spawnCreepWave(lane, team);
    }
  }

  // Spawn all neutral camps
  for (const campDef of NEUTRAL_CAMPS) {
    spawnNeutralCamp(campDef);
  }

  // Reset spawn timer
  G.nextCreepSpawn = CREEP_SPAWN_INTERVAL;
}

// ── _updateLaneCreep ──────────────────────────────────────────
function _updateLaneCreep(unit, dt, t) {
  if (!unit.alive) return;

  _updateHPBar(unit);

  // Check if unit reached end of waypoints → attack structures/ancient there
  const atEnd = unit.waypointIndex >= unit.waypointList.length;

  // Find a target in attack range
  const attackTarget = _findLaneTarget(unit);

  if (attackTarget) {
    const targetPos = attackTarget.position || (attackTarget.group ? attackTarget.group.position : null);
    if (targetPos) {
      const d = _dist(unit.position, targetPos);
      if (d <= unit.attackRange) {
        // In range: stop and attack
        unit.state.anim = 'attack';
        _attackCreepTarget(unit, attackTarget, t);
        return;
      } else if (d <= unit.aggroRadius) {
        // Move toward target
        unit.state.anim = 'walk';
        const dx = targetPos.x - unit.position.x;
        const dz = targetPos.z - unit.position.z;
        const speed = unit.moveSpeed * dt;
        unit.position.x += (dx / d) * speed;
        unit.position.z += (dz / d) * speed;

        const targetY = Math.atan2(dx, dz);
        let delta = targetY - unit.group.rotation.y;
        while (delta >  Math.PI) delta -= Math.PI * 2;
        while (delta < -Math.PI) delta += Math.PI * 2;
        unit.group.rotation.y += delta * 0.2;
        return;
      }
    }
  }

  if (!atEnd) {
    // March to next waypoint
    unit.state.anim = 'walk';
    _moveCreepTowardWaypoint(unit, dt);
  } else {
    unit.state.anim = 'idle';
    // At enemy base — look for structures to attack
    const structTarget = G.structures.find(s => {
      if (!s.alive || s.team === unit.team) return false;
      const d = _dist2(unit.position.x, unit.position.z, s.position.x, s.position.z);
      return d <= unit.attackRange * 2;
    });
    if (structTarget) {
      _attackCreepTarget(unit, structTarget, t);
    }
  }
}

// ── _updateNeutralCreep ────────────────────────────────────────
function _updateNeutralCreep(unit, dt, t) {
  if (!unit.alive) return;

  _updateHPBar(unit);

  const center = unit.campCenter;

  // Check leash distance
  if (center) {
    const leashDist = _dist2(unit.position.x, unit.position.z, center.x, center.z);
    if (leashDist > unit.leashRadius) {
      unit.returning = true;
      unit.target = null;
    }
  }

  if (unit.returning) {
    // Return to camp center
    unit.state.anim = 'walk';
    const dx = center.x - unit.position.x;
    const dz = center.z - unit.position.z;
    const d = Math.sqrt(dx * dx + dz * dz);
    if (d < 0.5) {
      unit.returning = false;
      unit.state.anim = 'idle';
    } else {
      const speed = unit.moveSpeed * 1.2 * dt;
      unit.position.x += (dx / d) * speed;
      unit.position.z += (dz / d) * speed;
    }
    return;
  }

  // Find target
  const target = _findNeutralTarget(unit);
  unit.target = target;

  if (target) {
    const targetPos = target.position || (target.group ? target.group.position : null);
    if (targetPos) {
      const d = _dist(unit.position, targetPos);
      if (d <= unit.attackRange) {
        unit.state.anim = 'attack';
        _attackCreepTarget(unit, target, t);
      } else {
        unit.state.anim = 'walk';
        const dx = targetPos.x - unit.position.x;
        const dz = targetPos.z - unit.position.z;
        const speed = unit.moveSpeed * dt;
        unit.position.x += (dx / d) * speed;
        unit.position.z += (dz / d) * speed;
      }
    }
  } else {
    // Idle at camp — gentle wander
    unit.state.anim = 'idle';
  }
}

// ── updateCreeps ──────────────────────────────────────────────
export function updateCreeps(dt, t) {
  // Wave spawn timer
  G.nextCreepSpawn -= dt;
  if (G.nextCreepSpawn <= 0) {
    G.nextCreepSpawn = CREEP_SPAWN_INTERVAL;
    G.creepWave = (G.creepWave || 0) + 1;

    for (const lane of ['top', 'mid', 'bot']) {
      for (const team of ['sentinel', 'scourge']) {
        spawnCreepWave(lane, team);
      }
    }
  }

  // Update all lane creeps (iterate backwards for safe removal)
  for (let i = G.creeps.length - 1; i >= 0; i--) {
    const unit = G.creeps[i];
    if (!unit.alive) {
      G.creeps.splice(i, 1);
      continue;
    }
    _updateLaneCreep(unit, dt, t);
  }

  // Update all neutral units
  for (let i = G.neutrals.length - 1; i >= 0; i--) {
    const unit = G.neutrals[i];
    if (!unit.alive) {
      G.neutrals.splice(i, 1);
      continue;
    }
    _updateNeutralCreep(unit, dt, t);
  }

  // Neutral camp respawn timers
  for (const campDef of NEUTRAL_CAMPS) {
    const camp = _neutralCampState[campDef.id];
    if (!camp || camp.alive) continue;

    camp.respawnTimer -= dt;
    if (camp.respawnTimer <= 0) {
      spawnNeutralCamp(campDef);
    }
  }
}

// ── Mega creep upgrade (called by towers.js via event listener) ─
export function upgradeMegaCreeps(lane, team) {
  _fallenBarracks[team] = _fallenBarracks[team] || {};
  _fallenBarracks[team][lane] = true;

  // Existing creeps in that lane for that team become mega
  for (const unit of G.creeps) {
    if (unit.team === team && unit.lane === lane && !unit.isMega) {
      unit.isMega = true;
      unit.maxHp *= 2;
      unit.hp = Math.min(unit.hp * 2, unit.maxHp);
      unit.damage *= 2;
      unit.moveSpeed *= 1.1;

      // Update visuals — replace model
      const oldGroup = unit.group;
      const newGroup = getCreepModel(unit.type, unit.team, true);
      newGroup.position.copy(oldGroup.position);
      newGroup.rotation.copy(oldGroup.rotation);
      scene.remove(oldGroup);
      scene.add(newGroup);
      unit.group = newGroup;
      unit.position = newGroup.position;
    }
  }
}

// Listen for barracks destruction events
if (typeof window !== 'undefined') {
  window.addEventListener('barracksDestroyed', (e) => {
    const { lane, team } = e.detail;
    // The enemy team's creeps become mega (the team whose barracks fell = enemy gains mega)
    const beneficiary = team === 'sentinel' ? 'scourge' : 'sentinel';
    upgradeMegaCreeps(lane, beneficiary);
  });
}
