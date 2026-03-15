// js/heroes/sven.js — Sven (STR, Sentinel)
import { stdMat, glowMat, metalMat, box, cyl } from '../hero-models.js';

export function buildModel() {
  const g = new THREE.Group();

  const armor  = metalMat(0x556677);
  const cloth  = stdMat(0x334455);
  const gold   = metalMat(0xddaa00);
  const blue   = glowMat(0x4488ff);
  const dark   = stdMat(0x1a2233);

  // Boots
  g.add(box(0.17, 0.20, 0.22, armor, -0.14, 0.10, 0));
  g.add(box(0.17, 0.20, 0.22, armor,  0.14, 0.10, 0));

  // Legs
  g.add(box(0.17, 0.36, 0.18, cloth, -0.14, 0.40, 0));
  g.add(box(0.17, 0.36, 0.18, cloth,  0.14, 0.40, 0));

  // Torso — heavy knight
  g.add(box(0.56, 0.54, 0.38, armor, 0, 0.90, 0));
  g.add(box(0.34, 0.30, 0.06, gold, 0, 1.00, 0.20));  // chest plate

  // Cape / back
  g.add(box(0.46, 0.54, 0.06, stdMat(0x223344), 0, 0.88, -0.22));

  // Shoulders — large pauldrons
  g.add(box(0.20, 0.22, 0.26, armor, -0.42, 1.14, 0));
  g.add(box(0.20, 0.22, 0.26, armor,  0.42, 1.14, 0));
  g.add(cyl(0, 0.05, 0.14, 5, gold, -0.42, 1.28, 0));
  g.add(cyl(0, 0.05, 0.14, 5, gold,  0.42, 1.28, 0));

  // Arms
  g.add(box(0.17, 0.40, 0.18, armor, -0.40, 0.88, 0));
  g.add(box(0.17, 0.40, 0.18, armor,  0.40, 0.88, 0));

  // Gauntlets
  g.add(box(0.19, 0.17, 0.20, armor, -0.40, 0.65, 0));
  g.add(box(0.19, 0.17, 0.20, armor,  0.40, 0.65, 0));

  // Head / full helm
  g.add(box(0.36, 0.32, 0.34, armor, 0, 1.54, 0));
  g.add(box(0.22, 0.08, 0.06, gold, 0, 1.52, 0.18));  // visor

  // Blue glowing eye slit
  g.add(box(0.18, 0.04, 0.03, blue, 0, 1.56, 0.19));

  // Helm crest
  g.add(cyl(0.03, 0.05, 0.20, 6, gold, 0, 1.76, 0));

  // Great sword — enormous, two-handed, right side
  const blade = box(0.08, 0.80, 0.06, metalMat(0xaabbdd), 0.52, 0.70, 0.10);
  g.add(blade);
  const bladeEdge = box(0.04, 0.84, 0.02, blue, 0.56, 0.70, 0.14);
  g.add(bladeEdge);
  const guard = box(0.30, 0.06, 0.08, gold, 0.52, 1.12, 0.10);
  g.add(guard);
  const hilt = cyl(0.04, 0.04, 0.22, 6, dark, 0.52, 1.00, 0.10);
  g.add(hilt);

  return g;
}

export function getSkillTemplates() {
  return [
    {
      id: 'stormHammer', slot: 'Q',
      name: 'Storm Hammer',
      description: 'Launches a magical hammer that stuns the target and damages nearby enemies.',
      skillType: 'active',
      castType: 'unit-target',
      targetRule: 'enemy',
      damageType: 'magical',
      manaCostByLevel: [110, 120, 130, 140],
      cooldownByLevel: [13, 12, 11, 10],
      castRangeByLevel: [600, 600, 600, 600],
      effectValuesByLevel: {
        damage:      [100, 175, 250, 325],
        stunDuration:[1.4, 1.6, 1.8, 2.0],
        aoeRadius:   [255, 255, 255, 255],
      },
      aiHints: { useWhenEnemiesInRadiusAtLeast: 1, minManaPct: 0.25 },
    },
    {
      id: 'greatCleave', slot: 'W',
      name: 'Great Cleave',
      description: 'Sven strikes with great force, cleaving all nearby enemies with full damage.',
      skillType: 'passive',
      castType: 'no-target',
      targetRule: 'none',
      damageType: 'physical',
      manaCostByLevel: [0, 0, 0, 0],
      cooldownByLevel: [0, 0, 0, 0],
      castRangeByLevel: [0, 0, 0, 0],
      effectValuesByLevel: {
        cleavePct:   [30, 42, 55, 68],
        cleaveRadius:[300, 300, 300, 300],
      },
      aiHints: {},
    },
    {
      id: 'warcry', slot: 'E',
      name: 'Warcry',
      description: 'Sven charges himself and nearby allies with battle lust, granting bonus speed and armor.',
      skillType: 'active',
      castType: 'self',
      targetRule: 'none',
      damageType: 'none',
      manaCostByLevel: [25, 25, 25, 25],
      cooldownByLevel: [32, 28, 24, 20],
      castRangeByLevel: [0, 0, 0, 0],
      effectValuesByLevel: {
        moveSpeedBonus: [12, 15, 18, 21],
        armorBonus:     [5, 8, 11, 14],
        aoeRadius:      [250, 250, 250, 250],
        duration:       [8, 8, 8, 8],
      },
      aiHints: { useBeforeCombat: true, minManaPct: 0.05 },
    },
    {
      id: 'godsStrength', slot: 'R',
      name: 'God\'s Strength',
      description: 'Sven channels the power of a god, granting bonus damage for a duration.',
      skillType: 'active',
      castType: 'self',
      targetRule: 'none',
      damageType: 'none',
      manaCostByLevel: [100, 150, 200],
      cooldownByLevel: [80, 70, 60],
      castRangeByLevel: [0, 0, 0],
      effectValuesByLevel: {
        damageBonusPct: [100, 150, 200],
        duration:       [25, 25, 25],
      },
      aiHints: { useBeforeCombat: true, minManaPct: 0.2 },
    },
  ];
}
