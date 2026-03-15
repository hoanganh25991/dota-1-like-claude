# Shadow Fiend (Hero 4)

**Dota 1 hero:** Shadow Fiend (Undead · Scourge · Agility)  
**Silhouette:** Winged demon, hunched, two curved blades, glowing red eyes

[← Back to Heroes](index.md)

---

## Geometry Parts

| Part | Geometry | Color | Notes |
|---|---|---|---|
| Body torso | `BoxGeometry(0.35, 0.55, 0.28)` | `#0a0a0a` near-black | Thin, hunched forward 10° |
| Head | `SphereGeometry(0.2)` | `#111111` | Slightly forward-leaning |
| Eyes ×2 | `SphereGeometry(0.05)` | `#ff2200` red | Emissive, strong glow |
| Horn ×2 | `ConeGeometry(0.04, 0.2)` | `#330000` | Curved (approximated by rotation) |
| Left arm | `BoxGeometry(0.08, 0.42, 0.08)` | `#0a0a0a` | Slightly longer than normal |
| Right arm | `BoxGeometry(0.08, 0.42, 0.08)` | `#0a0a0a` | |
| Blade left | `BoxGeometry(0.04, 0.8, 0.06)` | `#221122` dark | Curved appearance via 2 segments |
| Blade right | `BoxGeometry(0.04, 0.8, 0.06)` | `#221122` | Mirror |
| Blade glow ×2 | `BoxGeometry(0.02, 0.75, 0.04)` | `#ff0044` | Emissive inner edge |
| Wings ×2 | `BoxGeometry(0.04, 0.8, 1.1)` | `#1a0022` | Folded at rest, open on ult |
| Wing ribs ×3 per wing | `BoxGeometry(0.03, 0.03, 0.9)` | `#2a0033` | Membrane ribs angled |
| Legs ×2 | `BoxGeometry(0.12, 0.4, 0.12)` | `#0a0a0a` | |
| Clawed feet ×2 | `BoxGeometry(0.18, 0.08, 0.22)` | `#220011` | Wide clawed stance |
| Soul orbs (×0–16) | `SphereGeometry(0.06)` | `#ff2200` | Orbit hero, count = souls |

## Animations

**Idle:** Wings twitch every 3s. Soul orbs orbit slowly around hero (sin wave height).  
**Walk:** Hunched forward glide — minimal foot movement, wings half-open.  
**Attack:** One blade slashes diagonally (arm rotates 0→-110°→0). Soul count decreases on Requiem.  
**Soul count visual:** Each soul = one red orb orbiting. 0–16 souls max. Orbs pulse faster when full.

## Stats

```
Base HP:       530     HP/level:   +19
Base Mana:     260     Mana/level: +14
Base Armor:    3.08    Attack Range: 128 (melee)
Move Speed:    305     Attack Speed: 100 (base)
Str/Agi/Int:   15/20/18 (+2.0/+2.9/+1.8 per level)
Attack damage: 51–57 + 2 per soul (Necromastery)
```

## Skills

### Q — Shadowraze (×3 variants)
- **Type:** No-target, 3 fixed-range AoEs (special: no target selection)
- **Range:** Short 200 / Medium 450 / Long 700 units (fixed distances ahead)
- **Short Raze:** 200 units ahead, Mana 75, CD 10s
- **Medium Raze:** 450 units ahead, Mana 75, CD 10s
- **Long Raze:** 700 units ahead, Mana 75, CD 10s
- **Damage:** 75/150/225/300 magic per raze. Each shares a CD independently.
- **Visual:** Black smoke eruption at the fixed distance. `CylinderGeometry` dark cloud puffs up.

### W — Necromastery (Passive)
- **Type:** Passive soul collection
- **Range:** N/A (passive)
- **Effect:** On unit kill, gain 1 soul (max 12/16/20/24). Each soul = +2 damage.
- **Visual:** Red orb flies from killed unit → orbits SF hero. Orbs glow brighter near cap.
- **Death:** SF drops 50% of souls on death.

### E — Presence of the Dark Lord (Passive Aura)
- **Type:** Passive aura, 900 radius
- **Range:** N/A (passive; aura radius 900)
- **Effect:** Reduces enemy armor by 3/4/5/6 in range
- **Visual:** Dark purple mist clouds radiate outward from SF's feet (particle drift)

### R — Requiem of Souls
- **Type:** No-target, self-centered AoE (special)
- **Range:** Self (effect radius 1000 units around caster)
- **Mana:** 150/175/200 | **CD:** 120/110/100s
- **Effect:** All stored souls (from Necromastery) fire as lines outward, then pull back.
  - Lines deal 80/120/160 × (souls/2) damage. Slow 20/30/50% on outward.
- **Visual:** Wings SPREAD FULLY open. Red soul lines explode outward in all directions, pause, pull back inward.
- **Geometry effect:**
  - Wings rotate from folded (Z=10°) to open (Z=90°) over 0.5s
  - 8–24 `Line` objects shoot outward, hang 0.3s, retract
