import { describe, it, expect } from 'vitest';
import { D, ZERO, ONE, formatNumber, safe } from '../src/sim/bignum.js';

describe('bignum', () => {
  it('D wraps numbers and strings', () => {
    expect(D(5).toNumber()).toBe(5);
    expect(D('1e10').toNumber()).toBe(1e10);
  });
  it('constants', () => {
    expect(ZERO.toNumber()).toBe(0);
    expect(ONE.toNumber()).toBe(1);
  });
  it('formats small numbers plainly', () => {
    expect(formatNumber(D(42))).toBe('42');
  });
  it('formats large numbers in scientific notation', () => {
    expect(formatNumber(D('1.5e6'))).toMatch(/e6/);
  });
  it('safe replaces non-finite with zero', () => {
    expect(safe(D(NaN)).toNumber()).toBe(0);
  });
  it('safe replaces infinity with zero', () => {
    expect(safe(D(Infinity)).toNumber()).toBe(0);
  });
  it('safe preserves large normal numbers', () => {
    expect(safe(D('1e300')).toNumber()).toBe(1e300);
  });
  it('safe preserves finite values above 1e308', () => {
    // Regression guard: 1e400 is a legitimate finite value, must not be zeroed
    // Use .eq() not .toNumber() since toNumber() overflows to Infinity
    expect(safe(D('1e400')).eq(D('1e400'))).toBe(true);
  });
});
