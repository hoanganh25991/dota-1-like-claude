# Main Menu

**Category:** Plan · **Tags:** #ui #flow #implemented

This document describes the main menu system: entry screen, play flow (side + team size), settings with tabs, and how the Hero Viewer is integrated.

---

## Overview

On load, the game shows the **Main Menu** instead of the lobby. From there the user can:

- **Play** — choose side (Sentinel / Scourge), then team size (5v5, 3v3, 1v1), then go to the hero-pick lobby and start a game (others are bots).
- **Multiplayer** — placeholder; currently disabled (“Coming Soon”).
- **Settings** — open a tabbed settings screen; **Hero Viewer is the first and default tab**, auto-loading the 3D hero viewer immediately on open.

---

## Screens and flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         MAIN MENU                                 │
│  · Play                                                           │
│  · Multiplayer (disabled)                                          │
│  · Settings                                                       │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    │                    ▼
┌─────────────────────┐      │           ┌─────────────────────┐
│     PLAY FLOW       │      │           │     SETTINGS        │
│  Step 1: Side       │      │           │  · General          │
│  · Sentinel        │      │           │  · Audio             │
│  · Scourge         │      │           │  · Hero Viewer  ─────┼──► loads hero-viewer.js when tab opened
│  [Back] [Continue] │      │           │  [← Back]           │
└─────────┬───────────┘      │           └─────────────────────┘
          │ Continue         │
          ▼                  │
┌─────────────────────┐      │
│  Step 2: Team size  │      │
│  · 5 vs 5          │      │
│  · 3 vs 3          │      │
│  · 1 vs 1          │      │
│  [Back] [Continue]  │      │
└─────────┬───────────┘      │
          │ Continue         │
          ▼                  │
┌─────────────────────┐      │
│       LOBBY         │◄─────┘
│  Hero pick +        │   (Back from lobby → Play flow step 2)
│  [← Back] [Start]   │
└─────────┬───────────┘
          │ Start Game
          ▼
       GAME (HUD + canvas)
```

---

## Where it lives in the code

| What | Where |
|------|--------|
| **HTML** | `index.html`: `#main-menu`, `#play-flow`, `#settings-screen`, `#lobby`, and Hero Viewer panel inside `#hero-viewer-panel` |
| **Styles** | `index.html`: Main menu, play flow, settings tabs. **Hero Viewer:** `css/hero-viewer.css` (all `#hero-viewer-panel` / `hv-*` styles) |
| **Logic** | `js/main.js`: `showScreen()`, button handlers, tab switching, dynamic `import('./hero-viewer.js')` when Hero Viewer tab is opened |
| **State** | `js/state.js`: `G.playerSide` (`'sentinel' \| 'scourge'`), `G.teamSize` (1, 3, or 5) |
| **Game start** | `js/main.js` `startGame()`: uses `G.playerSide` for player spawn (Sentinel = top-right base, Scourge = bottom-left); AI uses the opposite side |

---

## Main menu (`#main-menu`)

- **Title:** “CRIMSON LANE” with subtitle “MOBILE MOBA”.
- **Buttons:**
  - **Play** — switches to play flow, step 1 (choose side).
  - **Multiplayer** — disabled, “Coming Soon”.
  - **Settings** — opens settings with the General tab active.

---

## Play flow (`#play-flow`)

- **Step 1 — Choose your side**
  - Options: **Sentinel**, **Scourge** (`.opt-btn[data-side]`).
  - **Continue** requires a side; then step 2 is shown.
  - **Back** returns to Main Menu.

- **Step 2 — Choose team size**
  - Options: **5 vs 5**, **3 vs 3**, **1 vs 1** (`.opt-btn[data-mode]`).
  - **Continue** requires a mode; then stores `G.teamSize` and shows **Lobby**.
  - **Back** returns to step 1.

- Lobby has **← Back** which calls `window.lobbyBack()` and shows play flow again at step 2 (team size).

---

## Settings (`#settings-screen`)

- **Header:** “Settings” + **← Back** (returns to Main Menu).
- **Tabs:** `data-tab` / `data-pane` link each tab to its pane:
  - **Hero Viewer** *(first tab, auto-selected on Settings open)* — shows `#hero-viewer-panel`; the app runs `import('./hero-viewer.js')` and then `initHeroViewer()` immediately when Settings is opened.
  - **General** — placeholder text.
  - **Audio** — placeholder text.

---

## Hero Viewer (inside Settings)

- **Markup:** All viewer UI is in `index.html` inside `#hero-viewer-panel` (no separate HTML file).
- **IDs:** All viewer elements use an `hv-` prefix (e.g. `#hv-hero-canvas`, `#hv-stats-panel`) to avoid clashes with the main game.
- **Load on demand:** The Hero Viewer script and 3D scene are only initialized when the user opens **Settings → Hero Viewer**; `js/hero-viewer.js` exports `initHeroViewer()` and is loaded via dynamic `import()`.
- **All heroes:** The viewer lists all 20 heroes from the game registry (`HERO_REGISTRY` / `ALL_HERO_IDS`). Each hero’s 3D model is built via the hero module’s `buildModel()`; stats and Q/W/E/R skills are derived from the same registry so you can review both the model and skills easily.
- **Behaviour:** Hero strip (portrait per hero), 3D viewport, stats, level/attack-speed sliders, skill grid with keys and meta (mana/CD), animation buttons (Idle, Walk, Attack, Cast Q/R, Die), prev/next hero, and keyboard (Q/W/E/R, arrows, etc.). The first five heroes (Lich, Sniper, Dragon Knight, Shadow Fiend, Windrunner) have custom spell VFX in the viewer; the rest use a generic cast effect.

---

## State and game start

- **`G.playerSide`** — `'sentinel'` or `'scourge'`; set when the user picks a side in play flow.
- **`G.teamSize`** — `1`, `3`, or `5`; set when the user picks a team size.
- **`startGame()`** uses `G.playerSide` to place the player hero and the AI hero on the correct bases (Sentinel top-right, Scourge bottom-left). Other slots are intended to be bots; current game logic still uses a single player vs one AI.

---

## File reference

| File | Role |
|------|------|
| `index.html` | Main menu, play flow, settings, Hero Viewer panel markup; links `css/hero-viewer.css` |
| `css/hero-viewer.css` | All Hero Viewer panel styles (scoped under `#hero-viewer-panel`, `hv-` IDs); one place to maintain viewer UI |
| `js/main.js` | Menu/play/settings wiring, `showScreen()`, `lobbyBack()`, tab click → Hero Viewer import + init |
| `js/state.js` | `G.playerSide`, `G.teamSize` |
| `js/hero-viewer.js` | Hero Viewer logic and Three.js scene; `initHeroViewer()` called when Hero Viewer tab is first opened |

**Note:** The standalone `hero-viewer.html` was removed; the viewer lives only inside the app (Settings → Hero Viewer).
