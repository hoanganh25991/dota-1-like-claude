// js/heroes/axe.js — Axe (STR, Scourge)
import { stdMat, glowMat, metalMat, box, cyl, sph } from '../hero-models.js';

export function buildModel() {
  const g = new THREE.Group();

  const red    = stdMat(0xbb2200);
  const skin   = stdMat(0xaa4422);
  const metal  = metalMat(0x889988);
  const dark   = stdMat(0x221111);
  const blood  = glowMat(0xff3300);

  // Boots/feet — huge
  g.add(box(0.20, 0.22, 0.24, dark, -0.15, 0.11, 0));
  g.add(box(0.20, 0.22, 0.24, dark,  0.15, 0.11, 0));

  // Legs — thick
  g.add(box(0.20, 0.38, 0.20, red, -0.15, 0.42, 0));
  g.add(box(0.20, 0.38, 0.20, red,  0.15, 0.42, 0));

  // Torso — massive barrel chest
  g.add(box(0.64, 0.58, 0.44, skin, 0, 0.94, 0));

  // Chest scar lines
  g.add(box(0.02, 0.30, 0.03, dark, -0.10, 1.00, 0.23));
  g.add(box(0.02, 0.20, 0.03, dark,  0.12, 0.98, 0.23));

  // Huge shoulders with spikes
  g.add(box(0.22, 0.24, 0.26, red, -0.46, 1.18, 0));
  g.add(box(0.22, 0.24, 0.26, red,  0.46, 1.18, 0));
  g.add(cyl(0, 0.06, 0.18, 5, metal, -0.46, 1.38, 0));
  g.add(cyl(0, 0.06, 0.18, 5, metal,  0.46, 1.38, 0));

  // Arms — huge
  g.add(box(0.20, 0.44, 0.22, skin, -0.44, 0.88, 0));
  g.add(box(0.20, 0.44, 0.22, skin,  0.44, 0.88, 0));

  // Fists
  g.add(sph(0.12, 7, skin, -0.44, 0.60, 0.05));
  g.add(sph(0.12, 7, skin,  0.44, 0.60, 0.05));

  // Head — top-heavy brute
  g.add(box(0.38, 0.36, 0.34, skin, 0, 1.58, 0));

  // Mohawk / horn nub
  g.add(box(0.08, 0.18, 0.28, dark, 0, 1.82, 0));

  // Red glowing eyes
  g.add(sph(0.05, 6, blood, -0.10, 1.60, 0.18));
  g.add(sph(0.05, 6, blood,  0.10, 1.60, 0.18));

  // Battle axe — right hand
  const haft = cyl(0.03, 0.04, 0.90, 7, dark, 0.52, 0.78, 0.08);
  haft.rotation.z = -0.3;
  g.add(haft);
  const head1 = box(0.06, 0.42, 0.36, metal, 0.70, 1.12, 0.08);
  g.add(head1);
  const headEdge = box(0.04, 0.46, 0.08, glowMat(0xff6600), 0.74, 1.12, 0.22);
  g.add(headEdge);

  return g;
}

export function getSkillTemplates() {
  return [
    {
      id: 'berserkerCall', slot: 'Q',
      name: 'Berserker\'s Call',
      description: 'Axe taunts all nearby enemy units, forcing them to attack him while gaining bonus armor.',
      skillType: 'active',
      castType: 'self-radius',
      targetRule: 'enemy',
      damageType: 'none',
      manaCostByLevel: [80, 90, 100, 110],
      cooldownByLevel: [14, 12, 10, 8],
      castRangeByLevel: [0, 0, 0, 0],
      effectValuesByLevel: {
        tauntRadius:  [300, 300, 300, 300],
        tauntDuration:[1.8, 2.2, 2.6, 3.0],
        armorBonus:   [40, 40, 40, 40],
      },
      aiHints: { useWhenEnemiesInRadiusAtLeast: 2, minManaPct: 0.2 },
    },
    {
      id: 'battleHunger', slot: 'W',
      name: 'Battle Hunger',
      description: 'Enrages an enemy unit with the hunger of battle, slowing and dealing damage over time.',
      skillType: 'active',
      castType: 'unit-target',
      targetRule: 'enemy',
      damageType: 'magical',
      manaCostByLevel: [70, 80, 90, 100],
      cooldownByLevel: [10, 10, 10, 10],
      castRangeByLevel: [750, 750, 750, 750],
      effectValuesByLevel: {
        damagePerSecond: [16, 24, 32, 40],
        moveSlowPct:     [11, 14, 17, 20],
        duration:        [10, 10, 10, 10],
      },
      aiHints: { useOnFleingEnemy: true, minManaPct: 0.15 },
    },
    {
      id: 'counterHelix', slot: 'E',
      name: 'Counter Helix',
      description: 'When attacked, Axe has a chance to spin and deal pure damage to all nearby enemies.',
      skillType: 'passive',
      castType: 'no-target',
      targetRule: 'none',
      damageType: 'pure',
      manaCostByLevel: [0, 0, 0, 0],
      cooldownByLevel: [0, 0, 0, 0],
      castRangeByLevel: [0, 0, 0, 0],
      effectValuesByLevel: {
        procChancePct: [17, 19, 21, 23],
        damage:        [100, 125, 150, 175],
        aoeRadius:     [275, 275, 275, 275],
        internalCD:    [0.45, 0.40, 0.35, 0.30],
      },
      aiHints: {},
    },
    {
      id: 'cullingBlade', slot: 'R',
      name: 'Culling Blade',
      description: 'Axe leaps to an enemy and executes them if their HP is below the threshold, instantly killing them.',
      skillType: 'active',
      castType: 'unit-target',
      targetRule: 'enemy',
      damageType: 'pure',
      manaCostByLevel: [60, 120, 180],
      cooldownByLevel: [75, 65, 55],
      castRangeByLevel: [150, 150, 150],
      effectValuesByLevel: {
        executeThreshold: [250, 350, 450],
        damage:           [150, 250, 350],
        cdResetOnKill:    [true, true, true],
        bonusMovementOnKill: [25, 25, 25],
        bonusMovementDuration: [6, 6, 6],
      },
      aiHints: { useOnLowHealthTarget: true, minManaPct: 0.1 },
    },
  ];
}
