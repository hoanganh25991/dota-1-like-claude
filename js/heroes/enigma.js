// js/heroes/enigma.js — Enigma (INT, Scourge)
import { stdMat, glowMat, box, cyl, sph } from '../hero-models.js';

export function buildModel() {
  const g = new THREE.Group();

  const void_  = stdMat(0x060616);   // near-black void
  const cosmos = glowMat(0x3322ff);  // deep blue glow
  const star   = glowMat(0xffffff);  // star white
  const dark   = stdMat(0x0a0a1a);
  const purple = glowMat(0x8800ff);

  // Void orb base — no solid feet, floating entity
  g.add(sph(0.18, 10, dark, 0, 0.18, 0));
  g.add(cyl(0.04, 0.18, 0.38, 10, void_, 0, 0.38, 0));

  // Cosmic tendrils base
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    const tendril = cyl(0, 0.03, 0.24, 5, cosmos,
      Math.cos(ang) * 0.16, 0.12 + i * 0.02, Math.sin(ang) * 0.14);
    g.add(tendril);
  }

  // Torso — dark void mass
  g.add(sph(0.28, 12, void_, 0, 0.72, 0));
  g.add(box(0.40, 0.42, 0.34, void_, 0, 0.84, 0));

  // Void swirl bands
  g.add(cyl(0.30, 0.30, 0.04, 12, cosmos, 0, 0.72, 0));
  g.add(cyl(0.30, 0.30, 0.04, 12, purple, 0, 0.92, 0));

  // Star particles embedded in body
  g.add(sph(0.03, 5, star, -0.18, 0.80, 0.16));
  g.add(sph(0.02, 5, star,  0.22, 0.88, 0.14));
  g.add(sph(0.025, 5, star, 0.10, 0.68, 0.18));
  g.add(sph(0.02, 5, star, -0.24, 0.92, 0.12));

  // Shoulders — void mass growths
  g.add(sph(0.16, 8, dark, -0.38, 1.08, 0));
  g.add(sph(0.16, 8, dark,  0.38, 1.08, 0));
  g.add(sph(0.06, 6, cosmos, -0.48, 1.18, 0));
  g.add(sph(0.06, 6, cosmos,  0.48, 1.18, 0));

  // Arms — void tendrils
  g.add(box(0.10, 0.40, 0.10, void_, -0.36, 0.82, 0));
  g.add(box(0.10, 0.40, 0.10, void_,  0.36, 0.82, 0));

  // Hand orbs — cosmic energy
  g.add(sph(0.09, 8, cosmos, -0.36, 0.58, 0.04));
  g.add(sph(0.09, 8, cosmos,  0.36, 0.58, 0.04));
  g.add(sph(0.05, 6, star, -0.36, 0.58, 0.09));
  g.add(sph(0.05, 6, star,  0.36, 0.58, 0.09));

  // Head — cosmic void sphere
  g.add(sph(0.24, 12, dark, 0, 1.38, 0));

  // Cosmic ring around head
  g.add(cyl(0.30, 0.30, 0.04, 12, cosmos, 0, 1.40, 0));
  g.add(cyl(0.24, 0.24, 0.02, 12, purple, 0, 1.38, 0));

  // Void eyes — deep glowing
  g.add(sph(0.060, 8, cosmos, -0.10, 1.40, 0.20));
  g.add(sph(0.060, 8, cosmos,  0.10, 1.40, 0.20));
  g.add(sph(0.030, 6, star, -0.10, 1.40, 0.24));
  g.add(sph(0.030, 6, star,  0.10, 1.40, 0.24));

  // Star field in head
  g.add(sph(0.022, 5, star, -0.08, 1.50, 0.12));
  g.add(sph(0.016, 5, star,  0.14, 1.44, 0.14));
  g.add(sph(0.018, 5, star,  0.02, 1.32, 0.20));

  // Black hole singularity orb — floating above/between hands
  g.add(sph(0.08, 10, glowMat(0x000022), 0, 0.56, 0.20));
  g.add(sph(0.04, 8, cosmos, 0, 0.56, 0.26));

  return g;
}

export function getSkillTemplates() {
  return [
    {
      id: 'malefice', slot: 'Q',
      name: 'Malefice',
      description: 'Focuses the power of the void on an enemy, repeatedly stunning them.',
      skillType: 'active',
      castType: 'unit-target',
      targetRule: 'enemy',
      damageType: 'magical',
      manaCostByLevel: [100, 120, 140, 160],
      cooldownByLevel: [14, 13, 12, 11],
      castRangeByLevel: [600, 600, 600, 600],
      effectValuesByLevel: {
        damagePerPulse: [50, 75, 100, 125],
        stunPerPulse:   [0.5, 0.5, 0.5, 0.5],
        pulseCount:     [2, 3, 4, 5],
        pulseInterval:  [2.0, 2.0, 2.0, 2.0],
      },
      aiHints: { useWhenEnemyInRange: true, minManaPct: 0.2 },
    },
    {
      id: 'demonicConversion', slot: 'W',
      name: 'Demonic Conversion',
      description: 'Converts a creep into 3 Eidolons that fight for Enigma.',
      skillType: 'active',
      castType: 'unit-target',
      targetRule: 'any',
      damageType: 'pure',
      manaCostByLevel: [170, 170, 170, 170],
      cooldownByLevel: [30, 30, 30, 30],
      castRangeByLevel: [700, 700, 700, 700],
      effectValuesByLevel: {
        eidolonCount:  [3, 3, 3, 3],
        eidolonDamage: [20, 32, 44, 56],
        eidolonHp:     [400, 500, 600, 700],
      },
      aiHints: { useOnCreep: true, minManaPct: 0.34 },
    },
    {
      id: 'midnightPulse', slot: 'E',
      name: 'Midnight Pulse',
      description: 'Creates a zone of dark energy that damages enemies based on max HP.',
      skillType: 'active',
      castType: 'point-target',
      targetRule: 'ground',
      damageType: 'pure',
      manaCostByLevel: [70, 80, 90, 100],
      cooldownByLevel: [25, 20, 15, 10],
      castRangeByLevel: [600, 600, 600, 600],
      effectValuesByLevel: {
        maxHpDmgPctPerSec:[0.04, 0.05, 0.06, 0.07],
        aoeRadius:        [700, 700, 700, 700],
        duration:         [8, 8, 8, 8],
      },
      aiHints: { useWhenEnemiesInRadiusAtLeast: 2, minManaPct: 0.14 },
    },
    {
      id: 'blackHole', slot: 'R',
      name: 'Black Hole',
      description: 'Channels to create a vortex that sucks in and disables all nearby enemies.',
      skillType: 'channel',
      castType: 'self-radius',
      targetRule: 'enemy',
      damageType: 'pure',
      manaCostByLevel: [200, 275, 340],
      cooldownByLevel: [210, 180, 150],
      castRangeByLevel: [0, 0, 0],
      effectValuesByLevel: {
        damagePerSecond: [50, 75, 100],
        aoeRadius:       [420, 420, 420],
        duration:        [4, 4, 4],
        pullStrength:    [200, 200, 200],
      },
      aiHints: { useWhenEnemiesInRadiusAtLeast: 3, minManaPct: 0.4 },
    },
  ];
}
