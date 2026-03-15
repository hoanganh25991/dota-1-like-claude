// js/heroes/tidehunter.js — Tidehunter (STR, Scourge)
import { stdMat, glowMat, metalMat, box, cyl, sph } from '../hero-models.js';

export function buildModel() {
  const g = new THREE.Group();

  const sea    = stdMat(0x1a4a5a);
  const scale  = stdMat(0x0a2a3a);
  const anchor = metalMat(0x556655);
  const shell  = stdMat(0x4a6a5a);
  const yellow = glowMat(0xffcc00);

  // Wide base — sea creature lower body
  g.add(box(0.60, 0.44, 0.52, sea, 0, 0.22, 0));
  g.add(cyl(0.24, 0.32, 0.28, 10, scale, 0, 0.14, 0));

  // Belly
  g.add(sph(0.32, 10, stdMat(0x2a5a6a), 0, 0.60, 0.10));

  // Torso — wide
  g.add(box(0.64, 0.52, 0.50, sea, 0, 0.90, 0));

  // Scale plates on torso
  for (let i = 0; i < 3; i++) {
    g.add(box(0.52, 0.08, 0.06, scale, 0, 0.72 + i * 0.18, 0.27));
  }

  // Fins on sides
  g.add(box(0.06, 0.30, 0.28, shell, -0.40, 0.88, -0.08));
  g.add(box(0.06, 0.30, 0.28, shell,  0.40, 0.88, -0.08));

  // Shoulders — barnacle-covered
  g.add(sph(0.20, 8, sea, -0.50, 1.16, 0));
  g.add(sph(0.20, 8, sea,  0.50, 1.16, 0));
  g.add(sph(0.06, 6, scale, -0.56, 1.26, 0.08));
  g.add(sph(0.06, 6, scale,  0.56, 1.26, 0.08));

  // Arms — thick tentacle-like
  g.add(box(0.18, 0.48, 0.20, sea, -0.48, 0.84, 0));
  g.add(box(0.18, 0.48, 0.20, sea,  0.48, 0.84, 0));

  // Hands / claws
  g.add(sph(0.13, 7, scale, -0.48, 0.56, 0.06));
  g.add(sph(0.13, 7, scale,  0.48, 0.56, 0.06));

  // Head — wide fish-like
  const head = box(0.50, 0.34, 0.42, sea, 0, 1.52, 0);
  g.add(head);

  // Fin crest on head
  g.add(box(0.06, 0.24, 0.42, shell, 0, 1.74, 0));
  g.add(box(0.04, 0.14, 0.22, shell, -0.12, 1.72, 0));
  g.add(box(0.04, 0.14, 0.22, shell,  0.12, 1.72, 0));

  // Yellow glowing eyes
  g.add(sph(0.055, 6, yellow, -0.13, 1.54, 0.22));
  g.add(sph(0.055, 6, yellow,  0.13, 1.54, 0.22));

  // Gills on face
  g.add(box(0.04, 0.14, 0.03, scale, -0.22, 1.46, 0.20));
  g.add(box(0.04, 0.14, 0.03, scale,  0.22, 1.46, 0.20));

  // Anchor — left hand
  const anchorShaft = cyl(0.03, 0.04, 0.80, 7, anchor, -0.60, 0.82, 0.06);
  anchorShaft.rotation.z = 0.25;
  g.add(anchorShaft);
  const anchorTop  = box(0.22, 0.04, 0.06, anchor, -0.74, 1.22, 0.06);
  g.add(anchorTop);
  const anchorBody = box(0.04, 0.30, 0.06, anchor, -0.82, 0.96, 0.06);
  g.add(anchorBody);
  const anchorHookL = cyl(0, 0.04, 0.18, 5, anchor, -0.90, 0.80, 0.06);
  anchorHookL.rotation.z = -0.7;
  g.add(anchorHookL);
  const anchorHookR = cyl(0, 0.04, 0.18, 5, anchor, -0.74, 0.80, 0.06);
  anchorHookR.rotation.z =  0.7;
  g.add(anchorHookR);

  return g;
}

export function getSkillTemplates() {
  return [
    {
      id: 'gush', slot: 'Q',
      name: 'Gush',
      description: 'Hurls a blob of water at an enemy that reduces armor and movement speed.',
      skillType: 'active',
      castType: 'unit-target',
      targetRule: 'enemy',
      damageType: 'magical',
      manaCostByLevel: [90, 100, 110, 120],
      cooldownByLevel: [12, 10, 8, 6],
      castRangeByLevel: [700, 700, 700, 700],
      effectValuesByLevel: {
        damage:     [80, 130, 180, 230],
        armorReduct:[2, 3, 4, 5],
        moveSlowPct:[25, 35, 45, 55],
        duration:   [4, 4, 4, 4],
      },
      aiHints: { useWhenEnemyInRange: true, minManaPct: 0.2 },
    },
    {
      id: 'krakenShell', slot: 'W',
      name: 'Kraken Shell',
      description: 'Creates a thick shell of protection that blocks damage from physical attacks.',
      skillType: 'passive',
      castType: 'no-target',
      targetRule: 'none',
      damageType: 'none',
      manaCostByLevel: [0, 0, 0, 0],
      cooldownByLevel: [0, 0, 0, 0],
      castRangeByLevel: [0, 0, 0, 0],
      effectValuesByLevel: {
        damageBlock:       [9, 18, 27, 36],
        dispelDebuffThresh:[250, 250, 250, 250],
      },
      aiHints: {},
    },
    {
      id: 'anchorSmash', slot: 'E',
      name: 'Anchor Smash',
      description: 'Slams the anchor to deal damage and reduce attack damage of nearby enemies.',
      skillType: 'active',
      castType: 'self-radius',
      targetRule: 'enemy',
      damageType: 'pure',
      manaCostByLevel: [40, 50, 60, 70],
      cooldownByLevel: [5, 5, 5, 5],
      castRangeByLevel: [0, 0, 0, 0],
      effectValuesByLevel: {
        damage:           [75, 100, 125, 150],
        attackDmgReductPct:[30, 40, 50, 60],
        aoeRadius:        [325, 325, 325, 325],
        reductDuration:   [4, 4, 4, 4],
      },
      aiHints: { useWhenEnemiesInRadiusAtLeast: 1, minManaPct: 0.1 },
    },
    {
      id: 'ravage', slot: 'R',
      name: 'Ravage',
      description: 'Slams the ground, sending tentacles in all directions to stun and damage all nearby enemies.',
      skillType: 'active',
      castType: 'self-radius',
      targetRule: 'enemy',
      damageType: 'magical',
      manaCostByLevel: [150, 225, 325],
      cooldownByLevel: [150, 120, 100],
      castRangeByLevel: [0, 0, 0],
      effectValuesByLevel: {
        damage:      [250, 350, 450],
        stunDuration:[1.53, 1.83, 2.13],
        aoeRadius:   [1025, 1025, 1025],
      },
      aiHints: { useWhenEnemiesInRadiusAtLeast: 3, minManaPct: 0.3 },
    },
  ];
}
