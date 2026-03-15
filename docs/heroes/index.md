# 🧙 Dota 1 — 20 Hero Design Document

**Category:** Design · **Tags:** #content #heroes #skills #art

> **Roster:** 20 heroes (5 original + 15 new). All heroes are drawn using **Three.js geometry only** (no external assets).  
> Each hero has a **unique silhouette** recognizable from Dota 1.  
> Attack animation speed scales directly with attack speed stat.  
> A **Hero Review Screen** lets you preview each hero + test each skill live.

---

## 🎨 Drawing System — Three.js Geometry Parts

Each hero is an **assembled group of BoxGeometry / CylinderGeometry / SphereGeometry** meshes,
colored with `MeshLambertMaterial`. No textures — pure geometry art.

### Animation Layers (all heroes share this system)

| Layer | What animates | Driver |
|---|---|---|
| `idleAnim` | Gentle body bob up/down | `sin(time × 1.5)` |
| `walkAnim` | Leg swing alternating, arm swing | `sin(time × walkSpeed)` |
| `attackAnim` | Attack wind-up → strike → return | Attack Speed stat |
| `castAnim` | Arm raise + glow | Per skill |
| `deathAnim` | Tip forward → sink into ground | On death |
| `hitAnim` | Flash white + micro-knockback | On take damage |

### Attack Speed → Animation Speed Formula
```
attackInterval (ms) = 1700 / (1 + attackSpeed / 100)
animationSpeed     = 1700 / attackInterval   // 1.0 at base, up to ~4.0
armSwingAmount     = 0.6 rad (fixed angle)
armSwingDuration   = attackInterval × 0.4    // 40% of interval = swing
```
When attack speed increases (from items/buffs), the arm swing completes faster,
making the character visually feel faster.

---

## Heroes

All 20 heroes are documented below. Each skill includes a **Range** definition (see [plan.md](../plan.md) §6 for the taxonomy). Heroes 1–5 have full geometry and skill writeups; heroes 6–20 use compact skill tables.

| # | Hero | Primary | Faction |
|---|------|---------|---------|
| 1 | [Lich](lich.md) | Intelligence | Scourge |
| 2 | [Sniper](sniper.md) | Agility | Sentinel |
| 3 | [Dragon Knight](dragon-knight.md) | Strength | Sentinel |
| 4 | [Shadow Fiend](shadow-fiend.md) | Agility | Scourge |
| 5 | [Windrunner](windrunner.md) | Agility | Sentinel |
| 6 | [Axe](axe.md) | Strength | Scourge |
| 7 | [Pudge](pudge.md) | Strength | Scourge |
| 8 | [Sven](sven.md) | Strength | Sentinel |
| 9 | [Tidehunter](tidehunter.md) | Strength | Scourge |
| 10 | [Earthshaker](earthshaker.md) | Strength | Sentinel |
| 11 | [Phantom Assassin](phantom-assassin.md) | Agility | Scourge |
| 12 | [Juggernaut](juggernaut.md) | Agility | Sentinel |
| 13 | [Drow Ranger](drow-ranger.md) | Agility | Sentinel |
| 14 | [Bounty Hunter](bounty-hunter.md) | Agility | Scourge |
| 15 | [Vengeful Spirit](vengeful-spirit.md) | Agility | Scourge |
| 16 | [Crystal Maiden](crystal-maiden.md) | Intelligence | Sentinel |
| 17 | [Zeus](zeus.md) | Intelligence | Sentinel |
| 18 | [Lina](lina.md) | Intelligence | Sentinel |
| 19 | [Lion](lion.md) | Intelligence | Sentinel |
| 20 | [Enigma](enigma.md) | Intelligence | Scourge |

---

## 🖥️ Hero Review Screen

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  HERO VIEWER              [◀ Prev Hero]  [Next Hero ▶]  │
├──────────────────────┬──────────────────────────────────┤
│                      │  Lich                            │
│   [3D Hero Canvas]   │  Intelligence · Scourge          │
│   Rotate: drag       │  ──────────────────────────────  │
│   Zoom: scroll       │  HP ████████████░░░  454         │
│                      │  Mana ████████████░░  403        │
│  [Idle] [Walk]       │  Armor  1.1 │ Range  600         │
│  [Attack] [Die]      │  Move   295 │ AS     100         │
│                      │  ──────────────────────────────  │
│  Attack Speed: ──●── │  STR 15 (+1.75)                  │
│  (slider 50–400)     │  AGI 15 (+1.50)                  │
│                      │  INT 22 (+3.00)  ← Primary       │
│  Level: [1–25]       │  ──────────────────────────────  │
│                      │  SKILLS                          │
│                      │  [Q] [W] [E] [R]                 │
│                      │  ← tap to preview skill          │
└──────────────────────┴──────────────────────────────────┘

[Skill Preview Panel — appears below on skill tap]
┌─────────────────────────────────────────────────────────┐
│  ❄ Frost Nova                      Mana 120 │ CD 7s    │
│  Deals 300 magic dmg in 400 AoE. Slows 50%. 4s.        │
│  [Cast Preview] → shows animation on dummy target       │
└─────────────────────────────────────────────────────────┘
```

### Features
- **Hero selector:** 5 hero portrait cards at top, click to switch
- **3D viewport:** Hero rendered in Three.js, orbiting camera, auto-rotate
- **Animation buttons:** Idle / Walk / Attack / Cast Q W E R / Die
- **Attack speed slider:** 50–400 range. Hero attack animation updates live.
- **Level selector:** 1–25 slider. Stats update in real-time. Skill levels follow.
- **Skill preview:** Tap skill button → panel shows description + plays cast animation on dummy
- **Dummy target:** Small neutral cube next to hero for skill targeting
- **Stat panel:** All base stats + growth per level, updates with level slider

---

## 📐 Shared Design Rules

### Color palette per hero
| Hero | Primary | Secondary | Accent |
|---|---|---|---|
| Lich | `#1a0a2e` | `#00ffcc` | `#6633aa` |
| Sniper | `#8B6914` | `#888888` | `#ffcc00` |
| Dragon Knight | `#2244aa` | `#ffcc00` | `#cc0000` |
| Shadow Fiend | `#0a0a0a` | `#ff2200` | `#330000` |
| Windrunner | `#1a4a2a` | `#88ffcc` | `#c4855a` |

### Geometry budget (per hero)
- Max 20–28 mesh parts per hero
- All meshes in single `THREE.Group` for transform control
- LOD: at distance > 20 units, merge to 8-part simplified version

### Team coloring
- Scourge heroes (Lich, Shadow Fiend): add subtle red point light below feet
- Sentinel heroes (Sniper, Dragon Knight, Windrunner): add subtle blue point light
- Light intensity 0.3, distance 2.0 — does not affect map lighting

---

## Implementation Notes

Each hero is implemented as `js/heroes/<id>.js` following the contract in `js/heroes/_template.js`. Use `stdMat`, `glowMat`, `metalMat`, `transMat` from `../hero-models.js`. Stats use in-game scale: `range` in world units (melee ~2.5–3, ranged 10–14), `move` ~7–9, `hp`/`mp` in hundreds.

**Skill range convention:** Every skill has a **Range** line. Values: `N/A (passive)`, `Self`, `XXX units`, `global` (Zeus R), or `Self (effect radius XXX)` for self-centered AoE.

*Skill range taxonomy and per-hero specs are defined in [plan.md](../plan.md) §6. Hero modules in `js/heroes/` should align `castRange`/`castRangeByLevel` with these values.*
