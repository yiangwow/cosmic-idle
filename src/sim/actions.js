import { D, ONE } from './bignum.js';
import { UPGRADES } from './data.js';
import { globalMultiplier } from './generators.js';

const UPGRADE_BY_ID = Object.fromEntries(UPGRADES.map(u => [u.id, u]));

export function upgradeById(id) {
  return UPGRADE_BY_ID[id];
}

export function effectiveClickPower(state) {
  let mult = ONE;
  for (const u of UPGRADES) {
    if (u.kind === 'click' && state.upgrades[u.id]) mult = mult.mul(u.effect);
  }
  return state.clickPower.mul(mult).mul(globalMultiplier(state));
}

export function click(state) {
  const gain = effectiveClickPower(state);
  state.energy = state.energy.add(gain);
  state.energyEarnedThisRun = state.energyEarnedThisRun.add(gain);
  return gain;
}

export function canAfford(state, upgrade) {
  const bal = upgrade.currency === 'stardust' ? state.stardust : state.energy;
  return bal.gte(upgrade.cost);
}

export function buyUpgrade(state, id) {
  const u = UPGRADE_BY_ID[id];
  if (!u || state.upgrades[id]) return false;
  if (!canAfford(state, u)) return false;
  if (u.currency === 'stardust') state.stardust = state.stardust.sub(u.cost);
  else state.energy = state.energy.sub(u.cost);
  state.upgrades[id] = true;
  return true;
}
