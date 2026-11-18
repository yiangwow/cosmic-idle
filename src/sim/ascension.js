import { D, ZERO } from './bignum.js';
import { SCALES, STARDUST_K, GENERATORS, UPGRADES } from './data.js';

export function canAscend(state) {
  if (state.scale >= SCALES.length - 1) return false;
  return state.energyEarnedThisRun.gte(SCALES[state.scale].ascendThreshold);
}

export function stardustReward(state) {
  const threshold = SCALES[state.scale].ascendThreshold;
  if (state.energyEarnedThisRun.lt(threshold)) return ZERO;
  const ratio = state.energyEarnedThisRun.div(threshold).toNumber();
  return D(Math.floor(STARDUST_K * Math.sqrt(ratio)));
}

export function ascend(state) {
  if (!canAscend(state)) return false;
  const reward = stardustReward(state);
  state.stardust = state.stardust.add(reward);
  state.scale += 1;
  state.energy = ZERO;
  state.energyEarnedThisRun = ZERO;
  for (const g of GENERATORS) state.generators[g.id] = 0;
  // Reset per-run upgrades (click, generator); keep global (stardust) upgrades.
  for (const u of UPGRADES) {
    if (u.kind !== 'global') delete state.upgrades[u.id];
  }
  return true;
}
