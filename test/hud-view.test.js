import { describe, it, expect } from 'vitest';
import { D } from '../src/sim/bignum.js';
import { createState } from '../src/sim/state.js';
import { GENERATORS } from '../src/sim/data.js';
import { describeGenerator, describeAscend } from '../src/ui/hud.js';

describe('hud view-models', () => {
  it('describeGenerator reports affordability', () => {
    const s = createState();
    s.energy = D(10);
    const vm = describeGenerator(s, GENERATORS[0]);
    expect(vm.affordable).toBe(true);
    expect(vm.cost.toNumber()).toBeCloseTo(10);
  });
  it('describeGenerator unaffordable when broke', () => {
    const s = createState();
    const vm = describeGenerator(s, GENERATORS[0]);
    expect(vm.affordable).toBe(false);
  });
  it('describeAscend reflects threshold', () => {
    const s = createState();
    s.energyEarnedThisRun = D(1e6);
    const vm = describeAscend(s);
    expect(vm.available).toBe(true);
    expect(vm.reward.toNumber()).toBeGreaterThan(0);
  });
});
