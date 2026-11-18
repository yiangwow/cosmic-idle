import { D } from './bignum.js';
import { advance } from './tick.js';

export const MAX_OFFLINE_SECONDS = 8 * 60 * 60; // 8 hours

export function applyOffline(state, nowMs) {
  const elapsedMs = Math.max(0, nowMs - state.lastSaved);
  const seconds = Math.min(elapsedMs / 1000, MAX_OFFLINE_SECONDS);

  if (seconds === 0) {
    return { seconds: 0, gained: D(0) };
  }

  const before = state.energy;
  advance(state, seconds);
  const gained = state.energy.sub(before);
  return { seconds, gained: D(gained) };
}
