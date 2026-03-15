// js/heroes/sniper.js — Sniper (AGI, Sentinel)
import { stdMat, glowMat, metalMat, box, cyl, sph } from '../hero-models.js';

export function buildModel() {
  const g = new THREE.Group();

  const skin    = stdMat(0xd4a870);   // warm tan
  const leather = stdMat(0x5c3a1e);   // brown leather
  const denim   = stdMat(0x3a5070);   // blue-grey pants
  const metal   = metalMat(0xaabbcc); // gun metal
  const eye     = glowMat(0x2244aa);  // blue eyes
  const hatCol  = stdMat(0x7a4f2a);   // hat brown

  // Feet / boots
  const bootL = box(0.13, 0.16, 0.18, leather, -0.10, 0.08, 0);
  const bootR = box(0.13, 0.16, 0.18, leather,  0.10, 0.08, 0);
  g.add(bootL, bootR);

  // Legs
  const legL = box(0.13, 0.40, 0.14, denim, -0.10, 0.38, 0);
  const legR = box(0.13, 0.40, 0.14, denim,  0.10, 0.38, 0);
  g.add(legL, legR);

  // Torso — slim
  const torso = box(0.34, 0.46, 0.28, leather, 0, 0.85, 0);
  g.add(torso);

  // Belt
  const belt = box(0.36, 0.07, 0.30, stdMat(0x3a2010), 0, 0.60, 0);
  g.add(belt);

  // Shoulders
  const shoulderL = box(0.13, 0.14, 0.18, leather, -0.24, 1.08, 0);
  const shoulderR = box(0.13, 0.14, 0.18, leather,  0.24, 1.08, 0);
  g.add(shoulderL, shoulderR);

  // Arms
  const armL = box(0.11, 0.38, 0.12, skin, -0.24, 0.82, 0);
  const armR = box(0.11, 0.38, 0.12, skin,  0.24, 0.82, 0);
  g.add(armL, armR);

  // Hands
  const handL = sph(0.07, 6, skin, -0.24, 0.62, 0.05);
  const handR = sph(0.07, 6, skin,  0.24, 0.62, 0.08);
  g.add(handL, handR);

  // Head
  const head = sph(0.19, 10, skin, 0, 1.34, 0);
  g.add(head);

  // Wide hat brim
  const hatBrim = cyl(0.36, 0.36, 0.05, 12, hatCol, 0, 1.50, 0);
  g.add(hatBrim);

  // Hat crown
  const hatCrown = cyl(0.20, 0.24, 0.24, 10, hatCol, 0, 1.65, 0);
  g.add(hatCrown);

  // Hat band
  const hatBand = cyl(0.245, 0.245, 0.04, 10, stdMat(0x1a0a00), 0, 1.52, 0);
  g.add(hatBand);

  // Eyes
  const eyeL = sph(0.035, 6, eye, -0.07, 1.36, 0.17);
  const eyeR = sph(0.035, 6, eye,  0.07, 1.36, 0.17);
  g.add(eyeL, eyeR);

  // Rifle — long barrel held at right side
  const rifleStock = box(0.06, 0.10, 0.28, leather, 0.28, 0.72, 0.10);
  g.add(rifleStock);
  const rifleBody  = box(0.055, 0.08, 0.48, metal, 0.28, 0.72, -0.10);
  g.add(rifleBody);
  const rifleBarrel = cyl(0.022, 0.028, 0.65, 7, metal, 0.28, 0.72, -0.46);
  rifleBarrel.rotation.x = Math.PI / 2;
  g.add(rifleBarrel);

  // Scope
  const scope = cyl(0.025, 0.025, 0.18, 6, metal, 0.28, 0.78, -0.05);
  scope.rotation.x = Math.PI / 2;
  g.add(scope);

  return g;
}

export function getSkillTemplates() {
  return [
    {
      id: 'shrapnel', slot: 'Q',
      name: 'Shrapnel',
      description: 'Launches a ball of shrapnel that showers the target area, damaging and slowing enemies.',
      skillType: 'active',
      castType: 'point-target',
      targetRule: 'ground',
      damageType: 'magical',
      manaCostByLevel: [120, 120, 120, 120],
      cooldownByLevel: [14, 12, 10, 8],
      castRangeByLevel: [1000, 1000, 1000, 1000],
      effectValuesByLevel: {
        damagePerSecond: [12, 20, 28, 36],
        aoeRadius:       [400, 400, 400, 400],
        slowPct:         [15, 20, 25, 30],
        duration:        [5, 5, 5, 5],
      },
      aiHints: { useWhenEnemiesInRadiusAtLeast: 1, minManaPct: 0.25 },
    },
    {
      id: 'headshot', slot: 'W',
      name: 'Headshot',
      description: 'Sniper has a chance to deal bonus damage and briefly stun the target on each attack.',
      skillType: 'passive',
      castType: 'no-target',
      targetRule: 'none',
      damageType: 'physical',
      manaCostByLevel: [0, 0, 0, 0],
      cooldownByLevel: [0, 0, 0, 0],
      castRangeByLevel: [0, 0, 0, 0],
      effectValuesByLevel: {
        procChancePct:  [40, 50, 60, 70],
        bonusDamage:    [30, 30, 30, 30],
        stunDuration:   [0.5, 0.5, 0.5, 0.5],
      },
      aiHints: {},
    },
    {
      id: 'takeAim', slot: 'E',
      name: 'Take Aim',
      description: 'Increases Sniper\'s attack range by extending his rifle.',
      skillType: 'passive',
      castType: 'no-target',
      targetRule: 'none',
      damageType: 'none',
      manaCostByLevel: [0, 0, 0, 0],
      cooldownByLevel: [0, 0, 0, 0],
      castRangeByLevel: [0, 0, 0, 0],
      effectValuesByLevel: {
        attackRangeBonus: [100, 200, 300, 400],
      },
      aiHints: {},
    },
    {
      id: 'assassinate', slot: 'R',
      name: 'Assassinate',
      description: 'Sniper channels briefly then fires a devastating shot at extreme range, dealing massive damage.',
      skillType: 'channel',
      castType: 'unit-target',
      targetRule: 'enemy',
      damageType: 'magical',
      manaCostByLevel: [175, 275, 350],
      cooldownByLevel: [20, 15, 10],
      castRangeByLevel: [3000, 3000, 3000],
      effectValuesByLevel: {
        damage:          [425, 575, 725],
        channelDuration: [1.5, 1.5, 1.5],
        miniStunDuration:[0.5, 0.5, 0.5],
      },
      aiHints: { useOnLowHealthTarget: true, minManaPct: 0.35 },
    },
  ];
}
