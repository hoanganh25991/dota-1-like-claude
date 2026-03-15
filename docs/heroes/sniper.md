# Sniper (Hero 2)

**Dota 1 hero:** Sniper (Keen · Sentinel · Agility)  
**Silhouette:** Short stout gnome, oversized rifle, wide-brimmed hat

[← Back to Heroes](index.md)

---

## Geometry Parts

| Part | Geometry | Color | Notes |
|---|---|---|---|
| Body torso | `BoxGeometry(0.38, 0.5, 0.3)` | `#8B6914` leather brown | Stocky build |
| Legs ×2 | `BoxGeometry(0.14, 0.38, 0.14)` | `#5c4a1e` | Short, wide stance |
| Boots ×2 | `BoxGeometry(0.16, 0.1, 0.2)` | `#3a2a0a` dark brown | Slightly forward offset |
| Head | `SphereGeometry(0.22)` | `#c49a5a` tan skin | Slightly squished |
| Hat brim | `CylinderGeometry(0.32, 0.34, 0.05)` | `#4a3010` | Wide flat disk on head |
| Hat crown | `CylinderGeometry(0.18, 0.2, 0.22)` | `#4a3010` | Sits on brim |
| Hat feather | `BoxGeometry(0.03, 0.18, 0.06)` | `#cc3300` red | Angled out of hat |
| Left arm | `BoxGeometry(0.1, 0.4, 0.1)` | `#8B6914` | Holds rifle front |
| Right arm | `BoxGeometry(0.1, 0.4, 0.1)` | `#8B6914` | Holds rifle grip |
| Rifle barrel | `CylinderGeometry(0.04, 0.04, 1.1)` | `#888888` gunmetal | Long, horizontal, points forward |
| Rifle stock | `BoxGeometry(0.12, 0.16, 0.38)` | `#5c3a1e` wood | Rear of rifle |
| Rifle scope | `CylinderGeometry(0.05, 0.05, 0.2)` | `#444` | On top of barrel |
| Beard | `BoxGeometry(0.14, 0.12, 0.1)` | `#cc9933` | Below chin |
| Bandolier | `BoxGeometry(0.38, 0.06, 0.08)` | `#8B0000` | Diagonal strap on chest |

## Animations

**Idle:** Slight body sway. Rifle rests diagonally. Foot tap every 2s.  
**Walk:** Leg alternation, arms locked on rifle. Waddle side-to-side (Z rotation ±3°).  
**Attack:** Rifle raises to aim (0.15s wind-up), muzzle flash (white point light blink), recoil kick-back 0.1s. Speed scales with attack speed — at 2× speed, full sequence completes in half time.  
**Cast R (Assassinate):** Hero freezes, crosshair overlay appears on screen, barrel glows, then massive flash + beam effect.

## Stats

```
Base HP:       492     HP/level:   +19
Base Mana:     195     Mana/level: +13
Base Armor:    2.08    Attack Range: 550
Move Speed:    290     Attack Speed: 100 (base)
Str/Agi/Int:   15/21/16 (+1.7/+2.9/+1.5 per level)
Attack damage: 38–44 (ranged physical)
```

## Skills

### Q — Shrapnel
- **Type:** Point-target AoE zone
- **Range:** 900 units
- **Mana:** 120 | **CD:** 22s (1 charge stored per 22s, max 2)
- **Effect:** Rains shrapnel in 350-radius zone for 9s. 15/30/45/60 DPS + 30% slow inside zone.
- **Visual:** Yellow burst on land → zone shimmers with small metal shard particles bouncing on ground.
- **Geometry effect:** Ring of `BoxGeometry(0.04, 0.04, 0.04)` particles randomly bounce inside radius

### W — Headshot (Passive)
- **Type:** Passive proc
- **Range:** N/A (passive)
- **Effect:** 40% chance on attack to deal 30/55/80/115 bonus physical damage + 0.5s mini-stun
- **Visual:** On proc → yellow star burst on target's head, brief freeze frame 0.05s
- **Geometry effect:** `StarGeometry` equivalent (IcosahedronGeometry scaled flat) flash on impact

### E — Aim (Passive)
- **Type:** Passive stat
- **Range:** N/A (passive)
- **Effect:** Increases attack range by 75/150/225/300
- **Visual:** At level 4, sniper has 850 attack range — show range circle glow on review screen
- **Indicator:** Faint gold ring at edge of attack range in review mode

### R — Assassinate
- **Type:** Unit-target (very long range)
- **Range:** 2000/2500/3000 units by level
- **Mana:** 175/250/275 | **CD:** 20s | Channel: 1.7s
- **Damage:** 355/505/655 magic + applies Headshot slow
- **Interrupt:** Channeling is interrupted by stun/silence
- **Visual:** Sniper freezes → red laser dot appears on target → beam fires (instant line from barrel to target)
- **Geometry effect:** `Line` from barrel tip to target, bright yellow, 0.15s flash. Screen vignette on caster during channel.
