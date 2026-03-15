// js/heroes/pudge.js — Pudge (STR, Scourge)
import { stdMat, glowMat, metalMat, box, cyl, sph } from '../hero-models.js';

export function buildModel() {
  const g = new THREE.Group();

  const flesh  = stdMat(0xbb7744);
  const rot    = stdMat(0x556633);
  const dark   = stdMat(0x2a1a0a);
  const metal  = metalMat(0x667755);
  const gore   = glowMat(0xff2200);
  const chain  = metalMat(0x888888);

  // Massive bloated lower body
  g.add(box(0.70, 0.52, 0.60, flesh, 0, 0.26, 0));

  // Gut/belly — bulging sphere
  const belly = sph(0.40, 10, flesh, 0, 0.68, 0.14);
  g.add(belly);

  // Torso — enormous
  g.add(box(0.72, 0.50, 0.54, flesh, 0, 1.00, 0));

  // Rot spots
  g.add(sph(0.08, 6, rot, -0.24, 0.92, 0.22));
  g.add(sph(0.06, 6, rot,  0.18, 1.08, 0.20));
  g.add(sph(0.07, 6, rot,  0.30, 0.74, 0.26));

  // Stitches across belly
  for (let i = 0; i < 4; i++) {
    g.add(box(0.16, 0.02, 0.03, dark, -0.16 + i * 0.10, 0.72, 0.38));
  }

  // Huge arms
  g.add(box(0.22, 0.50, 0.24, flesh, -0.54, 0.88, 0));
  g.add(box(0.22, 0.50, 0.24, flesh,  0.54, 0.88, 0));

  // Meaty fists
  g.add(sph(0.15, 7, flesh, -0.54, 0.58, 0.05));
  g.add(sph(0.15, 7, flesh,  0.54, 0.58, 0.05));

  // Head — massive round
  const head = sph(0.30, 10, flesh, 0, 1.56, 0);
  g.add(head);

  // Sunken red eyes
  g.add(sph(0.055, 6, gore, -0.10, 1.60, 0.24));
  g.add(sph(0.055, 6, gore,  0.10, 1.60, 0.24));

  // Mouth gash
  g.add(box(0.20, 0.04, 0.03, dark, 0, 1.44, 0.26));

  // Meat hook — carried in right hand
  const hookChain = cyl(0.02, 0.02, 0.60, 6, chain, 0.68, 0.72, 0.08);
  hookChain.rotation.z = -0.5;
  g.add(hookChain);
  const hookHead = box(0.06, 0.08, 0.14, metal, 0.90, 0.48, 0.08);
  g.add(hookHead);
  const hookTip = cyl(0, 0.04, 0.16, 5, metal, 0.96, 0.44, 0.14);
  hookTip.rotation.z = -1.2;
  hookTip.rotation.x =  0.4;
  g.add(hookTip);

  // Belt straps / chains decorating body
  g.add(box(0.80, 0.06, 0.56, chain, 0, 0.60, 0));
  g.add(box(0.80, 0.06, 0.56, chain, 0, 1.22, 0));

  return g;
}

export function getSkillTemplates() {
  return [
    {
      id: 'meatHook', slot: 'Q',
      name: 'Meat Hook',
      description: 'Launches a bloody hook that drags the first unit it encounters back to Pudge.',
      skillType: 'active',
      castType: 'point-target',
      targetRule: 'any',
      damageType: 'pure',
      manaCostByLevel: [110, 120, 130, 140],
      cooldownByLevel: [14, 13, 12, 11],
      castRangeByLevel: [1000, 1100, 1200, 1300],
      effectValuesByLevel: {
        damage:      [100, 180, 260, 340],
        hookSpeed:   [1575, 1575, 1575, 1575],
      },
      aiHints: { useWhenEnemyVisible: true, minManaPct: 0.25 },
    },
    {
      id: 'rot', slot: 'W',
      name: 'Rot',
      description: 'Emits a toxic cloud that slows and damages all nearby enemies, but also damages Pudge.',
      skillType: 'toggle',
      castType: 'self-radius',
      targetRule: 'enemy',
      damageType: 'magical',
      manaCostByLevel: [0, 0, 0, 0],
      cooldownByLevel: [0, 0, 0, 0],
      castRangeByLevel: [0, 0, 0, 0],
      effectValuesByLevel: {
        damagePerSecond: [30, 55, 80, 105],
        selfDamagePerSec:[30, 55, 80, 105],
        aoeRadius:       [250, 250, 250, 250],
        moveSlowPct:     [14, 17, 20, 23],
        manaPerSecond:   [8, 8, 8, 8],
      },
      aiHints: { useWhenEnemiesNearby: true, minManaPct: 0.1 },
    },
    {
      id: 'fleshHeap', slot: 'E',
      name: 'Flesh Heap',
      description: 'Provides magic resistance and gains Strength whenever a nearby enemy unit dies.',
      skillType: 'passive',
      castType: 'no-target',
      targetRule: 'none',
      damageType: 'none',
      manaCostByLevel: [0, 0, 0, 0],
      cooldownByLevel: [0, 0, 0, 0],
      castRangeByLevel: [0, 0, 0, 0],
      effectValuesByLevel: {
        magicResistancePct: [4, 8, 12, 16],
        strGainOnKill:      [0.9, 1.0, 1.1, 1.2],
        killRadius:         [400, 400, 400, 400],
      },
      aiHints: {},
    },
    {
      id: 'dismember', slot: 'R',
      name: 'Dismember',
      description: 'Pudge chows down on an enemy unit, disabling and dealing damage while healing himself.',
      skillType: 'channel',
      castType: 'unit-target',
      targetRule: 'enemy',
      damageType: 'magical',
      manaCostByLevel: [100, 130, 170],
      cooldownByLevel: [30, 20, 10],
      castRangeByLevel: [150, 150, 150],
      effectValuesByLevel: {
        damagePerSecond: [75, 125, 175],
        healPerSecond:   [75, 125, 175],
        duration:        [3, 3, 3],
      },
      aiHints: { useWhenEnemyInMeleeRange: true, minManaPct: 0.2 },
    },
  ];
}
