import { describe, it, expect } from 'vitest';
import { D } from '../src/sim/bignum.js';
import { createState } from '../src/sim/state.js';
import { serialize, deserialize, save, load, SAVE_KEY } from '../src/save/save.js';

function fakeStorage() {
  const m = new Map();
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, v),
    _map: m,
  };
}

describe('save', () => {
  it('round-trips a state', () => {
    const s = createState();
    s.energy = D('1.5e9');
    s.scale = 2;
    s.generators.emitter = 7;
    const back = deserialize(serialize(s));
    expect(back.energy.toString()).toBe(s.energy.toString());
    expect(back.scale).toBe(2);
    expect(back.generators.emitter).toBe(7);
  });
  it('save writes to storage and updates lastSaved', () => {
    const store = fakeStorage();
    const s = createState();
    const ok = save(s, store);
    expect(ok).toBe(true);
    expect(store.getItem(SAVE_KEY)).toBeTruthy();
  });
  it('load returns saved state', () => {
    const store = fakeStorage();
    const s = createState();
    s.stardust = D(42);
    save(s, store);
    const loaded = load(store);
    expect(loaded.stardust.toNumber()).toBe(42);
  });
  it('load returns fresh state when empty', () => {
    const loaded = load(fakeStorage());
    expect(loaded.scale).toBe(0);
    expect(loaded.energy.toNumber()).toBe(0);
  });
  it('load recovers from corrupt data', () => {
    const store = fakeStorage();
    store.setItem(SAVE_KEY, '{ not valid json');
    const loaded = load(store);
    expect(loaded.scale).toBe(0);
  });
});
