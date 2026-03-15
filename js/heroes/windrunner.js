// js/heroes/windrunner.js — Windrunner (AGI, Sentinel)
import { stdMat, glowMat, box, cyl, sph } from '../hero-models.js';

export function buildModel() {
  const g = new THREE.Group();

  const skin   = stdMat(0xddc49a);    // pale skin
  const hood   = stdMat(0x1a4a2a);    // forest green
  const cloak  = stdMat(0x2a6a3a);    // lighter green cloak
  const teal   = glowMat(0x00cc88);   // teal eyes
  const brown  = stdMat(0x5c3a1e);    // leather brown
  const wood   = stdMat(0x8b5e2a);    // bow wood

  // Boots
  const bootL = box(0.11, 0.16, 0.16, brown, -0.09, 0.08, 0);
  const bootR = box(0.11, 0.16, 0.16, brown,  0.09, 0.08, 0);
  g.add(bootL, bootR);

  // Leggings
  const legL = box(0.11, 0.38, 0.12, hood, -0.09, 0.36, 0);
  const legR = box(0.11, 0.38, 0.12, hood,  0.09, 0.36, 0);
  g.add(legL, legR);

  // Tunic / torso
  const torso = box(0.36, 0.46, 0.28, cloak, 0, 0.82, 0);
  g.add(torso);

  // Belt with quiver attachment
  const belt = box(0.38, 0.07, 0.30, brown, 0, 0.58, 0);
  g.add(belt);

  // Cloak back panel
  const cloakBack = box(0.34, 0.58, 0.06, hood, 0, 0.78, -0.17);
  g.add(cloakBack);

  // Shoulders — light pauldrons
  const shldrL = box(0.12, 0.12, 0.18, cloak, -0.26, 1.02, 0);
  const shldrR = box(0.12, 0.12, 0.18, cloak,  0.26, 1.02, 0);
  g.add(shldrL, shldrR);

  // Arms
  const armL = box(0.10, 0.36, 0.10, skin, -0.26, 0.78, 0);
  const armR = box(0.10, 0.36, 0.10, skin,  0.26, 0.78, 0);
  g.add(armL, armR);

  // Hands / bracers
  const bracerL = box(0.12, 0.12, 0.12, brown, -0.26, 0.58, 0);
  const bracerR = box(0.12, 0.12, 0.12, brown,  0.26, 0.58, 0);
  g.add(bracerL, bracerR);

  // Head
  const head = sph(0.18, 10, skin, 0, 1.30, 0);
  g.add(head);

  // Hood — cone shape using cylinder
  const hoodCap = cyl(0.02, 0.22, 0.36, 10, hood, 0, 1.50, -0.04);
  hoodCap.rotation.x = -0.15;
  g.add(hoodCap);

  // Hood brim / rim
  const hoodRim = cyl(0.24, 0.24, 0.04, 10, hood, 0, 1.32, 0);
  g.add(hoodRim);

  // Hair strands peeking out
  const hairL = box(0.08, 0.22, 0.06, stdMat(0x8b4513), -0.16, 1.22, -0.06);
  const hairR = box(0.08, 0.22, 0.06, stdMat(0x8b4513),  0.16, 1.22, -0.06);
  g.add(hairL, hairR);

  // Eyes
  const eyeL = sph(0.035, 6, teal, -0.07, 1.31, 0.15);
  const eyeR = sph(0.035, 6, teal,  0.07, 1.31, 0.15);
  g.add(eyeL, eyeR);

  // Bow — held in left hand (large longbow)
  const bowLimb1 = cyl(0.018, 0.028, 0.70, 6, wood, -0.46, 0.98, 0.05);
  bowLimb1.rotation.z =  0.22;
  g.add(bowLimb1);
  const bowLimb2 = cyl(0.018, 0.028, 0.70, 6, wood, -0.46, 0.50, 0.05);
  bowLimb2.rotation.z = -0.22;
  g.add(bowLimb2);

  // Bow grip
  const bowGrip = cyl(0.035, 0.035, 0.18, 6, brown, -0.46, 0.74, 0.05);
  g.add(bowGrip);

  // Bow string
  const bowString = cyl(0.006, 0.006, 1.30, 4, stdMat(0xcccccc), -0.46, 0.74, 0.10);
  g.add(bowString);

  // Quiver on back (right side)
  const quiver = cyl(0.06, 0.05, 0.38, 8, brown, 0.28, 0.84, -0.18);
  quiver.rotation.x = 0.3;
  g.add(quiver);

  // Arrows in quiver
  for (let i = 0; i < 3; i++) {
    const arrow = cyl(0.008, 0.008, 0.44, 4, wood,
      0.25 + i * 0.04, 1.04, -0.16);
    arrow.rotation.x = 0.3;
    g.add(arrow);
  }

  return g;
}

export function getSkillTemplates() {
  return [
    {
      id: 'shackleshot', slot: 'Q',
      name: 'Shackleshot',
      description: 'Fires an arrow that shackles the target to a tree or another enemy behind them.',
      skillType: 'active',
      castType: 'point-target',
      targetRule: 'enemy',
      damageType: 'physical',
      manaCostByLevel: [90, 100, 110, 120],
      cooldownByLevel: [14, 12, 10, 8],
      castRangeByLevel: [1000, 1000, 1000, 1000],
      effectValuesByLevel: {
        stunDuration:     [0.75, 1.5, 2.25, 3.0],
        shackleRadius:    [100, 100, 100, 100],
      },
      aiHints: { useWhenEnemyNearTree: true, minManaPct: 0.2 },
    },
    {
      id: 'powershot', slot: 'W',
      name: 'Powershot',
      description: 'Charges up a powerful shot that damages and pushes back all units in a line.',
      skillType: 'active',
      castType: 'point-target',
      targetRule: 'ground',
      damageType: 'magical',
      manaCostByLevel: [90, 100, 110, 120],
      cooldownByLevel: [12, 11, 10, 9],
      castRangeByLevel: [3000, 3000, 3000, 3000],
      effectValuesByLevel: {
        damage:       [120, 200, 280, 360],
        chargeTime:   [1.0, 1.0, 1.0, 1.0],
        lineWidth:    [100, 100, 100, 100],
        knockbackDist:[50, 50, 50, 50],
      },
      aiHints: { useWhenEnemiesInLine: true, minManaPct: 0.2 },
    },
    {
      id: 'windrun', slot: 'E',
      name: 'Windrun',
      description: 'Increases Windrunner\'s speed and grants evasion, making her untouchable.',
      skillType: 'active',
      castType: 'self',
      targetRule: 'none',
      damageType: 'none',
      manaCostByLevel: [75, 75, 75, 75],
      cooldownByLevel: [15, 15, 15, 15],
      castRangeByLevel: [0, 0, 0, 0],
      effectValuesByLevel: {
        evasionPct:      [100, 100, 100, 100],
        moveSpeedBonus:  [100, 100, 100, 100],
        duration:        [3, 3, 3, 3],
      },
      aiHints: { useWhenInDanger: true, minManaPct: 0.15 },
    },
    {
      id: 'focusFire', slot: 'R',
      name: 'Focus Fire',
      description: 'Attacks a single target at maximum attack speed for a duration, consuming all attack speed bonuses.',
      skillType: 'active',
      castType: 'unit-target',
      targetRule: 'enemy',
      damageType: 'physical',
      manaCostByLevel: [200, 300, 400],
      cooldownByLevel: [60, 50, 40],
      castRangeByLevel: [600, 600, 600],
      effectValuesByLevel: {
        attackSpeedBonus: [400, 500, 600],
        damagePenaltyPct: [50, 35, 20],
        duration:         [20, 20, 20],
      },
      aiHints: { useOnHighHealthEnemy: true, minManaPct: 0.4 },
    },
  ];
}
