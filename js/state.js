// ============================================================
// state.js — Global mutable game state for Crimson Lane
// ============================================================

// Default values snapshot — used by resetState()
const DEFAULTS = {
  // ── Match lifecycle ────────────────────────────────────────
  running: false,
  tick: 0,
  time: 0,             // seconds elapsed in match

  // ── Day/night cycle ────────────────────────────────────────
  dayPhase: 'day',     // 'day' | 'night'
  dayTimer: 0,         // seconds into current phase
  DAY_DURATION: 240,   // 4 minutes per phase
  NIGHT_DURATION: 240,

  // ── Player configuration (set via menus) ──────────────────
  playerSide: 'sentinel',  // 'sentinel' | 'scourge'
  teamSize: 5,             // 5 | 3 | 1
  pickedHeroId: 'lich',
  botDifficulty: 'normal', // 'easy' | 'normal' | 'hard'

  // ── Entity arrays ──────────────────────────────────────────
  heroes: [],       // all hero units (player + bots)
  creeps: [],       // active lane creeps
  neutrals: [],     // active neutral units
  projectiles: [],  // active projectiles (arrows, spells)
  structures: [],   // live towers, barracks, ancients

  // ── Player refs ────────────────────────────────────────────
  playerHero: null,

  // ── Camera ────────────────────────────────────────────────
  camTarget: { x: 0, z: 0 },

  // ── Economy tracking ──────────────────────────────────────
  // Per-hero gold is stored on the hero object itself.
  // Team-level counters kept here for UI display.
  sentinelScore: 0,   // towers/kills weighting
  scourgeScore: 0,

  // ── Creep spawn state ──────────────────────────────────────
  creepWave: 0,         // wave number
  nextCreepSpawn: 30,   // seconds until next wave

  // ── Neutral respawn timers ─────────────────────────────────
  // Map of campId → secondsUntilRespawn (set when camp is cleared)
  neutralTimers: {},

  // ── UI flags ──────────────────────────────────────────────
  shopOpen: false,
  shopCategory: 'components',  // active shop tab
  targetingSkill: null,        // 'Q' | 'W' | 'E' | 'R' | null

  // ── HUD state ─────────────────────────────────────────────
  selectedUnit: null,   // hero or unit selected for info panel
  chatMessages: [],     // [ { sender, text, time } ]

  // ── Announcer ─────────────────────────────────────────────
  announcerQueue: [],   // [ { text, color, duration } ]

  // ── Input snapshot ────────────────────────────────────────
  // Populated each frame by input.js
  input: {
    moveDir: { x: 0, z: 0 },
    attackPressed: false,
    skillPressed: { Q: false, W: false, E: false, R: false },
    pointerWorld: { x: 0, z: 0 },
    joystickActive: false,
  },

  // ── Match end ─────────────────────────────────────────────
  matchResult: null,        // null | 'victory' | 'defeat'
  matchEndTime: null,       // game time when match ended
};

// ── Live state object ─────────────────────────────────────────
// All systems read/write this single object.
export const G = Object.assign({}, structuredClone ? structuredClone(DEFAULTS) : JSON.parse(JSON.stringify(DEFAULTS)));

// ── resetState ───────────────────────────────────────────────
// Call before starting a new match. Preserves playerSide,
// teamSize, pickedHeroId, botDifficulty set from menus.
export function resetState() {
  const keep = {
    playerSide:    G.playerSide,
    teamSize:      G.teamSize,
    pickedHeroId:  G.pickedHeroId,
    botDifficulty: G.botDifficulty,
  };

  // Wipe all keys
  const fresh = structuredClone ? structuredClone(DEFAULTS) : JSON.parse(JSON.stringify(DEFAULTS));
  for (const key of Object.keys(fresh)) {
    G[key] = fresh[key];
  }

  // Restore player choices
  Object.assign(G, keep);
}

// ── Convenience helpers ───────────────────────────────────────

/** Push an announcer message to the queue. */
export function announce(text, color = '#ffcc44', duration = 2500) {
  G.announcerQueue.push({ text, color, duration, id: Date.now() + Math.random() });
}

/** Add a chat message. */
export function addChat(sender, text) {
  G.chatMessages.push({ sender, text, time: G.time });
  if (G.chatMessages.length > 50) G.chatMessages.shift();
}

/** Return the enemy team string of the given team. */
export function enemyTeam(team) {
  return team === 'sentinel' ? 'scourge' : 'sentinel';
}
