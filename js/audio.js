// ============================================================
// audio.js — Web Audio API sound synthesis for Crimson Lane
// All SFX synthesized via WebAudio — no audio files needed.
// ============================================================

let _ctx = null;
let _sfxVolume  = 0.8;
let _musicVolume = 0.4;
let _musicNodes  = null; // { osc, gain } for ambient drone

// ── Context ───────────────────────────────────────────────────
function _getCtx() {
  if (!_ctx) {
    try {
      // @ts-ignore — webkitAudioContext for Safari legacy support
      _ctx = new (window.AudioContext || window['webkitAudioContext'])();
    } catch (_) {
      _ctx = null;
    }
  }
  return _ctx;
}

/** Resume the AudioContext after a user gesture. */
export function resumeAudio() {
  try { _getCtx()?.resume(); } catch (_) {}
}

// ── Volume controls ───────────────────────────────────────────
export function setSFXVolume(v)   { _sfxVolume   = Math.max(0, Math.min(1, v)); }
export function setMusicVolume(v) { _musicVolume = Math.max(0, Math.min(1, v));
  if (_musicNodes) _musicNodes.gain.gain.setTargetAtTime(_musicVolume * 0.15, _getCtx().currentTime, 0.1);
}

// ── Master gain helper ────────────────────────────────────────
function _masterGain(ctx, vol) {
  const g = ctx.createGain();
  g.gain.value = Math.max(0, Math.min(1, vol * _sfxVolume));
  g.connect(ctx.destination);
  return g;
}

// ── Oscillator helpers ────────────────────────────────────────
function _osc(ctx, type, freq, dest) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  o.connect(dest);
  return o;
}

function _gain(ctx, val, dest) {
  const g = ctx.createGain();
  g.gain.value = val;
  if (dest) g.connect(dest);
  return g;
}

function _bqf(ctx, type, freq, Q, dest) {
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = Q ?? 1;
  if (dest) f.connect(dest);
  return f;
}

// Convenience: create a white-noise buffer (1s mono)
function _noiseBuffer(ctx) {
  const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function _noise(ctx, dest) {
  const src = ctx.createBufferSource();
  src.buffer = _noiseBuffer(ctx);
  src.loop = true;
  src.connect(dest);
  return src;
}

// ── Synthesizers ─────────────────────────────────────────────

function _sfxHit(ctx) {
  // Melee hit: short noise burst, sharp attack, fast decay ~0.1s
  const master = _masterGain(ctx, 0.55);
  const hpf    = _bqf(ctx, 'highpass', 900, 2, master);
  const env    = _gain(ctx, 0, hpf);
  const now    = ctx.currentTime;
  env.gain.setValueAtTime(0, now);
  env.gain.linearRampToValueAtTime(0.9, now + 0.005);
  env.gain.exponentialRampToValueAtTime(0.001, now + 0.10);
  const n = _noise(ctx, env);
  n.start(now); n.stop(now + 0.12);

  // Quick thump oscillator
  const g2 = _gain(ctx, 0, master);
  g2.gain.setValueAtTime(0.5, now);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
  const o = _osc(ctx, 'sine', 180, g2);
  o.frequency.exponentialRampToValueAtTime(60, now + 0.06);
  o.start(now); o.stop(now + 0.07);
}

function _sfxRanged(ctx) {
  // Higher-pitched click + small reverb tail ~0.15s
  const master = _masterGain(ctx, 0.45);
  const bpf    = _bqf(ctx, 'bandpass', 2400, 4, master);
  const env    = _gain(ctx, 0, bpf);
  const now    = ctx.currentTime;
  env.gain.setValueAtTime(0, now);
  env.gain.linearRampToValueAtTime(0.8, now + 0.003);
  env.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
  const n = _noise(ctx, env);
  n.start(now); n.stop(now + 0.15);

  // High ping
  const g2 = _gain(ctx, 0, master);
  g2.gain.setValueAtTime(0.35, now);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  const o = _osc(ctx, 'square', 1200, g2);
  o.frequency.exponentialRampToValueAtTime(400, now + 0.12);
  o.start(now); o.stop(now + 0.13);
}

function _sfxMagic(ctx) {
  // Ethereal sine glissando ~0.3s
  const master = _masterGain(ctx, 0.5);
  const now = ctx.currentTime;

  for (let i = 0; i < 3; i++) {
    const g = _gain(ctx, 0, master);
    const startFreq = 440 + i * 180;
    const endFreq   = 880 + i * 200;
    g.gain.setValueAtTime(0, now + i * 0.06);
    g.gain.linearRampToValueAtTime(0.25, now + i * 0.06 + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.22);
    const o = _osc(ctx, 'sine', startFreq, g);
    o.frequency.setValueAtTime(startFreq, now + i * 0.06);
    o.frequency.exponentialRampToValueAtTime(endFreq, now + i * 0.06 + 0.22);
    o.start(now + i * 0.06);
    o.stop(now + i * 0.06 + 0.24);
  }
}

function _sfxDeath(ctx) {
  // Descending minor third, slow decay ~0.5s
  const master = _masterGain(ctx, 0.6);
  const now = ctx.currentTime;
  const freqs = [440, 370]; // A4 -> F#4 (minor third down)

  freqs.forEach((f, i) => {
    const g = _gain(ctx, 0, master);
    g.gain.setValueAtTime(0, now + i * 0.18);
    g.gain.linearRampToValueAtTime(0.4, now + i * 0.18 + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 0.45);
    const o = _osc(ctx, 'sawtooth', f, g);
    o.frequency.setValueAtTime(f, now + i * 0.18);
    o.frequency.exponentialRampToValueAtTime(f * 0.85, now + i * 0.18 + 0.45);
    o.start(now + i * 0.18);
    o.stop(now + i * 0.18 + 0.5);
  });

  // Low thud
  const g2 = _gain(ctx, 0, master);
  g2.gain.setValueAtTime(0.55, now);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
  const o2 = _osc(ctx, 'sine', 80, g2);
  o2.frequency.exponentialRampToValueAtTime(30, now + 0.4);
  o2.start(now); o2.stop(now + 0.45);
}

function _sfxLevelUp(ctx) {
  // Ascending arpeggio 3 tones ~0.4s
  const master = _masterGain(ctx, 0.55);
  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99]; // C5 E5 G5

  notes.forEach((f, i) => {
    const g = _gain(ctx, 0, master);
    g.gain.setValueAtTime(0, now + i * 0.10);
    g.gain.linearRampToValueAtTime(0.5, now + i * 0.10 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.10 + 0.25);
    const o = _osc(ctx, 'triangle', f, g);
    o.start(now + i * 0.10);
    o.stop(now + i * 0.10 + 0.28);
    // Harmonic
    const g2 = _gain(ctx, 0, master);
    g2.gain.setValueAtTime(0, now + i * 0.10);
    g2.gain.linearRampToValueAtTime(0.15, now + i * 0.10 + 0.02);
    g2.gain.exponentialRampToValueAtTime(0.001, now + i * 0.10 + 0.22);
    const o2 = _osc(ctx, 'sine', f * 2, g2);
    o2.start(now + i * 0.10);
    o2.stop(now + i * 0.10 + 0.25);
  });
}

function _sfxGold(ctx) {
  // Pure tone 880Hz, short ping ~0.12s
  const master = _masterGain(ctx, 0.5);
  const now = ctx.currentTime;
  const g = _gain(ctx, 0, master);
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.6, now + 0.008);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  const o = _osc(ctx, 'sine', 880, g);
  o.start(now); o.stop(now + 0.14);
  // Overtone
  const g2 = _gain(ctx, 0, master);
  g2.gain.setValueAtTime(0, now);
  g2.gain.linearRampToValueAtTime(0.2, now + 0.008);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.10);
  const o2 = _osc(ctx, 'sine', 1760, g2);
  o2.start(now); o2.stop(now + 0.11);
}

function _sfxSpawn(ctx) {
  // Rising whoosh
  const master = _masterGain(ctx, 0.5);
  const now = ctx.currentTime;
  const lpf = _bqf(ctx, 'lowpass', 800, 1, master);
  const env = _gain(ctx, 0, lpf);
  env.gain.setValueAtTime(0, now);
  env.gain.linearRampToValueAtTime(0.7, now + 0.15);
  env.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
  const n = _noise(ctx, env);
  n.start(now); n.stop(now + 0.6);

  lpf.frequency.setValueAtTime(200, now);
  lpf.frequency.exponentialRampToValueAtTime(3500, now + 0.5);

  // Rising tone
  const g2 = _gain(ctx, 0, master);
  g2.gain.setValueAtTime(0, now);
  g2.gain.linearRampToValueAtTime(0.3, now + 0.1);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  const o = _osc(ctx, 'sine', 200, g2);
  o.frequency.exponentialRampToValueAtTime(800, now + 0.5);
  o.start(now); o.stop(now + 0.55);
}

function _sfxTowerHit(ctx) {
  // Metallic tick, slightly overdriven ~0.1s
  const master = _masterGain(ctx, 0.5);
  const now = ctx.currentTime;

  // Metallic ring
  const g = _gain(ctx, 0, master);
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.7, now + 0.004);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.10);
  const o = _osc(ctx, 'square', 1800, g);
  o.frequency.setValueAtTime(1800, now);
  o.frequency.exponentialRampToValueAtTime(900, now + 0.08);
  o.start(now); o.stop(now + 0.12);

  // Noise burst
  const hpf = _bqf(ctx, 'highpass', 2000, 2, master);
  const env2 = _gain(ctx, 0, hpf);
  env2.gain.setValueAtTime(0.5, now);
  env2.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  const n = _noise(ctx, env2);
  n.start(now); n.stop(now + 0.09);
}

function _sfxTowerDeath(ctx) {
  // Low boom + reverb ~0.6s
  const master = _masterGain(ctx, 0.7);
  const now = ctx.currentTime;

  // Boom sub
  const g = _gain(ctx, 0, master);
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(1.0, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
  const o = _osc(ctx, 'sine', 120, g);
  o.frequency.setValueAtTime(120, now);
  o.frequency.exponentialRampToValueAtTime(30, now + 0.6);
  o.start(now); o.stop(now + 0.65);

  // Rubble noise
  const lpf = _bqf(ctx, 'lowpass', 1200, 1, master);
  const env2 = _gain(ctx, 0, lpf);
  env2.gain.setValueAtTime(0, now);
  env2.gain.linearRampToValueAtTime(0.8, now + 0.02);
  env2.gain.exponentialRampToValueAtTime(0.001, now + 0.58);
  const n = _noise(ctx, env2);
  n.start(now); n.stop(now + 0.6);

  // Mid crack
  const g2 = _gain(ctx, 0, master);
  g2.gain.setValueAtTime(0.6, now + 0.01);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
  const o2 = _osc(ctx, 'sawtooth', 320, g2);
  o2.frequency.exponentialRampToValueAtTime(60, now + 0.18);
  o2.start(now + 0.01); o2.stop(now + 0.2);
}

function _sfxFrost(ctx) {
  // Sine glissando down + reverb tail ~0.4s
  const master = _masterGain(ctx, 0.5);
  const now = ctx.currentTime;

  const g = _gain(ctx, 0, master);
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.5, now + 0.04);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
  const o = _osc(ctx, 'sine', 1200, g);
  o.frequency.setValueAtTime(1200, now);
  o.frequency.exponentialRampToValueAtTime(300, now + 0.38);
  o.start(now); o.stop(now + 0.4);

  // Shimmer noise (ice crystals)
  const hpf = _bqf(ctx, 'highpass', 3000, 3, master);
  const env2 = _gain(ctx, 0, hpf);
  env2.gain.setValueAtTime(0, now);
  env2.gain.linearRampToValueAtTime(0.3, now + 0.02);
  env2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  const n = _noise(ctx, env2);
  n.start(now); n.stop(now + 0.38);

  // Harmonic second
  const g2 = _gain(ctx, 0, master);
  g2.gain.setValueAtTime(0, now + 0.03);
  g2.gain.linearRampToValueAtTime(0.25, now + 0.07);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
  const o2 = _osc(ctx, 'triangle', 900, g2);
  o2.frequency.exponentialRampToValueAtTime(200, now + 0.4);
  o2.start(now + 0.03); o2.stop(now + 0.42);
}

function _sfxShrapnel(ctx) {
  // Short high-freq noise burst
  const master = _masterGain(ctx, 0.5);
  const now = ctx.currentTime;
  const hpf = _bqf(ctx, 'highpass', 4000, 2, master);
  const env = _gain(ctx, 0, hpf);
  env.gain.setValueAtTime(0, now);
  env.gain.linearRampToValueAtTime(0.8, now + 0.005);
  env.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  const n = _noise(ctx, env);
  n.start(now); n.stop(now + 0.13);

  // Metallic tick
  const g = _gain(ctx, 0, master);
  g.gain.setValueAtTime(0.5, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  const o = _osc(ctx, 'square', 2200, g);
  o.frequency.exponentialRampToValueAtTime(500, now + 0.08);
  o.start(now); o.stop(now + 0.1);
}

// Sustained assassinate channel hum — returns stop function
let _assassinateSource = null;
let _assassinateGain   = null;

function _sfxAssassinateChannel(ctx) {
  // Stop any existing channel hum
  try { _assassinateSource?.stop(); } catch (_) {}

  const master = _masterGain(ctx, 0.35);
  const now = ctx.currentTime;
  const g = _gain(ctx, 0, master);
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.6, now + 0.12);
  // Sustained — stopped by assassinateFire or explicitly

  const o = ctx.createOscillator();
  o.type = 'sawtooth';
  o.frequency.value = 120;
  o.connect(g);
  // Slight wobble
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 4;
  const lfoG = ctx.createGain();
  lfoG.gain.value = 8;
  lfo.connect(lfoG);
  lfoG.connect(o.frequency);
  lfo.start(now);
  o.start(now);

  _assassinateSource = o;
  _assassinateGain   = g;
}

function _stopAssassinateChannel() {
  if (!_assassinateSource) return;
  const ctx = _getCtx();
  if (ctx && _assassinateGain) {
    _assassinateGain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
  }
  const src = _assassinateSource;
  setTimeout(() => { try { src.stop(); } catch (_) {} }, 200);
  _assassinateSource = null;
  _assassinateGain   = null;
}

function _sfxAssassinateFire(ctx) {
  _stopAssassinateChannel();
  // Sharp crack
  const master = _masterGain(ctx, 0.65);
  const now = ctx.currentTime;

  const lpf = _bqf(ctx, 'lowpass', 3000, 1, master);
  const env = _gain(ctx, 0, lpf);
  env.gain.setValueAtTime(0, now);
  env.gain.linearRampToValueAtTime(1.0, now + 0.003);
  env.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
  const n = _noise(ctx, env);
  n.start(now); n.stop(now + 0.2);

  const g = _gain(ctx, 0, master);
  g.gain.setValueAtTime(0.7, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  const o = _osc(ctx, 'sawtooth', 600, g);
  o.frequency.exponentialRampToValueAtTime(80, now + 0.12);
  o.start(now); o.stop(now + 0.14);
}

function _sfxFire(ctx) {
  // Crackling noise
  const master = _masterGain(ctx, 0.45);
  const now = ctx.currentTime;
  const lpf = _bqf(ctx, 'bandpass', 800, 0.8, master);
  const env = _gain(ctx, 0, lpf);
  env.gain.setValueAtTime(0, now);
  env.gain.linearRampToValueAtTime(0.9, now + 0.04);
  env.gain.setValueAtTime(0.9, now + 0.18);
  env.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
  const n = _noise(ctx, env);
  n.start(now); n.stop(now + 0.48);

  // Crackle overlay (fast amplitude modulation)
  const crackleG = _gain(ctx, 0, master);
  crackleG.gain.setValueAtTime(0, now);
  crackleG.gain.linearRampToValueAtTime(0.4, now + 0.05);
  crackleG.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  const hpf = _bqf(ctx, 'highpass', 2500, 1, crackleG);
  const n2 = _noise(ctx, hpf);
  n2.start(now); n2.stop(now + 0.38);
}

function _sfxWindrun(ctx) {
  // Airy whoosh
  const master = _masterGain(ctx, 0.45);
  const now = ctx.currentTime;
  const bpf = _bqf(ctx, 'bandpass', 600, 0.5, master);
  const env = _gain(ctx, 0, bpf);
  env.gain.setValueAtTime(0, now);
  env.gain.linearRampToValueAtTime(0.8, now + 0.08);
  env.gain.setValueAtTime(0.8, now + 0.22);
  env.gain.exponentialRampToValueAtTime(0.001, now + 0.52);
  const n = _noise(ctx, env);
  n.start(now); n.stop(now + 0.55);

  bpf.frequency.setValueAtTime(300, now);
  bpf.frequency.exponentialRampToValueAtTime(1800, now + 0.3);
  bpf.frequency.exponentialRampToValueAtTime(600, now + 0.52);

  // Subtle tone flutter
  const g2 = _gain(ctx, 0, master);
  g2.gain.setValueAtTime(0, now);
  g2.gain.linearRampToValueAtTime(0.12, now + 0.1);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
  const o = _osc(ctx, 'sine', 440, g2);
  o.frequency.exponentialRampToValueAtTime(880, now + 0.48);
  o.start(now); o.stop(now + 0.5);
}

function _sfxBuy(ctx) {
  // "Cha-ching" — two tones
  const master = _masterGain(ctx, 0.55);
  const now = ctx.currentTime;

  // First tone
  const g1 = _gain(ctx, 0, master);
  g1.gain.setValueAtTime(0, now);
  g1.gain.linearRampToValueAtTime(0.55, now + 0.01);
  g1.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
  const o1 = _osc(ctx, 'triangle', 1046.5, g1); // C6
  o1.start(now); o1.stop(now + 0.16);

  // Second tone (fifth up)
  const g2 = _gain(ctx, 0, master);
  g2.gain.setValueAtTime(0, now + 0.09);
  g2.gain.linearRampToValueAtTime(0.55, now + 0.10);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
  const o2 = _osc(ctx, 'triangle', 1567.98, g2); // G6
  o2.start(now + 0.09); o2.stop(now + 0.28);

  // Shimmer
  const g3 = _gain(ctx, 0, master);
  g3.gain.setValueAtTime(0, now);
  g3.gain.linearRampToValueAtTime(0.2, now + 0.02);
  g3.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
  const o3 = _osc(ctx, 'sine', 3136, g3); // G7
  o3.start(now); o3.stop(now + 0.24);
}

function _sfxTpChannel(ctx) {
  // Low resonant hum (sustained)
  const master = _masterGain(ctx, 0.4);
  const now = ctx.currentTime;

  const g = _gain(ctx, 0, master);
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.6, now + 0.15);
  g.gain.setValueAtTime(0.6, now + 0.8);
  g.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

  const o = _osc(ctx, 'sine', 110, g);
  o.start(now); o.stop(now + 1.25);

  // LFO wobble
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 6;
  const lfoG = ctx.createGain();
  lfoG.gain.value = 12;
  lfo.connect(lfoG);
  lfoG.connect(o.frequency);
  lfo.start(now); lfo.stop(now + 1.25);

  // Harmonic shimmer
  const g2 = _gain(ctx, 0, master);
  g2.gain.setValueAtTime(0, now);
  g2.gain.linearRampToValueAtTime(0.2, now + 0.2);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
  const o2 = _osc(ctx, 'triangle', 330, g2);
  o2.start(now); o2.stop(now + 1.2);
}

// Generic fallback beep
function _sfxBeep(ctx, freq = 440, dur = 0.15) {
  const master = _masterGain(ctx, 0.3);
  const now = ctx.currentTime;
  const g = _gain(ctx, 0, master);
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.5, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, now + dur);
  const o = _osc(ctx, 'sine', freq, g);
  o.start(now); o.stop(now + dur + 0.01);
}

// ── playSFX ───────────────────────────────────────────────────
/**
 * Play a named sound effect. Synthesizes on demand via Web Audio API.
 * Supported names: 'hit', 'ranged', 'magic', 'death', 'levelup', 'gold',
 *   'spawn', 'respawn', 'towerHit', 'towerDeath', 'frost', 'shrapnel',
 *   'chainFrost', 'assassinateChannel', 'assassinateFire', 'fire',
 *   'windrun', 'buy', 'tpChannel'
 */
export function playSFX(name, _volume = 1.0) {
  const ctx = _getCtx();
  if (!ctx) return;

  // Resume suspended context (mobile)
  if (ctx.state === 'suspended') { try { ctx.resume(); } catch (_) {} }

  try {
    switch (name) {
      case 'hit':
      case 'melee':
        return _sfxHit(ctx);
      case 'ranged':
      case 'arrow':
        return _sfxRanged(ctx);
      case 'magic':
      case 'spell':
      case 'frostNova':
      case 'iceArmor':
        return _sfxMagic(ctx);
      case 'death':
        return _sfxDeath(ctx);
      case 'levelup':
        return _sfxLevelUp(ctx);
      case 'gold':
        return _sfxGold(ctx);
      case 'spawn':
      case 'respawn':
        return _sfxSpawn(ctx);
      case 'towerHit':
        return _sfxTowerHit(ctx);
      case 'towerDeath':
        return _sfxTowerDeath(ctx);
      case 'frost':
      case 'chainFrost':
        return _sfxFrost(ctx);
      case 'shrapnel':
        return _sfxShrapnel(ctx);
      case 'assassinateChannel':
        return _sfxAssassinateChannel(ctx);
      case 'assassinateFire':
      case 'assassinate':
        return _sfxAssassinateFire(ctx);
      case 'fire':
      case 'breathFire':
      case 'dragonForm':
      case 'breathe':
        return _sfxFire(ctx);
      case 'windrun':
        return _sfxWindrun(ctx);
      case 'buy':
        return _sfxBuy(ctx);
      case 'tpChannel':
        return _sfxTpChannel(ctx);
      // Additional aliases used by other systems
      case 'blink':
        return _sfxMagic(ctx);
      case 'sell':
        return _sfxGold(ctx);
      case 'teleport':
        return _sfxSpawn(ctx);
      case 'tpCancel':
        return _sfxBeep(ctx, 220, 0.1);
      case 'manaRestore':
        return _sfxMagic(ctx);
      case 'sacrifice':
        return _sfxDeath(ctx);
      case 'dragonTail':
        return _sfxTowerHit(ctx);
      case 'shackleshot':
        return _sfxRanged(ctx);
      case 'powershot':
        return _sfxRanged(ctx);
      case 'focusFire':
        return _sfxWindrun(ctx);
      case 'shadowraze':
        return _sfxFire(ctx);
      case 'requiem':
        return _sfxDeath(ctx);
      default:
        // Generic fallback beep
        return _sfxBeep(ctx, 440, 0.12);
    }
  } catch (err) {
    // Audio errors are non-critical; silently swallow
    try { _sfxBeep(ctx, 440, 0.1); } catch (_) {}
  }
}

// ── Ambient music ─────────────────────────────────────────────

let _musicCtx   = null;

export function playMusic() {
  const ctx = _getCtx();
  if (!ctx || _musicNodes) return;

  const masterG = ctx.createGain();
  masterG.gain.value = 0;
  masterG.connect(ctx.destination);

  // Slowly fade in
  masterG.gain.setValueAtTime(0, ctx.currentTime);
  masterG.gain.linearRampToValueAtTime(_musicVolume * 0.15, ctx.currentTime + 3.0);

  // Drone: two detuned oscillators
  const droneFreqs = [55, 55.5, 82.5, 110];
  const oscs = droneFreqs.map((f, i) => {
    const g = ctx.createGain();
    g.gain.value = 0.18 - i * 0.03;
    g.connect(masterG);
    const o = ctx.createOscillator();
    o.type = i < 2 ? 'sawtooth' : 'sine';
    o.frequency.value = f;
    o.connect(g);
    o.start();
    return { osc: o, gain: g };
  });

  // Slow LFO amplitude modulation for breathing effect
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.08;
  const lfoG = ctx.createGain();
  lfoG.gain.value = 0.04;
  lfo.connect(lfoG);
  lfoG.connect(masterG.gain);
  lfo.start();

  _musicNodes = { oscs, masterG, lfo };
  _musicCtx   = ctx;
}

export function stopMusic() {
  if (!_musicNodes) return;
  const ctx = _musicCtx ?? _getCtx();
  if (!ctx) return;
  const { oscs, masterG, lfo } = _musicNodes;

  masterG.gain.setTargetAtTime(0, ctx.currentTime, 1.5);
  setTimeout(() => {
    try {
      oscs.forEach(({ osc }) => osc.stop());
      lfo.stop();
    } catch (_) {}
  }, 4000);
  _musicNodes = null;
}
