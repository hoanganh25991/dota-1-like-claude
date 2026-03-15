// js/heroes/shadow-fiend.js — Shadow Fiend (AGI, Scourge)
import { stdMat, glowMat, box, sph } from '../hero-models.js';

export function buildModel() {
  const g = new THREE.Group();

  const dark   = stdMat(0x140606);    // near-black body
  const blood  = glowMat(0xff2200);   // blood red glow
  const shadow = stdMat(0x1e0808);    // dark body accent
  const bone   = stdMat(0x554444);    // dark bone

  // Lower body / base
  const base = box(0.32, 0.40, 0.24, dark, 0, 0.20, 0);
  g.add(base);

  // Legs — thin and dark
  const legL = box(0.10, 0.38, 0.10, dark, -0.11, 0.52, 0);
  const legR = box(0.10, 0.38, 0.10, dark,  0.11, 0.52, 0);
  g.add(legL, legR);

  // Torso
  const torso = box(0.36, 0.46, 0.28, dark, 0, 0.92, 0);
  g.add(torso);

  // Chest highlight — faint red glow seams
  const chestLine = box(0.06, 0.40, 0.03, glowMat(0x550000), 0, 0.94, 0.15);
  g.add(chestLine);

  // Shoulders — bony protrusions
  const shldrL = sph(0.12, 8, bone, -0.26, 1.14, 0);
  const shldrR = sph(0.12, 8, bone,  0.26, 1.14, 0);
  g.add(shldrL, shldrR);

  // Arms — wispy thin
  const armL = box(0.08, 0.44, 0.08, dark, -0.28, 0.84, 0);
  const armR = box(0.08, 0.44, 0.08, dark,  0.28, 0.84, 0);
  g.add(armL, armR);

  // Clawed hands
  const clawL = sph(0.07, 6, bone, -0.28, 0.60, 0.04);
  const clawR = sph(0.07, 6, bone,  0.28, 0.60, 0.04);
  g.add(clawL, clawR);

  // Claw fingers
  for (let i = 0; i < 3; i++) {
    const angL = -0.3 + i * 0.3;
    const fingerL = box(0.025, 0.10, 0.025, bone,
      -0.28 + Math.sin(angL) * 0.06, 0.52 + Math.cos(angL) * 0.04, 0.08);
    g.add(fingerL);
  }

  // Head — elongated skull
  const head = sph(0.20, 10, dark, 0, 1.46, 0);
  head.scale.set(1, 1.2, 1);
  g.add(head);

  // Blood red glowing eyes — prominent
  const eyeL = sph(0.06, 8, blood, -0.08, 1.48, 0.16);
  const eyeR = sph(0.06, 8, blood,  0.08, 1.48, 0.16);
  g.add(eyeL, eyeR);

  // Eye glow halos
  const haloL = sph(0.09, 8, glowMat(0x880000), -0.08, 1.48, 0.14);
  const haloR = sph(0.09, 8, glowMat(0x880000),  0.08, 1.48, 0.14);
  g.add(haloL, haloR);

  // Wings — left
  const wingL1 = box(0.04, 0.30, 0.50, shadow, -0.42, 1.10, -0.10);
  wingL1.rotation.z =  0.5;
  wingL1.rotation.y = -0.4;
  g.add(wingL1);
  const wingL2 = box(0.03, 0.24, 0.38, dark, -0.60, 0.90, -0.06);
  wingL2.rotation.z =  0.7;
  wingL2.rotation.y = -0.5;
  g.add(wingL2);

  // Wings — right
  const wingR1 = box(0.04, 0.30, 0.50, shadow, 0.42, 1.10, -0.10);
  wingR1.rotation.z = -0.5;
  wingR1.rotation.y =  0.4;
  g.add(wingR1);
  const wingR2 = box(0.03, 0.24, 0.38, dark, 0.60, 0.90, -0.06);
  wingR2.rotation.z = -0.7;
  wingR2.rotation.y =  0.5;
  g.add(wingR2);

  // Wing membrane lines (glowing red veins)
  const veinL = box(0.015, 0.22, 0.30, glowMat(0x440000), -0.52, 1.00, -0.08);
  veinL.rotation.z = 0.6;
  g.add(veinL);
  const veinR = box(0.015, 0.22, 0.30, glowMat(0x440000),  0.52, 1.00, -0.08);
  veinR.rotation.z = -0.6;
  g.add(veinR);

  // Floating soul wisps around body
  const wisp1 = sph(0.05, 6, glowMat(0x660000), -0.45, 0.70, 0.10);
  const wisp2 = sph(0.04, 6, glowMat(0x440000),  0.40, 0.60, -0.10);
  g.add(wisp1, wisp2);

  return g;
}

export function getSkillTemplates() {
  return [
    {
      id: 'shadowrazeNear', slot: 'Q',
      name: 'Shadowraze (Near)',
      description: 'Shadow Fiend razes the ground 200 units in front of him, dealing damage to nearby enemies.',
      skillType: 'active',
      castType: 'no-target',
      targetRule: 'none',
      damageType: 'magical',
      manaCostByLevel: [90, 90, 90, 90],
      cooldownByLevel: [10, 10, 10, 10],
      castRangeByLevel: [200, 200, 200, 200],
      effectValuesByLevel: {
        damage:    [75, 150, 225, 300],
        aoeRadius: [250, 250, 250, 250],
        fixedRange:[200, 200, 200, 200],
      },
      aiHints: { useWhenEnemyInMeleeRange: true, minManaPct: 0.15 },
    },
    {
      id: 'shadowrazeMid', slot: 'W',
      name: 'Shadowraze (Mid)',
      description: 'Shadow Fiend razes the ground 450 units in front of him, dealing damage to nearby enemies.',
      skillType: 'active',
      castType: 'no-target',
      targetRule: 'none',
      damageType: 'magical',
      manaCostByLevel: [90, 90, 90, 90],
      cooldownByLevel: [10, 10, 10, 10],
      castRangeByLevel: [450, 450, 450, 450],
      effectValuesByLevel: {
        damage:    [75, 150, 225, 300],
        aoeRadius: [250, 250, 250, 250],
        fixedRange:[450, 450, 450, 450],
      },
      aiHints: { useWhenEnemyAtMidRange: true, minManaPct: 0.15 },
    },
    {
      id: 'necromastery', slot: 'E',
      name: 'Necromastery',
      description: 'Shadow Fiend steals the soul of each unit he kills, gaining bonus damage per soul. Loses souls on death.',
      skillType: 'passive',
      castType: 'no-target',
      targetRule: 'none',
      damageType: 'none',
      manaCostByLevel: [0, 0, 0, 0],
      cooldownByLevel: [0, 0, 0, 0],
      castRangeByLevel: [0, 0, 0, 0],
      effectValuesByLevel: {
        maxSouls:          [12, 20, 28, 36],
        damagePerSoul:     [2, 2, 2, 2],
        soulsLostOnDeath:  [12, 14, 16, 18],
      },
      aiHints: {},
    },
    {
      id: 'requiemOfSouls', slot: 'R',
      name: 'Requiem of Souls',
      description: 'Releases all stored souls as lines of demonic energy, dealing damage and slowing enemies.',
      skillType: 'active',
      castType: 'self-radius',
      targetRule: 'none',
      damageType: 'magical',
      manaCostByLevel: [150, 225, 300],
      cooldownByLevel: [180, 120, 60],
      castRangeByLevel: [0, 0, 0],
      effectValuesByLevel: {
        damagePerSoul: [40, 55, 80],
        aoeRadius:     [1000, 1000, 1000],
        slowPct:       [15, 20, 25],
        slowDuration:  [4, 4, 4],
        lineLinesCount:[3, 3, 3],
      },
      aiHints: { useWhenEnemiesInRadiusAtLeast: 2, minManaPct: 0.3, requireFullSoulStacks: true },
    },
  ];
}
