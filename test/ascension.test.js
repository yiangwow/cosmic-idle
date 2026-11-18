import { describe, it, expect } from 'vitest';
import { D } from '../src/sim/bignum.js';
import { createState } from '../src/sim/state.js';
import { canAscend, stardustReward, ascend } from '../src/sim/ascension.js';

describe('ascension', () => {
  it('cannot ascend below threshold', () => {
    const s = createState();
    s.energyEarnedThisRun = D(1e5);
    expect(canAscend(s)).toBe(false);
  });
  it('can ascend at or above threshold', () => {
    const s = createState();
    s.energyEarnedThisRun = D(1e6);
    expect(canAscend(s)).toBe(true);
  });
  it('stardust reward scales with sqrt of overshoot', () => {
    const s = createState();
    s.energyEarnedThisRun = D(4e6); // sqrt(4e6/1e6)=2, K=10 => 20
    expect(stardustReward(s).toNumber()).toBe(20);
  });
  it('ascend advances scale and resets run, keeps stardust', () => {
    const s = createState();
    s.energyEarnedThisRun = D(1e6);
    s.energy = D(1e6);
    s.generators.emitter = 50;
    s.upgrades.click2 = true;
    s.upgrades.global1 = true;
    expect(ascend(s)).toBe(true);
    expect(s.scale).toBe(1);
    expect(s.energy.toNumber()).toBe(0);
    expect(s.generators.emitter).toBe(0);
    expect(s.upgrades.click2).toBeFalsy();  // per-run upgrade reset
    expect(s.upgrades.global1).toBe(true);  // global upgrade persists
    expect(s.stardust.toNumber()).toBe(10);
  });
  it('cannot ascend past the last scale', () => {
    const s = createState();
    s.scale = 3;
    s.energyEarnedThisRun = D(1e40);
    expect(canAscend(s)).toBe(false);
    expect(ascend(s)).toBe(false);
  });
});
