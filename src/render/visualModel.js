import { GENERATORS } from '../sim/data.js';
import { energyPerSecond } from '../sim/generators.js';

// Core grows with log10(energy): each 10x of energy adds a fixed number of px,
// clamped to [minPx, maxPx]. Energy 0 -> minPx.
export function coreRadius(state, minPx, maxPx) {
  const e = state.energy.toNumber();
  const logE = e > 1 ? Math.log10(e) : 0; // 0 at/below 1 energy
  const grown = minPx + logE * 14;
  return Math.max(minPx, Math.min(maxPx, grown));
}

// Visible elements for one generator: sqrt of owned count so the scene fills
// quickly then saturates, hard-capped so it never overwhelms the canvas.
export function elementCount(state, genId) {
  const count = state.generators[genId] || 0;
  if (count === 0) return 0;
  return Math.min(60, Math.round(Math.sqrt(count) * 2));
}

// Overall fullness in [0,1]: normalized total holdings across all generators.
export function sceneDensity(state) {
  let total = 0;
  for (const g of GENERATORS) total += state.generators[g.id] || 0;
  return Math.min(1, total / 400);
}

// Glow/brightness in [0,1] from production rate (log-scaled).
export function intensity(state) {
  const eps = energyPerSecond(state).toNumber();
  return Math.min(1, Math.log10(eps + 10) / 12);
}
