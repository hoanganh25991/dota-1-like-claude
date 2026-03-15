// ============================================================
// main.js — Entry point for Crimson Lane
// ============================================================

import { G, resetState } from './state.js';
import { initScene, updateCamera, setDayNight, snapCamera, scene, camera, renderer } from './scene.js';
import { buildMap } from './map.js';
import { initCreeps, updateCreeps } from './creeps.js';
import { initStructures, updateStructures } from './towers.js';
import { initHUD, updateHUD, announce, showMatchEnd } from './hud.js';
import { initControls, updateControls } from './controls.js';
import { updateCombat, SPAWN_POS } from './combat.js';
import { updateSkillCooldowns } from './skills.js';
import { updateParticles } from './particles.js';
import { animateHero } from './animations.js';
import { initBots, updateAllBots } from './ai.js';
import { initI18n, t, applyDOM, loadLocale } from './i18n.js';
import { HERO_DEFS, ALL_HERO_IDS, loadHeroModule } from './heroes/registry.js';
import { recalcHeroStats } from './items.js';

export let _animFrameId = null;
let _lastTime = 0;
let _heroViewerLoaded = false;

// ── App init ──────────────────────────────────────────────────
async function _appReady() {
  await initI18n();
  applyDOM();

  _wireMenuButtons();
  _wireSettingsTabs();
  _wireLobby();
  _wireLanguageSelector();

  // Hide loading screen
  const loading = document.getElementById('loading-screen');
  if (loading) {
    loading.style.transition = 'opacity 0.5s';
    loading.style.opacity = '0';
    setTimeout(() => loading.style.display = 'none', 500);
  }

  // Enable menu buttons (were disabled during load)
  document.querySelectorAll('#main-menu button').forEach(b => b.disabled = false);

  // Show main menu
  showScreen('main-menu');
}

// ── Screen management ─────────────────────────────────────────
export function showScreen(id) {
  const screens = ['main-menu', 'play-flow', 'settings-screen', 'lobby', 'game-screen'];
  screens.forEach(s => {
    const el = document.getElementById(s);
    if (!el) return;
    if (s === id) {
      el.classList.remove('hidden');
      el.style.display = '';
    } else {
      el.classList.add('hidden');
    }
  });
}

// ── Menu wiring ───────────────────────────────────────────────
function _wireMenuButtons() {
  // Play button → show play-flow step 1
  document.getElementById('btn-play')?.addEventListener('click', () => {
    _showPlayStep(1);
    showScreen('play-flow');
  });

  // Settings button → show settings, open Hero Viewer tab
  document.getElementById('btn-settings')?.addEventListener('click', () => {
    showScreen('settings-screen');
    _openHeroViewerTab();
  });

  // Back from settings → main menu
  document.getElementById('btn-settings-back')?.addEventListener('click', () => showScreen('main-menu'));

  // Play flow step 1: side selection
  document.querySelectorAll('.choice-btn[data-side]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.choice-btn[data-side]').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      G.playerSide = btn.dataset.side;
      const cont = document.getElementById('btn-flow-next-1');
      if (cont) cont.disabled = false;
    });
  });

  // Play flow step 1 continue
  document.getElementById('btn-flow-next-1')?.addEventListener('click', () => {
    if (!G.playerSide) return;
    _showPlayStep(2);
  });

  // Play flow back (step 1)
  document.getElementById('btn-flow-back-1')?.addEventListener('click', () => showScreen('main-menu'));

  // Play flow step 2: team size
  document.querySelectorAll('.choice-btn[data-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.choice-btn[data-mode]').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      G.teamSize = parseInt(btn.dataset.mode);
      const cont = document.getElementById('btn-flow-next-2');
      if (cont) cont.disabled = false;
    });
  });

  // Play flow step 2 continue → lobby
  document.getElementById('btn-flow-next-2')?.addEventListener('click', () => {
    if (!G.teamSize) return;
    showScreen('lobby');
    _populateLobby();
  });

  // Play flow back (step 2)
  document.getElementById('btn-flow-back-2')?.addEventListener('click', () => _showPlayStep(1));

  // Lobby back
  document.getElementById('btn-lobby-back')?.addEventListener('click', () => { showScreen('play-flow'); _showPlayStep(2); });

  // Start game from lobby
  document.getElementById('btn-lobby-start')?.addEventListener('click', () => startGame());
}

function _showPlayStep(step) {
  const s1 = document.getElementById('flow-step-1');
  const s2 = document.getElementById('flow-step-2');
  if (s1) { step === 1 ? s1.classList.remove('hidden') : s1.classList.add('hidden'); }
  if (s2) { step === 2 ? s2.classList.remove('hidden') : s2.classList.add('hidden'); }
}

function _wireSettingsTabs() {
  document.querySelectorAll('[data-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      const pane = tab.dataset.tab;
      document.querySelectorAll('[data-tab]').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('[data-pane]').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.querySelector(`[data-pane="${pane}"]`)?.classList.add('active');
      if (pane === 'hero-viewer') _openHeroViewerTab();
    });
  });
}

async function _openHeroViewerTab() {
  if (!_heroViewerLoaded) {
    const { initHeroViewer } = await import('./hero-viewer.js');
    await initHeroViewer();
    _heroViewerLoaded = true;
  }
}

function _populateLobby() {
  const grid = document.getElementById('hero-grid');
  if (!grid) return;

  const label = document.getElementById('lobby-hero-selected');
  const startBtn = document.getElementById('btn-lobby-start');

  function selectCard(card) {
    document.querySelectorAll('#hero-grid .hero-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    G.pickedHeroId = card.dataset.hero;
    if (label) label.textContent = card.querySelector('.hero-card-name')?.textContent ?? '';
    if (startBtn) startBtn.disabled = false;
  }

  // Wire existing hero cards in HTML
  grid.querySelectorAll('.hero-card').forEach(card => {
    card.addEventListener('click', () => selectCard(card));
  });

  // Auto-select first card
  const first = grid.querySelector('.hero-card');
  if (first) selectCard(first);

  // Bot difficulty dropdown
  document.getElementById('bot-difficulty')?.addEventListener('change', (e) => {
    G.botDifficulty = e.target.value;
  });
  G.botDifficulty = document.getElementById('bot-difficulty')?.value ?? 'normal';
}

function _wireLobby() {
  // Lobby back button wired via lobbyBack on window (called from HTML onclick)
  // Additional lobby wiring can go here
}

function _wireLanguageSelector() {
  document.getElementById('lang-select')?.addEventListener('change', async (e) => {
    await loadLocale(e.target.value);
  });
}

// ── Match start ───────────────────────────────────────────────
export async function startGame() {
  resetState();
  showScreen('game-screen');

  // Init Three.js
  const canvas = document.getElementById('game-canvas');
  initScene(canvas);

  // Build world
  buildMap();

  // Spawn player hero
  const heroMod = await loadHeroModule(G.pickedHeroId);
  const heroDef = HERO_DEFS[G.pickedHeroId];
  const heroGroup = heroMod.buildModel();
  scene.add(heroGroup);

  const playerSpawn = G.playerSide === 'sentinel' ? SPAWN_POS.sentinel : SPAWN_POS.scourge;
  heroGroup.position.set(playerSpawn.x, 0, playerSpawn.z);

  // Build skills from template
  const skillTemplates = heroMod.getSkillTemplates();
  const skills = {};
  for (const sk of skillTemplates) {
    skills[sk.slot] = { ...sk, level: 0, cdRemaining: 0 };
  }

  G.playerHero = {
    id: 'player_hero',
    def: heroDef,
    isPlayer: true,
    team: G.playerSide,
    group: heroGroup,
    position: heroGroup.position,
    hp: heroDef.hp, maxHp: heroDef.hp,
    mp: heroDef.mp, maxMp: heroDef.mp,
    xp: 0, level: 1,
    skillPoints: 1,
    gold: 650,
    inventory: [],
    skills,
    alive: true,
    statusEffects: [],
    moveTarget: null,
    attackTarget: null,
    lastAttackTime: 0,
  };
  recalcHeroStats(G.playerHero);
  G.heroes.push(G.playerHero);

  // Spawn bot heroes (opponents on enemy side)
  const enemySide = G.playerSide === 'sentinel' ? 'scourge' : 'sentinel';
  const enemySpawn = enemySide === 'sentinel' ? SPAWN_POS.sentinel : SPAWN_POS.scourge;
  const botCount = G.teamSize > 0 ? G.teamSize : 1;

  for (let i = 0; i < botCount; i++) {
    const botHeroId = ALL_HERO_IDS[(i + 1) % ALL_HERO_IDS.length];
    const botMod = await loadHeroModule(botHeroId);
    const botDef = HERO_DEFS[botHeroId];
    const botGroup = botMod.buildModel();
    scene.add(botGroup);
    botGroup.position.set(
      enemySpawn.x + (i - Math.floor(botCount / 2)) * 2,
      0,
      enemySpawn.z + i * 1.5
    );

    const botSkillTemplates = botMod.getSkillTemplates();
    const botSkills = {};
    for (const sk of botSkillTemplates) {
      botSkills[sk.slot] = { ...sk, level: 1, cdRemaining: 0 };
    }

    const bot = {
      id: `bot_${i}`,
      def: botDef,
      isPlayer: false,
      team: enemySide,
      group: botGroup,
      position: botGroup.position,
      hp: botDef.hp, maxHp: botDef.hp,
      mp: botDef.mp, maxMp: botDef.mp,
      xp: 0, level: 1,
      skillPoints: 0,
      gold: 650,
      inventory: [],
      skills: botSkills,
      alive: true,
      statusEffects: [],
      moveTarget: null,
      attackTarget: null,
      lastAttackTime: 0,
    };
    recalcHeroStats(bot);
    G.heroes.push(bot);
  }

  // Init structures, creeps
  initStructures();
  initCreeps();

  // Init HUD and controls
  initHUD();
  initControls(canvas);

  // Init bot AI
  initBots();

  // Snap camera to player
  snapCamera(playerSpawn);

  // Start game loop
  G.running = true;
  _lastTime = performance.now();
  _gameLoop(performance.now());
}

// ── Game loop ─────────────────────────────────────────────────
function _gameLoop(now) {
  _animFrameId = requestAnimationFrame(_gameLoop);

  const dt = Math.min((now - _lastTime) / 1000, 0.1); // cap at 100ms
  _lastTime = now;

  if (!G.running) return;

  G.time += dt;
  G.tick++;

  // Day/night cycle: 5min day, 5min night
  G.dayTimer += dt;
  const CYCLE = 300; // 5 minutes
  if (G.dayTimer >= CYCLE) {
    G.dayTimer -= CYCLE;
    G.dayPhase = G.dayPhase === 'day' ? 'night' : 'day';
    setDayNight(G.dayPhase);
    announce(
      G.dayPhase === 'night' ? t('nightFalls') : t('dayBreaks'),
      G.dayPhase === 'night' ? '#4488ff' : '#ffcc44'
    );
  }

  // Update systems
  updateCombat(dt);
  updateAllBots(dt);
  updateControls(dt);
  updateCreeps(dt, G.time);
  updateStructures(dt);

  // Animate all heroes and tick skill cooldowns
  for (const hero of G.heroes) {
    if (hero.group) {
      animateHero(hero, dt, G.time);
      updateSkillCooldowns(hero, dt);
    }
  }

  // Update particles
  updateParticles(dt);

  // Camera follow
  if (G.playerHero?.group) {
    updateCamera(G.playerHero.group.position);
  }

  // HUD
  updateHUD(G.time);

  // Check match end
  if (G.matchResult && G.running) {
    G.running = false;
    showMatchEnd(G.matchResult);
  }

  // Render
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

// Listen for match-end events
window.addEventListener('ancientDestroyed', (e) => {
  const { team } = e.detail;
  G.matchResult = team === G.playerSide ? 'defeat' : 'victory';
});

// Start the app — module scripts are deferred so DOM is already ready
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', _appReady);
} else {
  _appReady();
}
