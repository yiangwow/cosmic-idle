import { D, ONE } from './bignum.js';
import { GENERATORS, UPGRADES, STARDUST_BONUS_PER } from './data.js';

const GEN_BY_ID = Object.fromEntries(GENERATORS.map(g => [g.id, g]));

export function generatorCost(genId, count) {
  const g = GEN_BY_ID[genId];
  return D(g.baseCost).mul(D(g.costGrowth).pow(count));
}

export function globalMultiplier(state) {
  let mult = ONE;
  for (const u of UPGRADES) {
    if (u.kind === 'global' && state.upgrades[u.id]) mult = mult.mul(u.effect);
  }
  // Stardust passive bonus: +2% per stardust.
  mult = mult.mul(ONE.add(state.stardust.mul(STARDUST_BONUS_PER)));
  return mult;
}

function generatorUpgradeMult(state, genId) {
  let mult = ONE;
  for (const u of UPGRADES) {
    if (u.kind === 'generator' && u.target === genId && state.upgrades[u.id]) {
      mult = mult.mul(u.effect);
    }
  }
  return mult;
}

export function generatorOutput(state, genId) {
  const g = GEN_BY_ID[genId];
  const count = state.generators[genId] || 0;
  if (count === 0) return D(0);
  return D(count)
    .mul(g.baseOutput)
    .mul(generatorUpgradeMult(state, genId))
    .mul(globalMultiplier(state));
}

export function energyPerSecond(state) {
  let total = D(0);
  for (const g of GENERATORS) total = total.add(generatorOutput(state, g.id));
  return total;
}

export function buyGenerator(state, genId) {
  const count = state.generators[genId] || 0;
  const cost = generatorCost(genId, count);
  if (state.energy.lt(cost)) return false;
  state.energy = state.energy.sub(cost);
  state.generators[genId] = count + 1;
  return true;
}
