import { energyPerSecond } from './generators.js';

export const TICK_RATE = 20;
export const TICK_DT = 1 / TICK_RATE;

export function advance(state, dtSeconds) {
  const gain = energyPerSecond(state).mul(dtSeconds);
  state.energy = state.energy.add(gain);
  state.energyEarnedThisRun = state.energyEarnedThisRun.add(gain);
}
