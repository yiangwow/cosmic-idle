import { describe, it, expect } from 'vitest';
import { createState } from '../src/sim/state.js';
import { advance, TICK_RATE, TICK_DT } from '../src/sim/tick.js';

describe('tick', () => {
  it('TICK_DT is inverse of TICK_RATE', () => {
    expect(TICK_DT).toBeCloseTo(1 / TICK_RATE);
  });
  it('advance adds production over time', () => {
    const s = createState();
    s.generators.emitter = 10; // 2 energy/sec
    advance(s, 1);
    expect(s.energy.toNumber()).toBeCloseTo(2);
    expect(s.energyEarnedThisRun.toNumber()).toBeCloseTo(2);
  });
  it('advance is deterministic for equal inputs', () => {
    const a = createState(); a.generators.emitter = 5;
    const b = createState(); b.generators.emitter = 5;
    advance(a, 0.5); advance(b, 0.5);
    expect(a.energy.toNumber()).toBe(b.energy.toNumber());
  });
  it('advance with no generators does nothing', () => {
    const s = createState();
    advance(s, 5);
    expect(s.energy.toNumber()).toBe(0);
  });
});
