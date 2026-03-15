// js/heroes/registry.js — Hero registry with stats and async module loader

export const ALL_HERO_IDS = [
  'lich', 'sniper', 'dragon-knight', 'shadow-fiend', 'windrunner',
  'axe', 'pudge', 'sven', 'tidehunter', 'earthshaker',
  'phantom-assassin', 'juggernaut', 'drow-ranger', 'bounty-hunter',
  'vengeful-spirit', 'crystal-maiden', 'zeus', 'lina', 'lion', 'enigma',
];

// Full hero stat definitions (no THREE dependency — pure data)
export const HERO_DEFS = {

  'lich': {
    id: 'lich', name: 'Lich',
    primary: 'int', faction: 'scourge', attackType: 'ranged',
    str: 15, strGrow: 1.75,
    agi: 15, agiGrow: 1.5,
    int: 22, intGrow: 3.0,
    hp: 454, mp: 403,
    armor: 1.1, moveSpeed: 295,
    attackRange: 600, attackDamage: 46, baseAttackTime: 1.7,
    hpRegen: 0.5, mpRegen: 0.9,
  },

  'sniper': {
    id: 'sniper', name: 'Sniper',
    primary: 'agi', faction: 'sentinel', attackType: 'ranged',
    str: 15, strGrow: 1.7,
    agi: 21, agiGrow: 2.9,
    int: 15, intGrow: 1.5,
    hp: 435, mp: 247,
    armor: 2.3, moveSpeed: 280,
    attackRange: 1000, attackDamage: 39, baseAttackTime: 1.7,
    hpRegen: 0.5, mpRegen: 0.9,
  },

  'dragon-knight': {
    id: 'dragon-knight', name: 'Dragon Knight',
    primary: 'str', faction: 'sentinel', attackType: 'melee',
    str: 21, strGrow: 2.9,
    agi: 17, agiGrow: 1.9,
    int: 15, intGrow: 1.5,
    hp: 597, mp: 247,
    armor: 3.4, moveSpeed: 290,
    attackRange: 150, attackDamage: 55, baseAttackTime: 1.6,
    hpRegen: 1.5, mpRegen: 0.9,
  },

  'shadow-fiend': {
    id: 'shadow-fiend', name: 'Shadow Fiend',
    primary: 'agi', faction: 'scourge', attackType: 'ranged',
    str: 15, strGrow: 2.0,
    agi: 22, agiGrow: 2.9,
    int: 13, intGrow: 1.5,
    hp: 473, mp: 215,
    armor: 3.2, moveSpeed: 305,
    attackRange: 500, attackDamage: 53, baseAttackTime: 1.7,
    hpRegen: 0.5, mpRegen: 0.9,
  },

  'windrunner': {
    id: 'windrunner', name: 'Windrunner',
    primary: 'agi', faction: 'sentinel', attackType: 'ranged',
    str: 17, strGrow: 1.9,
    agi: 19, agiGrow: 2.4,
    int: 21, intGrow: 2.3,
    hp: 511, mp: 351,
    armor: 2.3, moveSpeed: 295,
    attackRange: 600, attackDamage: 49, baseAttackTime: 1.7,
    hpRegen: 0.5, mpRegen: 0.9,
  },

  'axe': {
    id: 'axe', name: 'Axe',
    primary: 'str', faction: 'scourge', attackType: 'melee',
    str: 25, strGrow: 3.0,
    agi: 20, agiGrow: 2.2,
    int: 12, intGrow: 1.2,
    hp: 700, mp: 182,
    armor: 3.0, moveSpeed: 295,
    attackRange: 150, attackDamage: 52, baseAttackTime: 1.7,
    hpRegen: 1.5, mpRegen: 0.5,
  },

  'pudge': {
    id: 'pudge', name: 'Pudge',
    primary: 'str', faction: 'scourge', attackType: 'melee',
    str: 25, strGrow: 3.2,
    agi: 14, agiGrow: 1.4,
    int: 14, intGrow: 1.4,
    hp: 700, mp: 234,
    armor: 1.0, moveSpeed: 285,
    attackRange: 150, attackDamage: 52, baseAttackTime: 1.7,
    hpRegen: 1.5, mpRegen: 0.5,
  },

  'sven': {
    id: 'sven', name: 'Sven',
    primary: 'str', faction: 'sentinel', attackType: 'melee',
    str: 23, strGrow: 2.7,
    agi: 21, agiGrow: 2.0,
    int: 14, intGrow: 1.5,
    hp: 649, mp: 234,
    armor: 3.0, moveSpeed: 295,
    attackRange: 150, attackDamage: 53, baseAttackTime: 1.7,
    hpRegen: 1.5, mpRegen: 0.5,
  },

  'tidehunter': {
    id: 'tidehunter', name: 'Tidehunter',
    primary: 'str', faction: 'scourge', attackType: 'melee',
    str: 22, strGrow: 3.0,
    agi: 15, agiGrow: 1.5,
    int: 16, intGrow: 1.7,
    hp: 622, mp: 260,
    armor: 5.0, moveSpeed: 295,
    attackRange: 150, attackDamage: 47, baseAttackTime: 1.7,
    hpRegen: 1.5, mpRegen: 0.5,
  },

  'earthshaker': {
    id: 'earthshaker', name: 'Earthshaker',
    primary: 'str', faction: 'sentinel', attackType: 'melee',
    str: 22, strGrow: 2.5,
    agi: 12, agiGrow: 1.4,
    int: 16, intGrow: 1.8,
    hp: 622, mp: 260,
    armor: 3.0, moveSpeed: 300,
    attackRange: 150, attackDamage: 52, baseAttackTime: 1.7,
    hpRegen: 1.5, mpRegen: 0.5,
  },

  'phantom-assassin': {
    id: 'phantom-assassin', name: 'Phantom Assassin',
    primary: 'agi', faction: 'scourge', attackType: 'melee',
    str: 18, strGrow: 1.85,
    agi: 23, agiGrow: 3.3,
    int: 12, intGrow: 1.3,
    hp: 511, mp: 182,
    armor: 3.0, moveSpeed: 310,
    attackRange: 150, attackDamage: 40, baseAttackTime: 1.65,
    hpRegen: 0.5, mpRegen: 0.5,
  },

  'juggernaut': {
    id: 'juggernaut', name: 'Juggernaut',
    primary: 'agi', faction: 'sentinel', attackType: 'melee',
    str: 20, strGrow: 2.0,
    agi: 24, agiGrow: 2.85,
    int: 13, intGrow: 1.35,
    hp: 568, mp: 208,
    armor: 4.0, moveSpeed: 305,
    attackRange: 150, attackDamage: 51, baseAttackTime: 1.5,
    hpRegen: 1.5, mpRegen: 0.5,
  },

  'drow-ranger': {
    id: 'drow-ranger', name: 'Drow Ranger',
    primary: 'agi', faction: 'sentinel', attackType: 'ranged',
    str: 16, strGrow: 1.9,
    agi: 22, agiGrow: 2.9,
    int: 15, intGrow: 1.4,
    hp: 454, mp: 247,
    armor: 2.0, moveSpeed: 290,
    attackRange: 625, attackDamage: 44, baseAttackTime: 1.7,
    hpRegen: 0.5, mpRegen: 0.5,
  },

  'bounty-hunter': {
    id: 'bounty-hunter', name: 'Bounty Hunter',
    primary: 'agi', faction: 'scourge', attackType: 'melee',
    str: 17, strGrow: 2.1,
    agi: 21, agiGrow: 3.0,
    int: 15, intGrow: 1.4,
    hp: 473, mp: 247,
    armor: 4.0, moveSpeed: 310,
    attackRange: 150, attackDamage: 39, baseAttackTime: 1.65,
    hpRegen: 0.5, mpRegen: 0.5,
  },

  'vengeful-spirit': {
    id: 'vengeful-spirit', name: 'Vengeful Spirit',
    primary: 'agi', faction: 'scourge', attackType: 'ranged',
    str: 18, strGrow: 2.3,
    agi: 24, agiGrow: 2.6,
    int: 21, intGrow: 1.9,
    hp: 511, mp: 351,
    armor: 4.0, moveSpeed: 285,
    attackRange: 400, attackDamage: 47, baseAttackTime: 1.7,
    hpRegen: 0.5, mpRegen: 0.9,
  },

  'crystal-maiden': {
    id: 'crystal-maiden', name: 'Crystal Maiden',
    primary: 'int', faction: 'sentinel', attackType: 'ranged',
    str: 14, strGrow: 1.7,
    agi: 14, agiGrow: 1.4,
    int: 21, intGrow: 2.9,
    hp: 416, mp: 351,
    armor: 1.0, moveSpeed: 280,
    attackRange: 600, attackDamage: 40, baseAttackTime: 1.7,
    hpRegen: 0.5, mpRegen: 0.9,
  },

  'zeus': {
    id: 'zeus', name: 'Zeus',
    primary: 'int', faction: 'sentinel', attackType: 'ranged',
    str: 19, strGrow: 2.0,
    agi: 11, agiGrow: 1.2,
    int: 22, intGrow: 2.7,
    hp: 530, mp: 371,
    armor: 1.0, moveSpeed: 295,
    attackRange: 350, attackDamage: 50, baseAttackTime: 1.7,
    hpRegen: 0.5, mpRegen: 0.9,
  },

  'lina': {
    id: 'lina', name: 'Lina',
    primary: 'int', faction: 'sentinel', attackType: 'ranged',
    str: 16, strGrow: 1.7,
    agi: 17, agiGrow: 1.7,
    int: 21, intGrow: 2.9,
    hp: 454, mp: 351,
    armor: 1.0, moveSpeed: 295,
    attackRange: 650, attackDamage: 49, baseAttackTime: 1.7,
    hpRegen: 0.5, mpRegen: 0.9,
  },

  'lion': {
    id: 'lion', name: 'Lion',
    primary: 'int', faction: 'sentinel', attackType: 'ranged',
    str: 16, strGrow: 1.7,
    agi: 15, agiGrow: 1.5,
    int: 22, intGrow: 3.1,
    hp: 454, mp: 371,
    armor: 1.0, moveSpeed: 290,
    attackRange: 600, attackDamage: 49, baseAttackTime: 1.7,
    hpRegen: 0.5, mpRegen: 0.9,
  },

  'enigma': {
    id: 'enigma', name: 'Enigma',
    primary: 'int', faction: 'scourge', attackType: 'ranged',
    str: 17, strGrow: 2.2,
    agi: 14, agiGrow: 1.1,
    int: 22, intGrow: 3.1,
    hp: 473, mp: 371,
    armor: 1.0, moveSpeed: 275,
    attackRange: 500, attackDamage: 49, baseAttackTime: 1.7,
    hpRegen: 0.5, mpRegen: 0.9,
  },

};

// Async loader — loads hero module (geometry + skills) on demand
export async function loadHeroModule(id) {
  switch (id) {
    case 'lich':              return import('./lich.js');
    case 'sniper':            return import('./sniper.js');
    case 'dragon-knight':     return import('./dragon-knight.js');
    case 'shadow-fiend':      return import('./shadow-fiend.js');
    case 'windrunner':        return import('./windrunner.js');
    case 'axe':               return import('./axe.js');
    case 'pudge':             return import('./pudge.js');
    case 'sven':              return import('./sven.js');
    case 'tidehunter':        return import('./tidehunter.js');
    case 'earthshaker':       return import('./earthshaker.js');
    case 'phantom-assassin':  return import('./phantom-assassin.js');
    case 'juggernaut':        return import('./juggernaut.js');
    case 'drow-ranger':       return import('./drow-ranger.js');
    case 'bounty-hunter':     return import('./bounty-hunter.js');
    case 'vengeful-spirit':   return import('./vengeful-spirit.js');
    case 'crystal-maiden':    return import('./crystal-maiden.js');
    case 'zeus':              return import('./zeus.js');
    case 'lina':              return import('./lina.js');
    case 'lion':              return import('./lion.js');
    case 'enigma':            return import('./enigma.js');
    default:
      throw new Error(`Unknown hero id: "${id}"`);
  }
}
