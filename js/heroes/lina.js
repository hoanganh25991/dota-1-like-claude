// js/heroes/lina.js — Lina (INT, Sentinel)
import { stdMat, glowMat, metalMat, box, cyl, sph } from '../hero-models.js';

export function buildModel() {
  const g = new THREE.Group();

  const robe   = stdMat(0xcc3311);   // red robe
  const skin   = stdMat(0xddaa88);
  const fire   = glowMat(0xff6600);  // fire orange glow
  const gold   = metalMat(0xeeaa22);
  const hair   = stdMat(0xff4422);   // red-orange hair
  const dark   = stdMat(0x661100);

  g.add(cyl(0.09, 0.14, 0.36, 8, robe, -0.09, 0.18, 0));
  g.add(cyl(0.09, 0.14, 0.36, 8, robe,  0.09, 0.18, 0));

  // Robe flare base
  g.add(cyl(0.12, 0.30, 0.36, 10, robe, 0, 0.18, 0));
  g.add(box(0.40, 0.50, 0.32, robe, 0, 0.74, 0));

  // Fire trim at robe hem
  g.add(box(0.44, 0.05, 0.36, fire, 0, 0.50, 0));
  g.add(box(0.44, 0.04, 0.36, fire, 0, 1.00, 0));

  // Belt / sash
  g.add(box(0.44, 0.07, 0.34, gold, 0, 0.52, 0));

  // Shoulders
  g.add(sph(0.12, 8, robe, -0.28, 1.06, 0));
  g.add(sph(0.12, 8, robe,  0.28, 1.06, 0));

  // Arms
  g.add(box(0.09, 0.36, 0.10, skin, -0.28, 0.82, 0));
  g.add(box(0.09, 0.36, 0.10, skin,  0.28, 0.82, 0));

  // Gold bracers
  g.add(box(0.10, 0.10, 0.12, gold, -0.28, 0.62, 0));
  g.add(box(0.10, 0.10, 0.12, gold,  0.28, 0.62, 0));

  // Hands with fire
  g.add(sph(0.07, 6, skin, -0.28, 0.48, 0.04));
  g.add(sph(0.07, 6, skin,  0.28, 0.48, 0.04));
  g.add(sph(0.05, 6, fire, -0.28, 0.42, 0.08));  // fire in palm
  g.add(sph(0.04, 6, fire,  0.28, 0.42, 0.08));

  // Head
  g.add(sph(0.18, 10, skin, 0, 1.32, 0));

  // Fire eyes
  g.add(sph(0.038, 6, fire, -0.07, 1.34, 0.16));
  g.add(sph(0.038, 6, fire,  0.07, 1.34, 0.16));

  // Flowing fire hair — long behind/above
  g.add(box(0.20, 0.36, 0.07, hair, 0, 1.44, -0.10));
  g.add(box(0.14, 0.30, 0.07, hair, -0.16, 1.36, -0.12));
  g.add(box(0.14, 0.30, 0.07, hair,  0.16, 1.36, -0.12));
  g.add(box(0.10, 0.22, 0.07, hair, -0.24, 1.22, -0.10));
  g.add(box(0.10, 0.22, 0.07, hair,  0.24, 1.22, -0.10));

  // Hair glow tips
  g.add(sph(0.06, 6, fire, -0.16, 1.60, -0.08));
  g.add(sph(0.05, 6, fire,  0.16, 1.58, -0.08));
  g.add(sph(0.05, 6, fire,  0, 1.66, -0.06));

  // Gold headband
  g.add(cyl(0.19, 0.19, 0.04, 10, gold, 0, 1.26, 0));

  // Fire staff — right hand
  const shaft = cyl(0.023, 0.028, 0.88, 7, dark, 0.38, 0.68, 0.08);
  shaft.rotation.z = -0.16;
  g.add(shaft);
  g.add(sph(0.10, 9, fire, 0.50, 1.12, 0.08));
  g.add(sph(0.06, 7, glowMat(0xffcc00), 0.50, 1.12, 0.08));

  // Staff flame burst
  for (let i = 0; i < 4; i++) {
    const ang = (i / 4) * Math.PI * 2;
    g.add(cyl(0, 0.03, 0.14, 5, fire,
      0.50 + Math.cos(ang) * 0.06, 1.24, 0.08 + Math.sin(ang) * 0.06));
  }

  return g;
}

export function getSkillTemplates() {
  return [
    {
      id: 'dragonSlave', slot: 'Q',
      name: 'Dragon Slave',
      description: 'Launches a wave of fire along a line that damages all enemies it touches.',
      skillType: 'active',
      castType: 'point-target',
      targetRule: 'ground',
      damageType: 'magical',
      manaCostByLevel: [100, 110, 120, 130],
      cooldownByLevel: [9, 8, 7, 6],
      castRangeByLevel: [900, 900, 900, 900],
      effectValuesByLevel: {
        damage:     [100, 160, 220, 280],
        lineLength: [900, 900, 900, 900],
        lineWidth:  [275, 275, 275, 275],
      },
      aiHints: { useWhenEnemiesInLine: true, minManaPct: 0.2 },
    },
    {
      id: 'lightStrikeArray', slot: 'W',
      name: 'Light Strike Array',
      description: 'Summons a column of flames that stuns and damages enemies in an area.',
      skillType: 'active',
      castType: 'point-target',
      targetRule: 'ground',
      damageType: 'magical',
      manaCostByLevel: [90, 105, 120, 135],
      cooldownByLevel: [10, 9, 8, 7],
      castRangeByLevel: [625, 625, 625, 625],
      effectValuesByLevel: {
        damage:      [80, 130, 180, 230],
        stunDuration:[1.6, 1.9, 2.2, 2.5],
        aoeRadius:   [225, 225, 225, 225],
        delay:       [0.5, 0.5, 0.5, 0.5],
      },
      aiHints: { useWhenEnemiesInRadiusAtLeast: 1, minManaPct: 0.18 },
    },
    {
      id: 'fierySoul', slot: 'E',
      name: 'Fiery Soul',
      description: 'Grants bonus attack and cast speed whenever Lina casts a spell.',
      skillType: 'passive',
      castType: 'no-target',
      targetRule: 'none',
      damageType: 'none',
      manaCostByLevel: [0, 0, 0, 0],
      cooldownByLevel: [0, 0, 0, 0],
      castRangeByLevel: [0, 0, 0, 0],
      effectValuesByLevel: {
        atkSpeedPerStack: [25, 35, 45, 65],
        maxStacks:        [3, 3, 3, 3],
        stackDuration:    [10, 10, 10, 10],
      },
      aiHints: {},
    },
    {
      id: 'lagunaBlade', slot: 'R',
      name: 'Laguna Blade',
      description: 'Fires a huge bolt of lightning at a single target dealing massive damage.',
      skillType: 'active',
      castType: 'unit-target',
      targetRule: 'enemy',
      damageType: 'pure',
      manaCostByLevel: [280, 420, 680],
      cooldownByLevel: [55, 45, 35],
      castRangeByLevel: [600, 600, 600],
      effectValuesByLevel: {
        damage: [450, 675, 950],
      },
      aiHints: { useOnLowHealthTarget: true, minManaPct: 0.56 },
    },
  ];
}
