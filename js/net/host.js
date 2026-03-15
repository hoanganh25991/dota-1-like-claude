// ============================================================
// net/host.js — Host-side networking stub
// MVP: no real networking implemented.
// ============================================================

import { MSG, encode } from './protocol.js';
import { sendToAll } from './peer.js';

let _clientJoinedCallbacks = [];

/**
 * Start hosting a lobby/game session.
 * In MVP this is a no-op; in full implementation it would
 * configure the peer to accept incoming connections.
 */
export function startHosting() {
  _clientJoinedCallbacks = [];
}

/**
 * Broadcast a game state snapshot to all connected clients.
 * @param {*} state - Serialisable snapshot of game state
 */
export function broadcastSnapshot(state) {
  const raw = encode(MSG.STATE_SNAPSHOT, state);
  sendToAll(raw);
}

/**
 * Register a callback to fire when a new client joins.
 * @param {function} callback - Called with client info object
 */
export function onClientJoined(callback) {
  if (typeof callback === 'function') {
    _clientJoinedCallbacks.push(callback);
  }
}

/**
 * Stop hosting and clean up.
 */
export function stopHosting() {
  _clientJoinedCallbacks = [];
}
