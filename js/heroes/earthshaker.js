// js/heroes/earthshaker.js — Earthshaker (STR, Sentinel)
import { stdMat, glowMat, metalMat, box, cyl, sph } from '../hero-models.js';

export function buildModel() {
  const g = new THREE.Group();

  const stone  = stdMat(0x6a5a4a);
  const dark   = stdMat(0x3a2a1a);
  const gold   = metalMat(0xddaa44);
  const orange = glowMat(0xff8800);
  const rock   = stdMat(0x8a7a6a);

  // Stone lower body / centaur-like base
  g.add(box(0.60, 0.40, 0.70, stone, 0, 0.20, 0));
  g.add(box(0.50, 0.36, 0.52, dark,  0, 0.50, 0.10));

  // Front legs
  g.add(box(0.14, 0.38, 0.14, stone, -0.20, 0.36, 0.26));
  g.add(box(0.14, 0.38, 0.14, stone,  0.20, 0.36, 0.26));

  // Back haunches
  g.add(box(0.18, 0.30, 0.14, stone, -0.24, 0.40, -0.22));
  g.add(box(0.18, 0.30, 0.14, stone,  0.24, 0.40, -0.22));

  // Torso — massive stone giant
  g.add(box(0.68, 0.56, 0.50, stone, 0, 0.94, -0.04));

  // Rock slabs embedded in torso
  g.add(box(0.20, 0.22, 0.06, rock, -0.20, 1.02, 0.26));
  g.add(box(0.18, 0.18, 0.06, rock,  0.18, 0.98, 0.26));

  // Gold band across chest
  g.add(box(0.62, 0.08, 0.06, gold, 0, 1.12, 0.26));

  // Shoulders — rocky protrusions
  g.add(sph(0.22, 8, stone, -0.52, 1.20, 0));
  g.add(sph(0.22, 8, stone,  0.52, 1.20, 0));
  g.add(sph(0.08, 6, rock, -0.64, 1.32, 0));
  g.add(sph(0.08, 6, rock,  0.64, 1.32, 0));

  // Arms — thick stone limbs
  g.add(box(0.22, 0.46, 0.24, stone, -0.50, 0.90, 0));
  g.add(box(0.22, 0.46, 0.24, stone,  0.50, 0.90, 0));

  // Fists
  g.add(sph(0.16, 7, stone, -0.50, 0.60, 0.06));
  g.add(sph(0.16, 7, stone,  0.50, 0.60, 0.06));

  // Head — blocky stone
  g.add(box(0.44, 0.36, 0.40, stone, 0, 1.58, 0));

  // Orange glowing eyes
  g.add(sph(0.06, 6, orange, -0.12, 1.62, 0.22));
  g.add(sph(0.06, 6, orange,  0.12, 1.62, 0.22));

  // Rock horns/crown
  g.add(box(0.08, 0.24, 0.12, rock, -0.16, 1.82, -0.04));
  g.add(box(0.08, 0.24, 0.12, rock,  0.16, 1.82, -0.04));
  g.add(box(0.10, 0.16, 0.14, rock,  0, 1.80, -0.08));

  // Totem / staff — left hand
  const shaft = cyl(0.04, 0.05, 1.10, 8, dark, -0.60, 0.74, 0.10);
  shaft.rotation.z = 0.15;
  g.add(shaft);
  const totemHead = box(0.16, 0.24, 0.16, gold, -0.70, 1.32, 0.10);
  g.add(totemHead);
  const totemGlow = sph(0.10, 8, orange, -0.70, 1.44, 0.10);
  g.add(totemGlow);

  return g;
}

export function getSkillTemplates() {
  return [
    {
      id: 'fissure', slot: 'Q',
      name: 'Fissure',
      description: 'Slams the ground with a mighty totem, creating an impassable ridge and stunning enemies.',
      skillType: 'active',
      castType: 'point-target',
      targetRule: 'ground',
      damageType: 'magical',
      manaCostByLevel: [125, 140, 155, 170],
      cooldownByLevel: [15, 14, 13, 12],
      castRangeByLevel: [1400, 1400, 1400, 1400],
      effectValuesByLevel: {
        damage:      [90, 120, 150, 180],
        stunDuration:[1.25, 1.50, 1.75, 2.00],
        lineLength:  [1400, 1400, 1400, 1400],
        wallDuration:[8, 8, 8, 8],
      },
      aiHints: { useWhenEnemiesInLine: true, minManaPct: 0.25 },
    },
    {
      id: 'enchantTotem', slot: 'W',
      name: 'Enchant Totem',
      description: 'Empowers Earthshaker\'s totem for a single devastating blow.',
      skillType: 'active',
      castType: 'self',
      targetRule: 'none',
      damageType: 'physical',
      manaCostByLevel: [25, 30, 35, 40],
      cooldownByLevel: [6, 5, 4, 3],
      castRangeByLevel: [0, 0, 0, 0],
      effectValuesByLevel: {
        damageBonusPct: [100, 175, 250, 325],
        duration:       [14, 14, 14, 14],
      },
      aiHints: { useBeforeAttack: true, minManaPct: 0.05 },
    },
    {
      id: 'aftershock', slot: 'E',
      name: 'Aftershock',
      description: 'Each time Earthshaker casts a spell, nearby enemies are stunned.',
      skillType: 'passive',
      castType: 'no-target',
      targetRule: 'none',
      damageType: 'magical',
      manaCostByLevel: [0, 0, 0, 0],
      cooldownByLevel: [0, 0, 0, 0],
      castRangeByLevel: [0, 0, 0, 0],
      effectValuesByLevel: {
        stunDuration: [0.3, 0.8, 1.2, 1.5],
        damage:       [50, 75, 100, 125],
        aoeRadius:    [275, 275, 275, 275],
      },
      aiHints: {},
    },
    {
      id: 'echoSlam', slot: 'R',
      name: 'Echo Slam',
      description: 'Sends a shockwave through the earth that echoes off of each nearby enemy, dealing damage per echo.',
      skillType: 'active',
      castType: 'self-radius',
      targetRule: 'enemy',
      damageType: 'magical',
      manaCostByLevel: [145, 205, 265],
      cooldownByLevel: [130, 110, 90],
      castRangeByLevel: [0, 0, 0],
      effectValuesByLevel: {
        initialDamage:  [165, 195, 225],
        echoDamage:     [55, 65, 75],
        aoeRadius:      [575, 575, 575],
        echoRadius:     [400, 400, 400],
      },
      aiHints: { useWhenEnemiesInRadiusAtLeast: 3, minManaPct: 0.3 },
    },
  ];
}
