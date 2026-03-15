---
name: "Implementation Plan: Crimson Lane — DotA 1 Style MOBA"
overview: Build a complete DotA 1-style MOBA game from scratch following the SDLC docs. Implementation will use subagents to work in parallel for speed, with clear separation of concerns for gameplay systems, UI, and assets.
todos: []
isProject: false
---

# Implementation Plan: Crimson Lane — DotA 1 Style MOBA

## Project State

The project currently has only documentation (`docs/`) folder with complete spec. Need to build `index.html` and `js/` from scratch.

## Phase 1: Core Scaffold (Sequential)

**Goal:** Get basic Three.js game running with map, camera, and game loop.

1. **Create `index.html`**
  - Single-page structure with HUD, menu overlays, canvas container
  - CDN imports: Three.js, QR library for multiplayer
  - Base CSS reset with theme colors from `theme.md`
  - Mobile responsive viewport setup
2. **Create `js/main.js`**
  - Game loop with `requestAnimationFrame`
  - Menu flow: main → play → lobby → game → end
  - State initialization (`G.playerSide`, `G.teamSize`)
  - Entry point wiring
3. **Create `js/constants.js`**
  - Map dimensions (100×100)
  - Team colors (Sentinel/Scourge)
  - Respawn timer formula: `5 + level × 2`
  - Vision ranges (day: 1800, night: 800)
  - XP radius: 1000 units
  - Creep spawn interval: 30s
4. **Create `js/state.js`**
  - Global state `G = { ... }`
  - Entity registries (heroes, creeps, towers)
  - Game phase: `waiting`, `playing`, `end`
  - Time tracking (`matchTime`, `dayNightCycle`)
5. **Create `js/scene.js`**
  - Three.js setup (scene, renderer, camera, shadows)
  - Ambient + directional lighting
  - Camera controller (orbit follow)
  - Post-processing: ACES tone mapping
6. **Create `js/map.js`**
  - Terrain generation (ground plane)
  - 3 lanes with explicit waypoints
  - Base positions (Scourge BL, Sentinel TR)
  - Jungle camp positions (6 camps)

## Phase 2: Hero System (Parallel Subagents)

1. **Implement Hero Core** (`js/heroes/_template.js`, `js/heroes.js`)
  - Hero class with base stats
  - Animation system (idle/walk/attack/death)
  - State machine: alive/dead/respawning
  - Movement, rotation, pathing
2. **Implement Combat** (`js/combat.js`)
  - Damage formulas: physical/magical/pure
  - Armor reduction: `100 / (100 + armor × 6)`
  - Attack loop: acquire target → move in range → fire
  - Death → bounty + XP → respawn
3. **Implement Skills** (`js/skills.js`)
  - Skill type registry (active/passive/toggle/channel)
  - Cast validation: range, mana, cooldown
  - Projectile system (basic attack, ranged skills)
  - Status effects: stun/slow/silence
4. **Implement 5 MVP Heroes** (parallel)
  - `js/heroes/lich.js` — Frost Nova, Chain Frost, Shadow Wave, Ice Armor
    - `js/heroes/sniper.js` — Headshot, Exposure, Sharpened, Assassinate
    - `js/heroes/dragon-knight.js` — Breath, Spikes, Armor, Dragon Blood
    - `js/heroes/shadow-fiend.js` — Raze, Presence, Shadowraze, Nevermore
    - `js/heroes/windrunner.js` — Windrun, Shackleshot, Focusfire, Powershot

## Phase 3: Creeps & Structures (Parallel)

1. **Implement Creeps** (`js/creeps.js`)
  - Lane creep spawner (every 30s, 3 melee + 1 ranged)
    - Waypoint pathing
    - Target priority: creeps → heroes → towers
    - Last hit detection, deny logic
    - XP/gold rewards
2. **Implement Towers** (`js/towers.js`)
  - 3 tiers per lane + base tower (18 total)
    - Auto-attack in range
    - Priority: creeps → heroes
    - Tower attack SFX + VFX
3. **Implement Barracks & Ancient**
  - 6 barracks (per-lane)
    - Mega-creep upgrade on destruction
    - Ancient as win condition

## Phase 4: UI & HUD (Parallel)

1. **Create `js/hud.js`**
  - Top HUD: team strips (allies left, enemies right)
    - Center: timer + day/night icon
    - Hero bars: HP/MP/XP/KDA
    - Skill bar: Q/W/E/R with cooldowns
    - Inventory: 2×3 grid
    - Attack button (range-gated)
    - Shop button, TP indicator
2. **Create `js/controls.js`**
  - Desktop: arrow keys, click move, Q/W/E/R, Space stop, B shop
    - Mobile: joystick (left zone), action buttons (right zone)
    - Input abstraction → commands

## Phase 5: Audio & Polish (Parallel)

1. **Create `js/audio.js`**
  - Web Audio SFX generator (no files)
    - 18 sound types: hit, death, gold, levelup, tower, etc.
    - Fallback beeps if sounds/ empty
2. **Create `js/particles.js`**
  - Level-up ring burst
    - Death flash (white emissive)
    - Skill VFX (Frost Nova, Chain Frost, Powershot)
3. **Create `js/animations.js`**
  - Animation blending
    - Death → respawn rotation fix
    - Attack speed → animation speed scaling

## Phase 6: AI System (Parallel)

1. **Implement Hero AI** (`js/ai.js`)
  - FSM states: idle, move, attack, retreat, cast, farm, push, buy
    - Lane assignment at match start
    - Skill casting heuristics
    - Item buying via build paths
2. **Implement Bot Difficulty**
  - Presets: Easy/Normal/Hard
    - Tune: retreat HP, cast reaction, spell accuracy, item frequency

## Phase 7: Multiplayer Stub (Parallel)

1. **Create `js/net/` stubs**
  - `peer.js` — Trystero integration
    - `protocol.js` — command/event types
    - `host.js` — state broadcast
    - `client.js` — snapshot rendering
    - `lobby.js` — room/QR code flow

## Phase 8: Endgame & Testing

1. **Match End Screen**
  - Victory/Defeat on Ancient destruction
    - Stats summary
    - Play again button
2. **Tests**
  - `tests/combat-formulas.test.js`
    - Run: `node tests/combat-formulas.test.js`

## Summary

- **Files:** ~25–30 JS modules
- **Parallel groups:** Hero core, Creeps/Towers, HUD/Controls, Audio/Particles, AI, Net
- **Target:** MVP playable match with 5 heroes, 3 lanes, creeps, towers, win condition

