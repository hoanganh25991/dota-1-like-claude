// ============================================================
// towers.js — Towers, barracks, ancients for Crimson Lane
// THREE is a global loaded via CDN script tag.
// ============================================================

import { scene } from './scene.js';
import { G } from './state.js';
import { STRUCTURES, TOWER_STATS } from './constants.js';
import { spawnProjectile, spawnBurst } from './particles.js';

// ── Exported state ────────────────────────────────────────────
export let structures = [];

// ── Constants ─────────────────────────────────────────────────
const TOWER_FIRE_RATE = 1.2; // seconds between shots

const TEAM_COLORS = {
  sentinel: { body: 0x004422, emissive: 0x00cc55, orb: 0x00ff88 },
  scourge:  { body: 0x660000, emissive: 0xcc2200, orb: 0xff4422 },
};

// ── Utility ──────────────────────────────────────────────────
function _dist2(ax, az, bx, bz) {
  const dx = ax - bx;
  const dz = az - bz;
  return Math.sqrt(dx * dx + dz * dz);
}


function _enemyTeam(team) {
  return team === 'sentinel' ? 'scourge' : 'sentinel';
}

// ── 3D Model builders ─────────────────────────────────────────

function _buildTowerModel(tier, team) {
  const group = new THREE.Group();
  const colors = TEAM_COLORS[team] || TEAM_COLORS.scourge;
  const height = 1.8 + tier * 0.45;

  // Base plinth
  const plinthGeo = new THREE.CylinderGeometry(0.85, 1.0, 0.35, 8);
  const plinthMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9, metalness: 0.3 });
  const plinth = new THREE.Mesh(plinthGeo, plinthMat);
  plinth.position.y = 0.175;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  group.add(plinth);

  // Main shaft (cylinder)
  const shaftGeo = new THREE.CylinderGeometry(0.35, 0.5, height, 8);
  const shaftMat = new THREE.MeshStandardMaterial({
    color: colors.body,
    roughness: 0.55,
    metalness: 0.35,
    emissive: new THREE.Color(colors.emissive),
    emissiveIntensity: 0.15,
  });
  const shaft = new THREE.Mesh(shaftGeo, shaftMat);
  shaft.position.y = 0.35 + height / 2;
  shaft.castShadow = true;
  group.add(shaft);

  // Platform box near top
  const platformGeo = new THREE.BoxGeometry(1.1, 0.25, 1.1);
  const platform = new THREE.Mesh(platformGeo, shaftMat);
  platform.position.y = 0.35 + height - 0.05;
  platform.castShadow = true;
  group.add(platform);

  // Corner battlements on platform (4 small columns)
  const merlon = new THREE.BoxGeometry(0.22, 0.35, 0.22);
  const merlonMat = new THREE.MeshStandardMaterial({ color: colors.body, roughness: 0.7, metalness: 0.2 });
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const m = new THREE.Mesh(merlon, merlonMat);
    m.position.set(
      Math.cos(angle) * 0.42,
      0.35 + height + 0.1,
      Math.sin(angle) * 0.42,
    );
    m.castShadow = true;
    group.add(m);
  }

  // Glowing orb on top
  const orbGeo = new THREE.SphereGeometry(0.28, 10, 8);
  const orbMat = new THREE.MeshStandardMaterial({
    color: colors.orb,
    emissive: new THREE.Color(colors.orb),
    emissiveIntensity: 1.0,
    roughness: 0.05,
    metalness: 0.0,
  });
  const orb = new THREE.Mesh(orbGeo, orbMat);
  orb.position.y = 0.35 + height + 0.5;
  orb.name = '_orb';
  group.add(orb);

  // Point light from orb
  const orbLight = new THREE.PointLight(colors.orb, 1.2, 8, 2);
  orbLight.position.y = 0.35 + height + 0.6;
  group.add(orbLight);

  // HP bar
  _addHPBar(group, height + 1.8);

  return group;
}

function _buildBarracksModel(team) {
  const group = new THREE.Group();
  const colors = TEAM_COLORS[team] || TEAM_COLORS.scourge;

  const bodyMat = new THREE.MeshStandardMaterial({
    color: colors.body,
    roughness: 0.75,
    metalness: 0.15,
    emissive: new THREE.Color(colors.emissive),
    emissiveIntensity: 0.1,
  });

  const darkMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9, metalness: 0.1 });
  const roofMat = new THREE.MeshStandardMaterial({
    color: team === 'sentinel' ? 0x003318 : 0x440000,
    roughness: 0.8,
    metalness: 0.1,
  });

  // Ground floor
  const floorGeo = new THREE.BoxGeometry(2.6, 1.2, 2.6);
  const floor = new THREE.Mesh(floorGeo, bodyMat);
  floor.position.y = 0.6;
  floor.castShadow = true;
  floor.receiveShadow = true;
  group.add(floor);

  // Second story (narrower)
  const upperGeo = new THREE.BoxGeometry(2.0, 0.9, 2.0);
  const upper = new THREE.Mesh(upperGeo, bodyMat);
  upper.position.y = 1.65;
  upper.castShadow = true;
  group.add(upper);

  // Roof
  const roofGeo = new THREE.BoxGeometry(2.2, 0.25, 2.2);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = 2.22;
  roof.castShadow = true;
  group.add(roof);

  // Roof ridge
  const ridgeGeo = new THREE.BoxGeometry(0.3, 0.3, 2.2);
  const ridge = new THREE.Mesh(ridgeGeo, roofMat);
  ridge.position.y = 2.5;
  group.add(ridge);

  // Windows (darker inset boxes)
  const winGeo = new THREE.BoxGeometry(0.4, 0.35, 0.06);
  const winPositions = [
    [0, 1.05, 1.32], [0, 1.05, -1.32],
    [1.32, 1.05, 0], [-1.32, 1.05, 0],
  ];
  for (const [wx, wy, wz] of winPositions) {
    const win = new THREE.Mesh(winGeo, darkMat);
    win.position.set(wx, wy, wz);
    if (Math.abs(wz) > Math.abs(wx)) {
      // side-facing, rotate
    } else {
      win.rotation.y = Math.PI / 2;
    }
    group.add(win);
  }

  // Door
  const doorGeo = new THREE.BoxGeometry(0.55, 0.7, 0.06);
  const door = new THREE.Mesh(doorGeo, darkMat);
  door.position.set(0, 0.35, 1.32);
  group.add(door);

  // Chimney pillars
  for (const [cx, cz] of [[-0.7, -0.7], [0.7, 0.7]]) {
    const chimGeo = new THREE.BoxGeometry(0.22, 0.55, 0.22);
    const chim = new THREE.Mesh(chimGeo, roofMat);
    chim.position.set(cx, 2.6, cz);
    chim.castShadow = true;
    group.add(chim);
  }

  // HP bar
  _addHPBar(group, 3.2);

  return group;
}

function _buildAncientModel(team) {
  const group = new THREE.Group();
  const colors = TEAM_COLORS[team] || TEAM_COLORS.scourge;

  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.85, metalness: 0.3 });
  const bodyMat = new THREE.MeshStandardMaterial({
    color: colors.body,
    roughness: 0.45,
    metalness: 0.5,
    emissive: new THREE.Color(colors.emissive),
    emissiveIntensity: 0.25,
  });
  const coreMat = new THREE.MeshStandardMaterial({
    color: colors.orb,
    emissive: new THREE.Color(colors.orb),
    emissiveIntensity: 1.4,
    roughness: 0.0,
    metalness: 0.0,
  });

  // Wide stone base
  const baseGeo = new THREE.CylinderGeometry(3.2, 3.8, 0.55, 12);
  const base = new THREE.Mesh(baseGeo, stoneMat);
  base.position.y = 0.275;
  base.receiveShadow = true;
  group.add(base);

  // Second tier
  const tier2Geo = new THREE.CylinderGeometry(2.2, 2.8, 0.45, 10);
  const tier2 = new THREE.Mesh(tier2Geo, stoneMat);
  tier2.position.y = 0.775;
  tier2.castShadow = true;
  group.add(tier2);

  // Central obelisk body
  const obeliskGeo = new THREE.BoxGeometry(2.2, 4.5, 2.2);
  const obelisk = new THREE.Mesh(obeliskGeo, bodyMat);
  obelisk.position.y = 3.25;
  obelisk.castShadow = true;
  group.add(obelisk);

  // Tapered pyramid cap
  const capGeo = new THREE.CylinderGeometry(0.05, 1.35, 1.8, 5);
  const cap = new THREE.Mesh(capGeo, bodyMat);
  cap.position.y = 6.4;
  cap.castShadow = true;
  group.add(cap);

  // Mystical core orb (floating in center of obelisk)
  const coreGeo = new THREE.SphereGeometry(0.9, 14, 12);
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.y = 2.8;
  core.name = '_core';
  group.add(core);

  // Inner ring around core
  const ringGeo = new THREE.TorusGeometry(1.3, 0.1, 6, 32);
  const ring = new THREE.Mesh(ringGeo, coreMat);
  ring.position.y = 2.8;
  ring.rotation.x = Math.PI / 2;
  ring.name = '_ring';
  group.add(ring);

  // Four corner pillars
  const pillarMat = new THREE.MeshStandardMaterial({
    color: colors.body,
    roughness: 0.5,
    metalness: 0.5,
    emissive: new THREE.Color(colors.emissive),
    emissiveIntensity: 0.2,
  });
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const r = 2.7;
    const pillarGeo = new THREE.CylinderGeometry(0.32, 0.42, 3.5, 7);
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.set(Math.cos(angle) * r, 1.75 + 0.275, Math.sin(angle) * r);
    pillar.castShadow = true;
    group.add(pillar);

    // Small orb atop each pillar
    const pOrbGeo = new THREE.SphereGeometry(0.22, 7, 6);
    const pOrb = new THREE.Mesh(pOrbGeo, coreMat);
    pOrb.position.set(Math.cos(angle) * r, 3.8, Math.sin(angle) * r);
    group.add(pOrb);
  }

  // Strong point light
  const ancientLight = new THREE.PointLight(colors.orb, 3.0, 28, 2);
  ancientLight.position.y = 4.5;
  group.add(ancientLight);

  // HP bar (high above)
  _addHPBar(group, 8.5);

  return group;
}

function _addHPBar(group, yHeight) {
  const bgGeo = new THREE.BoxGeometry(1.2, 0.1, 0.05);
  const bgMat = new THREE.MeshStandardMaterial({ color: 0x330000, roughness: 1.0 });
  const bg = new THREE.Mesh(bgGeo, bgMat);
  bg.position.y = yHeight;
  bg.name = '_hpBg';
  group.add(bg);

  const barGeo = new THREE.BoxGeometry(1.2, 0.1, 0.06);
  const barMat = new THREE.MeshStandardMaterial({ color: 0x00dd44, roughness: 1.0 });
  const bar = new THREE.Mesh(barGeo, barMat);
  bar.position.y = yHeight;
  bar.name = '_hpBar';
  group.add(bar);
}

function _updateHPBar(struct) {
  const bar = struct.group.getObjectByName('_hpBar');
  if (!bar) return;
  const frac = Math.max(0, struct.hp / struct.maxHp);
  bar.scale.x = frac;
  bar.position.x = (frac - 1.0) * 0.6;
  const col = bar.material.color;
  if (frac > 0.5) col.set(0x00dd44);
  else if (frac > 0.25) col.set(0xddaa00);
  else col.set(0xdd2200);
}

// ── initStructures ────────────────────────────────────────────
export function initStructures() {
  structures = [];
  G.structures = structures;

  for (const def of STRUCTURES) {
    const [px, , pz] = def.pos;

    let group;
    let attackRange = 0;
    let damage = 0;
    let armor = 0;
    let tier = def.tier || 0;

    if (def.type === 'tower') {
      const tStats = TOWER_STATS[`t${def.tier}`] || TOWER_STATS.t1;
      group = _buildTowerModel(def.tier, def.team);
      attackRange = tStats.attackRange;
      damage = tStats.damage;
      armor = tStats.armor;
    } else if (def.type === 'barracks') {
      group = _buildBarracksModel(def.team);
      attackRange = 0;
      damage = 0;
      armor = 5;
    } else if (def.type === 'ancient') {
      group = _buildAncientModel(def.team);
      attackRange = 14;
      damage = 200;
      armor = 10;
    }

    group.position.set(px, 0, pz);
    scene.add(group);

    const struct = {
      id: def.id,
      type: def.type,
      team: def.team,
      tier,
      lane: def.lane || 'base',
      subtype: def.subtype || null,
      hp: def.hp,
      maxHp: def.maxHp,
      armor,
      position: { x: px, z: pz },
      group,
      alive: true,
      lastAttackTime: 0,
      attackRange,
      damage,
      currentTarget: null,
      _orbPulsePhase: Math.random() * Math.PI * 2,
    };

    structures.push(struct);
  }

  G.structures = structures;
}

// ── getStructure ──────────────────────────────────────────────
export function getStructure(id) {
  return structures.find(s => s.id === id) || null;
}

// ── damageStructure ───────────────────────────────────────────
export function damageStructure(struct, amount, _source) {
  if (!struct || !struct.alive) return;

  // Physical damage reduction
  const armorReduction = struct.armor / (struct.armor + 14);
  const effective = amount * (1 - armorReduction);
  struct.hp -= effective;

  _updateHPBar(struct);

  // Flash effect on hit
  struct.group.traverse(child => {
    if (child.isMesh && child.material) {
      child.material.emissiveIntensity = (child.material.emissiveIntensity || 0) + 0.4;
      setTimeout(() => {
        if (child.material) {
          child.material.emissiveIntensity = Math.max(0, child.material.emissiveIntensity - 0.4);
        }
      }, 120);
    }
  });

  if (struct.hp <= 0) {
    _destroyStructure(struct, _source);
  }
}

// ── _destroyStructure ─────────────────────────────────────────
function _destroyStructure(struct, _source) {
  if (!struct.alive) return;
  struct.alive = false;
  struct.hp = 0;

  // VFX
  const pos = { x: struct.position.x, y: 1.5, z: struct.position.z };
  spawnBurst(pos, struct.team === 'sentinel' ? 0x00cc55 : 0xcc2200, 12, 8);
  spawnBurst(pos, 0xffffff, 6, 5);

  // Remove 3D model
  if (struct.group && struct.group.parent) {
    scene.remove(struct.group);
  }

  // Gold + XP rewards to nearby enemies
  const killerTeam = _enemyTeam(struct.team);

  if (struct.type === 'tower') {
    const tStats = TOWER_STATS[`t${struct.tier}`] || TOWER_STATS.t1;
    const nearbyEnemies = G.heroes.filter(h => {
      if (!h || h.alive === false || h.team !== killerTeam) return false;
      const hPos = h.position || h.group?.position;
      if (!hPos) return false;
      return _dist2(struct.position.x, struct.position.z, hPos.x, hPos.z) <= 15;
    });

    const goldEach = nearbyEnemies.length > 0 ? Math.floor(tStats.goldBounty / nearbyEnemies.length) : 0;
    const xpEach   = nearbyEnemies.length > 0 ? Math.floor(tStats.xpBounty   / nearbyEnemies.length) : 0;

    for (const h of nearbyEnemies) {
      h.gold = (h.gold || 0) + goldEach;
      if (h.xp !== undefined) {
        h.xp = (h.xp || 0) + xpEach;
      }
    }

    // Dispatch event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('towerDestroyed', {
        detail: { id: struct.id, team: struct.team, lane: struct.lane, tier: struct.tier },
      }));
    }
  }

  if (struct.type === 'barracks') {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('barracksDestroyed', {
        detail: { id: struct.id, team: struct.team, lane: struct.lane, subtype: struct.subtype },
      }));
    }
  }

  if (struct.type === 'ancient') {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ancientDestroyed', {
        detail: { id: struct.id, team: struct.team },
      }));
    }
    // End match
    G.matchResult = struct.team === G.playerSide ? 'defeat' : 'victory';
    G.running = false;
  }
}

// ── _findTowerTarget ──────────────────────────────────────────
// Tower target priority:
//   1. Enemy creep attacking a friendly creep under tower
//   2. Any enemy creep in range
//   3. Enemy hero (aggro'd or last to attack allied hero under protection)
function _findTowerTarget(struct) {
  const enemyTeam = _enemyTeam(struct.team);
  const range = struct.attackRange;

  let best = null;
  let bestPriority = Infinity;
  let bestDist = Infinity;

  // Priority values: lower = higher priority
  const PRI_CREEP_ATTACKING = 1;
  const PRI_CREEP           = 2;
  const PRI_HERO            = 3;

  // Check enemy creeps
  for (const c of G.creeps) {
    if (!c.alive || c.team !== enemyTeam) continue;
    const d = _dist2(struct.position.x, struct.position.z, c.position.x, c.position.z);
    if (d > range) continue;

    // Higher priority if this creep is attacking one of our creeps
    let pri = PRI_CREEP;
    if (c.target && c.target.team === struct.team && c.target.alive) {
      pri = PRI_CREEP_ATTACKING;
    }

    if (pri < bestPriority || (pri === bestPriority && d < bestDist)) {
      best = c;
      bestPriority = pri;
      bestDist = d;
    }
  }

  if (best && bestPriority <= PRI_CREEP) return best;

  // Check enemy heroes
  for (const h of G.heroes) {
    if (h.alive === false || h.team !== enemyTeam) continue;
    const hPos = h.position || h.group?.position;
    if (!hPos) continue;
    const d = _dist2(struct.position.x, struct.position.z, hPos.x, hPos.z);
    if (d > range) continue;

    if (d < bestDist || bestPriority > PRI_HERO) {
      best = h;
      bestPriority = PRI_HERO;
      bestDist = d;
    }
  }

  return best;
}

// ── _towerAttack ──────────────────────────────────────────────
function _towerAttack(struct, target, t) {
  if (!target || !struct.alive) return;

  const elapsed = t - struct.lastAttackTime;
  if (elapsed < TOWER_FIRE_RATE) return;

  const targetPos = target.position || (target.group ? target.group.position : null);
  if (!targetPos) return;

  const d = _dist2(struct.position.x, struct.position.z, targetPos.x, targetPos.z);
  if (d > struct.attackRange) return;

  struct.lastAttackTime = t;
  struct.currentTarget = target;

  const from = {
    x: struct.position.x,
    y: (struct.type === 'tower' ? 1.8 + (struct.tier || 1) * 0.45 + 0.5 : 3.5),
    z: struct.position.z,
  };
  const to = {
    x: targetPos.x,
    y: (targetPos.y || 0) + 0.8,
    z: targetPos.z,
  };

  const towerColor = struct.team === 'sentinel' ? 0x88ffcc : 0xff8844;

  spawnProjectile(from, to, towerColor, 22, () => {
    // On hit: apply damage
    if (!struct.alive) return;
    if (target.alive === false) return;

    if (target.campId !== undefined) {
      // Creep or neutral
      target.hp -= struct.damage * (1 - (target.armor / (target.armor + 14)));
      if (target.hp <= 0 && target.alive) {
        target.alive = false;
        spawnBurst(targetPos, 0xffcc44, 4, 3);
        // Remove from arrays
        const arr = target.campId !== null ? G.neutrals : G.creeps;
        const idx = arr.indexOf(target);
        if (idx !== -1) arr.splice(idx, 1);
        setTimeout(() => {
          if (target.group && target.group.parent) scene.remove(target.group);
        }, 600);
      }
    } else if (target.type !== undefined && target.position !== undefined) {
      // Hero-like entity (has hp directly)
      const armorRed = (target.armor || 0) / ((target.armor || 0) + 14);
      target.hp = (target.hp || 0) - struct.damage * (1 - armorRed);
    } else {
      // Structure
      damageStructure(target, struct.damage, struct);
    }
  });
}

// ── _animateAncientCore ────────────────────────────────────────
function _animateAncientCore(struct, t) {
  const core = struct.group.getObjectByName('_core');
  const ring = struct.group.getObjectByName('_ring');
  if (core) {
    core.position.y = 2.8 + Math.sin(t * 1.8 + struct._orbPulsePhase) * 0.15;
    core.rotation.y = t * 0.7;
  }
  if (ring) {
    ring.rotation.z = t * 1.2;
    ring.rotation.x = Math.PI / 2 + Math.sin(t * 0.9) * 0.2;
  }
}

function _animateTowerOrb(struct, t) {
  const orb = struct.group.getObjectByName('_orb');
  if (orb && orb.material) {
    orb.material.emissiveIntensity = 0.7 + Math.sin(t * 2.5 + struct._orbPulsePhase) * 0.3;
  }
}

// ── updateStructures ──────────────────────────────────────────
export function updateStructures(dt, t) {
  for (let i = structures.length - 1; i >= 0; i--) {
    const struct = structures[i];

    if (!struct.alive) {
      structures.splice(i, 1);
      continue;
    }

    // Animate
    if (struct.type === 'ancient') {
      _animateAncientCore(struct, t);
    } else if (struct.type === 'tower') {
      _animateTowerOrb(struct, t);
    }

    // Tower attack logic
    if (struct.type === 'tower' || struct.type === 'ancient') {
      const target = _findTowerTarget(struct);
      if (target) {
        _towerAttack(struct, target, t);

        // Rotate tower toward target
        const targetPos = target.position || (target.group ? target.group.position : null);
        if (targetPos) {
          const dx = targetPos.x - struct.position.x;
          const dz = targetPos.z - struct.position.z;
          const targetY = Math.atan2(dx, dz);
          let delta = targetY - struct.group.rotation.y;
          while (delta >  Math.PI) delta -= Math.PI * 2;
          while (delta < -Math.PI) delta += Math.PI * 2;
          struct.group.rotation.y += delta * Math.min(dt * 4.0, 1.0);
        }
      } else {
        // Idle rotation
        struct.group.rotation.y += dt * 0.25;
        struct.currentTarget = null;
      }
    }

    // Update HP bar
    _updateHPBar(struct);
  }
}
