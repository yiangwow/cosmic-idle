export const STARDUST_K = 10;
export const STARDUST_BONUS_PER = 0.02;

export const SCALES = [
  { id: 'spark',    name: 'Spark',    resourceName: 'Photons',   ascendThreshold: 1e6 },
  { id: 'star',     name: 'Star',     resourceName: 'Fusion',    ascendThreshold: 1e12 },
  { id: 'galaxy',   name: 'Galaxy',   resourceName: 'Starlight', ascendThreshold: 1e20 },
  { id: 'universe', name: 'Universe', resourceName: 'Cosmic',    ascendThreshold: 1e32 },
];

export const GENERATORS = [
  { id: 'emitter',  name: 'Emitter',   baseCost: 10,    costGrowth: 1.15, baseOutput: 0.2 },
  { id: 'core',     name: 'Core',      baseCost: 120,   costGrowth: 1.16, baseOutput: 2 },
  { id: 'reactor',  name: 'Reactor',   baseCost: 1500,  costGrowth: 1.17, baseOutput: 24 },
  { id: 'nexus',    name: 'Nexus',     baseCost: 2e4,   costGrowth: 1.18, baseOutput: 300 },
  { id: 'engine',   name: 'Engine',    baseCost: 3e5,   costGrowth: 1.19, baseOutput: 4200 },
];

export const UPGRADES = [
  { id: 'click2',    name: 'Sharper Click',  kind: 'click',     cost: 100,   currency: 'energy',   effect: 2 },
  { id: 'click3',    name: 'Focused Beam',   kind: 'click',     cost: 5e3,   currency: 'energy',   effect: 3 },
  { id: 'emitter2',  name: 'Twin Emitters',  kind: 'generator', target: 'emitter', cost: 1e3, currency: 'energy', effect: 2 },
  { id: 'core2',     name: 'Overclock Core', kind: 'generator', target: 'core',    cost: 5e4, currency: 'energy', effect: 2 },
  { id: 'global1',   name: 'Cosmic Resonance', kind: 'global',  cost: 5,     currency: 'stardust', effect: 3 },
  { id: 'global2',   name: 'Stellar Harmony',  kind: 'global',  cost: 25,    currency: 'stardust', effect: 5 },
];
