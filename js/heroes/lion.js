// js/heroes/lion.js — Lion (INT, Sentinel)
import { stdMat, glowMat, metalMat, box, cyl, sph } from '../hero-models.js';

export function buildModel() {
  const g = new THREE.Group();

  const demon  = stdMat(0x5a1a1a);
  const skin   = stdMat(0xaa4433);
  const robe   = stdMat(0x3a1a0a);
  const purple = glowMat(0xcc44ff);
  const gold   = metalMat(0xddaa22);
  const horn   = stdMat(0x331100);

  // Tail / demonic lower body
  g.add(cyl(0.08, 0.18, 0.46, 8, demon, 0, 0.23, 0));
  g.add(sph(0.12, 8, demon, 0, 0.50, 0.10));

  // Torso
  g.add(box(0.38, 0.46, 0.28, robe, 0, 0.80, 0));

  // Torn robe panels
  g.add(box(0.10, 0.36, 0.05, demon, -0.22, 0.78, -0.15));
  g.add(box(0.10, 0.30, 0.05, demon,  0.22, 0.78, -0.15));

  // Shoulders
  g.add(box(0.12, 0.14, 0.16, demon, -0.28, 1.02, 0));
  g.add(box(0.12, 0.14, 0.16, demon,  0.28, 1.02, 0));

  // Arms — demonically deformed
  g.add(box(0.12, 0.36, 0.12, skin, -0.28, 0.78, 0));
  g.add(box(0.14, 0.36, 0.14, skin,  0.28, 0.78, 0));

  // Clawed hands / pointing finger
  g.add(sph(0.08, 6, skin, -0.28, 0.58, 0.04));
  g.add(sph(0.09, 6, skin,  0.28, 0.58, 0.04));

  // Finger of Death finger — right hand extended
  g.add(box(0.04, 0.18, 0.04, skin, 0.32, 0.46, 0.10));
  g.add(cyl(0, 0.02, 0.10, 5, purple, 0.34, 0.36, 0.14));

  // Head — demon skull with horns
  g.add(sph(0.20, 10, skin, 0, 1.32, 0));

  // Demonic horns
  const hornL = cyl(0, 0.05, 0.32, 6, horn, -0.12, 1.54, -0.04);
  hornL.rotation.z = -0.5;
  hornL.rotation.x = -0.2;
  g.add(hornL);
  const hornR = cyl(0, 0.05, 0.32, 6, horn,  0.12, 1.54, -0.04);
  hornR.rotation.z =  0.5;
  hornR.rotation.x = -0.2;
  g.add(hornR);

  // Purple glowing eyes
  g.add(sph(0.042, 6, purple, -0.08, 1.34, 0.16));
  g.add(sph(0.042, 6, purple,  0.08, 1.34, 0.16));

  // Sunken cheeks / bone ridges
  g.add(box(0.04, 0.10, 0.04, horn, -0.16, 1.30, 0.12));
  g.add(box(0.04, 0.10, 0.04, horn,  0.16, 1.30, 0.12));

  // Gold collar / necklace
  g.add(cyl(0.17, 0.17, 0.05, 10, gold, 0, 1.12, 0));

  // Staff / wand — left hand
  const wand = cyl(0.020, 0.025, 0.80, 7, horn, -0.36, 0.72, 0.08);
  wand.rotation.z = 0.18;
  g.add(wand);
  g.add(sph(0.09, 8, purple, -0.46, 1.12, 0.08));
  g.add(sph(0.05, 6, glowMat(0xff88ff), -0.46, 1.12, 0.08));

  // Demon tail (behind, curled)
  const tailBase = cyl(0.06, 0.08, 0.30, 7, demon, 0, 0.20, -0.18);
  tailBase.rotation.x = 0.5;
  g.add(tailBase);
  const tailMid = cyl(0.04, 0.06, 0.22, 7, demon, 0.08, 0.38, -0.32);
  tailMid.rotation.x = 0.8;
  tailMid.rotation.z = 0.3;
  g.add(tailMid);
  const tailTip = cyl(0, 0.04, 0.12, 5, horn, 0.18, 0.52, -0.40);
  g.add(tailTip);

  return g;
}

export function getSkillTemplates() {
  return [
    {
      id: 'earthSpike', slot: 'Q',
      name: 'Earth Spike',
      description: 'Sends a line of spikes erupting from the ground, launching enemies into the air.',
      skillType: 'active',
      castType: 'point-target',
      targetRule: 'ground',
      damageType: 'magical',
      manaCostByLevel: [90, 105, 120, 135],
      cooldownByLevel: [12, 11, 10, 9],
      castRangeByLevel: [500, 500, 500, 500],
      effectValuesByLevel: {
        damage:      [80, 140, 200, 260],
        stunDuration:[1.02, 1.42, 1.82, 2.22],
        lineLength:  [500, 500, 500, 500],
        lineWidth:   [125, 125, 125, 125],
      },
      aiHints: { useWhenEnemiesInLine: true, minManaPct: 0.18 },
    },
    {
      id: 'hex', slot: 'W',
      name: 'Hex',
      description: 'Transforms an enemy into a harmless animal, disabling it.',
      skillType: 'active',
      castType: 'unit-target',
      targetRule: 'enemy',
      damageType: 'none',
      manaCostByLevel: [100, 150, 200, 250],
      cooldownByLevel: [30, 24, 18, 12],
      castRangeByLevel: [500, 500, 500, 500],
      effectValuesByLevel: {
        hexDuration:       [1.0, 1.5, 2.0, 2.5],
        movementSpeed:     [100, 100, 100, 100],
      },
      aiHints: { useOnDangerousTarget: true, minManaPct: 0.2 },
    },
    {
      id: 'manaDrain', slot: 'E',
      name: 'Mana Drain',
      description: 'Channeled spell that steals mana from an enemy unit.',
      skillType: 'channel',
      castType: 'unit-target',
      targetRule: 'enemy',
      damageType: 'none',
      manaCostByLevel: [20, 20, 20, 20],
      cooldownByLevel: [20, 15, 10, 5],
      castRangeByLevel: [600, 600, 600, 600],
      effectValuesByLevel: {
        manaPerSecond:  [50, 75, 100, 150],
        duration:       [5, 5, 5, 5],
      },
      aiHints: { useOnHighManaEnemy: true, minManaPct: 0.04 },
    },
    {
      id: 'fingerOfDeath', slot: 'R',
      name: 'Finger of Death',
      description: 'Deals massive damage to a single target. Permanent damage bonus for each kill with Finger.',
      skillType: 'active',
      castType: 'unit-target',
      targetRule: 'enemy',
      damageType: 'pure',
      manaCostByLevel: [200, 420, 650],
      cooldownByLevel: [160, 100, 30],
      castRangeByLevel: [700, 700, 700],
      effectValuesByLevel: {
        damage:        [600, 725, 850],
        bonusDmgOnKill:[40, 40, 40],
      },
      aiHints: { useOnLowHealthTarget: true, minManaPct: 0.4 },
    },
  ];
}
