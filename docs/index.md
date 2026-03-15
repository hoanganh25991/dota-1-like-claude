# Docs — SDLC Hub

**Purpose:** Single entry point for Crimson Lane. Scope, specs, progress, and backlog live here.

**Stack:** Three.js · HTML/CSS/JS · Solo vs AI · WebRTC/Trystero multiplayer (host/join, room code, QR).

---

## How to use this hub

| Step | Action |
|------|--------|
| **Scope** | Read [plan.md](plan.md) for MVP rules; [brief.md](brief.md) for original vision. |
| **Design** | [theme.md](theme.md) (look & feel), [heroes/index.md](heroes/index.md) (hero content). |
| **Build** | [menu.md](menu.md) (UI flow). |
| **Track** | Plan section below — Done / Requirements Plan / Backlog. |

---

## Doc index

### Spec — requirements & rules

| Doc | Tags | Description |
|-----|------|-------------|
| [plan.md](plan.md) | `#mvp` `#requirements` `#technical` | Game rules & systems spec: scope, match rules, map, stats, abilities, combat, lanes, structures, economy, items, controls, AI, architecture. **Primary source of truth.** |
| [brief.md](brief.md) | `#vision` `#multiplayer` `#mobile` | Original brief: Dota 1–style feel, WebRTC/QR join, mobile controls. |

### Design — content & look

| Doc | Tags | Description |
|-----|------|-------------|
| [heroes/index.md](heroes/index.md) | `#content` `#heroes` `#skills` `#art` | 20 heroes: geometry, animations, stats, Q/W/E/R skills; per-hero modules in `js/heroes/`. |
| [theme.md](theme.md) | `#art` `#ui` `#audio` `#ux` | Theme: colors, typography, 3D style, HUD, audio identity, announcer. |

### Implementation — UI flow

| Doc | Tags | Description |
|-----|------|-------------|
| [menu.md](menu.md) | `#ui` `#flow` `#implemented` | Main menu, Play flow (side + team size), Settings, Hero Viewer, Lobby. |

---

## Tags quick reference

| Tag | Meaning |
|-----|---------|
| `#mvp` | In scope for minimum viable product |
| `#requirements` | Must-have rules and scope |
| `#technical` | Architecture, systems, contracts |
| `#content` | Heroes, items, map data |
| `#heroes` `#skills` | Hero and ability design |
| `#art` `#ui` `#audio` `#ux` | Visual, UI, sound, interaction |
| `#multiplayer` | Post-MVP: PeerJS, networking, room/lobby |
| `#vision` | High-level product goal |
| `#implemented` | Describes shipped / verified feature |

---

## Plan (lifecycle)

### Done `#implemented`

Verified against code — these features are shipped and working.

| Area | What's in |
|------|-----------|
| **Engine** | Three.js scene, 100x100 map (terrain, 3 lanes, river, base pads), camera, game loop. |
| **Menu** | Main menu, Play (side + team size), Settings, Hero Viewer (all 20 heroes: 3D preview, animations, stats, skills, level slider), Lobby, hero pick → start. Hero Viewer is first/default Settings tab (auto-loaded on open); mobile landscape layout compacted via CSS media queries. Menu polish: Back labels use `🔙` icon style, and main-menu buttons are fixed to equal width for cleaner alignment. |
| **Heroes** | 20 heroes with 3D models, stats, Q/W/E/R skills. **5 MVP heroes implemented**: `js/heroes/lich.js`, `js/heroes/sniper.js`, `js/heroes/dragon-knight.js`, `js/heroes/shadow-fiend.js`, `js/heroes/windrunner.js` - all with `buildModel()` and `getSkillTemplates()` exports. Full hero spec list: Axe, Pudge, Sven, Tidehunter, Earthshaker, Phantom Assassin, Juggernaut, Drow Ranger, Bounty Hunter, Vengeful Spirit, Crystal Maiden, Zeus, Lina, Lion, Enigma. |
| **Combat** | Melee/ranged attacks, projectiles, physical/magic/pure damage, armor, lifesteal, death, respawn timer. Combat system (`js/combat.js`): damage formulas (armor reduction: 100/(100+armor×6)), attackUnit function, projectile system (spawnProjectile, update loop), death handling (killUnit → bounty + XP → death VFX → respawn), combat events (damageApplied, unitDied, goldGranted, xpGranted). Formulas from plan.md implemented: RespawnTime = 5 + level × 2, MoveSpeedClamp = min 100 / max 550, AttackInterval = baseAttackTime / attackSpeedMultiplier. |
| **Creeps** | Lane creeps (melee + ranged), waypoints, last hit, deny, XP, gold. |
| **Neutral camps** | 6 camps, tiered units, leash radius, respawn timer, gold/XP rewards. |
| **Structures** | 18 towers (tier 1–4), 6 barracks (destroyable, HP, death → mega-creep upgrade), 2 Ancients (win condition). |
| **Items** | 13 items (6 basic, 6 upgrade, TP Scroll), recipes, passives, actives (Blink, Teleport, Mana Restore, Void Burst), shop, 6-slot inventory. TP Scroll full spec: stun cancels channel entirely (not just pauses); player selects any allied tower as TP target via click-to-target mode with HUD banner; base fountain fallback; Escape to cancel. |
| **HUD** | Top bar (portraits, HP, time, gold), hero bars (HP/MP/XP/level/KDA), skill bar (Q/W/E/R, cooldowns, mana), attack button, inventory (2×3 grid right-side above skillbar), shop button (top of inventory panel), minimap (click-to-pan), announcer (First Blood, Kill Streak, Barracks Fallen, etc.). Layout improved: inventory moved from bottom-center to right side freeing up game view; HUD panels semi-transparent (idle-fade to 0.35 after 4s); camera offset reduced to keep hero more centered. |
| **Match end** | Victory / Defeat screen on Ancient destruction. |
| **Multiplayer** | Trystero networking (`js/net/`: peer, protocol, host, client, lobby). Create/Join game, room code, QR code, hero pick (both host and client pick own hero in lobby), host starts; host broadcasts state snapshots. **Migrated PeerJS → Trystero (torrent strategy)**: signaling now uses distributed BitTorrent tracker infrastructure instead of a single cloud server (`0.peerjs.com`) — eliminates the recurring "Connection timed out" failure. 20 s join timeout, `cancelJoin()`, Back button abort, `hostReady` handshake all preserved. 4× Google STUN + openrelay TURN still configured for symmetric-NAT traversal. Trystero loaded via `esm.sh` CDN import in `js/net/peer.js`; external peer API unchanged so all callers are unaffected. |
| **Controls** | Desktop (arrow keys, click move/attack, Q/W/E/R, Space stop, scroll zoom, B shop). Mobile (joystick, attack button, skill buttons). |
| **Gameplay spec clarity (mobile controls + shop)** | Expanded [plan.md](plan.md) with SDLC-ready control/shop contracts: mobile landscape thumb zones, primary attack + skill cluster behavior, deterministic virtual joystick geometry/ownership/output mapping, and shop panel/buy-flow simulation events (`openShopCommand`, `buyItemCommand`, `itemPurchased`, `itemPurchaseFailed`). |
| **MOBA gameplay deep-spec (casting, range, map flow)** | Added detailed Garena-style mobile cast modes (quick cast, drag-aim-release, double-tap smart cast), deterministic range validation rules for attack/skills, skill-type contracts (active/passive/toggle/channel), and explicit Drow Ranger Frost Arrows toggle behavior (`8 mana per shot` when enabled + highlighted ON state). Expanded map section with fixed orientation and lane win-direction: **bottom-left start pushes to top-right** (mirrored when sides swap). (`docs/plan.md`, `docs/heroes/drow-ranger.md`) |
| **DotA 1 legacy baseline spec (6.65-style)** | Added implementation contracts for old-day authenticity: DotA 1 identity baseline (WC3 TFT custom-map feel), classic top HUD team strips (allies left-top, enemies right-top, timer/day-night center), XP receive radius rules (1000 AoE baseline + deny XP reduction), day/night cycle with vision shift, and lane checkpoint order from base → towers → river. (`docs/plan.md`) |
| **AI** | Hero bots (lane march, fight, retreat, fountain regen, skill casting, item buying). Creep AI (lane pathing, target priority). **Bot difficulty presets** (Easy/Normal/Hard) tuning retreat HP threshold, cast reaction time, spell accuracy, and item-buy frequency — lobby UI selector wired through `js/ai.js` → `js/items.js`. |
| **Audio** | 18 SFX (hit, ranged, magic, death, levelup, gold, spawn, respawn, tower hit/death, frost, shrapnel, chain frost, assassinate channel/fire, fire, windrun, buy). Procedural main theme. **SFX wiring:** playSFX(name) in js/audio.js with Web Audio fallback beeps when sounds/ empty; called at damage (applyDamage), death (killUnit, applyCreepDamage), buy (buyItem), gold (grantBounty); levelup supported—call playSFX('levelup') when hero level increases. |
| **Polish VFX** | Level-up ring burst: two `spawnRing` calls (gold 1.5u + white 0.8u) added to `onLevelUp()` in `combat.js`. Hero death white flash: `group.traverse` sets emissive to white on kill, `setTimeout 200ms` hides the group. Respawn rotation fix: `animations.js` now checks `_prevAnim === 'die'` before overwriting it, resetting `group.rotation.x/z` when leaving die state. |
| **Minimap fog of war & entity dots** | Enemy heroes hidden on minimap unless within vision of any allied hero (15u), tower (12u), or creep (10u). Barracks dots drawn (green=allied, red=enemy). Recenter ⌖ button below minimap snaps camera to player hero. (js/hud.js, index.html, js/main.js) |
| **Ability UX — drag-to-aim & double-tap** | Mobile skill buttons (Q/W/E/R) support three gestures: (1) drag >20px → gold arrow aim indicator at touchstart, casts at lift-off world position (raycasted to ground plane); (2) double-tap within 300ms → auto-casts on nearest enemy hero within 500u; (3) single tap → existing click-to-confirm targeting mode. Pulsing "TAP TARGET" hint above skill bar during targeting. Escape cancels targeting mode. (js/controls.js, index.html) |
| **Leveling & skill learning UX** | Dota-like skill progression integrated: heroes no longer start with all 4 skills. Player starts with 1 skill point and learns Q/W/E/R manually; level-up grants +1 skill point instead of auto-leveling. Ultimate learns are gated at hero levels 6/11/16. HUD adds skill-point counter, per-skill `+` learn buttons, locked/unlearned/learnable visual states, and active/passive/toggle badges; desktop supports `Ctrl/Meta/Alt + Q/W/E/R` to learn quickly. Hero Viewer now labels skill type from real `skillTypes` data (Active/Passive/Toggle). (js/state.js, js/main.js, js/combat.js, js/skills.js, js/hud.js, js/controls.js, js/hero-viewer.js, index.html, locales/en.json, locales/vi.json) |
| **Skill range-cast SDLC** | Skill cast range taxonomy in plan.md (global, self, short/medium/long, passive, toggle). All 20 heroes × 4 skills documented in [heroes/](heroes/index.md) with explicit **Range** per skill. Zeus R (Thundergod's Wrath) marked global; SF Q/R and similar special cases defined. Hero modules support `castRangeByLevel` (Lich, Zeus, Sniper as examples). (docs/plan.md, docs/heroes/, js/heroes/_template.js, js/heroes/lich.js, js/heroes/zeus.js, js/heroes/sniper.js) |
| **Attack button range gate** | Attack button (👊) is dimmed and non-tappable (`pointer-events:none`, opacity 0.28) when no enemy/neutral creep is within attack range. As soon as a target enters range it activates: full opacity, red glow, pulsing `atkPulse` animation — gives clear "you can attack now" signal. Same range threshold as the attack action (`hero.def.range + 4`). Checked every frame in `updateHUD()`. (js/hud.js, index.html) |
| **Mobile skill UX — MOBA-style passive/toggle/aim** | Passive skills: greyed-out buttons (opacity 0.45, pointer-events:none) with 'P' badge — cannot be tapped, flash briefly if pressed. Toggle skills (Drow Frost Arrows Q, Pudge Rot W): tap to toggle on/off, blue glow when active (`skill-toggled-on` CSS). Drag-to-aim snaps to nearest enemy unit within 7 world units of the aimed position — greatly improves unit-target skills on mobile. Double-tap now includes neutral creep camps as valid auto-targets. Drow Ranger Frost Arrows reworked: true toggle (no timer), orb effect hooked into attack loop — slows target 1.5–3s + bonus 15–45 magic dmg scaled by skill level; projectile turns blue when active. `skillTypes` metadata (`'passive'`/`'toggle'`/`'active'`) added to all 20 hero modules. (js/hud.js, js/skills.js, js/controls.js, js/heroes/*.js, js/main.js, index.html) |
| **Skill system implementation** | Complete skill system (`js/skills.js`) with: skill type system (Active/Passive/Toggle/Channel), 3 cast modes (quick/aim/double-tap), range validation (global/self/melee/short/medium/long/very-long), target validation (enemy/ally/ground rules), cast pipeline (mana/cooldown checks, status effects), and hero skill learning progression. Range taxonomy: global (Zeus R), self (Windrun), self-radius (Ravage), melee (150u), short (400u), medium (700u), long (1200u), very-long (2000u). Status effects: stun/slow/silence/knockback/disarm/root/invulnerability. Garena-style mobile UX: drag-to-aim, double-tap smart cast, auto-target nearest valid unit. (js/skills.js, docs/plan.md §6, js/heroes/_template.js) |
| **Loading screen** | Full-screen overlay shown immediately at page load (pure HTML/CSS, no JS dependency). Progress bar tracks CDN script loading (Three.js → Howler → QR → main.js init) with stage labels. Menu buttons disabled until JS fully initializes; re-enabled and overlay fades out on `_appReady()`. Slow-connection warning shown after 90s; CDN error shown inline with reload link. Fake-progress animation provides feedback during the longest download on 3G. (index.html, js/main.js) |
| **Internationalisation (i18n)** | Full EN/VI locale system. Key definitions and runtime in `js/i18n.js`; locale files `locales/en.json` + `locales/vi.json`. Auto-detects language via `navigator.language`, persists to `localStorage`. `applyDOM()` walks `[data-i18n]` / `[data-i18n-placeholder]` / `[data-i18n-title]` attributes. Language selector (dropdown + Reload button) in Settings → General. All dynamic UI strings in `main.js`, `hud.js`, `combat.js`, `controls.js`, `items.js`, `hero-viewer.js` use `t('key', vars)`. Covers menus, lobby, multiplayer, HUD, announcer, shop/items, hero viewer, end screen. |
| **Emoji theme polish** | Theme-matching emojis added across UI: flow (⚔️👥▶️), settings (⚙️📋ℹ️🔊🔄), controls (🎮⚔️🎯✨⏹️⌨️🔍🛒), lobby (🤖🛡️📊), multiplayer (🌐➕🔗🗡️📋), HUD (🎯✨⌖), viewer (💤🚶⚔️✨💀❤️📊📈), shop/items (🛡️👟🌿🗡️🔮❤️🩸🌀), announce (💔🏰🌀❌). Loading screen stages (⏳🔊📦⚔️✅❌). Swapped clashing emojis: Easy 😊→🛡️, Ally killed 😢→💔, Bounty Hunter 🥷→🗡️. (locales/en.json, locales/vi.json, index.html, js/hero-viewer.js, js/heroes/sniper.js) |
| **Rebuild (from scratch)** | Full game scaffold per SDLC: `index.html`, `js/` (main, state, scene, constants, map, heroes, hero-models, combat, skills, creeps, towers, items, hud, controls, audio, particles, animations, ai, hero-viewer, net stubs). 100×100 map, 3 lanes, bases, camera follow. 20 hero defs (Lich with 3D model + Frost Nova). Combat: damage formulas, melee/ranged, projectiles, death, respawn. Lane creeps (mid), structures (towers, barracks, ancients), win condition. Menu: side → team size → lobby hero pick → start. HUD: gold, time, HP/MP bars. Controls: click-to-move, Q cast. |
| **Tests & balance** | `#technical` | Unit tests for combat formulas in `tests/combat-formulas.test.js` (physical damage, respawn). Balance reference in `docs/balance.md` (formulas, hero stats, items, XP/gold). Run: `node tests/combat-formulas.test.js`. |
| **Implement & polish (index)** | `#mvp` `#implemented` | Last-hit/deny + gold/XP on creep kill; hero kill bounty + XP; 6 neutral camps (spawn, 60s respawn). HUD: skill bar Q/W/E/R, minimap (click-to-pan), inventory 2×3, shop panel, match end screen (Victory/Defeat), loading overlay. Settings: Hero Viewer first tab, 20-hero list + placeholder preview. Controls: Space stop, B shop, scroll zoom, mobile stubs. Audio: `playSFX` Web Audio fallback (hit, death, gold, buy). Polish: `spawnRing`/death flash in `killUnit`, attack button range gate in HUD. |
| **Full game implementation (from scratch)** | `#mvp` `#implemented` | Complete rebuild: all JS modules written from scratch — `index.html`, `css/style.css`, `css/hero-viewer.css`, `js/main.js` (game loop, menu flow), `js/state.js`, `js/scene.js` (Three.js, ACES, PCFSoft shadows), `js/constants.js` (all map/item/tower/creep defs), `js/map.js` (100×100 terrain, river, jungle instanced trees, base pads with team lights), `js/particles.js` (ring burst, projectile, death flash, damage floats), `js/animations.js` (idle/walk/attack/cast/die per hero), `js/combat.js` (damage formulas, XP radius 1000u, deny rules, respawn timer), `js/skills.js` (full cast pipeline, 15 hero skill implementations), `js/items.js` (13 items, shop commands, recipe merge, stat recalc), `js/creeps.js` (lane waves 3+1, waypoint AI, mega-creep upgrade, 6 neutral camps), `js/towers.js` (18 towers, 6 barracks, 2 ancients, auto-attack AI), `js/hud.js` (top bar ally/enemy strips, day/night indicator, skill bar cooldowns, minimap fog-of-war, inventory, shop panel, idle-fade), `js/controls.js` (desktop click-move/attack/cast, keyboard shortcuts, mobile joystick+drag-aim), `js/audio.js` (Web Audio synthesis for 20 SFX + ambient drone), `js/ai.js` (8-state FSM bots, difficulty presets, build paths for all 20 heroes), `js/hero-viewer.js` (standalone 3D preview, orbit, level/AS sliders, skill cards), `js/heroes/` (all 20 hero modules with 3D geometry + 4 skills each), `js/net/` (Trystero stubs), `js/i18n.js` (EN/VI locales), `locales/en.json`+`locales/vi.json`, `tests/combat-formulas.test.js` (11 passing tests). Classic top HUD team strips (allies left, enemies right, day/night center), 5m/5m day/night cycle, XP radius 1000u + deny 50% XP, lane checkpoints base→T3→T2→T1→river→enemy, skill balance across all 20 heroes per old-DotA identity rules. |

### Requirements Plan `#mvp`

Scoped and spec'd — ready to implement. Ordered by priority.

*(All items completed — see Done section below.)*

### Backlog (future — not yet scoped)

| Item | Tags | Notes |
|------|------|-------|
| Client sync from host snapshots | `#multiplayer` `#technical` | Host broadcasts state; client can be extended to render from snapshots only. |
| Draft/ban phase | `#multiplayer` `#content` | Out of MVP. |
| Replay system | `#technical` | Out of MVP. |
| Matchmaking & login | `#technical` `#multiplayer` | Out of MVP. |

---

## Code reference

- **Run:** Open `index.html` in browser (no build step).
- **Entry:** `js/main.js` (game loop, menu flow, lobby).
- **Core:** `js/state.js`, `js/scene.js`, `js/constants.js`.
- **Heroes:** `js/heroes/` (registry.js, _template.js, one module per hero); `js/heroes.js`, `js/hero-models.js`, `js/skills.js`, `js/combat.js`, `js/items.js`, `js/ai.js`.
- **Gameplay:** `js/creeps.js`, `js/towers.js`, `js/particles.js`, `js/animations.js`.
- **Net:** `js/net/` (peer.js, protocol.js, host.js, client.js, lobby.js).
- **Player:** `js/controls.js`, `js/hud.js`, `js/map.js`, `js/audio.js`, `js/particles.js`, `js/animations.js`.
- **UI:** `js/hero-viewer.js`, `css/hero-viewer.css`.
- **Content:** Heroes in `js/heroes/` (per-hero defs, skills, models); items in `js/items.js`; map/towers/barracks in `js/constants.js`.
- **Audio:** 18 WAV files in `sounds/`; generation script in `scripts/generate-dota-sfx.js`.

---

*Update the Plan section as work completes. Keep tags consistent when adding new docs.*
