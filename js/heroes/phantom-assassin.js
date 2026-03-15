// js/heroes/phantom-assassin.js — Phantom Assassin (AGI, Scourge)
import { stdMat, glowMat, metalMat, box, cyl, sph } from '../hero-models.js';

export function buildModel() {
  const g = new THREE.Group();

  const dark   = stdMat(0x1a1a2a);
  const cloth  = stdMat(0x2a2a3a);
  const mask   = stdMat(0x0a0a14);
  const blade  = metalMat(0x8899bb);
  const pink   = glowMat(0xff44aa);
  const purple = glowMat(0xaa22ff);

  // Slim boots
  g.add(box(0.10, 0.18, 0.14, dark, -0.08, 0.09, 0));
  g.add(box(0.10, 0.18, 0.14, dark,  0.08, 0.09, 0));

  // Legs — slim
  g.add(box(0.10, 0.38, 0.12, cloth, -0.08, 0.38, 0));
  g.add(box(0.10, 0.38, 0.12, cloth,  0.08, 0.38, 0));

  // Torso — slender
  g.add(box(0.30, 0.44, 0.24, dark, 0, 0.82, 0));

  // Cloak panels
  g.add(box(0.28, 0.46, 0.05, cloth, 0, 0.80, -0.15));
  g.add(box(0.12, 0.36, 0.05, cloth, -0.20, 0.78, -0.14));
  g.add(box(0.12, 0.36, 0.05, cloth,  0.20, 0.78, -0.14));

  // Shoulders — light pauldrons
  g.add(box(0.10, 0.12, 0.16, dark, -0.22, 1.04, 0));
  g.add(box(0.10, 0.12, 0.16, dark,  0.22, 1.04, 0));

  // Arms — slim
  g.add(box(0.09, 0.36, 0.09, cloth, -0.22, 0.80, 0));
  g.add(box(0.09, 0.36, 0.09, cloth,  0.22, 0.80, 0));

  // Wrapped hands / gauntlets
  g.add(box(0.10, 0.12, 0.10, dark, -0.22, 0.60, 0.02));
  g.add(box(0.10, 0.12, 0.10, dark,  0.22, 0.60, 0.02));

  // Head
  g.add(sph(0.17, 10, dark, 0, 1.30, 0));

  // Full face mask
  g.add(box(0.24, 0.22, 0.06, mask, 0, 1.30, 0.12));

  // Pink glowing eyes (two slits)
  g.add(box(0.06, 0.024, 0.03, pink, -0.06, 1.32, 0.16));
  g.add(box(0.06, 0.024, 0.03, pink,  0.06, 1.32, 0.16));

  // Hood
  g.add(cyl(0.02, 0.20, 0.28, 10, cloth, 0, 1.46, -0.04));
  g.add(cyl(0.20, 0.20, 0.04, 10, cloth, 0, 1.32,  0.01));

  // Daggers / blades — both hands
  const bladeL = box(0.03, 0.40, 0.04, blade, -0.26, 0.56, 0.10);
  bladeL.rotation.z = 0.3;
  g.add(bladeL);
  const bladeR = box(0.03, 0.40, 0.04, blade,  0.26, 0.56, 0.10);
  bladeR.rotation.z = -0.3;
  g.add(bladeR);

  // Blade glow edges
  const glowL = box(0.015, 0.38, 0.015, purple, -0.28, 0.56, 0.12);
  glowL.rotation.z = 0.3;
  g.add(glowL);
  const glowR = box(0.015, 0.38, 0.015, purple,  0.28, 0.56, 0.12);
  glowR.rotation.z = -0.3;
  g.add(glowR);

  // Sash / belt
  g.add(box(0.34, 0.05, 0.26, cloth, 0, 0.60, 0));

  return g;
}

export function getSkillTemplates() {
  return [
    {
      id: 'stiflingDagger', slot: 'Q',
      name: 'Stifling Dagger',
      description: 'Throws a dagger dealing damage based on Phantom Assassin\'s attack and slowing the target.',
      skillType: 'active',
      castType: 'unit-target',
      targetRule: 'enemy',
      damageType: 'physical',
      manaCostByLevel: [40, 40, 40, 40],
      cooldownByLevel: [8, 6, 4, 2],
      castRangeByLevel: [525, 525, 525, 525],
      effectValuesByLevel: {
        damageOfAttack: [0.20, 0.30, 0.40, 0.50],
        moveSlowPct:    [26, 34, 42, 50],
        slowDuration:   [2.5, 2.5, 2.5, 2.5],
      },
      aiHints: { useOnFleingEnemy: true, minManaPct: 0.1 },
    },
    {
      id: 'phantomStrike', slot: 'W',
      name: 'Phantom Strike',
      description: 'Teleports Phantom Assassin to a target, attacking rapidly for a short time.',
      skillType: 'active',
      castType: 'unit-target',
      targetRule: 'any',
      damageType: 'physical',
      manaCostByLevel: [50, 40, 30, 20],
      cooldownByLevel: [25, 20, 15, 10],
      castRangeByLevel: [1000, 1000, 1000, 1000],
      effectValuesByLevel: {
        attackSpeedBonus: [100, 150, 200, 250],
        duration:         [2.0, 2.0, 2.0, 2.0],
      },
      aiHints: { useWhenEnemyInRange: true, minManaPct: 0.1 },
    },
    {
      id: 'blur', slot: 'E',
      name: 'Blur',
      description: 'Phantom Assassin focuses on avoiding attacks, granting her significant evasion.',
      skillType: 'passive',
      castType: 'no-target',
      targetRule: 'none',
      damageType: 'none',
      manaCostByLevel: [0, 0, 0, 0],
      cooldownByLevel: [0, 0, 0, 0],
      castRangeByLevel: [0, 0, 0, 0],
      effectValuesByLevel: {
        evasionPct: [20, 25, 30, 35],
      },
      aiHints: {},
    },
    {
      id: 'coupDeGrace', slot: 'R',
      name: 'Coup De Grace',
      description: 'A fatal strike that deals enormous critical damage with a chance on each attack.',
      skillType: 'passive',
      castType: 'no-target',
      targetRule: 'none',
      damageType: 'physical',
      manaCostByLevel: [0, 0, 0],
      cooldownByLevel: [0, 0, 0],
      castRangeByLevel: [0, 0, 0],
      effectValuesByLevel: {
        critChancePct: [15, 18, 22],
        critMultiplier:[2.3, 3.0, 4.0],
      },
      aiHints: {},
    },
  ];
}
