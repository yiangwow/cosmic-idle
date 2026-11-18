import { D } from '../sim/bignum.js';
import { createState, SAVE_VERSION } from '../sim/state.js';
import { GENERATORS } from '../sim/data.js';

export const SAVE_KEY = 'cosmic-idle-save';
export const BACKUP_KEY = 'cosmic-idle-save-backup';

export function serialize(state) {
  return {
    scale: state.scale,
    energy: state.energy.toString(),
    energyEarnedThisRun: state.energyEarnedThisRun.toString(),
    stardust: state.stardust.toString(),
    clickPower: state.clickPower.toString(),
    generators: { ...state.generators },
    upgrades: { ...state.upgrades },
    lastSaved: state.lastSaved,
    saveVersion: SAVE_VERSION,
  };
}

export function migrate(obj) {
  // v1 is current. Future versions add stepwise upgrades here.
  if (!obj.saveVersion) obj.saveVersion = 1;
  return obj;
}

export function deserialize(obj) {
  const migrated = migrate(obj);
  const base = createState();
  const generators = { ...base.generators };
  for (const g of GENERATORS) {
    if (migrated.generators && migrated.generators[g.id] != null) {
      generators[g.id] = migrated.generators[g.id];
    }
  }
  return {
    scale: migrated.scale ?? 0,
    energy: D(migrated.energy ?? 0),
    energyEarnedThisRun: D(migrated.energyEarnedThisRun ?? 0),
    stardust: D(migrated.stardust ?? 0),
    clickPower: D(migrated.clickPower ?? 1),
    generators,
    upgrades: { ...(migrated.upgrades ?? {}) },
    lastSaved: migrated.lastSaved ?? Date.now(),
    saveVersion: SAVE_VERSION,
  };
}

export function save(state, storage = localStorage) {
  state.lastSaved = Date.now();
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(serialize(state)));
    return true;
  } catch (e) {
    return false;
  }
}

export function load(storage = localStorage) {
  const raw = storage.getItem(SAVE_KEY);
  if (!raw) return createState();
  try {
    return deserialize(JSON.parse(raw));
  } catch (e) {
    try { storage.setItem(BACKUP_KEY, raw); } catch (_) { /* ignore */ }
    return createState();
  }
}
