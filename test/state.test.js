// test/state.test.js
import { describe, it, expect } from 'vitest';
import { SCALES, GENERATORS, UPGRADES } from '../src/sim/data.js';
import { createState, SAVE_VERSION } from '../src/sim/state.js';

describe('data', () => {
  it('has four scales in order', () => {
    expect(SCALES.map(s => s.id)).toEqual(['spark', 'star', 'galaxy', 'universe']);
  });
  it('generators have growing cost multipliers', () => {
    for (const g of GENERATORS) expect(g.costGrowth).toBeGreaterThan(1);
  });
  it('upgrades reference valid kinds', () => {
    for (const u of UPGRADES) expect(['click', 'generator', 'global']).toContain(u.kind);
  });
});

describe('state', () => {
  it('creates a fresh state at scale 0', () => {
    const s = createState();
    expect(s.scale).toBe(0);
    expect(s.energy.toNumber()).toBe(0);
    expect(s.clickPower.toNumber()).toBe(1);
    expect(s.saveVersion).toBe(SAVE_VERSION);
  });
  it('initializes generator counts to zero', () => {
    const s = createState();
    for (const g of GENERATORS) expect(s.generators[g.id]).toBe(0);
  });
});
