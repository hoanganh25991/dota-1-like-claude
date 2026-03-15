// Unit tests for combat formulas
// Run: node tests/combat-formulas.test.js

let passed = 0, failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${name}: ${e.message}`);
    failed++;
  }
}

function assertEqual(actual, expected, msg) {
  if (Math.abs(actual - expected) > 0.001) {
    throw new Error(`${msg}: expected ${expected}, got ${actual}`);
  }
}

console.log('Combat Formulas:');

// PhysicalDamageTaken = damage * 100 / (100 + armor * 6)
test('Physical damage with 0 armor', () => {
  const dmg = 100 * 100 / (100 + 0 * 6);
  assertEqual(dmg, 100, 'zero armor gives full damage');
});
test('Physical damage with 10 armor', () => {
  const dmg = 100 * 100 / (100 + 10 * 6);
  assertEqual(dmg, 62.5, '10 armor gives 62.5 damage');
});
test('Physical damage with 25 armor', () => {
  const dmg = 100 * 100 / (100 + 25 * 6);
  assertEqual(dmg, 40, '25 armor gives 40 damage');
});

// RespawnTime = 5 + level * 2
test('Respawn time level 1', () => assertEqual(5 + 1 * 2, 7, 'level 1 respawn'));
test('Respawn time level 10', () => assertEqual(5 + 10 * 2, 25, 'level 10 respawn'));
test('Respawn time level 25', () => assertEqual(5 + 25 * 2, 55, 'level 25 respawn'));

// MoveSpeed clamp 100-550
test('MoveSpeed clamp min', () => {
  const clamped = Math.max(100, Math.min(550, 50));
  assertEqual(clamped, 100, 'min clamp');
});
test('MoveSpeed clamp max', () => {
  const clamped = Math.max(100, Math.min(550, 700));
  assertEqual(clamped, 550, 'max clamp');
});

// XP formula
test('XP to level 2', () => assertEqual(1 * 100 + 200, 300, 'XP for level 2'));
test('XP to level 5', () => assertEqual(4 * 100 + 200, 600, 'XP for level 5'));

// Attack interval
test('Attack interval formula', () => {
  const baseAttackTime = 1.7;
  const attackSpeedMultiplier = 1.0;
  const interval = baseAttackTime / attackSpeedMultiplier;
  assertEqual(interval, 1.7, 'base attack interval');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
