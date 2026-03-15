# Balance — Hero stats, items, XP/gold

**Tags:** `#technical` `#mvp`

Reference for tuning. Values should match or extend `js/constants.js`, `js/heroes/*.js`, `js/items.js`.

## Combat formulas (plan §5)

- **Physical damage taken:** `damage * 100 / (100 + armor * 6)`
- **Respawn:** `5 + level * 2` seconds
- **Move speed:** clamp 100–550

## Hero stats

- Per-hero base HP, mana, armor, move speed, attack range, and primary attribute growth in `js/heroes/*.js`.
- Lich is the reference hero with full skill defs in `js/skills.js`.

## Items (13 MVP)

- 6 basic, 6 upgrade, TP Scroll. Costs and bonuses in `js/items.js`.
- Shop categories: movement, basic, mobility, offensive, defensive, consumable.

## XP / gold curves

- Creep bounties in `js/creeps.js` (goldBounty, xpBounty per creep).
- Tower/barracks/ancient rewards: to be wired; values TBD.
- Passive gold trickle: not yet implemented.

## Balance checklist

- [ ] Adjust tower count to 18 total (9 per side) if needed
- [ ] Tune creep wave timing and bounty for 10–20 min target match length
- [ ] Add passive gold and XP curve constants
