import { describe, it, expect } from 'vitest';
import { D } from '../src/sim/bignum.js';
import { createState } from '../src/sim/state.js';
import {
  generatorCost, generatorOutput, energyPerSecond, buyGenerator, globalMultiplier,
} from '../src/sim/generators.js';

describe('generators', () => {
  it('cost of first unit equals baseCost', () => {
    expect(generatorCost('emitter', 0).toNumber()).toBeCloseTo(10);
  });
  it('cost grows geometrically', () => {
    expect(generatorCost('emitter', 1).toNumber()).toBeCloseTo(11.5);
  });
  it('output is zero with no units', () => {
    const s = createState();
    expect(generatorOutput(s, 'emitter').toNumber()).toBe(0);
  });
  it('buyGenerator fails when unaffordable', () => {
    const s = createState();
    expect(buyGenerator(s, 'emitter')).toBe(false);
    expect(s.generators.emitter).toBe(0);
  });
  it('buyGenerator deducts energy and increments count', () => {
    const s = createState();
    s.energy = D(50);
    expect(buyGenerator(s, 'emitter')).toBe(true);
    expect(s.generators.emitter).toBe(1);
    expect(s.energy.toNumber()).toBeCloseTo(40);
  });
  it('energyPerSecond sums generator output with base global multiplier', () => {
    const s = createState();
    s.generators.emitter = 10; // 10 * 0.2 = 2/s at global mult 1
    expect(energyPerSecond(s).toNumber()).toBeCloseTo(2);
  });
  it('global multiplier is 1 on a fresh state', () => {
    expect(globalMultiplier(createState()).toNumber()).toBeCloseTo(1);
  });
});
