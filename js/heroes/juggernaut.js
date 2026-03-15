// js/heroes/juggernaut.js — Juggernaut (AGI, Sentinel)
import { stdMat, glowMat, metalMat, box, cyl, sph } from '../hero-models.js';

export function buildModel() {
  const g = new THREE.Group();

  const cloth  = stdMat(0xddcc88);
  const armor  = metalMat(0x8899aa);
  const mask   = stdMat(0xeeddaa);
  const green  = glowMat(0x22ff88);
  const dark   = stdMat(0x223322);
  const blade  = metalMat(0xccddee);

  g.add(box(0.13, 0.18, 0.16, armor, -0.10, 0.09, 0));
  g.add(box(0.13, 0.18, 0.16, armor,  0.10, 0.09, 0));

  g.add(box(0.13, 0.36, 0.14, cloth, -0.10, 0.36, 0));
  g.add(box(0.13, 0.36, 0.14, cloth,  0.10, 0.36, 0));

  // Sash / hakama
  g.add(box(0.36, 0.46, 0.28, cloth, 0, 0.82, 0));
  g.add(box(0.40, 0.10, 0.30, dark, 0, 0.58, 0));  // belt obi

  // Chest wrap
  g.add(box(0.30, 0.36, 0.06, dark, 0, 0.94, 0.16));

  // Shoulders — light armor
  g.add(box(0.12, 0.14, 0.18, armor, -0.26, 1.04, 0));
  g.add(box(0.12, 0.14, 0.18, armor,  0.26, 1.04, 0));

  // Arms
  g.add(box(0.11, 0.36, 0.12, cloth, -0.26, 0.80, 0));
  g.add(box(0.11, 0.36, 0.12, cloth,  0.26, 0.80, 0));

  // Bracers
  g.add(box(0.13, 0.12, 0.14, armor, -0.26, 0.60, 0));
  g.add(box(0.13, 0.12, 0.14, armor,  0.26, 0.60, 0));

  // Head
  g.add(sph(0.19, 10, mask, 0, 1.32, 0));

  // Oni mask
  g.add(box(0.26, 0.24, 0.06, mask, 0, 1.32, 0.12));
  // Mask detail — green glowing eyes
  g.add(sph(0.04, 6, green, -0.07, 1.36, 0.17));
  g.add(sph(0.04, 6, green,  0.07, 1.36, 0.17));

  // Mask horns
  g.add(cyl(0, 0.03, 0.12, 5, mask, -0.08, 1.48, 0.12));
  g.add(cyl(0, 0.03, 0.12, 5, mask,  0.08, 1.48, 0.12));

  // Topknot
  g.add(cyl(0.04, 0.06, 0.14, 6, dark, 0, 1.48, -0.02));

  // Katana — held right hand
  const katana = box(0.03, 0.80, 0.04, blade, 0.32, 0.66, 0.14);
  katana.rotation.z = -0.2;
  g.add(katana);
  const katanaGlow = box(0.015, 0.78, 0.015, green, 0.34, 0.66, 0.17);
  katanaGlow.rotation.z = -0.2;
  g.add(katanaGlow);
  const tsuba = box(0.14, 0.04, 0.05, armor, 0.28, 1.06, 0.14);
  g.add(tsuba);
  const hilt = cyl(0.025, 0.025, 0.20, 6, dark, 0.24, 0.98, 0.14);
  g.add(hilt);

  return g;
}

export function getSkillTemplates() {
  return [
    {
      id: 'bladeFury', slot: 'Q',
      name: 'Blade Fury',
      description: 'Channels a blade spin that makes Juggernaut magic immune and deals damage to nearby enemies.',
      skillType: 'channel',
      castType: 'self',
      targetRule: 'none',
      damageType: 'magical',
      manaCostByLevel: [110, 110, 110, 110],
      cooldownByLevel: [30, 25, 20, 15],
      castRangeByLevel: [0, 0, 0, 0],
      effectValuesByLevel: {
        damagePerSecond: [80, 100, 120, 140],
        aoeRadius:       [250, 250, 250, 250],
        duration:        [5, 5, 5, 5],
        magicImmune:     [true, true, true, true],
      },
      aiHints: { useWhenEnemiesInRadiusAtLeast: 1, minManaPct: 0.22 },
    },
    {
      id: 'healingWard', slot: 'W',
      name: 'Healing Ward',
      description: 'Summons a ward that heals nearby allied units.',
      skillType: 'active',
      castType: 'point-target',
      targetRule: 'ground',
      damageType: 'none',
      manaCostByLevel: [120, 120, 120, 120],
      cooldownByLevel: [60, 50, 40, 30],
      castRangeByLevel: [400, 400, 400, 400],
      effectValuesByLevel: {
        healPct:    [1.5, 2.0, 2.5, 3.0],
        aoeRadius:  [500, 500, 500, 500],
        wardDuration:[25, 25, 25, 25],
        wardHp:     [1, 1, 1, 1],
      },
      aiHints: { useWhenAlliesLowHp: true, minManaPct: 0.25 },
    },
    {
      id: 'bladeDance', slot: 'E',
      name: 'Blade Dance',
      description: 'Gives Juggernaut a chance to deal critical damage on each attack.',
      skillType: 'passive',
      castType: 'no-target',
      targetRule: 'none',
      damageType: 'physical',
      manaCostByLevel: [0, 0, 0, 0],
      cooldownByLevel: [0, 0, 0, 0],
      castRangeByLevel: [0, 0, 0, 0],
      effectValuesByLevel: {
        critChancePct: [15, 20, 25, 35],
        critMultiplier:[1.7, 1.7, 1.7, 1.7],
      },
      aiHints: {},
    },
    {
      id: 'omnislash', slot: 'R',
      name: 'Omnislash',
      description: 'Juggernaut leaps at a target and slashes nearby enemies with blinding speed.',
      skillType: 'active',
      castType: 'unit-target',
      targetRule: 'enemy',
      damageType: 'physical',
      manaCostByLevel: [200, 275, 350],
      cooldownByLevel: [130, 120, 110],
      castRangeByLevel: [450, 450, 450],
      effectValuesByLevel: {
        slashCount:     [3, 6, 9],
        damagePerSlash: [100, 125, 150],
        slashRadius:    [425, 425, 425],
        duration:       [3, 3, 3],
      },
      aiHints: { useOnHighHealthEnemy: true, minManaPct: 0.4 },
    },
  ];
}
