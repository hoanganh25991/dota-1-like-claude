// ============================================================
// map.js — Map geometry for Crimson Lane
// Builds the 100x100 play field: ground, lanes, river, jungle,
// base pads, fountains, and tower placeholder meshes.
// THREE is a global loaded via CDN script tag.
// ============================================================

import { scene } from './scene.js';
import { STRUCTURES } from './constants.js';

export let mapGroup; // THREE.Group containing all map geometry

// ── Material cache ────────────────────────────────────────────
function _mat(color, roughness = 0.85, metalness = 0.0, emissive = null, emissiveIntensity = 0) {
  const m = new THREE.MeshStandardMaterial({ color, roughness, metalness });
  if (emissive !== null) {
    m.emissive = new THREE.Color(emissive);
    m.emissiveIntensity = emissiveIntensity;
  }
  return m;
}

// ── buildMap ──────────────────────────────────────────────────
export function buildMap() {
  mapGroup = new THREE.Group();

  _buildGround();
  _buildRiver();
  _buildLanes();
  _buildJungle();
  _buildBasePads();
  _buildFountains();
  _buildTowerPlaceholders();

  scene.add(mapGroup);
}

// ── Ground plane ─────────────────────────────────────────────
function _buildGround() {
  const geo = new THREE.PlaneGeometry(100, 100, 40, 40);
  const mat = _mat(0x1a2e1a, 0.9, 0.0);
  const ground = new THREE.Mesh(geo, mat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  mapGroup.add(ground);

  // Border trim — slightly raised thin strips around edges for visual boundary
  const borderMat = _mat(0x0f1f0f, 0.95, 0.0);
  const borderThick = 0.5;
  const borderH = 0.08;
  const borderSegs = [[0, 51.25, 100, borderThick], [0, -51.25, 100, borderThick],
                      [51.25, 0, borderThick, 100], [-51.25, 0, borderThick, 100]];
  for (const [bx, bz, bw, bd] of borderSegs) {
    const bg = new THREE.BoxGeometry(bw, borderH, bd);
    const bm = new THREE.Mesh(bg, borderMat);
    bm.position.set(bx, borderH / 2, bz);
    bm.receiveShadow = true;
    mapGroup.add(bm);
  }
}

// ── River ────────────────────────────────────────────────────
// Diagonal band crossing the map center (top-left to bottom-right axis)
// In Three.js coordinates the "center" diagonal runs along x = -z.
function _buildRiver() {
  // River is a rotated wide plane sitting just above ground
  const riverWidth = 6;
  const riverLength = 145; // long enough to cross the full diagonal
  const geo = new THREE.PlaneGeometry(riverLength, riverWidth, 60, 4);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x1a3a55,
    roughness: 0.2,
    metalness: 0.1,
    emissive: 0x071828,
    emissiveIntensity: 0.4,
  });
  const river = new THREE.Mesh(geo, mat);
  river.rotation.x = -Math.PI / 2;
  river.rotation.z = -Math.PI / 4; // 45 degrees to match diagonal
  river.position.set(0, 0.01, 0);
  river.receiveShadow = true;
  mapGroup.add(river);

  // River bank (slightly darker strip on each side)
  const bankMat = _mat(0x162a12, 0.95, 0.0);
  for (const sign of [-1, 1]) {
    const bankGeo = new THREE.PlaneGeometry(riverLength, 1.5, 60, 2);
    const bank = new THREE.Mesh(bankGeo, bankMat);
    bank.rotation.x = -Math.PI / 2;
    bank.rotation.z = -Math.PI / 4;
    // Offset perpendicular to river direction (perpendicular to 45deg is also 45deg rotated)
    const offset = (riverWidth / 2 + 0.75) * sign;
    bank.position.set(-offset * Math.sin(Math.PI / 4), 0.005, -offset * Math.cos(Math.PI / 4));
    bank.receiveShadow = true;
    mapGroup.add(bank);
  }

  // Rune spots: two circular glowing markers at common rune positions
  const runePositions = [{ x: -12, z: 12 }, { x: 12, z: -12 }];
  for (const rp of runePositions) {
    const runeGeo = new THREE.CircleGeometry(1.2, 16);
    const runeMat = new THREE.MeshStandardMaterial({
      color: 0x00ccff,
      emissive: 0x0088cc,
      emissiveIntensity: 0.6,
      roughness: 0.3,
    });
    const rune = new THREE.Mesh(runeGeo, runeMat);
    rune.rotation.x = -Math.PI / 2;
    rune.position.set(rp.x, 0.02, rp.z);
    mapGroup.add(rune);
  }
}

// ── Lane strips ───────────────────────────────────────────────
// Three lanes: mid (diagonal), top (along top edge), bot (along bottom edge)
function _buildLanes() {
  const laneMat = new THREE.MeshStandardMaterial({
    color: 0x3d4a2a,
    roughness: 0.8,
    metalness: 0.0,
  });

  // Mid lane: diagonal strip from (-40,40) to (40,-40)
  // (Scourge bottom-left to Sentinel top-right in Three.js z convention)
  _addLaneStrip(laneMat, 0, 0, 113, 3.5, -Math.PI / 4);

  // Top lane: two segments - vertical along x=-38, then horizontal along z=-38
  // From scourge base (-40,0,40) along top edge to sentinel base (40,0,-40)
  // In Three.js: Scourge is at x=-40,z=40; Sentinel at x=40,z=-40
  // Top lane goes: x=-38 from z=40 to z=0, then bends toward x=40,z=-38
  _addLaneSegment(laneMat, -38, 20, 42, 3.5, 0);        // vertical leg x=-38
  _addLaneSegment(laneMat, 0, -38, 80, 3.5, Math.PI / 2); // horizontal leg z=-38

  // Bot lane: horizontal along z=38, then vertical along x=38
  _addLaneSegment(laneMat, -10, 38, 60, 3.5, Math.PI / 2); // horizontal leg z=38
  _addLaneSegment(laneMat, 38, -5, 70, 3.5, 0);             // vertical leg x=38

  // Corner connectors near bases to visually join all three lanes
  _addLaneStrip(laneMat, -36, 30, 8, 4, Math.PI / 6);
  _addLaneStrip(laneMat, 36, -30, 8, 4, Math.PI / 6);
}

function _addLaneStrip(mat, cx, cz, length, width, rotY) {
  const geo = new THREE.PlaneGeometry(length, width, Math.round(length * 2), 2);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.rotation.z = rotY;
  mesh.position.set(cx, 0.015, cz);
  mesh.receiveShadow = true;
  mapGroup.add(mesh);
}

function _addLaneSegment(mat, cx, cz, length, width, rotY) {
  _addLaneStrip(mat, cx, cz, length, width, rotY);
}

// ── Jungle trees ──────────────────────────────────────────────
// Dense clusters of box-trees between lanes and along edges.
// Uses InstancedMesh for performance.
function _buildJungle() {
  const TREE_PLACEMENTS = _generateTreePositions();

  // Two sizes of tree: trunk (thin tall box) and canopy (slightly wider box)
  const trunkGeo = new THREE.BoxGeometry(0.4, 2.0, 0.4);
  const canopyGeo = new THREE.BoxGeometry(1.1, 1.4, 1.1);

  const trunkMat = _mat(0x2a1a0a, 0.9, 0.0);
  const canopyMat = _mat(0x0d2211, 0.85, 0.0, 0x061509, 0.15);

  const trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, TREE_PLACEMENTS.length);
  const canopyMesh = new THREE.InstancedMesh(canopyGeo, canopyMat, TREE_PLACEMENTS.length);
  trunkMesh.castShadow = true;
  trunkMesh.receiveShadow = true;
  canopyMesh.castShadow = true;
  canopyMesh.receiveShadow = true;

  const dummy = new THREE.Object3D();
  TREE_PLACEMENTS.forEach((tp, i) => {
    const { x, z, scale, rotY } = tp;

    // Trunk
    dummy.position.set(x, scale * 1.0, z);
    dummy.rotation.set(0, rotY, 0);
    dummy.scale.set(scale, scale, scale);
    dummy.updateMatrix();
    trunkMesh.setMatrixAt(i, dummy.matrix);

    // Canopy sits atop trunk
    dummy.position.set(x, scale * 2.2, z);
    dummy.scale.set(scale, scale * 0.8, scale);
    dummy.updateMatrix();
    canopyMesh.setMatrixAt(i, dummy.matrix);
  });

  trunkMesh.instanceMatrix.needsUpdate = true;
  canopyMesh.instanceMatrix.needsUpdate = true;

  mapGroup.add(trunkMesh);
  mapGroup.add(canopyMesh);
}

function _generateTreePositions() {
  // Deterministic seeded random — avoid Math.random() for reproducibility
  let seed = 42;
  function rand() {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff;
  }

  const positions = [];

  // Define jungle zones (rough regions between lanes, away from lane strips)
  const zones = [
    // Top-side jungle (between top lane and mid lane, Scourge half)
    { xMin: -46, xMax: -15, zMin: -10, zMax: 30, density: 18 },
    // Top-side jungle (Sentinel half)
    { xMin: 15, xMax: 46, zMin: -10, zMax: 30, density: 18 },
    // Bot-side jungle (between mid and bot lane, Scourge half)
    { xMin: -46, xMax: -15, zMin: -30, zMax: 10, density: 18 },
    // Bot-side jungle (Sentinel half)
    { xMin: 15, xMax: 46, zMin: -30, zMax: 10, density: 18 },
    // Edge thicket — Scourge top corner
    { xMin: -48, xMax: -36, zMin: 30, zMax: 48, density: 10 },
    // Edge thicket — Sentinel top corner
    { xMin: 36, xMax: 48, zMin: -48, zMax: -30, density: 10 },
    // Map outer borders (thin strip all around)
    { xMin: -48, xMax: 48, zMin: 42, zMax: 48, density: 14 },
    { xMin: -48, xMax: 48, zMin: -48, zMax: -42, density: 14 },
    { xMin: 42, xMax: 48, zMin: -42, zMax: 42, density: 14 },
    { xMin: -48, xMax: -42, zMin: -42, zMax: 42, density: 14 },
  ];

  for (const zone of zones) {
    for (let n = 0; n < zone.density; n++) {
      const x = zone.xMin + rand() * (zone.xMax - zone.xMin);
      const z = zone.zMin + rand() * (zone.zMax - zone.zMin);

      // Skip positions too close to the diagonal (river) and lane strips
      const onDiag = Math.abs(x + z) < 5;      // mid lane/river diagonal
      const onTop  = Math.abs(x + 38) < 2.5 && z > -5 && z < 35; // top lane vertical
      const onTopH = Math.abs(z + 38) < 2.5 && x > -5 && x < 45; // top lane horizontal
      const onBotH = Math.abs(z - 38) < 2.5 && x < 5 && x > -45; // bot lane horizontal
      const onBotV = Math.abs(x - 38) < 2.5 && z < 5 && z > -45; // bot lane vertical
      const inBase = (x < -32 && z > 32) || (x > 32 && z < -32); // inside base areas

      if (onDiag || onTop || onTopH || onBotH || onBotV || inBase) continue;

      positions.push({
        x,
        z,
        scale: 0.7 + rand() * 0.7,
        rotY: rand() * Math.PI * 2,
      });
    }
  }

  return positions;
}

// ── Base pads ─────────────────────────────────────────────────
// Circular platforms at each base with team-colored glow
function _buildBasePads() {
  const baseDefs = [
    { x: -40, z: 40, color: 0x660000, glow: 0xff2200, team: 'scourge' },  // Scourge: bottom-left
    { x: 40, z: -40, color: 0x004422, glow: 0x00ff88, team: 'sentinel' }, // Sentinel: top-right
  ];

  for (const bd of baseDefs) {
    // Outer decorative ring
    const outerRingGeo = new THREE.RingGeometry(9.5, 11, 40);
    const outerRingMat = new THREE.MeshStandardMaterial({
      color: bd.color,
      emissive: bd.glow,
      emissiveIntensity: 0.4,
      roughness: 0.5,
      side: THREE.DoubleSide,
    });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRing.rotation.x = -Math.PI / 2;
    outerRing.position.set(bd.x, 0.03, bd.z);
    mapGroup.add(outerRing);

    // Main base pad (raised cylinder)
    const padGeo = new THREE.CylinderGeometry(9, 9.5, 0.18, 40);
    const padMat = new THREE.MeshStandardMaterial({
      color: bd.color,
      roughness: 0.6,
      metalness: 0.2,
      emissive: bd.glow,
      emissiveIntensity: 0.12,
    });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.set(bd.x, 0.09, bd.z);
    pad.receiveShadow = true;
    mapGroup.add(pad);

    // Inner glowing rune circle on the pad surface
    const runeGeo = new THREE.CircleGeometry(5, 32);
    const runeMat = new THREE.MeshStandardMaterial({
      color: bd.glow,
      emissive: bd.glow,
      emissiveIntensity: 0.7,
      roughness: 0.2,
    });
    const runeMesh = new THREE.Mesh(runeGeo, runeMat);
    runeMesh.rotation.x = -Math.PI / 2;
    runeMesh.position.set(bd.x, 0.19, bd.z);
    mapGroup.add(runeMesh);

    // Decorative corner stones (4 small pillars around base)
    const pillarMat = new THREE.MeshStandardMaterial({
      color: bd.color,
      roughness: 0.4,
      metalness: 0.4,
      emissive: bd.glow,
      emissiveIntensity: 0.3,
    });
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const px = bd.x + Math.cos(angle) * 8;
      const pz = bd.z + Math.sin(angle) * 8;
      const pillarGeo = new THREE.CylinderGeometry(0.4, 0.5, 1.2, 8);
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(px, 0.6, pz);
      pillar.castShadow = true;
      mapGroup.add(pillar);
    }
  }
}

// ── Fountains ─────────────────────────────────────────────────
// Glowing point lights + visual basin inside each base
function _buildFountains() {
  const fountainDefs = [
    { x: -40, z: 40, lightColor: 0x4466ff, team: 'scourge' },
    { x: 40, z: -40, lightColor: 0x44ffaa, team: 'sentinel' },
  ];

  for (const fd of fountainDefs) {
    // Basin (flat disc with bright center)
    const basinGeo = new THREE.CylinderGeometry(1.8, 2.0, 0.3, 16);
    const basinMat = new THREE.MeshStandardMaterial({
      color: 0x223344,
      roughness: 0.3,
      metalness: 0.5,
      emissive: fd.lightColor,
      emissiveIntensity: 0.5,
    });
    const basin = new THREE.Mesh(basinGeo, basinMat);
    basin.position.set(fd.x, 0.15, fd.z);
    basin.castShadow = true;
    basin.receiveShadow = true;
    mapGroup.add(basin);

    // Water surface inside basin
    const waterGeo = new THREE.CircleGeometry(1.6, 16);
    const waterMat = new THREE.MeshStandardMaterial({
      color: fd.lightColor,
      emissive: fd.lightColor,
      emissiveIntensity: 0.8,
      roughness: 0.0,
      metalness: 0.0,
      transparent: true,
      opacity: 0.75,
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(fd.x, 0.32, fd.z);
    mapGroup.add(water);

    // Point light for soft area glow
    const light = new THREE.PointLight(fd.lightColor, 1.8, 18, 2);
    light.position.set(fd.x, 2.5, fd.z);
    mapGroup.add(light);
  }
}

// ── Tower placeholders ────────────────────────────────────────
// Tall thin box at each structure position from STRUCTURES data.
// Color-coded by team and type (tower/barracks/ancient).
function _buildTowerPlaceholders() {
  const colorMap = {
    tower_scourge:    { body: 0x660000, emissive: 0x440000 },
    tower_sentinel:   { body: 0x004422, emissive: 0x002211 },
    barracks_scourge: { body: 0x8b2200, emissive: 0x551100 },
    barracks_sentinel:{ body: 0x005533, emissive: 0x003322 },
    ancient_scourge:  { body: 0xcc0000, emissive: 0x880000 },
    ancient_sentinel: { body: 0x00cc66, emissive: 0x007733 },
  };

  for (const struct of STRUCTURES) {
    const key = `${struct.type}_${struct.team}`;
    const colors = colorMap[key] || { body: 0x444444, emissive: 0x222222 };
    const [sx, , sz] = struct.pos;

    if (struct.type === 'tower') {
      _buildTowerMesh(sx, sz, struct.tier, colors);
    } else if (struct.type === 'barracks') {
      _buildBarracksMesh(sx, sz, colors);
    } else if (struct.type === 'ancient') {
      _buildAncientMesh(sx, sz, colors, struct.team);
    }
  }
}

function _buildTowerMesh(x, z, tier, colors) {
  const height = 1.8 + tier * 0.4;
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  // Base plinth
  const plinthGeo = new THREE.BoxGeometry(1.4, 0.3, 1.4);
  const plinthMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
  const plinth = new THREE.Mesh(plinthGeo, plinthMat);
  plinth.position.y = 0.15;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  group.add(plinth);

  // Main tower shaft
  const shaftGeo = new THREE.BoxGeometry(0.9, height, 0.9);
  const shaftMat = new THREE.MeshStandardMaterial({
    color: colors.body,
    roughness: 0.6,
    metalness: 0.3,
    emissive: colors.emissive,
    emissiveIntensity: 0.2,
  });
  const shaft = new THREE.Mesh(shaftGeo, shaftMat);
  shaft.position.y = 0.3 + height / 2;
  shaft.castShadow = true;
  group.add(shaft);

  // Top battlement cap
  const capGeo = new THREE.BoxGeometry(1.3, 0.35, 1.3);
  const cap = new THREE.Mesh(capGeo, shaftMat);
  cap.position.y = 0.3 + height + 0.175;
  cap.castShadow = true;
  group.add(cap);

  // Small orb / spotlight on top
  const orbGeo = new THREE.SphereGeometry(0.25, 8, 6);
  const orbMat = new THREE.MeshStandardMaterial({
    color: colors.body,
    emissive: colors.body,
    emissiveIntensity: 0.9,
    roughness: 0.1,
  });
  const orb = new THREE.Mesh(orbGeo, orbMat);
  orb.position.y = 0.3 + height + 0.55;
  group.add(orb);

  // Store structure id for raycasting later
  group.userData.structureId = `tower_t${tier}`;

  mapGroup.add(group);
}

function _buildBarracksMesh(x, z, colors) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  // Squat fortified building
  const bodyGeo = new THREE.BoxGeometry(2.2, 1.4, 2.2);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: colors.body,
    roughness: 0.7,
    metalness: 0.2,
    emissive: colors.emissive,
    emissiveIntensity: 0.15,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.7;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Roof
  const roofGeo = new THREE.BoxGeometry(2.4, 0.2, 2.4);
  const roof = new THREE.Mesh(roofGeo, bodyMat);
  roof.position.y = 1.5;
  roof.castShadow = true;
  group.add(roof);

  // Two small chimney posts
  for (const [cx, cz] of [[-0.6, -0.6], [0.6, 0.6]]) {
    const chimGeo = new THREE.BoxGeometry(0.25, 0.6, 0.25);
    const chim = new THREE.Mesh(chimGeo, bodyMat);
    chim.position.set(cx, 1.9, cz);
    chim.castShadow = true;
    group.add(chim);
  }

  mapGroup.add(group);
}

function _buildAncientMesh(x, z, colors, team) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  // Wide base
  const baseGeo = new THREE.CylinderGeometry(3.0, 3.5, 0.5, 12);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.8,
    metalness: 0.3,
  });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.25;
  base.receiveShadow = true;
  group.add(base);

  // Central obelisk
  const obeliskGeo = new THREE.BoxGeometry(2.0, 4.0, 2.0);
  const obeliskMat = new THREE.MeshStandardMaterial({
    color: colors.body,
    roughness: 0.4,
    metalness: 0.5,
    emissive: colors.emissive,
    emissiveIntensity: 0.3,
  });
  const obelisk = new THREE.Mesh(obeliskGeo, obeliskMat);
  obelisk.position.y = 2.5;
  obelisk.castShadow = true;
  group.add(obelisk);

  // Tapered top
  const topGeo = new THREE.CylinderGeometry(0, 1.2, 1.5, 6);
  const top = new THREE.Mesh(topGeo, obeliskMat);
  top.position.y = 5.25;
  top.castShadow = true;
  group.add(top);

  // Glowing core orb
  const coreGeo = new THREE.SphereGeometry(0.8, 12, 10);
  const coreMat = new THREE.MeshStandardMaterial({
    color: colors.body,
    emissive: colors.body,
    emissiveIntensity: 1.2,
    roughness: 0.0,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.y = 3.0;
  group.add(core);

  // Point light emanating from ancient
  const ancientLight = new THREE.PointLight(
    team === 'scourge' ? 0xff2200 : 0x00ff88,
    2.0, 20, 2
  );
  ancientLight.position.y = 4.0;
  group.add(ancientLight);

  // Four corner pillars
  const pillarMat = new THREE.MeshStandardMaterial({
    color: colors.body,
    roughness: 0.5,
    metalness: 0.4,
    emissive: colors.emissive,
    emissiveIntensity: 0.2,
  });
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const pr = 2.5;
    const pillarGeo = new THREE.CylinderGeometry(0.3, 0.4, 3.0, 6);
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.set(Math.cos(angle) * pr, 1.5, Math.sin(angle) * pr);
    pillar.castShadow = true;
    group.add(pillar);
  }

  mapGroup.add(group);
}

// ── getGroundY ────────────────────────────────────────────────
export function getGroundY() { return 0; }

// ── Waypoints for creep/unit pathing ─────────────────────────
// Scourge base: x=-40, z=40 (bottom-left)  Sentinel base: x=40, z=-40 (top-right)
export const LANE_WAYPOINTS = {
  mid: [
    { x: -38, z: 38 }, { x: -25, z: 25 }, { x: -10, z: 10 },
    { x: 0,   z: 0  }, { x: 10,  z: -10 }, { x: 25,  z: -25 }, { x: 38, z: -38 },
  ],
  top: [
    { x: -38, z: 38 }, { x: -38, z: 10 }, { x: -38, z: 0 },
    { x: -20, z: -15 }, { x: 0,  z: -30 }, { x: 20,  z: -38 }, { x: 38, z: -38 },
  ],
  bot: [
    { x: -38, z: 38 }, { x: -10, z: 38 }, { x: 0,   z: 30 },
    { x: 15,  z: 20  }, { x: 30, z: 0   }, { x: 38,  z: -15 }, { x: 38, z: -38 },
  ],
};

// ── Structure positions ───────────────────────────────────────
// Mirrors STRUCTURES from constants.js as a keyed lookup for convenience
export const STRUCTURE_POSITIONS = {
  towers: {
    scourge_mid_t1:   { x: -10, z: -10 }, scourge_mid_t2:  { x: -22, z: -22 }, scourge_mid_t3:  { x: -32, z: -32 },
    scourge_top_t1:   { x: -10, z:  30 }, scourge_top_t2:  { x: -24, z:  36 }, scourge_top_t3:  { x: -36, z:  32 },
    scourge_bot_t1:   { x: -30, z: -10 }, scourge_bot_t2:  { x: -36, z: -24 }, scourge_bot_t3:  { x: -32, z: -36 },
    scourge_base_t1:  { x: -37, z: -33 }, scourge_base_t2: { x: -33, z: -37 },
    sentinel_mid_t1:  { x:  10, z:  10 }, sentinel_mid_t2: { x:  22, z:  22 }, sentinel_mid_t3: { x:  32, z:  32 },
    sentinel_top_t1:  { x:  10, z:  30 }, sentinel_top_t2: { x:  24, z:  36 }, sentinel_top_t3: { x:  36, z:  32 },
    sentinel_bot_t1:  { x:  30, z: -10 }, sentinel_bot_t2: { x:  36, z: -24 }, sentinel_bot_t3: { x:  32, z: -36 },
    sentinel_base_t1: { x:  37, z:  33 }, sentinel_base_t2: { x:  33, z:  37 },
  },
  barracks: {
    scourge_top:  { x: -37, z: 27 }, scourge_mid:  { x: -34, z: -29 }, scourge_bot:  { x: -27, z: -38 },
    sentinel_top: { x:  37, z: 27 }, sentinel_mid: { x:  34, z:  29 }, sentinel_bot: { x:  27, z: -38 },
  },
  ancients: {
    scourge:  { x: -40, z: -40 },
    sentinel: { x:  40, z:  40 },
  },
};
