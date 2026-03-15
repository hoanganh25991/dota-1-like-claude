// ============================================================
// constants.js — All static game data for Crimson Lane
// ============================================================

export const MAP_SIZE = 100; // world units, -50 to +50

// ── Lane waypoints ────────────────────────────────────────────
// Scourge base: ~[-40,-40], Sentinel base: ~[40,40]
// Waypoints listed from Scourge side → Sentinel side
// Each point: [x, z]  (y is height, handled by terrain)
export const LANES = {
  mid: {
    scourge: [-40, -40],
    sentinel: [40, 40],
    waypoints: [
      [-40, -40],
      [-28, -28],
      [-16, -16],
      [  0,   0],   // river crossing
      [ 16,  16],
      [ 28,  28],
      [ 40,  40],
    ],
  },
  top: {
    scourge: [-40, -40],
    sentinel: [40, 40],
    // Top lane hugs the top (high-z) edge
    waypoints: [
      [-40, -40],
      [-40,  -8],
      [-38,  16],
      [-20,  38],   // top side of river
      [  0,  40],   // river crossing near top edge
      [ 18,  40],
      [ 38,  38],
      [ 40,  40],
    ],
  },
  bot: {
    scourge: [-40, -40],
    sentinel: [40, 40],
    // Bottom lane hugs the bottom (low-z) edge
    waypoints: [
      [-40, -40],
      [ -8, -40],
      [ 16, -38],
      [ 38, -20],   // bottom side of river
      [ 40,   0],   // river crossing near bottom edge
      [ 40,  18],
      [ 38,  38],
      [ 40,  40],
    ],
  },
};

// ── Structure positions ────────────────────────────────────────
// Each structure: { id, type, team, lane, tier, pos:[x,y,z], hp, maxHp }
// Towers: type='tower' tier 1-4
// Barracks: type='barracks'
// Ancients: type='ancient'
// y=0 for all (placed on flat terrain)

export const STRUCTURES = [
  // ═══════════════════ SCOURGE TOWERS ════════════════════════
  // Mid lane
  { id:'scourge_tower_mid_t1', type:'tower', team:'scourge', lane:'mid', tier:1, pos:[-10, 0, -10], hp:550, maxHp:550 },
  { id:'scourge_tower_mid_t2', type:'tower', team:'scourge', lane:'mid', tier:2, pos:[-22, 0, -22], hp:600, maxHp:600 },
  { id:'scourge_tower_mid_t3', type:'tower', team:'scourge', lane:'mid', tier:3, pos:[-32, 0, -32], hp:650, maxHp:650 },
  // Top lane (scourge side hugs top edge — high z values)
  { id:'scourge_tower_top_t1', type:'tower', team:'scourge', lane:'top', tier:1, pos:[-10, 0,  30], hp:550, maxHp:550 },
  { id:'scourge_tower_top_t2', type:'tower', team:'scourge', lane:'top', tier:2, pos:[-24, 0,  36], hp:600, maxHp:600 },
  { id:'scourge_tower_top_t3', type:'tower', team:'scourge', lane:'top', tier:3, pos:[-36, 0,  32], hp:650, maxHp:650 },
  // Bot lane (scourge side hugs bottom edge — low z values)
  { id:'scourge_tower_bot_t1', type:'tower', team:'scourge', lane:'bot', tier:1, pos:[-30, 0, -10], hp:550, maxHp:550 },
  { id:'scourge_tower_bot_t2', type:'tower', team:'scourge', lane:'bot', tier:2, pos:[-36, 0, -24], hp:600, maxHp:600 },
  { id:'scourge_tower_bot_t3', type:'tower', team:'scourge', lane:'bot', tier:3, pos:[-32, 0, -36], hp:650, maxHp:650 },
  // Base towers (T4) flanking ancient
  { id:'scourge_tower_base_l', type:'tower', team:'scourge', lane:'base', tier:4, pos:[-37, 0, -33], hp:700, maxHp:700 },
  { id:'scourge_tower_base_r', type:'tower', team:'scourge', lane:'base', tier:4, pos:[-33, 0, -37], hp:700, maxHp:700 },

  // ═══════════════════ SENTINEL TOWERS ═══════════════════════
  // Mid lane
  { id:'sentinel_tower_mid_t1', type:'tower', team:'sentinel', lane:'mid', tier:1, pos:[ 10, 0,  10], hp:550, maxHp:550 },
  { id:'sentinel_tower_mid_t2', type:'tower', team:'sentinel', lane:'mid', tier:2, pos:[ 22, 0,  22], hp:600, maxHp:600 },
  { id:'sentinel_tower_mid_t3', type:'tower', team:'sentinel', lane:'mid', tier:3, pos:[ 32, 0,  32], hp:650, maxHp:650 },
  // Top lane (sentinel side)
  { id:'sentinel_tower_top_t1', type:'tower', team:'sentinel', lane:'top', tier:1, pos:[ 10, 0,  30], hp:550, maxHp:550 },
  { id:'sentinel_tower_top_t2', type:'tower', team:'sentinel', lane:'top', tier:2, pos:[ 24, 0,  36], hp:600, maxHp:600 },
  { id:'sentinel_tower_top_t3', type:'tower', team:'sentinel', lane:'top', tier:3, pos:[ 36, 0,  32], hp:650, maxHp:650 },
  // Bot lane (sentinel side)
  { id:'sentinel_tower_bot_t1', type:'tower', team:'sentinel', lane:'bot', tier:1, pos:[ 30, 0, -10], hp:550, maxHp:550 },
  { id:'sentinel_tower_bot_t2', type:'tower', team:'sentinel', lane:'bot', tier:2, pos:[ 36, 0, -24], hp:600, maxHp:600 },
  { id:'sentinel_tower_bot_t3', type:'tower', team:'sentinel', lane:'bot', tier:3, pos:[ 32, 0, -36], hp:650, maxHp:650 },
  // Base towers (T4) flanking ancient
  { id:'sentinel_tower_base_l', type:'tower', team:'sentinel', lane:'base', tier:4, pos:[ 37, 0,  33], hp:700, maxHp:700 },
  { id:'sentinel_tower_base_r', type:'tower', team:'sentinel', lane:'base', tier:4, pos:[ 33, 0,  37], hp:700, maxHp:700 },

  // ══════════════════════ BARRACKS ═══════════════════════════
  // Scourge barracks (melee + ranged per lane)
  { id:'scourge_barracks_top_m',  type:'barracks', team:'scourge', lane:'top', subtype:'melee',  pos:[-37, 0,  28], hp:1200, maxHp:1200 },
  { id:'scourge_barracks_top_r',  type:'barracks', team:'scourge', lane:'top', subtype:'ranged', pos:[-38, 0,  25], hp:1200, maxHp:1200 },
  { id:'scourge_barracks_mid_m',  type:'barracks', team:'scourge', lane:'mid', subtype:'melee',  pos:[-35, 0, -28], hp:1200, maxHp:1200 },
  { id:'scourge_barracks_mid_r',  type:'barracks', team:'scourge', lane:'mid', subtype:'ranged', pos:[-33, 0, -30], hp:1200, maxHp:1200 },
  { id:'scourge_barracks_bot_m',  type:'barracks', team:'scourge', lane:'bot', subtype:'melee',  pos:[-28, 0, -37], hp:1200, maxHp:1200 },
  { id:'scourge_barracks_bot_r',  type:'barracks', team:'scourge', lane:'bot', subtype:'ranged', pos:[-25, 0, -38], hp:1200, maxHp:1200 },
  // Sentinel barracks
  { id:'sentinel_barracks_top_m', type:'barracks', team:'sentinel', lane:'top', subtype:'melee',  pos:[ 37, 0,  28], hp:1200, maxHp:1200 },
  { id:'sentinel_barracks_top_r', type:'barracks', team:'sentinel', lane:'top', subtype:'ranged', pos:[ 38, 0,  25], hp:1200, maxHp:1200 },
  { id:'sentinel_barracks_mid_m', type:'barracks', team:'sentinel', lane:'mid', subtype:'melee',  pos:[ 35, 0,  28], hp:1200, maxHp:1200 },
  { id:'sentinel_barracks_mid_r', type:'barracks', team:'sentinel', lane:'mid', subtype:'ranged', pos:[ 33, 0,  30], hp:1200, maxHp:1200 },
  { id:'sentinel_barracks_bot_m', type:'barracks', team:'sentinel', lane:'bot', subtype:'melee',  pos:[ 28, 0, -37], hp:1200, maxHp:1200 },
  { id:'sentinel_barracks_bot_r', type:'barracks', team:'sentinel', lane:'bot', subtype:'ranged', pos:[ 25, 0, -38], hp:1200, maxHp:1200 },

  // ══════════════════════ ANCIENTS ═══════════════════════════
  { id:'scourge_ancient',  type:'ancient', team:'scourge',  pos:[-40, 0, -40], hp:4000, maxHp:4000 },
  { id:'sentinel_ancient', type:'ancient', team:'sentinel', pos:[ 40, 0,  40], hp:4000, maxHp:4000 },
];

// ── Item definitions ──────────────────────────────────────────
// Fields: id, name, cost, components[], bonus{}, active, passive, consumable
export const ITEMS_DEF = {
  // ── Components ──────────────────────────────────────────────
  bootsOfSpeed: {
    id: 'bootsOfSpeed',
    name: 'Boots of Speed',
    cost: 500,
    components: [],
    bonus: { moveSpeed: 50 },
    consumable: false,
  },
  ironBranch: {
    id: 'ironBranch',
    name: 'Iron Branch',
    cost: 53,
    components: [],
    bonus: { str: 1, agi: 1, int: 1 },
    consumable: false,
  },
  bladesOfAttack: {
    id: 'bladesOfAttack',
    name: 'Blades of Attack',
    cost: 500,
    components: [],
    bonus: { attackDamage: 9 },
    consumable: false,
  },
  ringOfProtection: {
    id: 'ringOfProtection',
    name: 'Ring of Protection',
    cost: 175,
    components: [],
    bonus: { armor: 2 },
    consumable: false,
  },
  magicCharm: {
    id: 'magicCharm',
    name: 'Magic Charm',
    cost: 150,
    components: [],
    bonus: { int: 3 },
    consumable: false,
  },
  vitalityGem: {
    id: 'vitalityGem',
    name: 'Vitality Gem',
    cost: 825,
    components: [],
    bonus: { hp: 250 },
    consumable: false,
  },

  // ── Upgrades ────────────────────────────────────────────────
  powerBoots: {
    id: 'powerBoots',
    name: 'Power Boots',
    cost: 1400,
    components: ['bootsOfSpeed', 'vitalityGem'],
    bonus: { moveSpeed: 65, hp: 250 },
    consumable: false,
  },
  arcaneBoots: {
    id: 'arcaneBoots',
    name: 'Arcane Boots',
    cost: 1300,
    components: ['bootsOfSpeed', 'magicCharm'],
    bonus: { moveSpeed: 55, mana: 150 },
    active: {
      name: 'Replenish Mana',
      manaCost: 0,
      cooldown: 55,
      desc: 'Restores 135 mana to nearby allies.',
      manaRestore: 135,
      radius: 12,
    },
    consumable: false,
  },
  blinkDagger: {
    id: 'blinkDagger',
    name: 'Blink Dagger',
    cost: 2150,
    components: [],
    bonus: {},
    active: {
      name: 'Blink',
      manaCost: 75,
      cooldown: 14,
      desc: 'Teleport to target point up to 12 units away.',
      range: 12,
    },
    consumable: false,
  },
  lifeStealBlade: {
    id: 'lifeStealBlade',
    name: 'Life Steal Blade',
    cost: 1950,
    components: ['bladesOfAttack'],
    bonus: { attackDamage: 16 },
    passive: {
      name: 'Life Steal',
      lifeSteal: 0.20,
      desc: '20% life steal on attack.',
    },
    consumable: false,
  },
  auraShield: {
    id: 'auraShield',
    name: 'Aura Shield',
    cost: 1100,
    components: ['ringOfProtection'],
    bonus: { armor: 5 },
    passive: {
      name: 'Armor Aura',
      auraArmor: 2,
      auraRadius: 12,
      desc: '+2 armor aura to nearby allies.',
    },
    consumable: false,
  },
  voidStaff: {
    id: 'voidStaff',
    name: 'Void Staff',
    cost: 1250,
    components: ['magicCharm'],
    bonus: { int: 16, spellPen: 0.25 },
    passive: {
      name: 'Void',
      spellPen: 0.25,
      desc: '25% magic resistance piercing.',
    },
    consumable: false,
  },

  // ── Consumable ───────────────────────────────────────────────
  tpScroll: {
    id: 'tpScroll',
    name: 'TP Scroll',
    cost: 135,
    components: [],
    bonus: {},
    active: {
      name: 'Teleport',
      manaCost: 75,
      cooldown: 0,
      channelTime: 3,
      desc: 'Teleport to a friendly structure after 3s channel.',
    },
    consumable: true,
    charges: 1,
  },
};

// ── Neutral camps ─────────────────────────────────────────────
export const NEUTRAL_CAMPS = [
  {
    id: 'camp1',
    pos: [15, 0, 10],
    tier: 1,
    units: [{ type: 'small', count: 3 }],
    respawn: 60,
    goldRange: [35, 55],
    xp: 60,
  },
  {
    id: 'camp2',
    pos: [-15, 0, -10],
    tier: 1,
    units: [{ type: 'small', count: 2 }, { type: 'medium', count: 1 }],
    respawn: 60,
    goldRange: [40, 65],
    xp: 75,
  },
  {
    id: 'camp3',
    pos: [22, 0, -8],
    tier: 2,
    units: [{ type: 'medium', count: 2 }],
    respawn: 90,
    goldRange: [55, 80],
    xp: 110,
  },
  {
    id: 'camp4',
    pos: [-22, 0, 8],
    tier: 2,
    units: [{ type: 'medium', count: 2 }, { type: 'small', count: 1 }],
    respawn: 90,
    goldRange: [60, 90],
    xp: 120,
  },
  {
    id: 'camp5',
    pos: [10, 0, -22],
    tier: 3,
    units: [{ type: 'large', count: 1 }, { type: 'medium', count: 2 }],
    respawn: 120,
    goldRange: [80, 120],
    xp: 180,
  },
  {
    id: 'camp6',
    pos: [-10, 0, 22],
    tier: 3,
    units: [{ type: 'large', count: 1 }, { type: 'medium', count: 2 }],
    respawn: 120,
    goldRange: [80, 120],
    xp: 180,
  },
];

// ── Creep stats ───────────────────────────────────────────────
export const CREEP_STATS = {
  // Lane creeps
  melee: {
    hp: 550,
    maxHp: 550,
    damage: 20,
    armor: 2,
    moveSpeed: 3.2,
    attackRange: 1.5,
    attackSpeed: 1.0,   // attacks per second
    goldBounty: [38, 44],
    xpBounty: 62,
    aggroRadius: 8,
    scale: 0.6,
  },
  ranged: {
    hp: 310,
    maxHp: 310,
    damage: 22,
    armor: 0,
    moveSpeed: 3.2,
    attackRange: 6,
    attackSpeed: 0.9,
    goldBounty: [43, 50],
    xpBounty: 68,
    aggroRadius: 8,
    scale: 0.5,
  },
  siege: {
    hp: 700,
    maxHp: 700,
    damage: 60,
    armor: 5,
    moveSpeed: 2.6,
    attackRange: 7,
    attackSpeed: 0.5,
    goldBounty: [95, 105],
    xpBounty: 125,
    aggroRadius: 10,
    scale: 0.9,
  },
  // Neutral variants
  small: {
    hp: 200,
    maxHp: 200,
    damage: 12,
    armor: 0,
    moveSpeed: 3.0,
    attackRange: 1.5,
    attackSpeed: 1.1,
    goldBounty: [12, 18],
    xpBounty: 25,
    aggroRadius: 6,
    scale: 0.4,
  },
  medium: {
    hp: 450,
    maxHp: 450,
    damage: 28,
    armor: 3,
    moveSpeed: 2.8,
    attackRange: 2,
    attackSpeed: 0.8,
    goldBounty: [22, 32],
    xpBounty: 55,
    aggroRadius: 6,
    scale: 0.65,
  },
  large: {
    hp: 900,
    maxHp: 900,
    damage: 55,
    armor: 6,
    moveSpeed: 2.5,
    attackRange: 2.5,
    attackSpeed: 0.65,
    goldBounty: [50, 70],
    xpBounty: 120,
    aggroRadius: 8,
    scale: 1.0,
  },
};

// ── Tower stats ───────────────────────────────────────────────
export const TOWER_STATS = {
  t1: {
    hp: 550,
    maxHp: 550,
    damage: 100,
    attackRange: 12,
    attackSpeed: 1.0,
    armor: 15,
    goldBounty: 150,
    xpBounty: 100,
    truesight: false,   // T1 cannot see invisibility
  },
  t2: {
    hp: 600,
    maxHp: 600,
    damage: 125,
    attackRange: 12,
    attackSpeed: 1.0,
    armor: 15,
    goldBounty: 200,
    xpBounty: 150,
    truesight: false,
  },
  t3: {
    hp: 650,
    maxHp: 650,
    damage: 150,
    attackRange: 12,
    attackSpeed: 1.0,
    armor: 20,
    goldBounty: 200,
    xpBounty: 150,
    truesight: true,
  },
  t4: {
    hp: 700,
    maxHp: 700,
    damage: 175,
    attackRange: 14,
    attackSpeed: 1.2,
    armor: 25,
    goldBounty: 200,
    xpBounty: 200,
    truesight: true,
  },
};

// ── Hero registry IDs ─────────────────────────────────────────
// Used for hero selection grid ordering
export const HERO_REGISTRY_IDS = [
  'lich',
  'sniper',
  'dragonKnight',
  'shadowFiend',
  'windrunner',
  'axe',
  'invoker',
  'pudge',
  'juggernaut',
  'crystalMaiden',
  'antimage',
  'sven',
  'lina',
  'tidehunter',
  'drow',
  'beastmaster',
  'bloodseeker',
  'mirana',
  'earthshaker',
  'storm',
];
