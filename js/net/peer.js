// ============================================================
// net/peer.js — Trystero-based peer connection stub
// MVP: no real P2P networking implemented.
// ============================================================

export let roomCode = null;
export let isHost   = false;

let _dataCallbacks = [];

export function initPeer() {
  // No-op in MVP
}

export function createRoom() {
  roomCode = 'LOCAL-' + Math.random().toString(36).slice(2, 6).toUpperCase();
  isHost   = true;
  return Promise.resolve({ roomCode });
}

export function joinRoom(code) {
  roomCode = code ?? null;
  isHost   = false;
  return Promise.resolve(null);
}

export function sendToAll(_data) {
  // No-op in MVP — no real peers to send to
}

export function onData(callback) {
  if (typeof callback === 'function') {
    _dataCallbacks.push(callback);
  }
}

export function destroy() {
  roomCode       = null;
  isHost         = false;
  _dataCallbacks = [];
}
