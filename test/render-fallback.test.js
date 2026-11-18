import { describe, it, expect } from 'vitest';
import { pickRenderMode } from '../src/render/scene.js';

describe('render mode selection', () => {
  it('falls back to 2d when webgl2 is unavailable', () => {
    const fakeCanvas = { getContext: () => null };
    expect(pickRenderMode(fakeCanvas)).toBe('2d');
  });
  it('uses webgl2 when available', () => {
    const fakeCanvas = { getContext: (t) => (t === 'webgl2' ? {} : null) };
    expect(pickRenderMode(fakeCanvas)).toBe('webgl2');
  });
});
