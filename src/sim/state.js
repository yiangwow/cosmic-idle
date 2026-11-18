import { D, ZERO } from './bignum.js';
import { GENERATORS } from './data.js';

export const SAVE_VERSION = 1;

export function createState() {
  const generators = {};
  for (const g of GENERATORS) generators[g.id] = 0;
  return {
    scale: 0,
    energy: ZERO,
    energyEarnedThisRun: ZERO,
    stardust: ZERO,
    clickPower: D(1),
    generators,
    upgrades: {},
    lastSaved: Date.now(),
    saveVersion: SAVE_VERSION,
  };
}
