// ============================================================
// net/protocol.js — Message types for future multiplayer
// ============================================================

export const MSG = {
  HERO_PICK:       'HERO_PICK',
  MATCH_START:     'MATCH_START',
  STATE_SNAPSHOT:  'STATE_SNAPSHOT',
  INPUT_COMMAND:   'INPUT_COMMAND',
  CHAT:            'CHAT',
};

/**
 * Encode a message as a JSON string.
 * @param {string} type  - One of MSG.*
 * @param {*}      payload - Serialisable data
 * @returns {string}
 */
export function encode(type, payload) {
  return JSON.stringify({ type, payload });
}

/**
 * Decode a raw JSON string back to { type, payload }.
 * Returns null if parsing fails.
 * @param {string} raw
 * @returns {{ type: string, payload: * } | null}
 */
export function decode(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
