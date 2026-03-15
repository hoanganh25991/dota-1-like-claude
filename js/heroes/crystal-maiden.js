// js/heroes/crystal-maiden.js — Crystal Maiden (INT, Sentinel)
import { stdMat, glowMat, metalMat, box, cyl, sph } from '../hero-models.js';

export function buildModel() {
  const g = new THREE.Group();

  const ice    = stdMat(0xaaddff);
  const robe   = stdMat(0x3366aa);
  const frost  = glowMat(0x88ddff);
  const white  = stdMat(0xeef8ff);
  const silver = metalMat(0xaabbcc);

  g.add(cyl(0.12, 0.18, 0.38, 8, robe, -0.10, 0.19, 0));
  g.add(cyl(0.12, 0.18, 0.38, 8, robe,  0.10, 0.19, 0));

  // Robe body — flared
  g.add(cyl(0.14, 0.34, 0.52, 10, robe, 0, 0.26, 0));
  g.add(box(0.42, 0.54, 0.36, robe, 0, 0.80, 0));

  // Frost trim on robe
  g.add(box(0.46, 0.06, 0.40, frost, 0, 0.54, 0));
  g.add(box(0.46, 0.04, 0.40, frost, 0, 1.04, 0));

  // Shoulders — ice epaulettes
  g.add(sph(0.14, 8, ice, -0.32, 1.08, 0));
  g.add(sph(0.14, 8, ice,  0.32, 1.08, 0));
  g.add(cyl(0, 0.05, 0.14, 5, frost, -0.36, 1.22, 0));
  g.add(cyl(0, 0.05, 0.14, 5, frost,  0.36, 1.22, 0));

  // Arms
  g.add(box(0.10, 0.36, 0.12, robe, -0.32, 0.82, 0));
  g.add(box(0.10, 0.36, 0.12, robe,  0.32, 0.82, 0));

  // Bracers — ice crystal
  g.add(box(0.12, 0.12, 0.14, ice, -0.32, 0.62, 0));
  g.add(box(0.12, 0.12, 0.14, ice,  0.32, 0.62, 0));

  // Hands
  g.add(sph(0.07, 6, ice, -0.32, 0.48, 0.04));
  g.add(sph(0.07, 6, ice,  0.32, 0.48, 0.04));

  // Head
  g.add(sph(0.19, 10, ice, 0, 1.34, 0));

  // Long white braids
  g.add(box(0.10, 0.44, 0.08, white, -0.16, 1.10, -0.12));
  g.add(box(0.10, 0.44, 0.08, white,  0.16, 1.10, -0.12));
  g.add(box(0.10, 0.32, 0.08, white, -0.20, 0.74, -0.10));
  g.add(box(0.10, 0.32, 0.08, white,  0.20, 0.74, -0.10));

  // Ice crown
  g.add(cyl(0.20, 0.20, 0.04, 10, silver, 0, 1.26, 0));
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    g.add(cyl(0, 0.022, 0.12, 5, frost,
      Math.cos(ang) * 0.18, 1.32, Math.sin(ang) * 0.14));
  }

  // Frost glowing eyes
  g.add(sph(0.040, 6, frost, -0.07, 1.36, 0.16));
  g.add(sph(0.040, 6, frost,  0.07, 1.36, 0.16));

  // Staff — left hand with ice orb
  const shaft = cyl(0.025, 0.030, 0.96, 7, silver, -0.44, 0.76, 0.08);
  shaft.rotation.z = 0.14;
  g.add(shaft);
  g.add(sph(0.11, 9, frost, -0.56, 1.28, 0.08));
  g.add(sph(0.07, 7, glowMat(0xffffff), -0.56, 1.28, 0.08));

  // Ice crystal cluster on staff
  g.add(box(0.06, 0.12, 0.06, ice, -0.60, 1.38, 0.08));
  g.add(box(0.04, 0.10, 0.04, frost, -0.54, 1.44, 0.12));

  return g;
}

export function getSkillTemplates() {
  return [
    {
      id: 'crystalNova', slot: 'Q',
      name: 'Crystal Nova',
      description: 'A burst of damaging ice that slows movement and attack speed of nearby enemies.',
      skillType: 'active',
      castType: 'point-target',
      targetRule: 'ground',
      damageType: 'magical',
      manaCostByLevel: [100, 110, 120, 130],
      cooldownByLevel: [12, 11, 10, 9],
      castRangeByLevel: [700, 700, 700, 700],
      effectValuesByLevel: {
        damage:         [100, 150, 200, 250],
        aoeRadius:      [425, 425, 425, 425],
        moveSlowPct:    [20, 30, 40, 50],
        atkSlowPct:     [20, 30, 40, 50],
        slowDuration:   [4.5, 4.5, 4.5, 4.5],
      },
      aiHints: { useWhenEnemiesInRadiusAtLeast: 1, minManaPct: 0.2 },
    },
    {
      id: 'frostbite', slot: 'W',
      name: 'Frostbite',
      description: 'Encases a target in ice, disabling movement and dealing damage over time.',
      skillType: 'active',
      castType: 'unit-target',
      targetRule: 'enemy',
      damageType: 'magical',
      manaCostByLevel: [115, 115, 115, 115],
      cooldownByLevel: [9, 9, 9, 9],
      castRangeByLevel: [500, 500, 500, 500],
      effectValuesByLevel: {
        damagePerSecond: [30, 50, 70, 100],
        rootDuration:    [1.5, 2.0, 2.5, 3.0],
      },
      aiHints: { useOnMobileEnemy: true, minManaPct: 0.23 },
    },
    {
      id: 'brillianceAura', slot: 'E',
      name: 'Brilliance Aura',
      description: 'Gives all friendly units a mana regeneration bonus.',
      skillType: 'passive',
      castType: 'no-target',
      targetRule: 'none',
      damageType: 'none',
      manaCostByLevel: [0, 0, 0, 0],
      cooldownByLevel: [0, 0, 0, 0],
      castRangeByLevel: [0, 0, 0, 0],
      effectValuesByLevel: {
        manaRegenBonus: [1.0, 1.65, 2.3, 3.0],
        aoeRadius:      [Infinity, Infinity, Infinity, Infinity],
      },
      aiHints: {},
    },
    {
      id: 'freezingField', slot: 'R',
      name: 'Freezing Field',
      description: 'Channels a massive blizzard that damages and slows all nearby enemies.',
      skillType: 'channel',
      castType: 'self-radius',
      targetRule: 'enemy',
      damageType: 'magical',
      manaCostByLevel: [200, 400, 600],
      cooldownByLevel: [110, 110, 110],
      castRangeByLevel: [0, 0, 0],
      effectValuesByLevel: {
        damagePerExplosion: [105, 170, 250],
        explosionRadius:    [300, 300, 300],
        aoeRadius:          [835, 835, 835],
        moveSlowPct:        [30, 30, 30],
        duration:           [10, 10, 10],
        manaPerSecond:      [20, 40, 60],
      },
      aiHints: { useWhenEnemiesInRadiusAtLeast: 3, minManaPct: 0.4 },
    },
  ];
}
