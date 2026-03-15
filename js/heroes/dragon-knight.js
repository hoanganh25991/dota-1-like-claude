// js/heroes/dragon-knight.js — Dragon Knight (STR, Sentinel)
import { stdMat, glowMat, metalMat, box, cyl, sph } from '../hero-models.js';

export function buildModel() {
  const g = new THREE.Group();

  const armor  = stdMat(0x1a1a2e);    // dark navy armor
  const gold   = metalMat(0xffcc00);  // gold trim
  const amber  = glowMat(0xffaa22);   // amber eye glow
  const shield  = stdMat(0x2a2a44);   // shield dark blue
  const dragon  = stdMat(0x8b0000);   // dark red dragon motif

  // Boots
  const bootL = box(0.15, 0.18, 0.20, armor, -0.13, 0.09, 0);
  const bootR = box(0.15, 0.18, 0.20, armor,  0.13, 0.09, 0);
  g.add(bootL, bootR);

  // Shin guards
  const shinL = box(0.14, 0.28, 0.16, armor, -0.13, 0.32, 0);
  const shinR = box(0.14, 0.28, 0.16, armor,  0.13, 0.32, 0);
  g.add(shinL, shinR);

  // Thighs
  const thighL = box(0.17, 0.26, 0.18, armor, -0.13, 0.60, 0);
  const thighR = box(0.17, 0.26, 0.18, armor,  0.13, 0.60, 0);
  g.add(thighL, thighR);

  // Torso — wide and heavy
  const torso = box(0.54, 0.52, 0.36, armor, 0, 0.96, 0);
  g.add(torso);

  // Chest plate gold trim
  const chestPlate = box(0.36, 0.30, 0.06, gold, 0, 1.06, 0.19);
  g.add(chestPlate);

  // Dragon emblem on chest
  const emblem = box(0.16, 0.20, 0.04, dragon, 0, 1.08, 0.22);
  g.add(emblem);

  // Pauldrons (large shoulder guards)
  const paulL = box(0.22, 0.20, 0.24, armor, -0.38, 1.18, 0);
  const paulR = box(0.22, 0.20, 0.24, armor,  0.38, 1.18, 0);
  g.add(paulL, paulR);

  // Pauldron gold edging
  const pEdgeL = box(0.24, 0.04, 0.26, gold, -0.38, 1.28, 0);
  const pEdgeR = box(0.24, 0.04, 0.26, gold,  0.38, 1.28, 0);
  g.add(pEdgeL, pEdgeR);

  // Arms — armored, thick
  const armL = box(0.14, 0.36, 0.16, armor, -0.37, 0.92, 0);
  const armR = box(0.14, 0.36, 0.16, armor,  0.37, 0.92, 0);
  g.add(armL, armR);

  // Gauntlets
  const gauntL = box(0.16, 0.16, 0.18, armor, -0.37, 0.70, 0);
  const gauntR = box(0.16, 0.16, 0.18, armor,  0.37, 0.70, 0);
  g.add(gauntL, gauntR);

  // Helmet
  const helm = box(0.34, 0.30, 0.32, armor, 0, 1.52, 0);
  g.add(helm);

  // Helmet visor gold trim
  const visor = box(0.24, 0.08, 0.06, gold, 0, 1.50, 0.17);
  g.add(visor);

  // Amber glowing eyes through visor
  const eyeL = sph(0.04, 6, amber, -0.07, 1.52, 0.17);
  const eyeR = sph(0.04, 6, amber,  0.07, 1.52, 0.17);
  g.add(eyeL, eyeR);

  // Helmet crest (dragon fin on top)
  const crest = box(0.06, 0.16, 0.28, dragon, 0, 1.72, 0);
  g.add(crest);
  const crestGold = box(0.04, 0.12, 0.04, gold, 0, 1.78, -0.12);
  g.add(crestGold);

  // Shield (left arm)
  const shieldMain = box(0.06, 0.40, 0.36, shield, -0.54, 0.88, 0.06);
  g.add(shieldMain);
  const shieldBoss = sph(0.08, 8, gold, -0.58, 0.92, 0.06);
  g.add(shieldBoss);
  const shieldRim = box(0.04, 0.44, 0.40, gold, -0.56, 0.88, 0.06);
  shieldRim.scale.set(1, 1, 1);
  g.add(shieldRim);

  // Sword (right hand, pointing down)
  const swordBlade = box(0.05, 0.60, 0.04, metalMat(0xccddee), 0.50, 0.55, 0.06);
  g.add(swordBlade);
  const swordGuard = box(0.18, 0.05, 0.06, gold, 0.50, 0.88, 0.06);
  g.add(swordGuard);
  const swordHilt  = cyl(0.03, 0.03, 0.18, 6, stdMat(0x3a2010), 0.50, 0.80, 0.06);
  g.add(swordHilt);

  return g;
}

export function getSkillTemplates() {
  return [
    {
      id: 'dragonTail', slot: 'Q',
      name: 'Dragon Tail',
      description: 'Dragon Knight bashes an enemy with his shield, stunning them.',
      skillType: 'active',
      castType: 'unit-target',
      targetRule: 'enemy',
      damageType: 'physical',
      manaCostByLevel: [100, 100, 100, 100],
      cooldownByLevel: [9, 8, 7, 6],
      castRangeByLevel: [150, 150, 150, 150],
      effectValuesByLevel: {
        stunDuration: [1.5, 2.0, 2.5, 3.0],
        damage:       [25, 50, 75, 100],
      },
      aiHints: { useWhenEnemyInMeleeRange: true, minManaPct: 0.2 },
    },
    {
      id: 'dragonBlood', slot: 'W',
      name: 'Dragon Blood',
      description: 'Dragon blood grants Dragon Knight powerful health regeneration and armor.',
      skillType: 'passive',
      castType: 'no-target',
      targetRule: 'none',
      damageType: 'none',
      manaCostByLevel: [0, 0, 0, 0],
      cooldownByLevel: [0, 0, 0, 0],
      castRangeByLevel: [0, 0, 0, 0],
      effectValuesByLevel: {
        hpRegenBonus: [2, 4, 6, 8],
        armorBonus:   [2, 4, 6, 8],
      },
      aiHints: {},
    },
    {
      id: 'dragonForm', slot: 'E',
      name: 'Elder Dragon Form',
      description: 'Dragon Knight transforms into an Elder Dragon, gaining bonus damage, ranged attacks, and splash.',
      skillType: 'active',
      castType: 'self',
      targetRule: 'none',
      damageType: 'none',
      manaCostByLevel: [50, 50, 50],
      cooldownByLevel: [100, 80, 60],
      castRangeByLevel: [0, 0, 0],
      effectValuesByLevel: {
        bonusDamage:    [35, 65, 100],
        bonusRange:     [350, 350, 600],
        splashRadius:   [0, 300, 300],
        duration:       [60, 60, 60],
      },
      aiHints: { useWhenInCombat: true, minManaPct: 0.1 },
    },
    {
      id: 'breatheFire', slot: 'R',
      name: 'Breathe Fire',
      description: 'Dragon Knight breathes a cone of fire that deals damage to enemies in front of him.',
      skillType: 'active',
      castType: 'point-target',
      targetRule: 'ground',
      damageType: 'magical',
      manaCostByLevel: [120, 130, 145, 160],
      cooldownByLevel: [14, 12, 10, 8],
      castRangeByLevel: [550, 550, 550, 550],
      effectValuesByLevel: {
        damage:     [100, 175, 250, 325],
        coneAngle:  [60, 60, 60, 60],
        coneLength: [550, 550, 550, 550],
      },
      aiHints: { useWhenEnemiesInRadiusAtLeast: 1, minManaPct: 0.25 },
    },
  ];
}
