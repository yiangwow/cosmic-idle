// test/actions.test.js
import { describe, it, expect } from 'vitest';
import { D } from '../src/sim/bignum.js';
import { createState } from '../src/sim/state.js';
import { click, effectiveClickPower, buyUpgrade } from '../src/sim/actions.js';

describe('actions', () => {
  it('base click power is 1', () => {
    expect(effectiveClickPower(createState()).toNumber()).toBeCloseTo(1);
  });
  it('click adds energy', () => {
    const s = createState();
    click(s);
    expect(s.energy.toNumber()).toBeCloseTo(1);
    expect(s.energyEarnedThisRun.toNumber()).toBeCloseTo(1);
  });
  it('buying a click upgrade doubles click power', () => {
    const s = createState();
    s.energy = D(100);
    expect(buyUpgrade(s, 'click2')).toBe(true);
    expect(effectiveClickPower(s).toNumber()).toBeCloseTo(2);
    expect(s.energy.toNumber()).toBeCloseTo(0);
  });
  it('cannot buy the same upgrade twice', () => {
    const s = createState();
    s.energy = D(1e6);
    buyUpgrade(s, 'click2');
    expect(buyUpgrade(s, 'click2')).toBe(false);
  });
  it('cannot buy a stardust upgrade without stardust', () => {
    const s = createState();
    s.energy = D(1e9);
    expect(buyUpgrade(s, 'global1')).toBe(false);
  });
  it('buys a stardust upgrade with stardust', () => {
    const s = createState();
    s.stardust = D(10);
    expect(buyUpgrade(s, 'global1')).toBe(true);
    expect(s.stardust.toNumber()).toBeCloseTo(5);
  });
});
