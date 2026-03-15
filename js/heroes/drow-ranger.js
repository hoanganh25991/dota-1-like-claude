// js/heroes/drow-ranger.js — Drow Ranger (AGI, Sentinel)
import { stdMat, glowMat, metalMat, box, cyl, sph } from '../hero-models.js';

export function buildModel() {
  const g = new THREE.Group();

  const ice    = stdMat(0xc8e8ff);   // pale ice skin
  const blue   = stdMat(0x224466);   // blue armor
  const silver = metalMat(0xaaccdd);
  const frost  = glowMat(0x88ddff);  // frost glow eyes
  const white  = stdMat(0xeeeeff);   // white hair
  const wood   = stdMat(0x6688aa);   // blue-tinted bow

  g.add(box(0.11, 0.17, 0.15, blue, -0.09, 0.085, 0));
  g.add(box(0.11, 0.17, 0.15, blue,  0.09, 0.085, 0));

  g.add(box(0.11, 0.36, 0.12, blue, -0.09, 0.36, 0));
  g.add(box(0.11, 0.36, 0.12, blue,  0.09, 0.36, 0));

  g.add(box(0.34, 0.44, 0.26, blue, 0, 0.80, 0));
  g.add(box(0.38, 0.06, 0.28, silver, 0, 0.58, 0));  // belt

  // Chest armor plate
  g.add(box(0.26, 0.28, 0.06, silver, 0, 0.86, 0.14));

  g.add(box(0.11, 0.12, 0.16, silver, -0.25, 1.02, 0));
  g.add(box(0.11, 0.12, 0.16, silver,  0.25, 1.02, 0));

  g.add(box(0.10, 0.34, 0.10, ice, -0.25, 0.78, 0));
  g.add(box(0.10, 0.34, 0.10, ice,  0.25, 0.78, 0));

  // Bracers
  g.add(box(0.11, 0.12, 0.12, silver, -0.25, 0.59, 0));
  g.add(box(0.11, 0.12, 0.12, silver,  0.25, 0.59, 0));

  // Head — elven features
  g.add(sph(0.18, 10, ice, 0, 1.30, 0));

  // Pointed ears
  g.add(box(0.03, 0.10, 0.05, ice, -0.20, 1.32, 0));
  g.add(box(0.03, 0.10, 0.05, ice,  0.20, 1.32, 0));

  // Frost glowing eyes
  g.add(sph(0.035, 6, frost, -0.07, 1.31, 0.15));
  g.add(sph(0.035, 6, frost,  0.07, 1.31, 0.15));

  // White hair flowing back
  g.add(box(0.24, 0.28, 0.06, white, 0, 1.24, -0.14));
  g.add(box(0.14, 0.22, 0.06, white, -0.16, 1.14, -0.18));
  g.add(box(0.14, 0.22, 0.06, white,  0.16, 1.14, -0.18));

  // Circlet / headband
  g.add(cyl(0.19, 0.19, 0.04, 10, silver, 0, 1.22, 0));

  // Longbow — held left side
  const bow1 = cyl(0.016, 0.024, 0.68, 6, wood, -0.46, 0.98, 0.06);
  bow1.rotation.z = 0.20;
  g.add(bow1);
  const bow2 = cyl(0.016, 0.024, 0.68, 6, wood, -0.46, 0.52, 0.06);
  bow2.rotation.z = -0.20;
  g.add(bow2);
  g.add(cyl(0.030, 0.030, 0.16, 6, blue, -0.46, 0.74, 0.06));  // grip
  g.add(cyl(0.005, 0.005, 1.28, 4, stdMat(0xffffff), -0.46, 0.75, 0.10));  // string

  // Frost arrow
  g.add(cyl(0.008, 0.008, 0.46, 4, wood, -0.46, 0.74, -0.14));
  g.add(sph(0.020, 5, frost, -0.46, 0.74, -0.38));

  // Quiver (right back)
  g.add(cyl(0.05, 0.045, 0.36, 8, blue, 0.26, 0.82, -0.17));
  for (let i = 0; i < 3; i++) {
    g.add(cyl(0.007, 0.007, 0.40, 4, wood, 0.22 + i * 0.04, 1.02, -0.16));
  }

  return g;
}

export function getSkillTemplates() {
  return [
    {
      id: 'frostShot', slot: 'Q',
      name: 'Frost Arrows',
      description: 'Adds a frost effect to each arrow, slowing the movement of enemies.',
      skillType: 'toggle',
      castType: 'no-target',
      targetRule: 'none',
      damageType: 'physical',
      manaCostByLevel: [8, 8, 8, 8],
      cooldownByLevel: [0, 0, 0, 0],
      castRangeByLevel: [0, 0, 0, 0],
      effectValuesByLevel: {
        moveSlowPct:  [15, 25, 35, 45],
        slowDuration: [1.5, 1.5, 1.5, 1.5],
        manaPerShot:  [8, 8, 8, 8],
      },
      aiHints: { useWhenInCombat: true, minManaPct: 0.15 },
    },
    {
      id: 'gust', slot: 'W',
      name: 'Gust',
      description: 'Releases a wave that silences enemies and knocks them back.',
      skillType: 'active',
      castType: 'point-target',
      targetRule: 'enemy',
      damageType: 'none',
      manaCostByLevel: [75, 75, 75, 75],
      cooldownByLevel: [15, 13, 11, 9],
      castRangeByLevel: [900, 900, 900, 900],
      effectValuesByLevel: {
        silenceDuration: [3, 4, 5, 6],
        knockbackDist:   [200, 350, 500, 650],
        coneAngle:       [60, 60, 60, 60],
      },
      aiHints: { useWhenEnemyCasting: true, minManaPct: 0.15 },
    },
    {
      id: 'precisionAura', slot: 'E',
      name: 'Precision Aura',
      description: 'Passively grants Drow and all allied ranged units bonus damage based on their base damage.',
      skillType: 'passive',
      castType: 'no-target',
      targetRule: 'none',
      damageType: 'none',
      manaCostByLevel: [0, 0, 0, 0],
      cooldownByLevel: [0, 0, 0, 0],
      castRangeByLevel: [0, 0, 0, 0],
      effectValuesByLevel: {
        auraRangedDamagePct: [14, 18, 22, 26],
        aoeRadius:           [1200, 1200, 1200, 1200],
      },
      aiHints: {},
    },
    {
      id: 'marksmanship', slot: 'R',
      name: 'Marksmanship',
      description: 'When no nearby enemies are present, Drow gains bonus Agility.',
      skillType: 'passive',
      castType: 'no-target',
      targetRule: 'none',
      damageType: 'none',
      manaCostByLevel: [0, 0, 0],
      cooldownByLevel: [0, 0, 0],
      castRangeByLevel: [0, 0, 0],
      effectValuesByLevel: {
        bonusAgi:          [15, 30, 45],
        exclusionRadius:   [375, 375, 375],
      },
      aiHints: {},
    },
  ];
}
