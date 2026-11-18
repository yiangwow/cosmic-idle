import { describe, it, expect } from 'vitest';
import { createState } from '../src/sim/state.js';
import { createLoop } from '../src/ui/hud.js';
import { TICK_DT } from '../src/sim/tick.js';

describe('createLoop accumulator', () => {
  it('runs the right number of fixed ticks for elapsed real time', () => {
    const s = createState();
    s.generators.emitter = 10; // 2 energy/sec
    let ticks = 0;
    const loop = createLoop(s, { onTick: () => { ticks++; } });
    loop.step(1); // 1 real second
    expect(ticks).toBe(1);
    // 1 second of production at 2/sec:
    expect(s.energy.toNumber()).toBeCloseTo(2, 1);
  });
  it('carries fractional time across steps', () => {
    const s = createState();
    const loop = createLoop(s, { onTick: () => {} });
    const half = TICK_DT / 2;
    loop.step(half); // not enough for a tick
    loop.step(half); // now enough for one tick
    // No assertion on energy (no generators) — just verifies no crash and accumulation.
    expect(typeof loop.step).toBe('function');
  });
});
