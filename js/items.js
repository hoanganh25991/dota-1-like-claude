// ============================================================
// items.js — Item system for Crimson Lane
// ============================================================

import { G } from './state.js';
import { ITEMS_DEF } from './constants.js';
import { playSFX } from './audio.js';
import { fxBlink, fxTeleport, spawnHealOrb } from './particles.js';
import { setAnim } from './animations.js';

// Base spawn positions (mirrored from combat.js to avoid circular import)
const _BASE_SPAWN = {
  sentinel: { x: 38,  y: 0, z: -38 },
  scourge:  { x: -38, y: 0, z: 38  },
};

// Distance helper (local copy to avoid circular import with combat.js)
function _dist(a, b) {
  const aPos = a?.group?.position ?? a?.position ?? a ?? { x: 0, z: 0 };
  const bPos = b?.group?.position ?? b?.position ?? b ?? { x: 0, z: 0 };
  const dx = aPos.x - bPos.x;
  const dz = aPos.z - bPos.z;
  return Math.sqrt(dx * dx + dz * dz);
}

// ── Shop commands ─────────────────────────────────────────────
export function openShop(hero) {
  G.shopOpen = true;
  window.dispatchEvent(new CustomEvent('shopOpened', { detail: { hero } }));
}

export function closeShop() {
  G.shopOpen = false;
  window.dispatchEvent(new CustomEvent('shopClosed'));
}

export function buyItem(hero, itemId) {
  const def = ITEMS_DEF[itemId];
  if (!def) {
    return { success: false, reason: 'invalid_item' };
  }

  // 1. Check gold
  if ((hero.gold ?? 0) < def.cost) {
    window.dispatchEvent(new CustomEvent('itemPurchaseFailed', {
      detail: { hero, itemId, reason: 'insufficient_gold' },
    }));
    return { success: false, reason: 'insufficient_gold' };
  }

  // 2. Check inventory space (max 6 slots)
  if (!hero.inventory) hero.inventory = [];
  if (hero.inventory.length >= 6) {
    window.dispatchEvent(new CustomEvent('itemPurchaseFailed', {
      detail: { hero, itemId, reason: 'inventory_full' },
    }));
    return { success: false, reason: 'inventory_full' };
  }

  // 3. Check if upgrade item: verify components are in inventory
  if (def.components && def.components.length > 0) {
    const inventoryIds = hero.inventory.map(i => i.id);
    const missingComponents = [];

    for (const compId of def.components) {
      const idx = inventoryIds.indexOf(compId);
      if (idx === -1) {
        missingComponents.push(compId);
      } else {
        // Mark as found (remove from search pool to avoid double-counting)
        inventoryIds[idx] = null;
      }
    }

    if (missingComponents.length > 0) {
      // Check if hero has enough gold to buy the item outright (some upgrades allow direct purchase)
      // For this implementation, require components to be present
      window.dispatchEvent(new CustomEvent('itemPurchaseFailed', {
        detail: { hero, itemId, reason: 'requirements_missing', missing: missingComponents },
      }));
      return { success: false, reason: 'requirements_missing' };
    }

    // Remove component items from inventory
    for (const compId of def.components) {
      const idx = hero.inventory.findIndex(i => i && i.id === compId);
      if (idx !== -1) {
        // Remove passive bonuses from component before swapping
        _removeItemBonuses(hero, hero.inventory[idx]);
        hero.inventory.splice(idx, 1);
      }
    }
  }

  // 4. Deduct gold atomically
  hero.gold -= def.cost;

  // 5. Add item to inventory
  const itemInstance = {
    id: def.id,
    def,
    cdRemaining: 0,
    charges: def.charges ?? (def.consumable ? 1 : undefined),
  };
  hero.inventory.push(itemInstance);

  // 6. Apply passive bonuses immediately
  _applyItemBonuses(hero, itemInstance);
  applyItemPassives(hero);
  recalcHeroStats(hero);

  // 7. Emit event
  window.dispatchEvent(new CustomEvent('itemPurchased', {
    detail: { hero, itemId, item: itemInstance },
  }));

  // 8. Play SFX
  try { playSFX('buy'); } catch (_) {}

  return { success: true, item: itemInstance };
}

export function sellItem(hero, slotIndex) {
  if (!hero.inventory || !hero.inventory[slotIndex]) return { success: false };

  const item = hero.inventory[slotIndex];
  const def  = item.def ?? ITEMS_DEF[item.id];
  if (!def) return { success: false };

  // Refund 50% of cost
  const refund = Math.floor((def.cost ?? 0) * 0.5);
  hero.gold = (hero.gold ?? 0) + refund;

  // Remove passive bonuses
  _removeItemBonuses(hero, item);
  hero.inventory.splice(slotIndex, 1);

  applyItemPassives(hero);
  recalcHeroStats(hero);

  window.dispatchEvent(new CustomEvent('itemSold', { detail: { hero, item, refund } }));
  try { playSFX('sell'); } catch (_) {}

  return { success: true, refund };
}

export function useItem(hero, slotIndex) {
  if (!hero.inventory || !hero.inventory[slotIndex]) return { success: false };

  const item = hero.inventory[slotIndex];
  const def  = item.def ?? ITEMS_DEF[item.id];
  if (!def || !def.active) return { success: false, reason: 'no_active' };

  // Check cooldown
  if ((item.cdRemaining ?? 0) > 0) return { success: false, reason: 'on_cooldown' };

  // Check mana cost
  const manaCost = def.active.manaCost ?? 0;
  if (hero.mp < manaCost) return { success: false, reason: 'no_mana' };

  hero.mp = Math.max(0, hero.mp - manaCost);

  // Execute active ability
  let result = { success: false };
  switch (def.id) {
    case 'blinkDagger':  result = _useBlink(hero, item); break;
    case 'tpScroll':     result = _useTpScroll(hero, item, slotIndex); break;
    case 'arcaneBoots':  result = _useManaRestore(hero, item); break;
    default:
      // Generic active: restore mana or heal
      if (def.active.manaRestore) {
        hero.mp = Math.min(
          hero.effectiveMaxMp ?? hero.def?.maxMp ?? 300,
          hero.mp + def.active.manaRestore
        );
        result = { success: true };
      }
      break;
  }

  if (result.success) {
    // Start cooldown
    item.cdRemaining = def.active.cooldown ?? 0;

    // Remove consumable
    if (def.consumable && def.id !== 'tpScroll') { // tpScroll removes itself on complete
      _removeItemBonuses(hero, item);
      hero.inventory.splice(slotIndex, 1);
      applyItemPassives(hero);
      recalcHeroStats(hero);
    }

    window.dispatchEvent(new CustomEvent('itemUsed', { detail: { hero, item } }));
  }

  return result;
}

// ── Bounty ────────────────────────────────────────────────────
export function grantBounty(killer, victim, type) {
  if (!killer) return;

  let gold = 0;

  switch (type) {
    case 'hero': {
      const level = victim?.level ?? 1;
      gold = 200 + level * 10;
      break;
    }
    case 'creep':
    case 'neutral': {
      const range = victim?.def?.goldBounty ?? victim?.goldBounty ?? [20, 30];
      if (Array.isArray(range)) {
        gold = Math.floor(range[0] + Math.random() * (range[1] - range[0]));
      } else {
        gold = range;
      }
      break;
    }
    case 'tower': {
      const tier = victim?.tier ?? 1;
      // Tier 1 = 150, Tier 2 = 175, Tier 3 = 200, Tier 4 = 250
      gold = 125 + tier * 25;
      break;
    }
    case 'barracks': {
      gold = 250;
      break;
    }
    default: {
      gold = 50;
      break;
    }
  }

  if (gold > 0) {
    killer.gold = (killer.gold ?? 0) + gold;
    window.dispatchEvent(new CustomEvent('goldGranted', { detail: { hero: killer, amount: gold } }));
    try { playSFX('gold'); } catch (_) {}
  }
}

// ── Apply / remove item bonuses ───────────────────────────────
function _applyItemBonuses(hero, item) {
  const def = item.def ?? ITEMS_DEF[item.id];
  if (!def || !def.bonus) return;

  const b = def.bonus;
  if (!hero._itemBonuses) hero._itemBonuses = {};

  for (const [stat, val] of Object.entries(b)) {
    hero._itemBonuses[stat] = (hero._itemBonuses[stat] ?? 0) + val;
  }
}

function _removeItemBonuses(hero, item) {
  const def = item.def ?? ITEMS_DEF[item.id];
  if (!def || !def.bonus) return;
  if (!hero._itemBonuses) return;

  const b = def.bonus;
  for (const [stat, val] of Object.entries(b)) {
    hero._itemBonuses[stat] = (hero._itemBonuses[stat] ?? 0) - val;
  }
}

export function applyItemPassives(hero) {
  if (!hero) return;

  // Reset item bonuses sum
  hero._itemBonuses = {};

  for (const item of (hero.inventory ?? [])) {
    _applyItemBonuses(hero, item);
  }

  // Recompute effective stats from base + item bonuses
  recalcHeroStats(hero);
}

// ── Stat recalculation ────────────────────────────────────────
export function recalcHeroStats(hero) {
  if (!hero || !hero.def) return;

  const def = hero.def;
  const level = hero.level ?? 1;
  const ib = hero._itemBonuses ?? {};

  // Primary attributes with level growth
  const str = (def.baseStr ?? 20) + (def.strGrow ?? 2) * (level - 1) + (ib.str ?? 0);
  const agi = (def.baseAgi ?? 20) + (def.agiGrow ?? 2) * (level - 1) + (ib.agi ?? 0);
  const int = (def.baseInt ?? 20) + (def.intGrow ?? 2) * (level - 1) + (ib.int ?? 0);

  // HP = baseHP + str * 19
  const baseHp  = def.maxHp ?? 500;
  hero.effectiveMaxHp = baseHp + str * 19 + (ib.hp ?? 0);

  // Mana = baseMana + int * 13
  const baseMp  = def.maxMp ?? 300;
  hero.effectiveMaxMp = baseMp + int * 13 + (ib.mana ?? 0);

  // Armor = baseArmor + agi * 0.14 + items
  hero.effectiveArmor = (def.armor ?? 2) + agi * 0.14 + (ib.armor ?? 0);

  // Damage = base + primary stat bonus + items
  const primaryStat = def.primaryAttr ?? 'str';
  let attrDmgBonus = 0;
  if (primaryStat === 'str') attrDmgBonus = str;
  else if (primaryStat === 'agi') attrDmgBonus = agi;
  else if (primaryStat === 'int') attrDmgBonus = int;

  hero.effectiveDamage = (def.attackDamage ?? 40) + attrDmgBonus * 0.5 + (ib.attackDamage ?? 0);

  // Attack speed multiplier based on AGI
  hero.effectiveAttackSpeedMult = 1.0 + agi * 0.01 + (ib.attackSpeed ?? 0) / 100;

  // Move speed — clamped 100-550
  hero.effectiveMoveSpeed = Math.min(550, Math.max(100,
    (def.moveSpeed ?? 295) + (ib.moveSpeed ?? 0)
  ));

  // HP/MP regen
  hero.effectiveHpRegen = (def.hpRegen ?? 1) + str * 0.03 + (ib.hpRegen ?? 0);
  hero.effectiveMpRegen = (def.mpRegen ?? 0.5) + int * 0.02 + (ib.mpRegen ?? 0);

  // Attack range (not modified by items in base, but dragonForm may change it)
  if (!hero._rangeOverride) {
    hero.effectiveAttackRange = def.attackRange ?? 2;
  }

  // Spell penetration
  hero.effectiveSpellPen = ib.spellPen ?? 0;

  // Life steal
  const lifeStealPassive = (hero.inventory ?? []).reduce((acc, item) => {
    const d = item.def ?? ITEMS_DEF[item.id];
    return acc + (d?.passive?.lifeSteal ?? 0);
  }, 0);
  hero.effectiveLifeSteal = lifeStealPassive;

  // Magic resistance (default 25%)
  hero.magicResist = 0.25;

  // Clamp current HP/MP to new max
  if (hero.hp > hero.effectiveMaxHp) hero.hp = hero.effectiveMaxHp;
  if (hero.mp > hero.effectiveMaxMp) hero.mp = hero.effectiveMaxMp;

  window.dispatchEvent(new CustomEvent('heroStatsRecalc', { detail: { hero } }));
}

// ── Item active abilities ─────────────────────────────────────
function _useBlink(hero, item) {
  const def = item.def ?? ITEMS_DEF[item.id];
  const range = (def.active?.range ?? 12);

  // Target position from G.input.pointerWorld or G.targetingSkill resolved pos
  const targetPos = G.input?.pointerWorld ?? { x: 0, z: 0 };
  const heroPos   = hero.group?.position ?? { x: 0, y: 0, z: 0 };

  const dx = targetPos.x - heroPos.x;
  const dz = (targetPos.z ?? 0) - heroPos.z;
  const dist = Math.sqrt(dx * dx + dz * dz);

  // Clamp to max range
  let blinkX = targetPos.x;
  let blinkZ = targetPos.z ?? 0;
  if (dist > range) {
    blinkX = heroPos.x + (dx / dist) * range;
    blinkZ = heroPos.z + (dz / dist) * range;
  }

  const fromPos = { x: heroPos.x, y: heroPos.y, z: heroPos.z };

  // Teleport hero
  if (hero.group) {
    hero.group.position.set(blinkX, heroPos.y, blinkZ);
  }
  if (hero.position) {
    hero.position.x = blinkX;
    hero.position.z = blinkZ;
  }

  fxBlink(fromPos, { x: blinkX, y: heroPos.y, z: blinkZ });
  try { playSFX('blink'); } catch (_) {}

  return { success: true };
}

function _useTpScroll(hero, item, _slotIndex) {
  const def = item.def ?? ITEMS_DEF[item.id];
  const channelTime = def.active?.channelTime ?? 3;

  if (hero.tpChanneling) return { success: false, reason: 'already_channeling' };

  hero.tpChanneling = true;
  setAnim(hero, 'cast');
  try { playSFX('tpChannel'); } catch (_) {}

  hero._tpTimeout = setTimeout(() => {
    if (!hero.tpChanneling) return; // was cancelled
    hero.tpChanneling = false;

    if (!hero.alive) return;

    // Teleport to friendly base fountain
    const base = _BASE_SPAWN[hero.team] ?? _BASE_SPAWN.sentinel;

    const heroPos = hero.group?.position ?? { x: 0, y: 0, z: 0 };
    fxTeleport({ x: heroPos.x, y: heroPos.y, z: heroPos.z });

    if (hero.group) {
      hero.group.position.set(base.x, base.y, base.z);
    }
    if (hero.position) {
      hero.position.x = base.x;
      hero.position.y = base.y;
      hero.position.z = base.z;
    }

    fxTeleport({ x: base.x, y: base.y, z: base.z });

    // Remove scroll
    if (hero.inventory) {
      const idx = hero.inventory.findIndex(i => i === item);
      if (idx !== -1) {
        hero.inventory.splice(idx, 1);
        applyItemPassives(hero);
      }
    }

    setAnim(hero, 'idle');
    try { playSFX('teleport'); } catch (_) {}
    window.dispatchEvent(new CustomEvent('hereTeleported', { detail: { hero } }));
  }, channelTime * 1000);

  return { success: true };
}

// Cancel TP if hero is stunned/damaged during channel
export function cancelTpScroll(hero) {
  if (!hero.tpChanneling) return;
  hero.tpChanneling = false;
  if (hero._tpTimeout) {
    clearTimeout(hero._tpTimeout);
    hero._tpTimeout = null;
  }
  setAnim(hero, 'idle');
  try { playSFX('tpCancel'); } catch (_) {}
}

function _useManaRestore(hero, item) {
  const def = item.def ?? ITEMS_DEF[item.id];
  const restore = def.active?.manaRestore ?? 135;
  const radius  = def.active?.radius ?? 12;

  // Restore mana to hero and nearby allies
  const heroPos = hero.group?.position ?? { x: 0, y: 0, z: 0 };

  const allies = G.heroes.filter(h =>
    h.alive &&
    h.team === hero.team &&
    _dist(heroPos, h.group?.position ?? h.position ?? { x: 0, z: 0 }) <= radius
  );

  for (const ally of allies) {
    const maxMp = ally.effectiveMaxMp ?? ally.def?.maxMp ?? 300;
    ally.mp = Math.min(maxMp, ally.mp + restore);
    spawnHealOrb(ally.group?.position ?? { x: 0, y: 0, z: 0 }, restore);
  }

  // Also restore to hero if not in allies list
  if (!allies.includes(hero)) {
    const maxMp = hero.effectiveMaxMp ?? hero.def?.maxMp ?? 300;
    hero.mp = Math.min(maxMp, hero.mp + restore);
    spawnHealOrb(heroPos, restore);
  }

  try { playSFX('manaRestore'); } catch (_) {}

  return { success: true };
}

// ── Item cooldown update (call per frame) ─────────────────────
export function updateItemCooldowns(hero, dt) {
  if (!hero || !hero.inventory) return;
  for (const item of hero.inventory) {
    if (item.cdRemaining > 0) {
      item.cdRemaining = Math.max(0, item.cdRemaining - dt);
    }
  }
}
