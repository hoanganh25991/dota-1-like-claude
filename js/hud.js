// ============================================================
// hud.js — HUD management for Crimson Lane
// Reads from G state, updates DOM every frame.
// ============================================================

import { G } from './state.js';
import { openShop, closeShop, buyItem, useItem } from './items.js';
import { castSkill, learnSkill, canLearnSkill } from './skills.js';
import { ITEMS_DEF, MAP_SIZE } from './constants.js';

// ── Internal state ────────────────────────────────────────────
let _minimapCtx      = null;
let _minimapEl       = null;
let _announcerEl     = null;
let _announcerTimer  = 0;
let _announcerActive = false;
let _idleTimer       = 0;
const IDLE_FADE_DELAY = 4.0;  // seconds
let _idleFadeEnabled  = true;

// Skill slots config
const SLOTS = ['Q', 'W', 'E', 'R'];

// Category → item IDs mapping (derived from ITEMS_DEF)
const SHOP_CATEGORIES = {
  components:  [],
  upgrades:    [],
  consumables: [],
};

// ── initHUD ───────────────────────────────────────────────────
export function initHUD() {
  _announcerEl = document.getElementById('announcer');
  _buildShopCategories();
  _initMinimap();
  _initShop();
  _wireSkillButtons();
  _wireInventory();
  _wireTopLevel();
  _wireIdleFade();
  _initMatchEnd();
}

// ── updateHUD ─────────────────────────────────────────────────
export function updateHUD(t) {
  if (!G.playerHero) return;
  _updateTopBar(t);
  _updateHeroBars();
  _updateSkillBar();
  _updateInventory();
  _updateAttackBtn();
  _updateMinimap();
  _updateAnnouncer(t);
  _processIdleFade(t);
}

// ── Top-level wiring ──────────────────────────────────────────
function _wireTopLevel() {
  // Shop button
  const shopBtn = document.getElementById('shop-button');
  if (shopBtn) {
    shopBtn.addEventListener('click', () => {
      if (G.shopOpen) { closeShop(); _hideShopPanel(); }
      else             { openShop(G.playerHero); _showShopPanel(); }
    });
    shopBtn.addEventListener('touchend', e => { e.preventDefault(); shopBtn.click(); });
  }

  // Shop panel close on Escape
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && G.shopOpen) {
      closeShop();
      _hideShopPanel();
    }
  });

  // Minimap recenter
  const recenterBtn = document.getElementById('minimap-recenter');
  if (recenterBtn) {
    recenterBtn.addEventListener('click', _recenterCamera);
    recenterBtn.addEventListener('touchend', e => { e.preventDefault(); _recenterCamera(); });
  }

  // Listen for shop events from items.js
  window.addEventListener('shopOpened', () => _showShopPanel());
  window.addEventListener('shopClosed',  () => _hideShopPanel());

  // Match end events
  window.addEventListener('matchEnd', e => {
    const result = e.detail?.result ?? 'defeat';
    showMatchEnd(result);
  });

  // Gold & item purchase feedback
  window.addEventListener('itemPurchaseFailed', e => {
    const { reason } = e.detail ?? {};
    if (reason === 'insufficient_gold') announce('Not enough gold!', '#ff4444', 1.8);
    else if (reason === 'inventory_full') announce('Inventory is full!', '#ff8800', 1.8);
    else if (reason === 'requirements_missing') announce('Missing components!', '#ff8800', 1.8);
  });

  // Settings: idle fade toggle
  const idleFadeCheck = document.getElementById('set-idle-fade');
  if (idleFadeCheck) {
    idleFadeCheck.addEventListener('change', () => {
      _idleFadeEnabled = idleFadeCheck.checked;
      if (!_idleFadeEnabled) _setHudOpacity(1);
    });
  }
}

// ── _updateTopBar ─────────────────────────────────────────────
function _updateTopBar(_t) {
  // Timer
  const secs  = Math.floor(G.time ?? 0);
  const mm    = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss    = String(secs % 60).padStart(2, '0');
  const timer = document.getElementById('match-timer');
  if (timer) timer.textContent = `${mm}:${ss}`;

  // Day/night
  const dayLabel = document.getElementById('day-night-label');
  if (dayLabel) {
    dayLabel.textContent = G.dayPhase === 'night' ? '\u{1F319} NIGHT' : '\u2600 DAY';
  }

  // Ally strip
  const allyStrip   = document.getElementById('ally-strip');
  const enemyStrip  = document.getElementById('enemy-strip');
  if (!allyStrip || !enemyStrip) return;

  const playerTeam = G.playerHero?.team ?? 'sentinel';
  const allies  = G.heroes.filter(h => h.team === playerTeam && h !== G.playerHero);
  const enemies = G.heroes.filter(h => h.team !== playerTeam);

  // Ally dots
  const allyDots = allyStrip.querySelectorAll('.team-hero-dot');
  allyDots.forEach((dot, i) => {
    const hero = allies[i];
    if (!hero) { dot.style.display = 'none'; return; }
    dot.style.display = '';
    const label = dot.querySelector('span');
    if (label) label.textContent = (hero.def?.name ?? 'Hero').charAt(0).toUpperCase();
    const bar = dot.querySelector('.hero-hp-bar');
    if (bar) {
      const maxHp = hero.effectiveMaxHp ?? hero.def?.maxHp ?? 500;
      const pct   = Math.max(0, Math.min(100, ((hero.hp ?? 0) / maxHp) * 100));
      bar.style.width = pct + '%';
      bar.style.background = hero.alive ? '#1aaa1a' : '#333';
    }
    dot.style.opacity = hero.alive ? '1' : '0.4';
    dot.title = (hero.def?.name ?? 'Hero') + ' — ' + Math.floor(hero.hp ?? 0) + ' HP';
  });

  // Enemy dots — only show if in vision
  const enemyDots = enemyStrip.querySelectorAll('.team-hero-dot');
  enemyDots.forEach((dot, i) => {
    const hero = enemies[i];
    if (!hero) { dot.style.display = 'none'; return; }
    dot.style.display = '';

    const visible = _isEnemyVisible(hero);
    const label = dot.querySelector('span');
    if (label) label.textContent = visible ? (hero.def?.name ?? 'E').charAt(0).toUpperCase() : '?';
    const bar = dot.querySelector('.hero-hp-bar');
    if (bar) {
      if (visible) {
        const maxHp = hero.effectiveMaxHp ?? hero.def?.maxHp ?? 500;
        const pct   = Math.max(0, Math.min(100, ((hero.hp ?? 0) / maxHp) * 100));
        bar.style.width  = pct + '%';
        bar.style.background = '#aa1a1a';
        bar.style.opacity = '1';
      } else {
        bar.style.width = '100%';
        bar.style.background = '#333';
      }
    }
    dot.style.opacity = hero.alive ? '1' : '0.35';
  });
}

// ── Vision helper ─────────────────────────────────────────────
function _isEnemyVisible(enemy) {
  const ePos = enemy.group?.position ?? enemy.position;
  if (!ePos) return false;

  // Check allied heroes
  for (const h of G.heroes) {
    if (!h.alive || h.team !== G.playerHero?.team) continue;
    const hPos = h.group?.position ?? h.position;
    if (!hPos) continue;
    const dx = hPos.x - ePos.x;
    const dz = hPos.z - ePos.z;
    if (Math.sqrt(dx * dx + dz * dz) <= 15) return true;
  }
  // Check allied structures
  for (const s of G.structures) {
    if (s.team !== G.playerHero?.team || !s.alive) continue;
    const sPos = s.group?.position ?? s.position;
    if (!sPos) continue;
    const dx = sPos.x - ePos.x;
    const dz = sPos.z - ePos.z;
    if (Math.sqrt(dx * dx + dz * dz) <= 12) return true;
  }
  // Check allied creeps
  for (const c of G.creeps) {
    if (!c.alive || c.team !== G.playerHero?.team) continue;
    const cPos = c.group?.position ?? c.position;
    if (!cPos) continue;
    const dx = cPos.x - ePos.x;
    const dz = cPos.z - ePos.z;
    if (Math.sqrt(dx * dx + dz * dz) <= 10) return true;
  }
  return false;
}

// ── _updateHeroBars ───────────────────────────────────────────
function _updateHeroBars() {
  const h = G.playerHero;
  if (!h) return;

  const maxHp = h.effectiveMaxHp ?? h.def?.maxHp ?? 500;
  const maxMp = h.effectiveMaxMp ?? h.def?.maxMp ?? 300;
  const hpPct = Math.max(0, Math.min(100, ((h.hp ?? 0) / maxHp) * 100));
  const mpPct = Math.max(0, Math.min(100, ((h.mp ?? 0) / maxMp) * 100));

  // XP
  const xpThresholds = [0, 200, 500, 900, 1400, 2000, 2700, 3500, 4400, 5400,
                        6500, 7700, 9000, 10400, 11900, 13500, 15200, 17000, 18900, 20900];
  const level    = Math.max(1, Math.min(25, h.level ?? 1));
  const xpNeeded = (xpThresholds[level] ?? 20900) - (xpThresholds[level - 1] ?? 0);
  const xpCurr   = Math.max(0, (h.xp ?? 0) - (xpThresholds[level - 1] ?? 0));
  const xpPct    = xpNeeded > 0 ? Math.min(100, (xpCurr / xpNeeded) * 100) : 100;

  _setBar('bar-hp', hpPct, 'bar-hp-val', `${Math.floor(h.hp ?? 0)}/${Math.floor(maxHp)}`);
  _setBar('bar-mp', mpPct, 'bar-mp-val', `${Math.floor(h.mp ?? 0)}/${Math.floor(maxMp)}`);
  _setBar('bar-xp', xpPct, 'bar-xp-val', `${Math.floor(xpCurr)}/${Math.floor(xpNeeded)}`);

  const lvEl = document.getElementById('hero-level');
  if (lvEl) lvEl.textContent = String(level);

  const goldEl = document.getElementById('hero-gold');
  if (goldEl) goldEl.textContent = '\uD83D\uDCB0 ' + Math.floor(h.gold ?? 0);

  // Skill points display
  const spEl = document.getElementById('skill-points-display');
  if (spEl) {
    const sp = h.skillPoints ?? 0;
    spEl.textContent = sp > 0 ? `+${sp}` : '';
    spEl.style.display = sp > 0 ? '' : 'none';
  }
}

function _setBar(fillId, pct, valId, text) {
  const fill = document.getElementById(fillId);
  if (fill) fill.style.width = pct.toFixed(1) + '%';
  const val = document.getElementById(valId);
  if (val) val.textContent = text;
}

// ── _updateSkillBar ───────────────────────────────────────────
function _updateSkillBar() {
  const h = G.playerHero;
  if (!h?.skills) return;

  SLOTS.forEach(slot => {
    const skill  = h.skills[slot];
    const btnEl  = document.getElementById(`skill-${slot}`);
    const cdEl   = document.getElementById(`skill-cd-${slot}`);
    const cdText = document.getElementById(`skill-cdtext-${slot}`);
    const costEl = document.getElementById(`skill-cost-${slot}`);
    const learnEl= document.getElementById(`skill-learn-${slot}`);
    if (!btnEl || !skill) return;

    const def       = skill.def ?? skill;
    const level     = skill.level ?? 0;
    const maxLevel  = slot === 'R' ? 3 : 4;
    const isPassive = def.skillType === 'passive' || def.castType === 'passive';
    const isToggle  = def.skillType === 'toggle';
    const learned   = level >= 1;

    // Passive styling
    if (isPassive) {
      btnEl.style.opacity        = learned ? '0.6' : '0.35';
      btnEl.style.pointerEvents  = 'none';
      if (costEl) { costEl.textContent = 'P'; }
      if (cdEl)   { cdEl.style.setProperty('--cd-pct', '0%'); }
      if (learnEl) learnEl.classList.add('hidden');
    } else {
      // Cooldown overlay (conic-gradient via CSS variable)
      const cdRemaining = skill.cdRemaining ?? 0;
      const lvlIdx = Math.max(0, level - 1);
      const cdTotal = Array.isArray(def.cooldownByLevel)
        ? (def.cooldownByLevel[Math.min(lvlIdx, def.cooldownByLevel.length - 1)] ?? 1)
        : (def.cooldown ?? 1);
      const cdFrac = cdTotal > 0 ? Math.max(0, Math.min(1, cdRemaining / cdTotal)) : 0;

      if (cdEl) {
        cdEl.style.setProperty('--cd-pct', (cdFrac * 100).toFixed(1) + '%');
        cdEl.style.background = cdFrac > 0
          ? `conic-gradient(rgba(0,0,0,0.7) ${cdFrac * 360}deg, transparent ${cdFrac * 360}deg)`
          : 'none';
      }
      if (cdText) {
        if (cdRemaining > 0.5) {
          cdText.textContent = cdRemaining.toFixed(1) + 's';
          cdText.classList.remove('hidden');
        } else {
          cdText.classList.add('hidden');
        }
      }

      // Mana cost label
      if (costEl) {
        if (!learned) {
          costEl.textContent = '\uD83D\uDD12'; // lock
        } else {
          const manaCost = Array.isArray(def.manaCostByLevel)
            ? (def.manaCostByLevel[Math.min(lvlIdx, def.manaCostByLevel.length - 1)] ?? 0)
            : (def.manaCost ?? 0);
          costEl.textContent = manaCost > 0 ? String(manaCost) : '\u2014';
        }
      }

      // Toggle glow
      if (isToggle && skill.active) {
        btnEl.classList.add('skill-toggled-on');
      } else {
        btnEl.classList.remove('skill-toggled-on');
      }

      btnEl.style.opacity       = learned ? '1' : '0.4';
      btnEl.style.pointerEvents = learned ? '' : 'none';
    }

    // Learn button visibility
    if (learnEl) {
      const canLearn = canLearnSkill(h, slot);
      learnEl.classList.toggle('hidden', !canLearn);
    }

    // Skill level dots (add/update level pip elements)
    let pipsEl = btnEl.querySelector('.skill-level-pips');
    if (!pipsEl) {
      pipsEl = document.createElement('div');
      pipsEl.className = 'skill-level-pips';
      pipsEl.style.cssText = 'position:absolute;bottom:2px;left:50%;transform:translateX(-50%);display:flex;gap:2px;pointer-events:none;';
      btnEl.appendChild(pipsEl);
    }
    // Rebuild pips
    pipsEl.innerHTML = '';
    for (let i = 0; i < maxLevel; i++) {
      const pip = document.createElement('span');
      pip.style.cssText = `display:inline-block;width:4px;height:4px;border-radius:50%;background:${i < level ? '#ffcc44' : '#333355'};`;
      pipsEl.appendChild(pip);
    }
  });
}

// ── _updateInventory ──────────────────────────────────────────
function _updateInventory() {
  const h = G.playerHero;
  if (!h) return;
  const slots = document.querySelectorAll('#inventory-panel .inv-slot');
  slots.forEach((slot, i) => {
    const item = h.inventory?.[i];
    if (!item) {
      slot.innerHTML = '';
      slot.style.background = '';
      slot.title = `Item slot ${i + 1}`;
      return;
    }
    const def = item.def ?? ITEMS_DEF[item.id] ?? {};
    const cd  = item.cdRemaining ?? 0;

    // Color-coded box + name label
    slot.innerHTML = `
      <span style="font-size:10px;line-height:1.1;word-break:break-word;color:#e0d8c8;">${def.name ?? item.id}</span>
      ${cd > 0.5 ? `<span style="position:absolute;top:1px;right:2px;font-size:9px;color:#ffcc44;">${cd.toFixed(1)}s</span>` : ''}
      ${def.active ? '<span style="position:absolute;bottom:1px;left:2px;font-size:8px;color:#44aaff;">ACT</span>' : ''}
    `;
    slot.style.position = 'relative';
    slot.style.background = def.active ? '#0a1a2a' : '#0d0d1a';
    slot.style.border = `1px solid ${def.components?.length > 0 ? '#5555aa' : '#3a3a5a'}`;
    slot.title = (def.name ?? item.id) + (def.cost ? ` — ${def.cost}g` : '');

    // Greyed if on cooldown
    slot.style.opacity = (cd > 0 && def.active) ? '0.55' : '1';
  });
}

// ── _updateAttackBtn ──────────────────────────────────────────
function _updateAttackBtn() {
  const h = G.playerHero;
  if (!h) return;
  const btn = document.getElementById('attack-btn');
  if (!btn) return;

  const heroPos = h.group?.position ?? h.position;
  if (!heroPos) {
    btn.style.opacity       = '0.28';
    btn.style.pointerEvents = 'none';
    return;
  }

  const range    = (h.effectiveAttackRange ?? h.def?.attackRange ?? 2) + 4;
  const allUnits = [...G.heroes, ...G.creeps, ...G.neutrals];
  let inRange    = false;

  for (const unit of allUnits) {
    if (!unit.alive || unit.team === h.team || unit === h) continue;
    const uPos = unit.group?.position ?? unit.position;
    if (!uPos) continue;
    const dx = heroPos.x - uPos.x;
    const dz = heroPos.z - uPos.z;
    if (Math.sqrt(dx * dx + dz * dz) <= range) { inRange = true; break; }
  }

  if (inRange) {
    btn.style.opacity       = '1';
    btn.style.pointerEvents = '';
    btn.classList.add('atk-pulse');
    btn.style.boxShadow = '0 0 8px rgba(220,30,30,0.85)';
  } else {
    btn.style.opacity       = '0.28';
    btn.style.pointerEvents = 'none';
    btn.classList.remove('atk-pulse');
    btn.style.boxShadow = '';
  }
}

// ── Minimap ───────────────────────────────────────────────────
function _initMinimap() {
  _minimapEl  = document.getElementById('minimap');
  if (!_minimapEl) return;
  _minimapCtx = _minimapEl.getContext('2d');

  // Click to pan camera
  _minimapEl.addEventListener('click', _onMinimapClick);
  _minimapEl.addEventListener('touchend', e => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    if (!touch) return;
    const rect = _minimapEl.getBoundingClientRect();
    _onMinimapClickAt(touch.clientX - rect.left, touch.clientY - rect.top);
  });
}

function _onMinimapClick(e) {
  const rect = _minimapEl.getBoundingClientRect();
  _onMinimapClickAt(e.clientX - rect.left, e.clientY - rect.top);
}

function _onMinimapClickAt(px, py) {
  const w = _minimapEl.width;
  const h = _minimapEl.height;
  // Map pixel → world coords
  const worldX = (px / w - 0.5) * MAP_SIZE;
  const worldZ = (py / h - 0.5) * MAP_SIZE;
  G.camTarget.x = worldX;
  G.camTarget.z = worldZ;
}

function _recenterCamera() {
  if (!G.playerHero) return;
  const pos = G.playerHero.group?.position ?? G.playerHero.position;
  if (pos) { G.camTarget.x = pos.x; G.camTarget.z = pos.z; }
}

function _updateMinimap() {
  if (!_minimapCtx || !_minimapEl) return;
  const ctx = _minimapCtx;
  const W   = _minimapEl.width;
  const H   = _minimapEl.height;

  ctx.clearRect(0, 0, W, H);

  // Background — dark green map
  ctx.fillStyle = '#0a1a0a';
  ctx.fillRect(0, 0, W, H);

  // River strip (diagonal)
  ctx.strokeStyle = '#102020';
  ctx.lineWidth   = 8;
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(W, 0);
  ctx.stroke();

  // Helper: world → minimap pixel
  function w2p(wx, wz) {
    return {
      x: ((wx / MAP_SIZE) + 0.5) * W,
      y: ((wz / MAP_SIZE) + 0.5) * H,
    };
  }

  // Structures
  for (const s of G.structures) {
    if (!s.alive && s.hp <= 0) continue;
    const sWp = s.group?.position ?? s.position;
    if (!sWp) continue;
    const p = w2p(sWp.x, sWp.z);
    ctx.beginPath();
    if (s.type === 'tower') {
      ctx.fillStyle = s.team === 'sentinel' ? '#aadd66' : '#dd6666';
      ctx.fillRect(p.x - 2.5, p.y - 2.5, 5, 5);
    } else if (s.type === 'barracks') {
      ctx.fillStyle = s.team === 'sentinel' ? '#668844' : '#884444';
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    } else if (s.type === 'ancient') {
      ctx.fillStyle = s.team === 'sentinel' ? '#44ff44' : '#ff4444';
      ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Creeps — tiny dots
  for (const c of G.creeps) {
    if (!c.alive) continue;
    const cPos = c.group?.position ?? c.position;
    if (!cPos) continue;
    const p = w2p(cPos.x, cPos.z);
    ctx.fillStyle = c.team === 'sentinel' ? '#44aa44' : '#aa4444';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Neutral creeps
  for (const n of G.neutrals ?? []) {
    if (!n.alive) continue;
    const nPos = n.group?.position ?? n.position;
    if (!nPos) continue;
    const p = w2p(nPos.x, nPos.z);
    ctx.fillStyle = '#888844';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const playerTeam = G.playerHero?.team ?? 'sentinel';

  // Allied heroes (always visible)
  for (const h of G.heroes) {
    if (!h.alive || h === G.playerHero) continue;
    if (h.team !== playerTeam) continue;
    const hPos = h.group?.position ?? h.position;
    if (!hPos) continue;
    const p = w2p(hPos.x, hPos.z);
    ctx.fillStyle = '#44ff44';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Enemy heroes (only if in vision)
  for (const h of G.heroes) {
    if (!h.alive || h.team === playerTeam) continue;
    if (!_isEnemyVisible(h)) continue;
    const hPos = h.group?.position ?? h.position;
    if (!hPos) continue;
    const p = w2p(hPos.x, hPos.z);
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Player hero — bright dot with pulsing ring
  if (G.playerHero) {
    const hPos = G.playerHero.group?.position ?? G.playerHero.position;
    if (hPos) {
      const p = w2p(hPos.x, hPos.z);
      // Pulsing ring
      const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.004);
      ctx.strokeStyle = `rgba(255,255,80,${0.4 + pulse * 0.5})`;
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4 + pulse * 2, 0, Math.PI * 2);
      ctx.stroke();
      // Dot
      ctx.fillStyle = '#ffff44';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Border
  ctx.strokeStyle = '#1a1a2a';
  ctx.lineWidth   = 2;
  ctx.strokeRect(0, 0, W, H);
}

// ── Announcer ─────────────────────────────────────────────────
export function announce(text, color = '#ffcc44', duration = 2.5) {
  G.announcerQueue.push({ text, color, duration });
}

function _updateAnnouncer(dt) {
  if (!_announcerEl) return;

  if (_announcerActive) {
    _announcerTimer -= dt;
    if (_announcerTimer <= 0) {
      // Fade out
      _announcerEl.style.opacity = '0';
      _announcerEl.style.transition = 'opacity 0.4s';
      setTimeout(() => {
        if (_announcerEl) _announcerEl.textContent = '';
        _announcerActive = false;
      }, 420);
    }
    return;
  }

  // Pop from queue
  if (G.announcerQueue.length === 0) return;
  const msg = G.announcerQueue.shift();
  if (!msg) return;

  _announcerEl.textContent    = msg.text;
  _announcerEl.style.color    = msg.color ?? '#ffcc44';
  _announcerEl.style.opacity  = '0';
  _announcerEl.style.transition = 'opacity 0.25s';

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (_announcerEl) _announcerEl.style.opacity = '1';
    });
  });

  _announcerTimer  = msg.duration ?? 2.5;
  _announcerActive = true;
}

// ── Match end ─────────────────────────────────────────────────
function _initMatchEnd() {
  const rematch  = document.getElementById('btn-rematch');
  const mainMenu = document.getElementById('btn-main-menu-end');
  if (rematch) {
    rematch.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('rematchRequested'));
    });
  }
  if (mainMenu) {
    mainMenu.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('returnToMainMenu'));
    });
  }
}

export function showMatchEnd(result) {
  const overlay = document.getElementById('match-end');
  if (!overlay) return;

  const titleEl = document.getElementById('match-result-text');
  const subEl   = document.getElementById('match-result-sub');

  if (titleEl) {
    titleEl.textContent = result === 'victory' ? 'VICTORY' : 'DEFEAT';
    titleEl.style.color = result === 'victory' ? '#44ff44' : '#ff4444';
  }

  if (subEl) {
    const playerTeam = G.playerHero?.team ?? 'sentinel';
    if (result === 'victory') {
      subEl.textContent = playerTeam === 'sentinel'
        ? 'The Sentinel has destroyed the Frozen Throne!'
        : 'The Scourge has razed the World Tree!';
    } else {
      subEl.textContent = playerTeam === 'sentinel'
        ? 'The Scourge has prevailed. The World Tree burns.'
        : 'The Sentinel stands victorious.';
    }
  }

  // Stats
  const h = G.playerHero;
  if (h) {
    const killsEl  = document.getElementById('rs-kills');
    const deathsEl = document.getElementById('rs-deaths');
    const goldEl   = document.getElementById('rs-gold');
    const timeEl   = document.getElementById('rs-time');
    if (killsEl)  killsEl.textContent  = String(h.kills  ?? 0);
    if (deathsEl) deathsEl.textContent = String(h.deaths ?? 0);
    if (goldEl)   goldEl.textContent   = String(h.totalGoldEarned ?? Math.floor(h.gold ?? 0));
    if (timeEl) {
      const secs = Math.floor(G.time ?? 0);
      timeEl.textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
    }
  }

  overlay.classList.remove('hidden');
  overlay.style.opacity    = '0';
  overlay.style.transition = 'opacity 0.8s';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    overlay.style.opacity = '1';
  }));
}

// ── Shop ──────────────────────────────────────────────────────
function _buildShopCategories() {
  SHOP_CATEGORIES.components  = [];
  SHOP_CATEGORIES.upgrades    = [];
  SHOP_CATEGORIES.consumables = [];

  for (const [id, def] of Object.entries(ITEMS_DEF)) {
    if (def.consumable) {
      SHOP_CATEGORIES.consumables.push(id);
    } else if (def.components && def.components.length > 0) {
      SHOP_CATEGORIES.upgrades.push(id);
    } else {
      SHOP_CATEGORIES.components.push(id);
    }
  }
}

let _selectedShopItem = null;

function _initShop() {
  // Category tab clicks
  const tabs = document.querySelectorAll('#shop-panel .shop-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      G.shopCategory = tab.dataset.cat ?? 'components';
      _renderShopItems(G.shopCategory);
      _selectedShopItem = null;
      _clearShopDetail();
    });
    tab.addEventListener('touchend', e => { e.preventDefault(); tab.click(); });
  });

  // Buy button
  const buyBtn = document.getElementById('shop-buy-btn');
  if (buyBtn) {
    buyBtn.addEventListener('click', () => {
      if (!_selectedShopItem || !G.playerHero) return;
      const result = buyItem(G.playerHero, _selectedShopItem);
      if (!result.success) {
        // feedback handled via event listener above
      }
    });
    buyBtn.addEventListener('touchend', e => { e.preventDefault(); buyBtn.click(); });
  }

  // Initial render
  _renderShopItems('components');
}

function _renderShopItems(category) {
  const list = document.getElementById('shop-item-list');
  if (!list) return;

  const ids = SHOP_CATEGORIES[category] ?? [];
  list.innerHTML = '';

  ids.forEach(id => {
    const def = ITEMS_DEF[id];
    if (!def) return;

    const card = document.createElement('div');
    card.className   = 'shop-item-card';
    card.dataset.id  = id;
    card.style.cssText = `
      display:flex;align-items:center;gap:6px;padding:6px 8px;
      cursor:pointer;border:1px solid #1e1e2e;border-radius:3px;
      margin-bottom:3px;background:#0d0d1a;transition:border-color 0.15s;
    `;
    card.innerHTML = `
      <span style="font-size:13px;min-width:20px;">${_itemIcon(def)}</span>
      <span style="flex:1;font-size:11px;color:#e0d8c8;">${def.name}</span>
      <span style="font-size:10px;color:#ffcc44;">${def.cost}g</span>
    `;

    card.addEventListener('click', () => {
      list.querySelectorAll('.shop-item-card').forEach(c => c.style.borderColor = '#1e1e2e');
      card.style.borderColor = '#ffcc44';
      _selectedShopItem = id;
      _showShopDetail(id, def);
    });
    card.addEventListener('touchend', e => { e.preventDefault(); card.click(); });
    card.addEventListener('mouseenter', () => { card.style.borderColor = '#5555aa'; });
    card.addEventListener('mouseleave', () => {
      card.style.borderColor = _selectedShopItem === id ? '#ffcc44' : '#1e1e2e';
    });

    list.appendChild(card);
  });
}

function _itemIcon(def) {
  if (def.consumable)           return '\uD83C\uDF9F\uFE0F';
  if (def.components?.length)   return '\u2728';
  if (def.bonus?.moveSpeed)     return '\uD83D\uDC62';
  if (def.bonus?.hp)            return '\u2764\uFE0F';
  if (def.bonus?.mana)          return '\uD83D\uDCA7';
  if (def.bonus?.attackDamage)  return '\u2694\uFE0F';
  if (def.bonus?.armor)         return '\uD83D\uDEE1\uFE0F';
  if (def.bonus?.int)           return '\u2728';
  return '\uD83E\uDDE9';
}

function _showShopDetail(_id, def) {
  const icon = document.getElementById('shop-det-icon');
  const name = document.getElementById('shop-det-name');
  const cost = document.getElementById('shop-det-cost');
  const desc = document.getElementById('shop-det-desc');
  const stats= document.getElementById('shop-det-stats');
  const btn  = document.getElementById('shop-buy-btn');

  if (icon) icon.textContent = _itemIcon(def);
  if (name) name.textContent = def.name;
  if (cost) { cost.textContent = def.cost + 'g'; cost.style.color = '#ffcc44'; }

  // Description: active/passive
  let descText = '';
  if (def.active)  descText += `Active: ${def.active.name} — ${def.active.desc ?? ''}\n`;
  if (def.passive) descText += `Passive: ${def.passive.name} — ${def.passive.desc ?? ''}\n`;
  if (def.components?.length) {
    descText += `Components: ${def.components.map(c => ITEMS_DEF[c]?.name ?? c).join(', ')}`;
  }
  if (desc) desc.textContent = descText || 'No description.';

  // Stat bonuses
  if (stats) {
    const bonuses = Object.entries(def.bonus ?? {});
    stats.innerHTML = bonuses.map(([k, v]) =>
      `<div style="font-size:10px;color:#aaccff;">+${typeof v === 'number' ? v : (v * 100).toFixed(0) + '%'} ${_statLabel(k)}</div>`
    ).join('');
  }

  // Check afford
  const canAfford = (G.playerHero?.gold ?? 0) >= def.cost;
  if (btn) {
    btn.classList.remove('hidden');
    btn.disabled = !canAfford;
    btn.style.opacity = canAfford ? '1' : '0.45';
    btn.textContent = canAfford ? 'BUY' : `Need ${def.cost - (G.playerHero?.gold ?? 0)}g more`;
  }
}

function _clearShopDetail() {
  const icon = document.getElementById('shop-det-icon');
  const name = document.getElementById('shop-det-name');
  const cost = document.getElementById('shop-det-cost');
  const desc = document.getElementById('shop-det-desc');
  const stats= document.getElementById('shop-det-stats');
  const btn  = document.getElementById('shop-buy-btn');
  if (icon) icon.textContent = '\uD83E\uDDE9';
  if (name) name.textContent = 'Select an item';
  if (cost) cost.textContent = '';
  if (desc) desc.textContent = 'Hover an item to see its details.';
  if (stats) stats.innerHTML = '';
  if (btn) btn.classList.add('hidden');
}

function _statLabel(key) {
  const map = {
    moveSpeed: 'Move Speed', hp: 'HP', mana: 'Mana', attackDamage: 'Attack Damage',
    armor: 'Armor', str: 'Strength', agi: 'Agility', int: 'Intelligence',
    hpRegen: 'HP Regen', mpRegen: 'Mana Regen', attackSpeed: 'Attack Speed',
    spellPen: 'Spell Penetration', lifeSteal: 'Life Steal',
  };
  return map[key] ?? key;
}

function _showShopPanel() {
  const panel = document.getElementById('shop-panel');
  if (panel) {
    panel.classList.remove('hidden');
    _renderShopItems(G.shopCategory ?? 'components');
    // Sync active tab
    document.querySelectorAll('#shop-panel .shop-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.cat === (G.shopCategory ?? 'components'));
    });
  }
}

function _hideShopPanel() {
  const panel = document.getElementById('shop-panel');
  if (panel) panel.classList.add('hidden');
}

// ── Skill buttons wiring ──────────────────────────────────────
let _skillButtonsWired = false;

function _wireSkillButtons() {
  if (_skillButtonsWired) return;
  _skillButtonsWired = true;

  SLOTS.forEach(slot => {
    const btnEl   = document.getElementById(`skill-${slot}`);
    const learnEl = document.getElementById(`skill-learn-${slot}`);

    if (btnEl) {
      btnEl.addEventListener('click', e => {
        if (e.target === learnEl || learnEl?.contains(e.target)) return;
        _handleSkillCast(slot);
      });
      btnEl.addEventListener('touchend', e => {
        e.preventDefault();
        if (e.target === learnEl || learnEl?.contains(e.target)) return;
        _handleSkillCast(slot);
      });
    }

    if (learnEl) {
      learnEl.addEventListener('click', e => {
        e.stopPropagation();
        if (G.playerHero) learnSkill(G.playerHero, slot);
      });
      learnEl.addEventListener('touchend', e => {
        e.preventDefault();
        e.stopPropagation();
        if (G.playerHero) learnSkill(G.playerHero, slot);
      });
    }
  });

  // Keyboard: Q/W/E/R cast; Ctrl+Q/W/E/R learn
  window.addEventListener('keydown', e => {
    if (e.repeat) return;
    const slot = e.key.toUpperCase();
    if (!SLOTS.includes(slot)) return;
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (G.playerHero) learnSkill(G.playerHero, slot);
    } else if (!_isTypingTarget(e.target)) {
      e.preventDefault();
      _handleSkillCast(slot);
    }
  });
}

function _handleSkillCast(slot) {
  const h = G.playerHero;
  if (!h) return;
  const skill = h.skills?.[slot];
  if (!skill) return;

  const def      = skill.def ?? skill;
  const castType = def.castType ?? 'self';

  if (castType === 'point' || castType === 'unit' || castType === 'direction') {
    // Need targeting — dispatch to controls
    window.dispatchEvent(new CustomEvent('enterTargetingMode', { detail: { slot } }));
  } else {
    // Self / self-radius / no-target / toggle — cast immediately
    castSkill(h, slot, 'instant', null, null);
  }
}

function _isTypingTarget(el) {
  return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
}

// ── Inventory wiring ──────────────────────────────────────────
function _wireInventory() {
  const slots = document.querySelectorAll('#inventory-panel .inv-slot');
  slots.forEach((slot, i) => {
    slot.addEventListener('click', () => {
      if (G.playerHero) useItem(G.playerHero, i);
    });
    slot.addEventListener('touchend', e => {
      e.preventDefault();
      if (G.playerHero) useItem(G.playerHero, i);
    });
  });

  // Attack button
  const atkBtn = document.getElementById('attack-btn');
  if (atkBtn) {
    atkBtn.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('attackBtnPressed'));
    });
    atkBtn.addEventListener('touchend', e => {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('attackBtnPressed'));
    });
  }
}

// ── Idle fade ─────────────────────────────────────────────────
function _wireIdleFade() {
  const resetIdle = () => { _idleTimer = 0; };
  window.addEventListener('mousemove', resetIdle, { passive: true });
  window.addEventListener('touchstart', resetIdle, { passive: true });
  window.addEventListener('keydown', resetIdle, { passive: true });
  window.addEventListener('click', resetIdle, { passive: true });
}

function _processIdleFade(dt) {
  if (!_idleFadeEnabled) return;
  _idleTimer += dt;
  const shouldFade = _idleTimer > IDLE_FADE_DELAY;
  _setHudOpacity(shouldFade ? 0.35 : 1);
}

function _setHudOpacity(opacity) {
  const fadeable = document.querySelectorAll('.idle-fadeable');
  fadeable.forEach(el => {
    el.style.transition = 'opacity 0.6s';
    el.style.opacity    = String(opacity);
  });
}
