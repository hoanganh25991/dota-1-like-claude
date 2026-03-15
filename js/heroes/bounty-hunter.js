// js/heroes/bounty-hunter.js — Bounty Hunter (AGI, Scourge)
import { stdMat, glowMat, metalMat, box, cyl, sph } from '../hero-models.js';

export function buildModel() {
  const g = new THREE.Group();

  const dark   = stdMat(0x1a1a1a);
  const cloth  = stdMat(0x2a2a18);
  const blade  = metalMat(0x999977);
  const gold   = metalMat(0xccaa33);
  const red    = glowMat(0xff4400);
  const tan    = stdMat(0xaa8855);

  g.add(box(0.11, 0.17, 0.14, dark, -0.09, 0.085, 0));
  g.add(box(0.11, 0.17, 0.14, dark,  0.09, 0.085, 0));

  g.add(box(0.11, 0.35, 0.12, cloth, -0.09, 0.35, 0));
  g.add(box(0.11, 0.35, 0.12, cloth,  0.09, 0.35, 0));

  g.add(box(0.32, 0.42, 0.24, cloth, 0, 0.79, 0));

  // Bandoliers / straps
  g.add(box(0.38, 0.04, 0.26, tan, 0, 0.98, 0));
  g.add(box(0.04, 0.40, 0.26, tan, -0.18, 0.82, 0));
  g.add(box(0.04, 0.40, 0.26, tan,  0.18, 0.82, 0));

  // Shoulders
  g.add(box(0.10, 0.12, 0.16, cloth, -0.23, 1.01, 0));
  g.add(box(0.10, 0.12, 0.16, cloth,  0.23, 1.01, 0));

  // Arms
  g.add(box(0.09, 0.34, 0.09, tan, -0.23, 0.78, 0));
  g.add(box(0.09, 0.34, 0.09, tan,  0.23, 0.78, 0));

  // Wraps
  g.add(box(0.10, 0.12, 0.11, cloth, -0.23, 0.59, 0.02));
  g.add(box(0.10, 0.12, 0.11, cloth,  0.23, 0.59, 0.02));

  // Head — wrapped ninja style
  g.add(sph(0.17, 10, tan, 0, 1.28, 0));

  // Face wrap / mask
  g.add(box(0.28, 0.14, 0.06, dark, 0, 1.24, 0.12));
  g.add(box(0.26, 0.04, 0.06, dark, 0, 1.32, 0.13));

  // Red eyes
  g.add(sph(0.035, 6, red, -0.07, 1.32, 0.16));
  g.add(sph(0.035, 6, red,  0.07, 1.32, 0.16));

  // Head wrap band
  g.add(cyl(0.18, 0.18, 0.05, 10, cloth, 0, 1.24, 0));

  // Shuriken stars — attached to belt/bandolier
  for (let i = 0; i < 2; i++) {
    const shuri = box(0.10, 0.10, 0.02, blade, -0.26 + i * 0.52, 0.90, 0.14);
    shuri.rotation.z = 0.5;
    g.add(shuri);
    const shuriCross = box(0.02, 0.10, 0.10, blade, -0.26 + i * 0.52, 0.90, 0.14);
    shuriCross.rotation.z = 0.5;
    g.add(shuriCross);
    const shuriGold = sph(0.025, 5, gold, -0.26 + i * 0.52, 0.90, 0.16);
    g.add(shuriGold);
  }

  // Main blade — right hand
  const mainBlade = box(0.03, 0.50, 0.04, blade, 0.28, 0.64, 0.12);
  mainBlade.rotation.z = -0.3;
  g.add(mainBlade);
  const mainHilt = cyl(0.025, 0.025, 0.16, 6, dark, 0.24, 0.96, 0.12);
  g.add(mainHilt);
  const mainGuard = box(0.14, 0.04, 0.05, gold, 0.24, 0.88, 0.12);
  g.add(mainGuard);

  // Coin pouch on belt (gold sack)
  g.add(sph(0.07, 6, gold, 0.28, 0.60, -0.10));

  return g;
}

export function getSkillTemplates() {
  return [
    {
      id: 'shurikenToss', slot: 'Q',
      name: 'Shuriken Toss',
      description: 'Throws a shuriken at a target that bounces to a Tracked unit.',
      skillType: 'active',
      castType: 'unit-target',
      targetRule: 'enemy',
      damageType: 'magical',
      manaCostByLevel: [120, 120, 120, 120],
      cooldownByLevel: [12, 10, 8, 6],
      castRangeByLevel: [650, 650, 650, 650],
      effectValuesByLevel: {
        damage:       [125, 200, 275, 350],
        bounceRange:  [900, 900, 900, 900],
        ministunDur:  [0.1, 0.1, 0.1, 0.1],
      },
      aiHints: { useWhenEnemyInRange: true, minManaPct: 0.25 },
    },
    {
      id: 'jinada', slot: 'W',
      name: 'Jinada',
      description: 'Once every few seconds, Bounty Hunter\'s next attack bashes and steals gold.',
      skillType: 'passive',
      castType: 'no-target',
      targetRule: 'none',
      damageType: 'physical',
      manaCostByLevel: [0, 0, 0, 0],
      cooldownByLevel: [9, 7, 5, 3],
      castRangeByLevel: [0, 0, 0, 0],
      effectValuesByLevel: {
        bonusDamage:    [50, 80, 110, 140],
        bashDuration:   [1.0, 1.0, 1.0, 1.0],
        goldStolen:     [20, 30, 40, 50],
      },
      aiHints: {},
    },
    {
      id: 'shadowWalk', slot: 'E',
      name: 'Shadow Walk',
      description: 'Bounty Hunter vanishes into the shadows and gains bonus damage on his next attack.',
      skillType: 'active',
      castType: 'self',
      targetRule: 'none',
      damageType: 'physical',
      manaCostByLevel: [50, 50, 50, 50],
      cooldownByLevel: [15, 12, 9, 6],
      castRangeByLevel: [0, 0, 0, 0],
      effectValuesByLevel: {
        duration:       [20, 20, 20, 20],
        bonusDamage:    [50, 100, 150, 200],
        moveSpeedBonus: [11, 16, 21, 26],
      },
      aiHints: { useBeforeCombat: true, minManaPct: 0.1 },
    },
    {
      id: 'track', slot: 'R',
      name: 'Track',
      description: 'Tracks an enemy hero, revealing their location and granting bonus gold to killers.',
      skillType: 'active',
      castType: 'unit-target',
      targetRule: 'enemy',
      damageType: 'none',
      manaCostByLevel: [50, 50, 50],
      cooldownByLevel: [10, 8, 6],
      castRangeByLevel: [900, 1000, 1100],
      effectValuesByLevel: {
        trackDuration:   [30, 30, 30],
        bonusGoldOnKill: [100, 175, 275],
        moveSpeedBonus:  [20, 24, 28],
        teamMoveSpeedBonus:[20, 24, 28],
      },
      aiHints: { useOnHighValueTarget: true, minManaPct: 0.1 },
    },
  ];
}
