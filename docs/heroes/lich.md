# Lich (Hero 1)

**Dota 1 hero:** Lich (Undead · Scourge · Intelligence)  
**Silhouette:** Tall robed skeleton, floating off ground, bony arms extended

[← Back to Heroes](index.md)

---

## Geometry Parts

| Part | Geometry | Color | Notes |
|---|---|---|---|
| Robe body | `CylinderGeometry(0.25, 0.45, 1.1)` | `#1a0a2e` dark purple | Wide at bottom, tapers up |
| Robe lower | `CylinderGeometry(0.45, 0.6, 0.4)` | `#1a0a2e` | Flared skirt base |
| Skull head | `SphereGeometry(0.22)` | `#e8dcc8` bone white | Slightly flattened Y |
| Jaw | `BoxGeometry(0.18, 0.07, 0.15)` | `#e8dcc8` | Offset -Y from skull center |
| Eye sockets ×2 | `SphereGeometry(0.05)` | `#00ffcc` cyan glow | Emissive material |
| Left arm | `BoxGeometry(0.07, 0.5, 0.07)` | `#c8b89a` | Angled outward 20° |
| Right arm | `BoxGeometry(0.07, 0.5, 0.07)` | `#c8b89a` | Angled outward 20° |
| Left hand | `SphereGeometry(0.07)` | `#c8b89a` | Bony fist |
| Right hand | `SphereGeometry(0.07)` | `#c8b89a` | Holds ice orb |
| Ice orb (right) | `SphereGeometry(0.1)` | `#88eeff` | Emissive, slow pulse scale |
| Staff | `CylinderGeometry(0.03, 0.03, 1.2)` | `#6633aa` | In left hand, tall |
| Staff top gem | `OctahedronGeometry(0.1)` | `#00ffcc` | Emissive top of staff |
| Shoulder spikes ×2 | `ConeGeometry(0.06, 0.22)` | `#334466` | On each shoulder |
| Float offset | — | — | Hero Y = `0.15 + sin(time×2)×0.06` hover |

## Animations

**Idle:** Gentle float oscillation on Y axis. Ice orb pulses scale 0.9→1.1.  
**Walk:** Robe sways slightly, arms drift. Legs hidden in robe — no leg anim.  
**Attack:** Right arm swings forward, ice orb launches (projectile spawns at hand). Speed: attack interval.  
**Cast Q (Frost Nova):** Both arms spread wide → cyan ring expands from body → contract.  
**Cast E (Chain Frost):** Right arm points, cyan orb fires, bounces with trail line.

## Stats

```
Base HP:       454     HP/level:   +19
Base Mana:     403     Mana/level: +26
Base Armor:    1.1     Attack Range: 600
Move Speed:    295     Attack Speed: 100 (base)
Str/Agi/Int:   15/15/22 (+1.75/+1.5/+3.0 per level)
Attack damage: 49–55 (magic staff)
```

## Skills

### Q — Frost Nova
- **Type:** Point-target AoE
- **Range:** 600 units (cast range to place AoE center)
- **Mana:** 120/130/145/160 | **CD:** 7/6/5/4s
- **Damage:** 75/150/225/300 magic (primary target: +100 bonus)
- **Slow:** 20/30/40/50% move speed, 4s duration
- **Visual:** Cyan ice ring expands 400 units from cast point. Ice shards spike up from ground at ring edge.
- **Geometry effect:** `TorusGeometry` ring scale 0→1 over 0.3s, 8 `ConeGeometry` spikes rise from ground

### W — Dark Ritual
- **Type:** Unit-target (allied non-hero unit only)
- **Range:** 400 units
- **Mana:** 25 | **CD:** 55/45/35/25s
- **Effect:** Sacrifices target creep → restores mana equal to 100/130/160/200% of creep's current HP
- **Visual:** Purple spiral rises from creep → flows into Lich. Creep fades out (scale → 0).
- **Geometry effect:** Spiral of purple `SphereGeometry` particles orbiting upward

### E — Chain Frost
- **Type:** Unit-target
- **Range:** 750 units | Bounce range: 750 units
- **Mana:** 150/175/200 | **CD:** 8s
- **Damage:** 280/370/460 magic per bounce, up to 10 bounces
- **Bounce range:** 750 units | Slow: 30%, 3s
- **Visual:** Cyan orb fires → on hit, line draws to next target and orb re-fires. Orb gets slightly larger per bounce.
- **Geometry effect:** Projectile `SphereGeometry` r=0.15, cyan emissive. `Line` drawn between bounce points.

### R — Frost Armor (Passive)
- **Type:** Passive aura (self + nearby allies within 900 units)
- **Range:** N/A (passive; aura radius 900)
- **Effect:** Adds 3/4/5/6 armor. Enemies who hit buffed unit → slowed 40% move for 3s
- **Visual:** Faint blue hexagonal sheen pulses on any unit with buff. Slow indicator: blue trail on affected enemy.
- **Geometry effect:** Subtle `IcosahedronGeometry` wireframe rotating slowly around Lich (scale 1.5)
