// js/heroes/vengeful-spirit.js — Vengeful Spirit (AGI, Scourge)
import { stdMat, glowMat, metalMat, box, cyl, sph } from '../hero-models.js';

export function buildModel() {
  const g = new THREE.Group();

  const teal   = stdMat(0x1a5a6a);
  const spirit = glowMat(0x00eedd);
  const dark   = stdMat(0x0a2a30);
  const gold   = metalMat(0xddaa44);
  const skin   = stdMat(0x4a8a88);

  // Ethereal lower form — no distinct legs, floating wisp base
  g.add(cyl(0.10, 0.24, 0.40, 10, stdMat(0x0a3038), 0, 0.20, 0));
  g.add(sph(0.18, 10, dark, 0, 0.44, 0));

  // Torso
  g.add(box(0.34, 0.42, 0.26, teal, 0, 0.80, 0));

  // Armor / garment panels
  g.add(box(0.22, 0.28, 0.06, dark, 0, 0.86, 0.14));
  g.add(box(0.26, 0.06, 0.28, gold, 0, 1.02, 0));

  // Wings — large ethereal
  const wingL = box(0.04, 0.44, 0.52, stdMat(0x0a4a50), -0.48, 1.00, -0.08);
  wingL.rotation.z = 0.4;
  wingL.rotation.y = -0.3;
  g.add(wingL);
  const wingR = box(0.04, 0.44, 0.52, stdMat(0x0a4a50),  0.48, 1.00, -0.08);
  wingR.rotation.z = -0.4;
  wingR.rotation.y =  0.3;
  g.add(wingR);

  // Wing glow veins
  const veinL = box(0.015, 0.38, 0.30, spirit, -0.52, 1.00, -0.06);
  veinL.rotation.z = 0.45;
  g.add(veinL);
  const veinR = box(0.015, 0.38, 0.30, spirit,  0.52, 1.00, -0.06);
  veinR.rotation.z = -0.45;
  g.add(veinR);

  // Shoulders
  g.add(box(0.12, 0.14, 0.16, teal, -0.26, 1.02, 0));
  g.add(box(0.12, 0.14, 0.16, teal,  0.26, 1.02, 0));

  // Arms
  g.add(box(0.09, 0.36, 0.10, skin, -0.26, 0.78, 0));
  g.add(box(0.09, 0.36, 0.10, skin,  0.26, 0.78, 0));

  // Hands — trailing spirit wisps
  g.add(sph(0.07, 6, spirit, -0.26, 0.58, 0.05));
  g.add(sph(0.07, 6, spirit,  0.26, 0.58, 0.05));

  // Head
  g.add(sph(0.19, 10, skin, 0, 1.32, 0));

  // Crown / headdress
  g.add(cyl(0.20, 0.20, 0.05, 10, gold, 0, 1.24, 0));
  for (let i = 0; i < 5; i++) {
    const ang = (i / 5) * Math.PI * 2;
    g.add(cyl(0, 0.025, 0.14, 5, gold,
      Math.cos(ang) * 0.18, 1.30, Math.sin(ang) * 0.14));
  }

  // Glowing teal eyes
  g.add(sph(0.042, 6, spirit, -0.07, 1.33, 0.16));
  g.add(sph(0.042, 6, spirit,  0.07, 1.33, 0.16));

  // Spirit aura glow below
  g.add(sph(0.14, 8, glowMat(0x005544), 0, 0.12, 0));

  return g;
}

export function getSkillTemplates() {
  return [
    {
      id: 'magicMissile', slot: 'Q',
      name: 'Magic Missile',
      description: 'Fires a magic missile at an enemy, stunning and dealing damage.',
      skillType: 'active',
      castType: 'unit-target',
      targetRule: 'enemy',
      damageType: 'magical',
      manaCostByLevel: [110, 120, 130, 140],
      cooldownByLevel: [13, 12, 11, 10],
      castRangeByLevel: [550, 550, 550, 550],
      effectValuesByLevel: {
        damage:      [100, 175, 250, 325],
        stunDuration:[1.0, 1.2, 1.4, 1.6],
      },
      aiHints: { useWhenEnemyInRange: true, minManaPct: 0.22 },
    },
    {
      id: 'waveOfTerror', slot: 'W',
      name: 'Wave of Terror',
      description: 'Sends a wave that reduces enemy armor and grants vision.',
      skillType: 'active',
      castType: 'point-target',
      targetRule: 'ground',
      damageType: 'none',
      manaCostByLevel: [40, 40, 40, 40],
      cooldownByLevel: [7, 7, 7, 7],
      castRangeByLevel: [1400, 1400, 1400, 1400],
      effectValuesByLevel: {
        armorReduct:    [1, 2, 3, 4],
        duration:       [10, 10, 10, 10],
        coneWidth:      [250, 250, 250, 250],
      },
      aiHints: { useBeforeCombat: true, minManaPct: 0.08 },
    },
    {
      id: 'commandAura', slot: 'E',
      name: 'Command Aura',
      description: 'Increases the attack damage of nearby allied units.',
      skillType: 'passive',
      castType: 'no-target',
      targetRule: 'none',
      damageType: 'none',
      manaCostByLevel: [0, 0, 0, 0],
      cooldownByLevel: [0, 0, 0, 0],
      castRangeByLevel: [0, 0, 0, 0],
      effectValuesByLevel: {
        damageBonusPct: [12, 18, 24, 30],
        aoeRadius:      [900, 900, 900, 900],
      },
      aiHints: {},
    },
    {
      id: 'netherSwap', slot: 'R',
      name: 'Nether Swap',
      description: 'Instantly swaps positions with a target hero.',
      skillType: 'active',
      castType: 'unit-target',
      targetRule: 'any',
      damageType: 'none',
      manaCostByLevel: [100, 150, 200],
      cooldownByLevel: [45, 35, 25],
      castRangeByLevel: [650, 850, 1050],
      effectValuesByLevel: {
        damage: [75, 125, 175],
      },
      aiHints: { useToSaveAlly: true, useToInitiate: true, minManaPct: 0.2 },
    },
  ];
}
