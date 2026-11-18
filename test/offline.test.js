import { describe, it, expect } from 'vitest';
import { createState } from '../src/sim/state.js';
import { applyOffline, MAX_OFFLINE_SECONDS } from '../src/sim/offline.js';

describe('offline', () => {
  it('awards production for elapsed time', () => {
    const s = createState();
    s.generators.emitter = 10;       // 2 energy/sec
    s.lastSaved = 1000;              // ms
    const res = applyOffline(s, 1000 + 5000); // 5s later
    expect(res.seconds).toBeCloseTo(5);
    expect(res.gained.toNumber()).toBeCloseTo(10);
    expect(s.energy.toNumber()).toBeCloseTo(10);
  });
  it('caps elapsed time at MAX_OFFLINE_SECONDS', () => {
    const s = createState();
    s.generators.emitter = 10;
    s.lastSaved = 0;
    const res = applyOffline(s, (MAX_OFFLINE_SECONDS + 100000) * 1000);
    expect(res.seconds).toBe(MAX_OFFLINE_SECONDS);
  });
  it('handles zero elapsed gracefully', () => {
    const s = createState();
    s.lastSaved = 5000;
    const res = applyOffline(s, 5000);
    expect(res.seconds).toBe(0);
    expect(res.gained.toNumber()).toBe(0);
  });
});
