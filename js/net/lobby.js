// ============================================================
// net/lobby.js — Lobby management wrapper
// MVP: wraps peer stubs; no real networking.
// ============================================================

import { createRoom, joinRoom, roomCode } from './peer.js';

let _lobbyUpdateCallbacks = [];

/**
 * Create a new lobby as host.
 * @returns {Promise<{ roomCode: string }>}
 */
export async function createLobby() {
  const result = await createRoom();
  _notifyLobbyUpdate();
  return result;
}

/**
 * Join an existing lobby by room code.
 * @param {string} code - Room code to join
 * @returns {Promise<null>}
 */
export async function joinLobby(code) {
  const result = await joinRoom(code);
  _notifyLobbyUpdate();
  return result;
}

/**
 * Get current lobby state snapshot.
 * @returns {{ roomCode: string|null, players: Array }}
 */
export function getLobbyState() {
  return {
    roomCode,
    players: [],   // populated by real P2P layer in future
  };
}

/**
 * Register a callback that fires whenever lobby state changes.
 * @param {function} callback - Called with current lobby state
 */
export function onLobbyUpdate(callback) {
  if (typeof callback === 'function') {
    _lobbyUpdateCallbacks.push(callback);
  }
}

function _notifyLobbyUpdate() {
  const state = getLobbyState();
  for (const cb of _lobbyUpdateCallbacks) {
    try { cb(state); } catch (_) {}
  }
}
