// js/heroes/zeus.js — Zeus (INT, Sentinel)
import { stdMat, glowMat, metalMat, box, cyl, sph } from '../hero-models.js';

export function buildModel() {
  const g = new THREE.Group();

  const toga   = stdMat(0xf0eedc);
  const gold   = metalMat(0xeecc44);
  const bolt   = glowMat(0xffee44);
  const skin   = stdMat(0xd4b882);
  const beard  = stdMat(0xeeeeee);

  // Sandaled feet
  g.add(box(0.16, 0.10, 0.24, skin, -0.12, 0.05, 0.02));
  g.add(box(0.16, 0.10, 0.24, skin,  0.12, 0.05, 0.02));

  // Sandal straps
  g.add(box(0.18, 0.04, 0.04, gold, -0.12, 0.10, 0));
  g.add(box(0.18, 0.04, 0.04, gold,  0.12, 0.10, 0));

  // Legs under toga
  g.add(box(0.14, 0.40, 0.14, skin, -0.12, 0.38, 0));
  g.add(box(0.14, 0.40, 0.14, skin,  0.12, 0.38, 0));

  // Toga — draped with folds (overlapping boxes)
  g.add(box(0.50, 0.58, 0.36, toga, 0, 0.84, 0));
  g.add(box(0.10, 0.54, 0.06, toga, -0.28, 0.84, -0.16));  // side drape
  g.add(box(0.10, 0.44, 0.06, toga,  0.28, 0.88, -0.16));

  // Gold sash / belt
  g.add(box(0.54, 0.07, 0.38, gold, 0, 0.58, 0));

  // Toga fold lines
  g.add(box(0.06, 0.46, 0.04, stdMat(0xd8d6c4), -0.14, 0.82, 0.19));
  g.add(box(0.06, 0.38, 0.04, stdMat(0xd8d6c4),  0.08, 0.86, 0.19));

  // Broad shoulders
  g.add(box(0.18, 0.18, 0.22, skin, -0.36, 1.10, 0));
  g.add(box(0.18, 0.18, 0.22, skin,  0.36, 1.10, 0));

  // Arms — muscular
  g.add(box(0.14, 0.40, 0.16, skin, -0.36, 0.84, 0));
  g.add(box(0.14, 0.40, 0.16, skin,  0.36, 0.84, 0));

  // Gold bracers
  g.add(box(0.16, 0.10, 0.18, gold, -0.36, 0.62, 0));
  g.add(box(0.16, 0.10, 0.18, gold,  0.36, 0.62, 0));

  // Hands
  g.add(sph(0.09, 7, skin, -0.36, 0.48, 0.04));
  g.add(sph(0.09, 7, skin,  0.36, 0.48, 0.04));

  // Head — Zeus, older god
  g.add(sph(0.21, 10, skin, 0, 1.38, 0));

  // Beard / full face beard
  g.add(box(0.24, 0.22, 0.06, beard, 0, 1.26, 0.14));
  g.add(box(0.16, 0.12, 0.06, beard, 0, 1.14, 0.14));

  // Mustache
  g.add(box(0.18, 0.06, 0.04, beard, 0, 1.32, 0.18));

  // Hair — flowing white
  g.add(box(0.30, 0.24, 0.06, beard, 0, 1.46, -0.12));
  g.add(box(0.24, 0.18, 0.06, beard, -0.20, 1.34, -0.10));
  g.add(box(0.24, 0.18, 0.06, beard,  0.20, 1.34, -0.10));

  // Lightning eyes
  g.add(sph(0.040, 6, bolt, -0.08, 1.40, 0.18));
  g.add(sph(0.040, 6, bolt,  0.08, 1.40, 0.18));

  // Laurel wreath
  g.add(cyl(0.22, 0.22, 0.04, 12, gold, 0, 1.30, 0));
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2;
    const leaf = box(0.04, 0.08, 0.03, stdMat(0x448822),
      Math.cos(ang) * 0.20, 1.32 + Math.abs(Math.sin(ang * 2)) * 0.03, Math.sin(ang) * 0.16);
    leaf.rotation.y = ang;
    g.add(leaf);
  }

  // Lightning bolt — right hand
  const bolt1 = box(0.04, 0.52, 0.04, bolt, 0.42, 0.56, 0.14);
  bolt1.rotation.z = -0.4;
  g.add(bolt1);
  const bolt2 = box(0.04, 0.30, 0.04, glowMat(0xffffff), 0.46, 0.66, 0.14);
  bolt2.rotation.z = -0.6;
  g.add(bolt2);

  return g;
}

export function getSkillTemplates() {
  return [
    {
      id: 'arcLightning', slot: 'Q',
      name: 'Arc Lightning',
      description: 'Hurls a bolt of lightning that bounces between nearby enemy units.',
      skillType: 'active',
      castType: 'unit-target',
      targetRule: 'enemy',
      damageType: 'magical',
      manaCostByLevel: [65, 65, 65, 65],
      cooldownByLevel: [1.6, 1.6, 1.6, 1.6],
      castRangeByLevel: [700, 700, 700, 700],
      effectValuesByLevel: {
        damage:        [75, 110, 145, 180],
        bounceCount:   [6, 6, 6, 6],
        bounceRadius:  [500, 500, 500, 500],
      },
      aiHints: { useWhenEnemiesInRadiusAtLeast: 1, minManaPct: 0.13 },
    },
    {
      id: 'lightningBolt', slot: 'W',
      name: 'Lightning Bolt',
      description: 'Calls down a devastating lightning bolt at a target enemy, stunning and dealing heavy damage.',
      skillType: 'active',
      castType: 'unit-target',
      targetRule: 'enemy',
      damageType: 'magical',
      manaCostByLevel: [125, 150, 175, 200],
      cooldownByLevel: [6, 6, 6, 6],
      castRangeByLevel: [700, 700, 700, 700],
      effectValuesByLevel: {
        damage:      [100, 175, 250, 325],
        stunDuration:[0.4, 0.4, 0.4, 0.4],
        visionRadius:[750, 750, 750, 750],
      },
      aiHints: { useWhenEnemyInRange: true, minManaPct: 0.25 },
    },
    {
      id: 'staticField', slot: 'E',
      name: 'Static Field',
      description: 'Each time Zeus casts a spell, all nearby enemies lose a percentage of their current HP.',
      skillType: 'passive',
      castType: 'no-target',
      targetRule: 'none',
      damageType: 'magical',
      manaCostByLevel: [0, 0, 0, 0],
      cooldownByLevel: [0, 0, 0, 0],
      castRangeByLevel: [0, 0, 0, 0],
      effectValuesByLevel: {
        currentHpPct: [4, 7, 10, 13],
        aoeRadius:    [900, 900, 900, 900],
      },
      aiHints: {},
    },
    {
      id: 'thundergodsWrath', slot: 'R',
      name: 'Thundergod\'s Wrath',
      description: 'Strikes all enemy heroes across the map with lightning bolts.',
      skillType: 'active',
      castType: 'global',
      targetRule: 'enemy',
      damageType: 'magical',
      manaCostByLevel: [200, 325, 450],
      cooldownByLevel: [120, 120, 120],
      castRangeByLevel: [Infinity, Infinity, Infinity],
      effectValuesByLevel: {
        damage:      [225, 350, 450],
        visionDuration:[5, 5, 5],
      },
      aiHints: { useWhenEnemyHeroLowHealth: true, minManaPct: 0.4 },
    },
  ];
}
