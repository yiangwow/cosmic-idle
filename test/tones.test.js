import { describe, it, expect } from 'vitest';
import { noteToFreq, clickPitch, scaleDroneFreqs } from '../src/audio/tones.js';

describe('tones', () => {
  it('A4 is 440Hz at 0 semitones', () => {
    expect(noteToFreq(0)).toBeCloseTo(440);
  });
  it('one octave up doubles frequency', () => {
    expect(noteToFreq(12)).toBeCloseTo(880);
  });
  it('click pitch rises with click power but stays in band', () => {
    const low = clickPitch(1);
    const high = clickPitch(1024);
    expect(high).toBeGreaterThan(low);
    expect(high).toBeLessThanOrEqual(1760);
    expect(low).toBeGreaterThanOrEqual(220);
  });
  it('drone freqs get lower/wider as scale index grows', () => {
    const spark = scaleDroneFreqs(0);
    const universe = scaleDroneFreqs(3);
    expect(Array.isArray(spark)).toBe(true);
    expect(spark.length).toBeGreaterThan(0);
    // lowest note of a later scale is lower than an earlier scale
    expect(Math.min(...universe)).toBeLessThan(Math.min(...spark));
  });
});
