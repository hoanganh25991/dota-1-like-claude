# Drow Ranger (Hero 13)

**Dota 1 hero:** Drow Ranger (Dark Elf · Sentinel · Agility)  
**Role:** Carry/Range

[← Back to Heroes](index.md)

---

## Silhouette

Archer, longbow, cloak, ice theme.

## Geometry

Slim torso, bow (TorusGeometry half), quiver, cloak, legs, hood. Colors: `#4466aa`, `#88aacc`, `#2a3355`.

## Stats

| Stat | Value |
|------|-------|
| HP | 530 |
| MP | 195 |
| Move | 8 |
| Range | 12 |
| Damage | 44–51 |
| Armor | 2 |
| Attack Speed | 1.0 |
| Primary | Agility |

## Skills

| Slot | Name | Type | Range | Mana | CD |
|------|------|------|-------|------|-----|
| Q | Frost Arrows | Toggle | N/A (toggle; attack range) | 8 mana per shot (when ON) | — |
| W | Gust | Point-target cone | 900 units | 90 | 13s |
| E | Precision Aura | Passive | N/A (passive; aura 900) | — | — |
| R | Marksmanship | Passive | N/A (passive) | — | — |

### Frost Arrows behavior contract

- `Q` is a toggle and does not cast a projectile by itself.
- **Enabled state:** skill button is highlighted (icy/blue "light on").
- While enabled, each successful basic attack spends **8 mana** and applies frost modifier.
- If mana is below 8 at shot time, the attack is normal and Frost Arrows toggles OFF.
