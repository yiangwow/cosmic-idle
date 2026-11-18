import Decimal from 'break_infinity.js';

export const ZERO = new Decimal(0);
export const ONE = new Decimal(1);

export function D(value) {
  return value instanceof Decimal ? value : new Decimal(value);
}

export function safe(decimal) {
  const d = D(decimal);
  // NaN: mantissa is NaN
  if (!isFinite(d.mantissa)) return ZERO;
  // Infinity: exponent is sentinel value 9e15
  if (d.exponent === 9e15) return ZERO;
  return d;
}

export function formatNumber(decimal) {
  const d = D(decimal);
  if (d.lt(1e6)) {
    // Show whole numbers without decimals, else 2 places.
    const n = d.toNumber();
    return Number.isInteger(n) ? String(n) : n.toFixed(2);
  }
  const exp = d.exponent;
  const mantissa = d.mantissa;
  return `${mantissa.toFixed(2)}e${exp}`;
}
