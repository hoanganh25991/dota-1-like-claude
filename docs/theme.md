# Game Theme — Crimson Lane

**Category:** Design · **Tags:** #art #ui #audio #ux

> **Tone:** Nostalgic · Tactical · Dark Fantasy
> **Audience:** People who played Dota 1 / Warcraft III era games (2005–2010)
> **Platform:** Mobile browser, single `.html` file

---

## Core Feeling

You open the game and it feels like 2008 — a Garena lobby, a scratchy headset, 11pm on a school night.
Not a cartoon. Not a hero shooter. A dark, slow, punishing RTS-RPG hybrid where **every last-hit matters**.

The theme is not "retro for the sake of it." It is **faithful** — the same weight, the same color palette, the same moment when Chain Frost bounces through five enemies and your screen lights up cyan.

---

## Visual Identity

### Color Palette

| Name | Hex | Used For |
|---|---|---|
| Void Black | `#07070f` | Game background, map night sky |
| Dark Navy | `#0d0d1a` | Panel backgrounds, UI base |
| Deep Purple | `#111128` | Active panel, selected state |
| Gold | `#ffcc44` | Hero name, selected border, gold counter |
| Muted Amber | `#c8a84a` | Secondary text, stat values |
| Stone White | `#e0d8c8` | Primary body text |
| Dim Grey | `#666688` | Labels, inactive elements |
| Sentinel Green | `#1a8a1a` | HP bars, Sentinel team |
| Scourge Red | `#8a1a1a` | Enemy HP, Scourge team |
| Mana Blue | `#3366ff` | Mana bars, ice/water spells |
| Frost Cyan | `#00ffcc` | Lich spells, Chain Frost glow |
| Shadow Red | `#ff2200` | Shadow Fiend eyes, dark magic |

### Typography

- **Headers / Hero Names:** All-caps, letter-spacing 2px, monospace-adjacent. No decorative fonts.
- **Body / Stats:** `Segoe UI` or system monospace fallback. Small, dense, functional.
- **Announcer Text:** Large, bold, centered. Single color per event. Fades in/out fast.
- **Never use:** rounded bubbly fonts, gradient text fills, drop shadows on body text.

### UI Borders

- 1px solid, dark purple-grey (`#1e1e2e` to `#3a3a5a`)
- Active elements: gold border (`#ffcc44`)
- Hover: blue-purple tint (`#5555aa`)
- Border-radius: 3–4px maximum. Keep corners nearly sharp.

### Backgrounds

- No gradients on panels. Flat dark fills only.
- Game viewport: deep near-black (`#07070f`) — let the 3D scene provide all depth
- Subtle `border-bottom: 1px solid` separators between sections, not shadows

---

## 3D Art Direction

### Style: "Clean Dark Fantasy"

- Models are **stylized, not realistic** — readable silhouettes at small screen sizes
- Simplified geometry (100–300 polygons per hero) but with deliberate **hero-specific shapes**
- No textures from files — all color via `MeshStandardMaterial` with roughness/metalness tuning
- **Shadows on** — soft `PCFSoftShadowMap`, single directional light top-right
- **ACES filmic tone mapping** — makes dark scenes feel cinematic without blooming out

### Hero Color Language

| Hero | Body Tone | Accent | Eyes |
|---|---|---|---|
| Lich | Bone white `#e8ddc8` | Deep purple robe | Cyan glow `#00ffcc` |
| Sniper | Warm tan `#d4a870` | Brown leather/hat | Blue `#2244aa` |
| Dragon Knight | Red-black armor | Gold trim | Amber `#ffaa22` |
| Shadow Fiend | Near-black `#140606` | Blood red | Red glow `#ff2200` |
| Windrunner | Pale `#ddc49a` | Forest green hood | Teal `#00cc88` |

### Lighting Rules

- One primary directional light: white, angle from top-right, casts shadows
- One hemisphere light: sky `#2a2a4a` / ground `#1a1208` — ambient fill, no harshness
- Per-hero accent `PointLight` on magical features (eyes, staff orbs) — low intensity, tight radius
- Night cycle (in-game): lower ambient intensity, reduce point light radius

---

## UI/UX Principles

### "Garena 2008" HUD Feel

- **Dense but readable** — Dota's original HUD put a lot on screen; don't fight that
- Information-first: every pixel earns its place (stats, cooldowns, HP bars)
- No loading spinners, no skeleton screens — just the data, immediately
- Feedback is **instant and physical**: damage floats up, skills flash, announcer text slams in

### Mobile Controls

- Virtual joystick: semi-transparent, fixed bottom-left, raw touch events
- Skill buttons: diamond layout, large enough for thumbs, gold border when active
- Cooldown: CSS `conic-gradient` radial sweep (the original Dota clock-wipe look)
- Insufficient mana: button desaturates + brief shake — not a modal, not a toast

### Minimap

- 2D canvas, top-left, always visible
- Dots only: green (ally), red (enemy), yellow (tower), white (creep)
- Fog of war: darkened fill outside vision radius
- Tap to pan camera — same behavior as the original Dota client

---

## Audio Identity

No audio files. Everything synthesized via **Web Audio API**.

| Sound | Synthesis approach |
|---|---|
| Hero attack (melee) | Short noise burst, sharp attack, fast decay |
| Hero attack (ranged) | Higher pitched click + small reverb tail |
| Frost Nova | Sine wave glissando down, reverb, cyan particle burst |
| Chain Frost bounce | Rising ping per bounce, shorter each time |
| Assassinate channel | Low hum → sharp crack on release |
| Tower attack | Metallic tick, slightly overdriven |
| Hero death | Descending minor third, slow decay |
| Last hit | Satisfying gold-coin ting (pure tone, 880Hz, short) |

No music — or optionally: a single looping ambient drone (low, slow, dark) that references the original Dota map's atmosphere.

---

## Announcer Text

Center-screen, appears and fades in 2 seconds. No voiceover — the text **is** the announcer.

| Event | Text | Color |
|---|---|---|
| First kill | `FIRST BLOOD!` | `#ff4444` |
| Double kill | `DOUBLE KILL!` | `#ff8800` |
| Tower falls | `TOWER DESTROYED` | `#ffcc44` |
| Hero respawns | `— RESPAWNED —` | `#88aaff` |
| Win | `VICTORY` | `#ffcc44`, fullscreen |
| Loss | `DEFEAT` | `#ff2222`, fullscreen |

---

## Atmosphere Notes

- **Day/night cycle**: directional light intensity oscillates every 4 minutes. Night is darker, vision shrinks. This alone creates tension.
- **Fountain**: soft blue glow near base (`PointLight 0x4488ff`), HP/mana regen when standing near it — visual and mechanical payoff
- **Trees**: instanced, dark, dense at edges. They exist to be cut through, to hide in, to feel like the original map's weight.
- **No particle spam**: effects are deliberate — 5–8 particles max, specific color per spell, fast lifetime. The screen should never feel like a fireworks show unless it's Chain Frost.

---

## What This Game Is Not

- Not a mobile gacha skin showcase
- Not a flashy 2026 hero brawler
- Not "inspired by Dota 2" — this is **Dota 1**, Warcraft III mod era, before it became a genre

The reference point is the feeling of watching someone play Lich on a CRT monitor in a Garena café while waiting your turn. That's the target.

---

*Theme authored for Crimson Lane · 2026 · personal project*
