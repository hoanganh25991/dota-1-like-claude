// Hero module template
// Every hero exports: buildModel() and getSkillTemplates()
// buildModel() returns a THREE.Group
// getSkillTemplates() returns array of 4 skill objects

export function buildModel() {
  // Build hero geometry using THREE primitives
  // Use materials from ../hero-models.js
  // Return THREE.Group
}

export function getSkillTemplates() {
  return [
    {
      id: 'skillId', slot: 'Q',
      name: 'Skill Name',
      description: 'What it does.',
      skillType: 'active',       // 'active'|'passive'|'toggle'|'channel'
      castType: 'unit-target',   // 'unit-target'|'point-target'|'self'|'self-radius'|'global'|'no-target'
      targetRule: 'enemy',       // 'enemy'|'ally'|'any'|'ground'|'none'
      damageType: 'magical',     // 'magical'|'physical'|'pure'
      manaCostByLevel: [100, 120, 140, 160],
      cooldownByLevel: [8, 7, 6, 5],
      castRangeByLevel: [500, 500, 500, 500], // 0 for self, Infinity for global
      effectValuesByLevel: { damage: [75, 150, 225, 300] },
      aiHints: { useWhenEnemiesInRadiusAtLeast: 1, minManaPct: 0.2 },
    },
    // W, E, R ...
  ];
}
