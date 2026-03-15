# Dragon Knight (Hero 3)

**Dota 1 hero:** Dragon Knight (Human · Sentinel · Strength)  
**Silhouette:** Tall armored knight, shield + sword, dragon helmet

[← Back to Heroes](index.md)

---

## Geometry Parts

| Part | Geometry | Color | Notes |
|---|---|---|---|
| Body torso | `BoxGeometry(0.45, 0.6, 0.3)` | `#2244aa` blue armor | Broad chest |
| Shoulder pads ×2 | `BoxGeometry(0.22, 0.15, 0.22)` | `#2244aa` | Raised above shoulders |
| Shoulder studs ×2 | `SphereGeometry(0.06)` | `#ffcc00` gold | Center of each pad |
| Legs ×2 | `BoxGeometry(0.17, 0.48, 0.17)` | `#1a3388` | Armored, slightly apart |
| Boots ×2 | `BoxGeometry(0.19, 0.14, 0.22)` | `#0a1a55` dark blue | Plated |
| Helmet | `CylinderGeometry(0.2, 0.24, 0.28)` | `#2244aa` | Flat top knight helm |
| Helmet visor | `BoxGeometry(0.18, 0.08, 0.1)` | `#001133` | Narrow slit, slightly forward |
| Dragon crest | `ConeGeometry(0.05, 0.2)` | `#ffcc00` gold | Horn on top center of helm |
| Face | `BoxGeometry(0.1, 0.1, 0.08)` | `#cc8844` skin | Visible below visor |
| Shield (left arm) | `BoxGeometry(0.08, 0.55, 0.45)` | `#1a3388` | Tall kite shield |
| Shield boss | `OctahedronGeometry(0.09)` | `#ffcc00` | Center of shield |
| Dragon on shield | `BoxGeometry(0.06, 0.25, 0.22)` | `#cc2200` | Stylized dragon shape on shield |
| Sword (right arm) | `BoxGeometry(0.06, 0.7, 0.04)` | `#ccddff` silver | Long straight blade |
| Sword guard | `BoxGeometry(0.2, 0.05, 0.06)` | `#ffcc00` | Crossguard |
| Cape | `BoxGeometry(0.35, 0.7, 0.04)` | `#cc0000` red | Behind body, slight wave anim |

## Animations

**Idle:** Cape sways (Z rotation sin wave). Dragon crest glints (emissive pulse).  
**Walk:** Strong leg march, shield held steady, sword at side. Shoulders rock slightly.  
**Attack:** Sword swings horizontally (Y rotation 0→-90°→0) over attack interval.  
**Dragon Form (ult active):** Hero mesh swapped to dragon — see R skill below.  
**Cast Q (Dragon Blood passive):** Flash of red/orange glow on hit.

## Stats

```
Base HP:       625     HP/level:   +25 (Strength primary)
Base Mana:     195     Mana/level: +13
Base Armor:    3.9     Attack Range: 128 (melee)
Move Speed:    290     Attack Speed: 100 (base)
Str/Agi/Int:   21/21/14 (+2.9/+1.5/+1.5 per level)
Attack damage: 53–59
```

## Skills

### Q — Dragon Blood (Passive)
- **Type:** Passive
- **Range:** N/A (passive)
- **Effect:** +3/6/9/12 HP regen/sec, +3/4/5/6 armor
- **Visual:** Faint red shimmer pulses from hero body every 3s
- **Geometry effect:** Red `SphereGeometry` corona pulse scale 1.0→1.8→0 opacity

### W — Dragon Tail
- **Type:** Unit-target (melee)
- **Range:** 150 units
- **Mana:** 100 | **CD:** 9s
- **Effect:** Shield bash — 2/2/2/2.5s stun + 25/50/75/100 magic damage
- **Visual:** Shield slams forward, gold shockwave ring at target's feet
- **Geometry effect:** `TorusGeometry` ring (gold) pops from ground, scale 0→1.5 over 0.25s

### E — Breathe Fire
- **Type:** Point-target line AoE (cone)
- **Range:** 600 units (cone length)
- **Mana:** 100/110/120/130 | **CD:** 15/12/9/6s
- **Damage:** 75/150/225/300 magic, reduces base attack damage by 35% for 5s
- **Visual:** Fire cone sprays from hero's mouth/sword direction
- **Geometry effect:** Orange/red `ConeGeometry` particles stream forward, fade out at range

### R — Elder Dragon Form
- **Type:** Self-transform
- **Range:** Self (no cast range)
- **CD:** 100s | Duration: 60s
- **Levels:** Level 1 = Green Dragon (poison slow), Level 2 = Red Dragon (+splash), Level 3 = Blue Dragon (+frost slow)
- **Effect:** Hero transforms → dragon body. Gains ranged attack (500), +15 armor, +50 move speed
- **Dragon geometry (replaces hero):**
  - Body: `BoxGeometry(0.9, 0.45, 0.5)` scaled dragon torso
  - Neck: `CylinderGeometry(0.18, 0.22, 0.4)` forward-angled
  - Head: `BoxGeometry(0.4, 0.3, 0.5)` elongated snout
  - Wings ×2: `BoxGeometry(0.05, 0.6, 0.9)` swept back, hinge animated flap
  - Tail: chain of 4 decreasing `SphereGeometry` (0.2→0.08)
  - Color: Green/Red/Blue based on level
