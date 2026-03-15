// ============================================================
// net/client.js — Client-side networking stub
// MVP: no real networking implemented.
// ============================================================

import { MSG, encode, decode } from './protocol.js';
import { sendToAll, onData } from './peer.js';

let _snapshotCallbacks = [];

/**
 * Attempt to connect to a host room.
 * MVP always resolves false (no real P2P).
 * @param {string} _roomCode
 * @returns {Promise<boolean>}
 */
export function connectToHost(_roomCode) {
  return Promise.resolve(false);
}

/**
 * Send an input command to the host.
 * @param {*} command - Input command object
 */
export function sendInput(command) {
  const raw = encode(MSG.INPUT_COMMAND, command);
  sendToAll(raw);
}

/**
 * Register a callback to receive game state snapshots from host.
 * @param {function} callback - Called with decoded snapshot payload
 */
export function onSnapshot(callback) {
  if (typeof callback !== 'function') return;
  _snapshotCallbacks.push(callback);

  // Wire into peer data channel
  onData(raw => {
    const msg = decode(raw);
    if (msg && msg.type === MSG.STATE_SNAPSHOT) {
      callback(msg.payload);
    }
  });
}

/**
 * Disconnect from the host and clean up.
 */
export function disconnect() {
  _snapshotCallbacks = [];
}
