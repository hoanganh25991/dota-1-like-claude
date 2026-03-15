// js/heroes/lich.js — Lich (INT, Scourge)
import { stdMat, glowMat, metalMat, box, cyl, sph } from '../hero-models.js';

export function buildModel() {
  const g = new THREE.Group();

  const bone    = stdMat(0xe8ddc8);          // bone white
  const robe    = stdMat(0x2a0a4a);          // deep purple
  const robeDk  = stdMat(0x180630);          // darker purple trim
  const cyan    = glowMat(0x00ffcc);          // cyan glow
  const staff   = metalMat(0x8899aa);        // pale metal

  // Legs / robe base — wide flare at bottom
  const robeBase = box(0.55, 0.55, 0.45, robe, 0, 0.28, 0);
  g.add(robeBase);
  const robeMid  = box(0.50, 0.60, 0.42, robe, 0, 0.82, 0);
  g.add(robeMid);

  // Torso
  const torso = box(0.44, 0.50, 0.36, robe, 0, 1.37, 0);
  g.add(torso);

  // Robe collar / dark trim
  const collar = box(0.48, 0.10, 0.38, robeDk, 0, 1.63, 0);
  g.add(collar);

  // Shoulders — bony protrusions
  const shoulderL = sph(0.14, 8, bone, -0.30, 1.58, 0);
  const shoulderR = sph(0.14, 8, bone,  0.30, 1.58, 0);
  g.add(shoulderL, shoulderR);

  // Arms
  const armL = box(0.12, 0.44, 0.12, bone, -0.32, 1.25, 0);
  const armR = box(0.12, 0.44, 0.12, bone,  0.32, 1.25, 0);
  g.add(armL, armR);

  // Hands
  const handL = sph(0.08, 6, bone, -0.32, 1.00, 0);
  const handR = sph(0.08, 6, bone,  0.32, 1.00, 0);
  g.add(handL, handR);

  // Head — skull-like
  const head = sph(0.22, 10, bone, 0, 1.88, 0);
  g.add(head);

  // Jaw (slightly protruding)
  const jaw = box(0.18, 0.10, 0.16, bone, 0, 1.70, 0.06);
  g.add(jaw);

  // Cyan glowing eyes
  const eyeL = sph(0.045, 6, cyan, -0.08, 1.90, 0.18);
  const eyeR = sph(0.045, 6, cyan,  0.08, 1.90, 0.18);
  g.add(eyeL, eyeR);

  // Staff shaft (held in left hand area, angled)
  const shaft = cyl(0.025, 0.03, 1.20, 7, staff, -0.52, 1.10, 0.05);
  shaft.rotation.z = 0.18;
  g.add(shaft);

  // Staff top orb glow
  const orbGlow = sph(0.10, 8, cyan, -0.72, 1.74, 0.05);
  g.add(orbGlow);

  // Staff orb outer ring
  const orbRing = cyl(0.13, 0.13, 0.04, 12, glowMat(0x00ddbb), -0.72, 1.74, 0.05);
  orbRing.rotation.x = Math.PI / 2;
  g.add(orbRing);

  // Robe hem spikes
  for (let i = 0; i < 5; i++) {
    const ang = (i / 5) * Math.PI * 2;
    const spike = cyl(0, 0.04, 0.14, 5, robeDk,
      Math.cos(ang) * 0.22, 0.07, Math.sin(ang) * 0.18);
    g.add(spike);
  }

  return g;
}

export function getSkillTemplates() {
  return [
    {
      id: 'frostNova', slot: 'Q',
      name: 'Frost Nova',
      description: 'Blasts enemy units around a target with freezing damage, slowing movement and attack speed.',
      skillType: 'active',
      castType: 'area-target',
      targetRule: 'enemy',
      damageType: 'magical',
      manaCostByLevel: [120, 130, 145, 160],
      cooldownByLevel: [7, 6, 5, 4],
      castRangeByLevel: [600, 600, 600, 600],
      effectValuesByLevel: {
        damage:  [75, 150, 225, 300],
        aoeRadius: [400, 400, 400, 400],
        slowPct: [20, 30, 40, 50],
        slowDuration: [4, 4, 4, 4],
      },
      aiHints: { useWhenEnemiesInRadiusAtLeast: 1, minManaPct: 0.2 },
    },
    {
      id: 'iceArmor', slot: 'W',
      name: 'Ice Armor',
      description: 'Creates a shield of ice around a friendly unit. Increases armor and slows attackers.',
      skillType: 'active',
      castType: 'unit-target',
      targetRule: 'ally',
      damageType: 'none',
      manaCostByLevel: [75, 75, 75, 75],
      cooldownByLevel: [20, 20, 20, 20],
      castRangeByLevel: [600, 600, 600, 600],
      effectValuesByLevel: {
        armorBonus:    [2, 4, 6, 8],
        attackSlowPct: [20, 30, 40, 50],
        duration:      [40, 40, 40, 40],
      },
      aiHints: { useOnAlliesInCombat: true, minManaPct: 0.15 },
    },
    {
      id: 'sacrifice', slot: 'E',
      name: 'Sacrifice',
      description: 'Sacrifices a friendly creep and converts its current HP into mana for Lich.',
      skillType: 'active',
      castType: 'unit-target',
      targetRule: 'ally',
      damageType: 'pure',
      manaCostByLevel: [0, 0, 0, 0],
      cooldownByLevel: [30, 26, 22, 18],
      castRangeByLevel: [400, 400, 400, 400],
      effectValuesByLevel: {
        manaGainPct: [0.50, 0.65, 0.80, 1.00],
      },
      aiHints: { useOnAlliedCreepWhenLowMana: true, minManaPct: 0.0 },
    },
    {
      id: 'chainFrost', slot: 'R',
      name: 'Chain Frost',
      description: 'Releases a jumping wave of frost that bounces between nearby enemies, dealing damage and slowing.',
      skillType: 'active',
      castType: 'unit-target',
      targetRule: 'enemy',
      damageType: 'magical',
      manaCostByLevel: [200, 300, 400],
      cooldownByLevel: [150, 120, 90],
      castRangeByLevel: [750, 750, 750],
      effectValuesByLevel: {
        damagePerBounce: [280, 370, 460],
        maxBounces:      [10, 10, 10],
        bounceRadius:    [750, 750, 750],
        slowPct:         [30, 40, 50],
        slowDuration:    [4, 4, 4],
      },
      aiHints: { useWhenEnemiesInRadiusAtLeast: 2, minManaPct: 0.4 },
    },
  ];
}
