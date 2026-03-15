# Windrunner (Hero 5)

**Dota 1 hero:** Windrunner (Night Elf · Sentinel · Agility)  
**Silhouette:** Slim female archer, hood and ponytail, longbow, green/teal colors

[← Back to Heroes](index.md)

---

## Geometry Parts

| Part | Geometry | Color | Notes |
|---|---|---|---|
| Body torso | `BoxGeometry(0.28, 0.52, 0.22)` | `#1a4a2a` forest green | Slim build, slight forward lean |
| Hips | `BoxGeometry(0.3, 0.18, 0.22)` | `#1a4a2a` | Slightly wider than torso |
| Legs ×2 | `BoxGeometry(0.11, 0.46, 0.11)` | `#0f3020` | Slim, slightly apart |
| Boots ×2 | `BoxGeometry(0.13, 0.12, 0.2)` | `#0a1e14` | Soft leather look |
| Left arm (bow arm) | `BoxGeometry(0.08, 0.44, 0.08)` | `#2d6b3a` | Extended forward |
| Right arm (draw arm) | `BoxGeometry(0.08, 0.44, 0.08)` | `#2d6b3a` | Pulled back at rest |
| Hands ×2 | `SphereGeometry(0.07)` | `#c4855a` skin | |
| Head | `SphereGeometry(0.19)` | `#c4855a` | Slightly smaller, feminine |
| Hood | `SphereGeometry(0.23, 8, 6)` | `#1a4a2a` | Partial sphere covering top/back |
| Hood point | `ConeGeometry(0.07, 0.2)` | `#1a4a2a` | Pointy top of hood |
| Ponytail | `CylinderGeometry(0.05, 0.02, 0.4)` | `#8B5e3c` brown | Hangs behind, swings in walk |
| Eyes ×2 | `SphereGeometry(0.03)` | `#00ffaa` teal | Slight emissive |
| Longbow | `TorusGeometry(0.55, 0.025, 4, 20, Math.PI)` | `#5c3a1e` | Half-circle bow, left side |
| Bow string | `Line` geometry | `#ccffcc` | Straight line across bow tips |
| Quiver | `CylinderGeometry(0.07, 0.07, 0.4)` | `#3a2010` | On back, right side |
| Arrows in quiver ×3 | `CylinderGeometry(0.01, 0.01, 0.5)` | `#c8a050` | Sticking up from quiver |
| Cloak | `BoxGeometry(0.28, 0.6, 0.04)` | `#0f3020` | Behind, slight flutter |
| Wind wisps ×4 | `SphereGeometry(0.05)` | `#88ffcc` | Float around hero, Windrun active |

## Animations

**Idle:** Ponytail swings gently. Cloak flutters (Z rotation ±2°). Wisps orbit slowly.  
**Walk:** Smooth run — legs alternate, right arm draws back slightly, cloak streams behind.  
**Attack:** Right arm pulls back (draw) → releases (forward snap) → arrow fires from bow. Duration = attack interval. At high attack speed, draw-and-release looks like rapid-fire.  
**Windrun active:** Wind wisps speed up orbit. Hero footsteps leave faint teal trail.

## Stats

```
Base HP:       492     HP/level:   +19
Base Mana:     234     Mana/level: +26
Base Armor:    1.1     Attack Range: 600
Move Speed:    295     Attack Speed: 100 (base)
Str/Agi/Int:   15/21/18 (+1.5/+2.9/+2.0 per level)
Attack damage: 36–46 (ranged physical)
```

## Skills

### Q — Shackleshot
- **Type:** Unit-target
- **Range:** 600 units
- **Mana:** 90/100/110/120 | **CD:** 15s
- **Effect:** Fires arrow at target. If target is in line with a tree or another unit → both get shackled (stun 0.75/1.5/2.25/3.0s).
- **Visual:** Arrow fires → wire/chain drawn between shackled units/tree
- **Geometry effect:** `Line` chain drawn between two targets, gold color. Both targets flash.

### W — Powershot
- **Type:** Vector-target (direction + range)
- **Range:** Up to 1700 units
- **Mana:** 90/100/110/120 | **CD:** 12s
- **Channel:** 1s charge up → releases at full charge or on re-cast
- **Damage:** 340/480/620/760 magic (decreases 10% per unit hit)
- **Visual:** Arrow glows brighter during charge. On release: giant glowing arrow pierces through line.
- **Geometry effect:** Arrow projectile 3× normal size, `CylinderGeometry(0.06, 0.01, 1.5)` scaled, bright green emissive

### E — Windrun
- **Type:** No-target, self-cast
- **Range:** Self
- **Mana:** 100 | **CD:** 15/12/9/6s | Duration: 3s
- **Effect:** +50% evasion, +50% move speed. Incoming projectiles miss.
- **Visual:** Hero surrounded by green wind spiral. Movement leaves teal afterimage trail.
- **Geometry effect:** `TorusGeometry` wind ring orbits hero horizontally. Speed of rotation = move speed. Afterimage: ghost copy of hero mesh at 20% opacity, 0.1s delayed.

### R — Focus Fire
- **Type:** Unit-target
- **Range:** 600 units (attack range)
- **CD:** 60s | Duration: 20s
- **Mana:** 200/275/350
- **Effect:** Fires at max attack speed on target (400/600/800 attack speed). Each attack -8/-4/-0% damage penalty.
- **Visual:** Hero locks on target, rapid-fire arrows. Attack animation matches ultra-high speed.
- **Geometry effect:** At 800 attack speed, full attack cycle takes ~130ms. Arrow blur trail appears.
