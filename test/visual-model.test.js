import { describe, it, expect } from 'vitest';
import { D } from '../src/sim/bignum.js';
import { createState } from '../src/sim/state.js';
import { coreRadius, elementCount, sceneDensity, intensity } from '../src/render/visualModel.js';

describe('visual model', () => {
  it('core radius is minPx at zero energy and grows with energy', () => {
    const s = createState();
    expect(coreRadius(s, 40, 400)).toBeCloseTo(40);
    s.energy = D(1e8);
    expect(coreRadius(s, 40, 400)).toBeGreaterThan(40);
  });
  it('core radius is clamped to maxPx', () => {
    const s = createState();
    s.energy = D('1e300');
    expect(coreRadius(s, 40, 400)).toBeLessThanOrEqual(400);
  });
  it('element count grows with owned generators but is capped', () => {
    const s = createState();
    expect(elementCount(s, 'emitter')).toBe(0);
    s.generators.emitter = 100;
    const c = elementCount(s, 'emitter');
    expect(c).toBeGreaterThan(0);
    expect(c).toBeLessThanOrEqual(60); // capped
  });
  it('scene density is 0 on fresh state and rises with holdings', () => {
    const s = createState();
    expect(sceneDensity(s)).toBeCloseTo(0);
    s.generators.emitter = 50;
    expect(sceneDensity(s)).toBeGreaterThan(0);
    expect(sceneDensity(s)).toBeLessThanOrEqual(1);
  });
  it('intensity is between 0 and 1', () => {
    const s = createState();
    s.generators.emitter = 10;
    const i = intensity(s);
    expect(i).toBeGreaterThanOrEqual(0);
    expect(i).toBeLessThanOrEqual(1);
  });
});
