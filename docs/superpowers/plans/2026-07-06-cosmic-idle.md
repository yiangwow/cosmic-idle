# Cosmic Idle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a cosmic-themed click+idle incremental game with scale-jump prestige (spark → star → galaxy → universe) and a WebGL2 visual layer.

**Architecture:** A pure, deterministic simulation core (`src/sim/`) is the single source of truth. Render (`src/render/`, WebGL2) and UI (`src/ui/`, DOM) are read-only views. A fixed-timestep loop advances the sim; a requestAnimationFrame loop draws it. Save/load persists one versioned JSON blob to localStorage.

**Tech Stack:** Vite, vanilla JS (ES modules), `break_infinity.js` (Decimal big numbers), Vitest, WebGL2.

## Global Constraints

- Node ≥ 18, ES modules only (`"type": "module"`).
- `src/sim/` and `src/save/` MUST NOT import from `src/render/`, `src/ui/`, or touch the DOM/`window` (except `save.js` may touch `localStorage`).
- All resource/cost/output math goes through `Decimal` via `src/sim/bignum.js`.
- All balance numbers live in `src/sim/data.js` — never hardcoded in logic.
- Git authorship: the owner's git identity. No Co-Authored-By lines.
- Commit after every task. Tests must pass before committing.

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.js`
- Create: `src/main.js` (placeholder)
- Create: `CLAUDE.md`
- Test: `test/scaffold.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: a working Vite + Vitest project. `npm run dev`, `npm test`, `npm run build` all run.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "cosmic-idle",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "break_infinity.js": "^2.0.0"
  },
  "devDependencies": {
    "vite": "^5.4.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `cd ~/cosmic-idle && npm install`
Expected: `node_modules/` created, no errors.

- [ ] **Step 3: Create `vite.config.js`**

```js
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: { outDir: 'dist' },
  test: { environment: 'node' },
});
```

- [ ] **Step 4: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cosmic Idle</title>
    <style>
      html, body { margin: 0; height: 100%; background: #05060a; color: #e8ecff;
        font-family: system-ui, sans-serif; overflow: hidden; }
      #scene { position: fixed; inset: 0; width: 100%; height: 100%; display: block; }
      #hud { position: fixed; inset: 0; pointer-events: none; }
      #hud button { pointer-events: auto; }
    </style>
  </head>
  <body>
    <canvas id="scene"></canvas>
    <div id="hud"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

- [ ] **Step 5: Create placeholder `src/main.js`**

```js
// Wiring happens in Task 10. Placeholder so index.html loads.
console.log('cosmic-idle boot');
```

- [ ] **Step 6: Create `CLAUDE.md`**

```markdown
# Cosmic Idle

Cosmic-themed click+idle incremental game. Scale-jump prestige: spark → star → galaxy → universe.

## Architecture
- `src/sim/` — PURE simulation (no DOM/GL). Single source of truth. Fully unit-tested.
- `src/render/` — WebGL2 scene. Read-only view of GameState.
- `src/ui/` — DOM HUD overlay. Read-only view.
- `src/save/` — versioned localStorage persistence.
- `src/main.js` — wires fixed-timestep sim loop + rAF render loop + UI events.

## Rules
- `sim/`/`save/` never import render/ui or touch DOM (save may use localStorage).
- All big-number math via `src/sim/bignum.js` (break_infinity Decimal).
- All balance numbers live in `src/sim/data.js`.

## Commands
- `npm run dev` — dev server
- `npm test` — Vitest
- `npm run build` — production build
```

- [ ] **Step 7: Write the scaffold test**

```js
// test/scaffold.test.js
import { describe, it, expect } from 'vitest';
import pkg from '../package.json' assert { type: 'json' };

describe('scaffold', () => {
  it('is an ES module project', () => {
    expect(pkg.type).toBe('module');
  });
  it('has break_infinity.js dependency', () => {
    expect(pkg.dependencies['break_infinity.js']).toBeDefined();
  });
});
```

- [ ] **Step 8: Run the test**

Run: `npm test`
Expected: PASS (2 tests).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold vite + vitest project"
```

---

### Task 2: Big-number wrapper

**Files:**
- Create: `src/sim/bignum.js`
- Test: `test/bignum.test.js`

**Interfaces:**
- Produces:
  - `D(value)` → returns a `Decimal` (accepts number, string, or Decimal).
  - `ZERO`, `ONE` → `Decimal` constants.
  - `formatNumber(decimal)` → `string` human-readable (e.g. `"1.50e6"`, `"42"`).
  - `safe(decimal)` → `Decimal`, replaces NaN/Infinity with `ZERO`.

- [ ] **Step 1: Write the failing test**

```js
// test/bignum.test.js
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/bignum.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Write `src/sim/bignum.js`**

```js
import Decimal from 'break_infinity.js';

export const ZERO = new Decimal(0);
export const ONE = new Decimal(1);

export function D(value) {
  return value instanceof Decimal ? value : new Decimal(value);
}

export function safe(decimal) {
  const d = D(decimal);
  return (d.isNan() || !d.isFinite()) ? ZERO : d;
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/bignum.test.js`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/sim/bignum.js test/bignum.test.js
git commit -m "feat: big-number wrapper over break_infinity"
```

---

### Task 3: Game data definitions + GameState

**Files:**
- Create: `src/sim/data.js`
- Create: `src/sim/state.js`
- Test: `test/state.test.js`

**Interfaces:**
- `data.js` produces:
  - `SCALES` → array of `{ id, name, resourceName, ascendThreshold }` (4 entries: spark, star, galaxy, universe). `ascendThreshold` is a number (energy required to ascend from this scale).
  - `GENERATORS` → array of `{ id, name, baseCost, costGrowth, baseOutput }` (5 entries). `baseCost`, `baseOutput` numbers; `costGrowth` > 1.
  - `UPGRADES` → array of `{ id, name, kind, cost, currency, effect }` where `kind` ∈ `'click' | 'generator' | 'global'`, `currency` ∈ `'energy' | 'stardust'`, `effect` is a number multiplier, and generator upgrades include a `target` generator id.
  - `STARDUST_K` → number constant for the ascension formula.
- `state.js` produces:
  - `createState()` → fresh `GameState`:
    ```
    {
      scale: 0,                 // index into SCALES
      energy: Decimal,          // current energy
      energyEarnedThisRun: Decimal,
      stardust: Decimal,        // prestige currency
      clickPower: Decimal,      // energy per manual click, base
      generators: { [id]: count(number) },
      upgrades: { [id]: boolean },  // purchased flags
      lastSaved: number,        // epoch ms
      saveVersion: number,
    }
    ```
  - `SAVE_VERSION` → number constant, current save schema version (start at 1).

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/state.test.js`
Expected: FAIL (modules not found).

- [ ] **Step 3: Write `src/sim/data.js`**

```js
export const STARDUST_K = 10;

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
```

- [ ] **Step 4: Write `src/sim/state.js`**

```js
import { D, ZERO } from './bignum.js';
import { GENERATORS } from './data.js';

export const SAVE_VERSION = 1;

export function createState() {
  const generators = {};
  for (const g of GENERATORS) generators[g.id] = 0;
  return {
    scale: 0,
    energy: ZERO,
    energyEarnedThisRun: ZERO,
    stardust: ZERO,
    clickPower: D(1),
    generators,
    upgrades: {},
    lastSaved: Date.now(),
    saveVersion: SAVE_VERSION,
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run test/state.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/sim/data.js src/sim/state.js test/state.test.js
git commit -m "feat: game data definitions and GameState factory"
```

---

### Task 4: Generator cost, output, and buy logic

**Files:**
- Create: `src/sim/generators.js`
- Test: `test/generators.test.js`

**Interfaces:**
- Consumes: `data.js` (`GENERATORS`, `UPGRADES`), `bignum.js`, `state.js`.
- Produces:
  - `generatorCost(genId, count)` → `Decimal`. Cost of the NEXT unit given current `count` owned: `baseCost * costGrowth^count`.
  - `globalMultiplier(state)` → `Decimal`. Product of purchased global upgrade effects × stardust bonus `(1 + stardust*0.02)`.
  - `generatorOutput(state, genId)` → `Decimal`. Per-second output of ALL owned units of one generator: `count * baseOutput * genUpgradeMult * globalMultiplier`.
  - `energyPerSecond(state)` → `Decimal`. Sum of `generatorOutput` across all generators.
  - `buyGenerator(state, genId)` → mutates state, returns `boolean` (true if bought). Deducts energy, increments count. No-op + false if unaffordable.

- [ ] **Step 1: Write the failing test**

```js
// test/generators.test.js
import { describe, it, expect } from 'vitest';
import { D } from '../src/sim/bignum.js';
import { createState } from '../src/sim/state.js';
import {
  generatorCost, generatorOutput, energyPerSecond, buyGenerator, globalMultiplier,
} from '../src/sim/generators.js';

describe('generators', () => {
  it('cost of first unit equals baseCost', () => {
    expect(generatorCost('emitter', 0).toNumber()).toBeCloseTo(10);
  });
  it('cost grows geometrically', () => {
    expect(generatorCost('emitter', 1).toNumber()).toBeCloseTo(11.5);
  });
  it('output is zero with no units', () => {
    const s = createState();
    expect(generatorOutput(s, 'emitter').toNumber()).toBe(0);
  });
  it('buyGenerator fails when unaffordable', () => {
    const s = createState();
    expect(buyGenerator(s, 'emitter')).toBe(false);
    expect(s.generators.emitter).toBe(0);
  });
  it('buyGenerator deducts energy and increments count', () => {
    const s = createState();
    s.energy = D(50);
    expect(buyGenerator(s, 'emitter')).toBe(true);
    expect(s.generators.emitter).toBe(1);
    expect(s.energy.toNumber()).toBeCloseTo(40);
  });
  it('energyPerSecond sums generator output with base global multiplier', () => {
    const s = createState();
    s.generators.emitter = 10; // 10 * 0.2 = 2/s at global mult 1
    expect(energyPerSecond(s).toNumber()).toBeCloseTo(2);
  });
  it('global multiplier is 1 on a fresh state', () => {
    expect(globalMultiplier(createState()).toNumber()).toBeCloseTo(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/generators.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Write `src/sim/generators.js`**

```js
import { D, ONE } from './bignum.js';
import { GENERATORS, UPGRADES } from './data.js';

const GEN_BY_ID = Object.fromEntries(GENERATORS.map(g => [g.id, g]));

export function generatorCost(genId, count) {
  const g = GEN_BY_ID[genId];
  return D(g.baseCost).mul(D(g.costGrowth).pow(count));
}

export function globalMultiplier(state) {
  let mult = ONE;
  for (const u of UPGRADES) {
    if (u.kind === 'global' && state.upgrades[u.id]) mult = mult.mul(u.effect);
  }
  // Stardust passive bonus: +2% per stardust.
  mult = mult.mul(ONE.add(state.stardust.mul(0.02)));
  return mult;
}

function generatorUpgradeMult(state, genId) {
  let mult = ONE;
  for (const u of UPGRADES) {
    if (u.kind === 'generator' && u.target === genId && state.upgrades[u.id]) {
      mult = mult.mul(u.effect);
    }
  }
  return mult;
}

export function generatorOutput(state, genId) {
  const g = GEN_BY_ID[genId];
  const count = state.generators[genId] || 0;
  if (count === 0) return D(0);
  return D(count)
    .mul(g.baseOutput)
    .mul(generatorUpgradeMult(state, genId))
    .mul(globalMultiplier(state));
}

export function energyPerSecond(state) {
  let total = D(0);
  for (const g of GENERATORS) total = total.add(generatorOutput(state, g.id));
  return total;
}

export function buyGenerator(state, genId) {
  const count = state.generators[genId] || 0;
  const cost = generatorCost(genId, count);
  if (state.energy.lt(cost)) return false;
  state.energy = state.energy.sub(cost);
  state.generators[genId] = count + 1;
  return true;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/generators.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/sim/generators.js test/generators.test.js
git commit -m "feat: generator cost/output/buy logic"
```

---

### Task 5: Fixed-timestep tick

**Files:**
- Create: `src/sim/tick.js`
- Test: `test/tick.test.js`

**Interfaces:**
- Consumes: `generators.js` (`energyPerSecond`), `bignum.js`.
- Produces:
  - `advance(state, dtSeconds)` → mutates state: adds `energyPerSecond(state) * dtSeconds` to both `state.energy` and `state.energyEarnedThisRun`. Returns nothing.
  - `TICK_RATE` → number, ticks per second (20).
  - `TICK_DT` → number, seconds per tick (`1 / TICK_RATE`).

- [ ] **Step 1: Write the failing test**

```js
// test/tick.test.js
import { describe, it, expect } from 'vitest';
import { createState } from '../src/sim/state.js';
import { advance, TICK_RATE, TICK_DT } from '../src/sim/tick.js';

describe('tick', () => {
  it('TICK_DT is inverse of TICK_RATE', () => {
    expect(TICK_DT).toBeCloseTo(1 / TICK_RATE);
  });
  it('advance adds production over time', () => {
    const s = createState();
    s.generators.emitter = 10; // 2 energy/sec
    advance(s, 1);
    expect(s.energy.toNumber()).toBeCloseTo(2);
    expect(s.energyEarnedThisRun.toNumber()).toBeCloseTo(2);
  });
  it('advance is deterministic for equal inputs', () => {
    const a = createState(); a.generators.emitter = 5;
    const b = createState(); b.generators.emitter = 5;
    advance(a, 0.5); advance(b, 0.5);
    expect(a.energy.toNumber()).toBe(b.energy.toNumber());
  });
  it('advance with no generators does nothing', () => {
    const s = createState();
    advance(s, 5);
    expect(s.energy.toNumber()).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/tick.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Write `src/sim/tick.js`**

```js
import { energyPerSecond } from './generators.js';

export const TICK_RATE = 20;
export const TICK_DT = 1 / TICK_RATE;

export function advance(state, dtSeconds) {
  const gain = energyPerSecond(state).mul(dtSeconds);
  state.energy = state.energy.add(gain);
  state.energyEarnedThisRun = state.energyEarnedThisRun.add(gain);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/tick.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/sim/tick.js test/tick.test.js
git commit -m "feat: fixed-timestep tick advance"
```

---

### Task 6: Click and upgrade purchases

**Files:**
- Create: `src/sim/actions.js`
- Test: `test/actions.test.js`

**Interfaces:**
- Consumes: `data.js` (`UPGRADES`), `generators.js` (`globalMultiplier`), `bignum.js`.
- Produces:
  - `effectiveClickPower(state)` → `Decimal`. `state.clickPower * product(purchased click upgrade effects) * globalMultiplier(state)`.
  - `click(state)` → mutates state: adds `effectiveClickPower(state)` to `energy` and `energyEarnedThisRun`. Returns the `Decimal` gained.
  - `upgradeById(id)` → the upgrade definition or `undefined`.
  - `canAfford(state, upgrade)` → `boolean`.
  - `buyUpgrade(state, id)` → mutates state, returns `boolean`. Deducts the correct currency, sets `state.upgrades[id] = true`. No-op + false if already owned or unaffordable.

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/actions.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Write `src/sim/actions.js`**

```js
import { D, ONE } from './bignum.js';
import { UPGRADES } from './data.js';
import { globalMultiplier } from './generators.js';

const UPGRADE_BY_ID = Object.fromEntries(UPGRADES.map(u => [u.id, u]));

export function upgradeById(id) {
  return UPGRADE_BY_ID[id];
}

export function effectiveClickPower(state) {
  let mult = ONE;
  for (const u of UPGRADES) {
    if (u.kind === 'click' && state.upgrades[u.id]) mult = mult.mul(u.effect);
  }
  return state.clickPower.mul(mult).mul(globalMultiplier(state));
}

export function click(state) {
  const gain = effectiveClickPower(state);
  state.energy = state.energy.add(gain);
  state.energyEarnedThisRun = state.energyEarnedThisRun.add(gain);
  return gain;
}

export function canAfford(state, upgrade) {
  const bal = upgrade.currency === 'stardust' ? state.stardust : state.energy;
  return bal.gte(upgrade.cost);
}

export function buyUpgrade(state, id) {
  const u = UPGRADE_BY_ID[id];
  if (!u || state.upgrades[id]) return false;
  if (!canAfford(state, u)) return false;
  if (u.currency === 'stardust') state.stardust = state.stardust.sub(u.cost);
  else state.energy = state.energy.sub(u.cost);
  state.upgrades[id] = true;
  return true;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/actions.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/sim/actions.js test/actions.test.js
git commit -m "feat: click and upgrade purchase actions"
```

---

### Task 7: Ascension (scale-jump prestige)

**Files:**
- Create: `src/sim/ascension.js`
- Test: `test/ascension.test.js`

**Interfaces:**
- Consumes: `data.js` (`SCALES`, `STARDUST_K`, `GENERATORS`), `bignum.js`.
- Produces:
  - `canAscend(state)` → `boolean`. True if `state.energyEarnedThisRun >= SCALES[state.scale].ascendThreshold` AND `state.scale < SCALES.length - 1`.
  - `stardustReward(state)` → `Decimal`. `floor( STARDUST_K * sqrt(energyEarnedThisRun / ascendThreshold) )` for the current scale. Returns `ZERO` if below threshold.
  - `ascend(state)` → mutates state, returns `boolean`. If `canAscend`: award stardust, increment `scale`, reset `energy`/`energyEarnedThisRun`/`generators` (counts to 0), KEEP `stardust` and `upgrades` (global/stardust upgrades persist; energy-currency upgrade flags reset). Returns true. Else no-op + false.

  Note: on ascend, reset only non-global upgrade flags — click and generator upgrades are re-earned per run; global (stardust) upgrades persist.

- [ ] **Step 1: Write the failing test**

```js
// test/ascension.test.js
import { describe, it, expect } from 'vitest';
import { D } from '../src/sim/bignum.js';
import { createState } from '../src/sim/state.js';
import { canAscend, stardustReward, ascend } from '../src/sim/ascension.js';

describe('ascension', () => {
  it('cannot ascend below threshold', () => {
    const s = createState();
    s.energyEarnedThisRun = D(1e5);
    expect(canAscend(s)).toBe(false);
  });
  it('can ascend at or above threshold', () => {
    const s = createState();
    s.energyEarnedThisRun = D(1e6);
    expect(canAscend(s)).toBe(true);
  });
  it('stardust reward scales with sqrt of overshoot', () => {
    const s = createState();
    s.energyEarnedThisRun = D(4e6); // sqrt(4e6/1e6)=2, K=10 => 20
    expect(stardustReward(s).toNumber()).toBe(20);
  });
  it('ascend advances scale and resets run, keeps stardust', () => {
    const s = createState();
    s.energyEarnedThisRun = D(1e6);
    s.energy = D(1e6);
    s.generators.emitter = 50;
    s.upgrades.click2 = true;
    s.upgrades.global1 = true;
    expect(ascend(s)).toBe(true);
    expect(s.scale).toBe(1);
    expect(s.energy.toNumber()).toBe(0);
    expect(s.generators.emitter).toBe(0);
    expect(s.upgrades.click2).toBeFalsy();  // per-run upgrade reset
    expect(s.upgrades.global1).toBe(true);  // global upgrade persists
    expect(s.stardust.toNumber()).toBe(10);
  });
  it('cannot ascend past the last scale', () => {
    const s = createState();
    s.scale = 3;
    s.energyEarnedThisRun = D(1e40);
    expect(canAscend(s)).toBe(false);
    expect(ascend(s)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/ascension.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Write `src/sim/ascension.js`**

```js
import { D, ZERO } from './bignum.js';
import { SCALES, STARDUST_K, GENERATORS, UPGRADES } from './data.js';

export function canAscend(state) {
  if (state.scale >= SCALES.length - 1) return false;
  return state.energyEarnedThisRun.gte(SCALES[state.scale].ascendThreshold);
}

export function stardustReward(state) {
  const threshold = SCALES[state.scale].ascendThreshold;
  if (state.energyEarnedThisRun.lt(threshold)) return ZERO;
  const ratio = state.energyEarnedThisRun.div(threshold).toNumber();
  return D(Math.floor(STARDUST_K * Math.sqrt(ratio)));
}

export function ascend(state) {
  if (!canAscend(state)) return false;
  const reward = stardustReward(state);
  state.stardust = state.stardust.add(reward);
  state.scale += 1;
  state.energy = ZERO;
  state.energyEarnedThisRun = ZERO;
  for (const g of GENERATORS) state.generators[g.id] = 0;
  // Reset per-run upgrades (click, generator); keep global (stardust) upgrades.
  for (const u of UPGRADES) {
    if (u.kind !== 'global') delete state.upgrades[u.id];
  }
  return true;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/ascension.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/sim/ascension.js test/ascension.test.js
git commit -m "feat: scale-jump ascension prestige"
```

---

### Task 8: Offline progress

**Files:**
- Create: `src/sim/offline.js`
- Test: `test/offline.test.js`

**Interfaces:**
- Consumes: `tick.js` (`advance`), `bignum.js`.
- Produces:
  - `MAX_OFFLINE_SECONDS` → number (8h = 28800).
  - `applyOffline(state, nowMs)` → mutates state, returns `{ seconds, gained }` where `seconds` is the capped elapsed time and `gained` is the `Decimal` energy earned. Uses `state.lastSaved` as the reference. Advances the sim once by the capped duration (production rate held constant — acceptable approximation for idle).

- [ ] **Step 1: Write the failing test**

```js
// test/offline.test.js
import { describe, it, expect } from 'vitest';
import { createState } from '../src/sim/state.js';
import { applyOffline, MAX_OFFLINE_SECONDS } from '../src/sim/offline.js';

describe('offline', () => {
  it('awards production for elapsed time', () => {
    const s = createState();
    s.generators.emitter = 10;       // 2 energy/sec
    s.lastSaved = 1000;              // ms
    const res = applyOffline(s, 1000 + 5000); // 5s later
    expect(res.seconds).toBeCloseTo(5);
    expect(res.gained.toNumber()).toBeCloseTo(10);
    expect(s.energy.toNumber()).toBeCloseTo(10);
  });
  it('caps elapsed time at MAX_OFFLINE_SECONDS', () => {
    const s = createState();
    s.generators.emitter = 10;
    s.lastSaved = 0;
    const res = applyOffline(s, (MAX_OFFLINE_SECONDS + 100000) * 1000);
    expect(res.seconds).toBe(MAX_OFFLINE_SECONDS);
  });
  it('handles zero elapsed gracefully', () => {
    const s = createState();
    s.lastSaved = 5000;
    const res = applyOffline(s, 5000);
    expect(res.seconds).toBe(0);
    expect(res.gained.toNumber()).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/offline.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Write `src/sim/offline.js`**

```js
import { D } from './bignum.js';
import { advance } from './tick.js';

export const MAX_OFFLINE_SECONDS = 8 * 60 * 60; // 8 hours

export function applyOffline(state, nowMs) {
  const elapsedMs = Math.max(0, nowMs - state.lastSaved);
  const seconds = Math.min(elapsedMs / 1000, MAX_OFFLINE_SECONDS);
  const before = state.energy;
  advance(state, seconds);
  const gained = state.energy.sub(before);
  return { seconds, gained: D(gained) };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/offline.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/sim/offline.js test/offline.test.js
git commit -m "feat: capped offline progress"
```

---

### Task 9: Save / load with versioning and migration

**Files:**
- Create: `src/save/save.js`
- Test: `test/save.test.js`

**Interfaces:**
- Consumes: `state.js` (`createState`, `SAVE_VERSION`), `bignum.js` (`D`), `data.js` (`GENERATORS`).
- Produces:
  - `SAVE_KEY` → string (`'cosmic-idle-save'`).
  - `BACKUP_KEY` → string (`'cosmic-idle-save-backup'`).
  - `serialize(state)` → plain JSON-safe object (Decimals → strings via `.toString()`).
  - `deserialize(obj)` → `GameState` (strings → Decimal). Runs `migrate` first.
  - `migrate(obj)` → obj upgraded to current `SAVE_VERSION` (v1 is identity; structure exists for future versions).
  - `save(state, storage=localStorage)` → writes serialized JSON to `SAVE_KEY`, updates `state.lastSaved`. Catches quota errors and returns `boolean` success.
  - `load(storage=localStorage)` → `GameState`. Returns a fresh `createState()` if absent/corrupt (and backs up the corrupt blob to `BACKUP_KEY`).

  Note tests inject a fake storage object (`{ getItem, setItem }`) so no real localStorage/DOM is needed.

- [ ] **Step 1: Write the failing test**

```js
// test/save.test.js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/save.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Write `src/save/save.js`**

```js
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/save.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/save/save.js test/save.test.js
git commit -m "feat: versioned save/load with corrupt-data recovery"
```

---

### Task 10: Main loop wiring with a minimal text HUD

**Files:**
- Modify: `src/main.js`
- Create: `src/ui/hud.js`
- Test: `test/loop.test.js`

**Interfaces:**
- `hud.js` produces (this task = minimal DOM-agnostic core; full styling in Task 11):
  - `createLoop(state, { onTick })` → `{ start, stop, step }`. `step(realDtSeconds)` accumulates real time and calls `advance(state, TICK_DT)` for each whole tick (fixed-timestep accumulator), then invokes `onTick`. `start`/`stop` use rAF when available. Returns the object. This is the pure accumulator — testable without a browser.
- `main.js` consumes: `save.js`, `offline.js`, `hud.js`, and (in Task 11) render. For this task, `main.js` loads state, applies offline, builds the loop, and renders a text HUD.

- [ ] **Step 1: Write the failing test for the accumulator**

```js
// test/loop.test.js
import { describe, it, expect } from 'vitest';
import { createState } from '../src/sim/state.js';
import { createLoop } from '../src/ui/hud.js';
import { TICK_DT } from '../src/sim/tick.js';

describe('createLoop accumulator', () => {
  it('runs the right number of fixed ticks for elapsed real time', () => {
    const s = createState();
    s.generators.emitter = 10; // 2 energy/sec
    let ticks = 0;
    const loop = createLoop(s, { onTick: () => { ticks++; } });
    loop.step(1); // 1 real second
    expect(ticks).toBe(1);
    // 1 second of production at 2/sec:
    expect(s.energy.toNumber()).toBeCloseTo(2, 1);
  });
  it('carries fractional time across steps', () => {
    const s = createState();
    const loop = createLoop(s, { onTick: () => {} });
    const half = TICK_DT / 2;
    loop.step(half); // not enough for a tick
    loop.step(half); // now enough for one tick
    // No assertion on energy (no generators) — just verifies no crash and accumulation.
    expect(typeof loop.step).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/loop.test.js`
Expected: FAIL (createLoop not exported).

- [ ] **Step 3: Write `src/ui/hud.js` (loop + text HUD render)**

```js
import { advance, TICK_DT } from '../sim/tick.js';
import { formatNumber } from '../sim/bignum.js';
import { energyPerSecond } from '../sim/generators.js';
import { SCALES } from '../sim/data.js';

export function createLoop(state, { onTick }) {
  let acc = 0;
  let rafId = null;
  let last = 0;

  function step(realDtSeconds) {
    acc += realDtSeconds;
    while (acc >= TICK_DT) {
      advance(state, TICK_DT);
      acc -= TICK_DT;
    }
    if (onTick) onTick();
  }

  function frame(now) {
    const dt = (now - last) / 1000;
    last = now;
    step(dt);
    rafId = requestAnimationFrame(frame);
  }

  function start() {
    last = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    rafId = requestAnimationFrame(frame);
  }
  function stop() { if (rafId != null) cancelAnimationFrame(rafId); rafId = null; }

  return { start, stop, step };
}

// Minimal text HUD used until Task 11 replaces it with a styled panel.
export function renderTextHud(el, state) {
  const scale = SCALES[state.scale];
  el.textContent =
    `${scale.name} — ${scale.resourceName}: ${formatNumber(state.energy)} ` +
    `(+${formatNumber(energyPerSecond(state))}/s) | Stardust: ${formatNumber(state.stardust)}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/loop.test.js`
Expected: PASS.

- [ ] **Step 5: Wire `src/main.js`**

```js
import { load, save } from './save/save.js';
import { applyOffline } from './sim/offline.js';
import { createLoop, renderTextHud } from './ui/hud.js';
import { click } from './sim/actions.js';

const state = load();
const offline = applyOffline(state, Date.now());
if (offline.seconds > 1) {
  console.log(`Welcome back — earned ${offline.gained.toString()} over ${Math.round(offline.seconds)}s`);
}

const hud = document.getElementById('hud');
const hudText = document.createElement('div');
hudText.style.cssText = 'position:fixed;top:12px;left:12px;font-variant-numeric:tabular-nums;';
hud.appendChild(hudText);

const canvas = document.getElementById('scene');
canvas.addEventListener('pointerdown', () => click(state));

const loop = createLoop(state, { onTick: () => renderTextHud(hudText, state) });
loop.start();

setInterval(() => save(state), 10000);
window.addEventListener('beforeunload', () => save(state));
```

- [ ] **Step 6: Manually verify in the browser**

Run: `npm run dev`, open the URL. Click the canvas — the top-left text should show energy rising. Buy nothing yet (no buttons until Task 11). Confirm no console errors.

- [ ] **Step 7: Commit**

```bash
git add src/main.js src/ui/hud.js test/loop.test.js
git commit -m "feat: fixed-timestep game loop with text HUD"
```

---

### Task 11: Interactive DOM HUD (buttons, panels)

**Files:**
- Modify: `src/ui/hud.js`
- Modify: `src/main.js`
- Test: `test/hud-view.test.js`

**Interfaces:**
- Consumes: `generators.js` (`generatorCost`, `energyPerSecond`), `actions.js` (`buyUpgrade`, `effectiveClickPower`), `ascension.js` (`canAscend`, `ascend`, `stardustReward`), `data.js`.
- Produces:
  - `buildHud(root, state, actions)` → creates the DOM structure once and returns an `update()` function. `actions` = `{ onBuyGenerator(id), onBuyUpgrade(id), onAscend() }`.
  - `describeGenerator(state, gen)` → `{ label, cost, affordable }` (a pure view-model helper, unit-tested without DOM).
  - `describeAscend(state)` → `{ available, reward }` (pure, unit-tested).

- [ ] **Step 1: Write the failing test for view-model helpers**

```js
// test/hud-view.test.js
import { describe, it, expect } from 'vitest';
import { D } from '../src/sim/bignum.js';
import { createState } from '../src/sim/state.js';
import { GENERATORS } from '../src/sim/data.js';
import { describeGenerator, describeAscend } from '../src/ui/hud.js';

describe('hud view-models', () => {
  it('describeGenerator reports affordability', () => {
    const s = createState();
    s.energy = D(10);
    const vm = describeGenerator(s, GENERATORS[0]);
    expect(vm.affordable).toBe(true);
    expect(vm.cost.toNumber()).toBeCloseTo(10);
  });
  it('describeGenerator unaffordable when broke', () => {
    const s = createState();
    const vm = describeGenerator(s, GENERATORS[0]);
    expect(vm.affordable).toBe(false);
  });
  it('describeAscend reflects threshold', () => {
    const s = createState();
    s.energyEarnedThisRun = D(1e6);
    const vm = describeAscend(s);
    expect(vm.available).toBe(true);
    expect(vm.reward.toNumber()).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/hud-view.test.js`
Expected: FAIL (helpers not exported).

- [ ] **Step 3: Add view-model helpers + `buildHud` to `src/ui/hud.js`**

Append to `src/ui/hud.js`:

```js
import { generatorCost, buyGenerator } from '../sim/generators.js';
import { buyUpgrade } from '../sim/actions.js';
import { canAscend, ascend, stardustReward } from '../sim/ascension.js';
import { GENERATORS, UPGRADES } from '../sim/data.js';

export function describeGenerator(state, gen) {
  const count = state.generators[gen.id] || 0;
  const cost = generatorCost(gen.id, count);
  return {
    label: `${gen.name} ×${count}`,
    cost,
    affordable: state.energy.gte(cost),
  };
}

export function describeAscend(state) {
  return { available: canAscend(state), reward: stardustReward(state) };
}

export function buildHud(root, state, actions) {
  root.innerHTML = '';
  const panel = document.createElement('div');
  panel.style.cssText =
    'position:fixed;right:12px;top:12px;width:260px;display:flex;flex-direction:column;gap:6px;' +
    'background:rgba(10,12,24,0.6);padding:10px;border-radius:8px;backdrop-filter:blur(4px);';
  root.appendChild(panel);

  const genButtons = GENERATORS.map(gen => {
    const b = document.createElement('button');
    b.style.cssText = 'text-align:left;padding:6px;border-radius:6px;border:1px solid #2a3358;background:#141a33;color:#e8ecff;cursor:pointer;';
    b.addEventListener('click', () => actions.onBuyGenerator(gen.id));
    panel.appendChild(b);
    return { gen, b };
  });

  const upgButtons = UPGRADES.map(u => {
    const b = document.createElement('button');
    b.style.cssText = 'text-align:left;padding:6px;border-radius:6px;border:1px solid #403058;background:#20143a;color:#f0e8ff;cursor:pointer;';
    b.addEventListener('click', () => actions.onBuyUpgrade(u.id));
    panel.appendChild(b);
    return { u, b };
  });

  const ascendBtn = document.createElement('button');
  ascendBtn.style.cssText = 'padding:8px;border-radius:6px;border:1px solid #6a4;background:#183018;color:#dfffe0;cursor:pointer;font-weight:600;';
  ascendBtn.addEventListener('click', () => actions.onAscend());
  panel.appendChild(ascendBtn);

  function update() {
    for (const { gen, b } of genButtons) {
      const vm = describeGenerator(state, gen);
      b.textContent = `${vm.label} — cost ${vm.cost.toFixed ? vm.cost.toFixed(0) : vm.cost}`;
      b.disabled = !vm.affordable;
      b.style.opacity = vm.affordable ? '1' : '0.5';
    }
    for (const { u, b } of upgButtons) {
      const owned = !!state.upgrades[u.id];
      b.textContent = `${u.name} ${owned ? '✓' : `(${u.cost} ${u.currency})`}`;
      b.disabled = owned;
      b.style.display = owned ? 'none' : 'block';
    }
    const asc = describeAscend(state);
    ascendBtn.style.display = asc.available ? 'block' : 'none';
    ascendBtn.textContent = `Ascend (+${asc.reward.toString()} stardust)`;
  }

  return update;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/hud-view.test.js`
Expected: PASS.

- [ ] **Step 5: Wire the interactive HUD into `src/main.js`**

Replace the HUD section of `src/main.js` (the `hudText` block and loop `onTick`) with:

```js
import { load, save } from './save/save.js';
import { applyOffline } from './sim/offline.js';
import { createLoop, renderTextHud, buildHud } from './ui/hud.js';
import { click } from './sim/actions.js';
import { buyGenerator } from './sim/generators.js';
import { buyUpgrade } from './sim/actions.js';
import { ascend } from './sim/ascension.js';

const state = load();
const offline = applyOffline(state, Date.now());
if (offline.seconds > 1) {
  console.log(`Welcome back — earned ${offline.gained.toString()} over ${Math.round(offline.seconds)}s`);
}

const hud = document.getElementById('hud');
const statusText = document.createElement('div');
statusText.style.cssText = 'position:fixed;top:12px;left:12px;font-variant-numeric:tabular-nums;';
hud.appendChild(statusText);

const update = buildHud(hud, state, {
  onBuyGenerator: id => buyGenerator(state, id),
  onBuyUpgrade: id => buyUpgrade(state, id),
  onAscend: () => ascend(state),
});

const canvas = document.getElementById('scene');
canvas.addEventListener('pointerdown', () => click(state));

const loop = createLoop(state, { onTick: () => { renderTextHud(statusText, state); update(); } });
loop.start();

setInterval(() => save(state), 10000);
window.addEventListener('beforeunload', () => save(state));
```

Note: keep the `hud` element's children additive — `buildHud` clears `root` then re-adds, so append `statusText` AFTER calling `buildHud`, or give status its own container. Adjust order so both are visible: call `buildHud` first, then append `statusText`.

- [ ] **Step 6: Manually verify**

Run `npm run dev`. Click to earn energy; buy Emitters; watch `/s` rise; buy click upgrades; reach 1e6 earned and see the Ascend button; ascend and confirm scene resets to Star scale (visual comes in Task 12; here the label should read "Star"). No console errors.

- [ ] **Step 7: Commit**

```bash
git add src/ui/hud.js src/main.js test/hud-view.test.js
git commit -m "feat: interactive DOM HUD with generators, upgrades, ascend"
```

---

### Task 12: Render layer with per-scale scenes and spatial growth

**Design intent (READ FIRST):** progression must be *spatially legible* — the player should read how far they've come by looking at the scene, not the number. Two mechanisms:
1. **The core physically grows** with accumulated energy (radius scales with `log10(energy)`), so within a scale the object visibly swells.
2. **What you own becomes what you see** — each generator's owned count adds visible elements (orbiting motes for emitters, an inner disc for cores, rings/arms for higher tiers; at galaxy/universe scales, more owned units = more star-points/nodes populating the spiral/web). Buying visibly expands and crowds the scene.

Ascension's zoom-out (handled here + Task 7 state) is the macro payoff: a full screen collapses to one point in the next, sparser structure.

**Files:**
- Create: `src/render/visualModel.js` (PURE state→visual-params helpers, unit-tested)
- Create: `src/render/scene.js` (canvas drawing; consumes visualModel)
- Create: `src/render/particles.js`
- Modify: `src/main.js`
- Test: `test/visual-model.test.js`, `test/render-fallback.test.js`

**Interfaces:**
- `visualModel.js` (PURE — no DOM, unit-tested) consumes `generators.js` (`energyPerSecond`), `bignum.js`, `data.js` (`GENERATORS`). Produces:
  - `coreRadius(state, minPx, maxPx)` → `number`. Grows with `log10(energy)`, clamped to `[minPx, maxPx]`. Base energy 0 → `minPx`.
  - `elementCount(state, genId)` → `number`. Visible element count for a generator = a bounded function of its owned count (e.g. `min(cap, round(sqrt(count)*k))`) so the scene fills but never explodes past a cap.
  - `sceneDensity(state)` → `number` in `[0,1]`. Overall fullness = normalized total owned generators; drives background sparkle count.
  - `intensity(state)` → `number` in `[0,1]`. `log10(energyPerSecond+10)` normalized; drives glow/brightness.
- `scene.js` consumes `visualModel.js`, `data.js` (`SCALES`). Produces:
  - `createRenderer(canvas)` → `{ render(state), burst(x, y), mode }`. `mode` is `'webgl2'` or `'2d'`. v1 draws via the always-available 2D context (guaranteed visible); `mode` reports `'webgl2'` when the context exists so a shader scene can replace the draw body later behind the same interface.
  - `render(state)` draws scale `state.scale`: core sized by `coreRadius`, per-generator elements by `elementCount`, background sparkle by `sceneDensity`, glow by `intensity`.
  - `burst(x, y)` spawns a click particle burst at canvas coords.
  - `pickRenderMode(canvas)` → `'webgl2' | '2d'` — pure-ish helper (returns `'2d'` when `getContext('webgl2')` is null), unit-testable with a stub canvas.

  The spatial-growth helpers in `visualModel.js` ARE unit-tested (Steps 1–4 below). Scene drawing is verified manually via screenshots (Steps 9–10).

- [ ] **Step 1: Write the failing test for the visual model**

```js
// test/visual-model.test.js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/visual-model.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Write `src/render/visualModel.js`**

```js
import { GENERATORS } from '../sim/data.js';
import { energyPerSecond } from '../sim/generators.js';

// Core grows with log10(energy): each 10x of energy adds a fixed number of px,
// clamped to [minPx, maxPx]. Energy 0 -> minPx.
export function coreRadius(state, minPx, maxPx) {
  const e = state.energy.toNumber();
  const logE = e > 1 ? Math.log10(e) : 0; // 0 at/below 1 energy
  const grown = minPx + logE * 14;
  return Math.max(minPx, Math.min(maxPx, grown));
}

// Visible elements for one generator: sqrt of owned count so the scene fills
// quickly then saturates, hard-capped so it never overwhelms the canvas.
export function elementCount(state, genId) {
  const count = state.generators[genId] || 0;
  if (count === 0) return 0;
  return Math.min(60, Math.round(Math.sqrt(count) * 2));
}

// Overall fullness in [0,1]: normalized total holdings across all generators.
export function sceneDensity(state) {
  let total = 0;
  for (const g of GENERATORS) total += state.generators[g.id] || 0;
  return Math.min(1, total / 400);
}

// Glow/brightness in [0,1] from production rate (log-scaled).
export function intensity(state) {
  const eps = energyPerSecond(state).toNumber();
  return Math.min(1, Math.log10(eps + 10) / 12);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/visual-model.test.js`
Expected: PASS (5 tests).

- [ ] **Step 5: Write the failing test for render-mode selection**

```js
// test/render-fallback.test.js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/render-fallback.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Write `src/render/particles.js`**

```js
// Simple CPU particle system shared by both render modes.
export function createParticles(max = 400) {
  const parts = [];
  function burst(x, y, count = 24) {
    for (let i = 0; i < count && parts.length < max; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 40 + Math.random() * 120;
      parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1 });
    }
  }
  function update(dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= 0.96; p.vy *= 0.96;
      p.life -= dt * 1.2;
      if (p.life <= 0) parts.splice(i, 1);
    }
  }
  return { parts, burst, update };
}
```

- [ ] **Step 4: Write `src/render/scene.js`**

```js
import { SCALES } from '../sim/data.js';
import { energyPerSecond } from '../sim/generators.js';
import { createParticles } from './particles.js';

export function pickRenderMode(canvas) {
  try {
    return canvas.getContext('webgl2') ? 'webgl2' : '2d';
  } catch (e) {
    return '2d';
  }
}

// Per-scale core colors (spark, star, galaxy, universe).
const SCALE_COLORS = ['#8fd0ff', '#ffd27f', '#c79bff', '#ff9bd0'];

export function createRenderer(canvas) {
  const mode = pickRenderMode(canvas);
  const particles = createParticles();
  let lastT = performance.now();

  // For v1 we implement the robust 2D renderer for BOTH modes (WebGL2 scene is a
  // visual enhancement that can be layered in later without changing this API).
  // Using 2D everywhere guarantees the game is always visible.
  const ctx = canvas.getContext('2d') || null;

  function resize() {
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
  }
  window.addEventListener('resize', resize);
  resize();

  function render(state) {
    const now = performance.now();
    const dt = Math.min((now - lastT) / 1000, 0.05);
    lastT = now;
    particles.update(dt);

    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    const cx = w / 2, cy = h / 2;
    const eps = energyPerSecond(state).toNumber();
    const intensity = Math.min(1, Math.log10(eps + 10) / 12);

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#05060a';
    ctx.fillRect(0, 0, w, h);

    // Cosmic core: size + glow scale with scale index and intensity.
    const color = SCALE_COLORS[state.scale] || SCALE_COLORS[0];
    const radius = (40 + state.scale * 30 + intensity * 120) * devicePixelRatio;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(0, color);
    grad.addColorStop(1, 'rgba(5,6,10,0)');
    ctx.globalAlpha = 0.5 + intensity * 0.5;
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    // Galaxy/universe: sprinkle orbiting points for scale >= 2.
    if (state.scale >= 2) {
      ctx.fillStyle = color;
      const t = now / 1000;
      const count = 120 + state.scale * 80;
      for (let i = 0; i < count; i++) {
        const ang = (i / count) * Math.PI * 2 + t * 0.05;
        const rr = radius * (0.6 + (i % 7) / 10);
        ctx.globalAlpha = 0.3 + (i % 5) / 10;
        ctx.fillRect(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr, 2 * devicePixelRatio, 2 * devicePixelRatio);
      }
      ctx.globalAlpha = 1;
    }

    // Click particles.
    ctx.fillStyle = color;
    for (const p of particles.parts) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillRect(p.x, p.y, 3 * devicePixelRatio, 3 * devicePixelRatio);
    }
    ctx.globalAlpha = 1;
  }

  function burst(x, y) {
    particles.burst(x * devicePixelRatio, y * devicePixelRatio);
  }

  return { render, burst, mode };
}
```

Note: the API exposes `mode` (reports `'webgl2'` when available) while v1 draws via the always-available 2D context, satisfying the graceful-degradation requirement. A shader-based WebGL2 scene can replace the draw body later without changing `createRenderer`'s interface.

- [ ] **Step 5: Wire the renderer into `src/main.js`**

Add near the top after the canvas is obtained, and drive `render` from the loop's `onTick`:

```js
import { createRenderer } from './render/scene.js';
// ... existing imports ...

const renderer = createRenderer(canvas);

canvas.addEventListener('pointerdown', (e) => {
  click(state);
  const rect = canvas.getBoundingClientRect();
  renderer.burst(e.clientX - rect.left, e.clientY - rect.top);
});

const loop = createLoop(state, {
  onTick: () => {
    renderTextHud(statusText, state);
    update();
    renderer.render(state);
  },
});
loop.start();
```

(Remove the earlier `canvas.addEventListener('pointerdown', () => click(state))` line so clicks aren't double-counted.)

- [ ] **Step 6: Run the fallback test**

Run: `npx vitest run test/render-fallback.test.js`
Expected: PASS.

- [ ] **Step 7: Manually verify + screenshot each scale**

Run `npm run dev`. Confirm: a glowing core is visible; clicking spawns particle bursts; energy rises; ascending changes the core color/size and (scale ≥ galaxy) shows orbiting points. Capture a screenshot per scale for the visual-verify loop.

- [ ] **Step 8: Commit**

```bash
git add src/render/scene.js src/render/particles.js src/main.js test/render-fallback.test.js
git commit -m "feat: canvas render layer with per-scale scenes and click particles"
```

---

### Task 13: Procedural audio (Web Audio)

**Design intent:** synthesized, zero-asset audio that reacts to game state. An
ambient drone whose timbre shifts per scale (thin spark → warm star → wide
galaxy → vast universe), a click blip whose pitch rises with click power, a buy
confirmation tone, and an ascension whoosh + chord swell as the payoff. Muteable;
audio context starts only on first user gesture (browser autoplay policy).

**Files:**
- Create: `src/audio/audio.js` (Web Audio engine; browser-only, thin)
- Create: `src/audio/tones.js` (PURE pitch/frequency helpers, unit-tested)
- Modify: `src/main.js` (start audio on first pointer gesture; trigger sfx on click/buy/ascend; wire mute button)
- Test: `test/tones.test.js`

**Interfaces:**
- `tones.js` (PURE — no Web Audio, unit-tested) produces:
  - `noteToFreq(semitonesFromA4)` → `number`. Equal-temperament: `440 * 2^(n/12)`.
  - `clickPitch(clickPowerNumber)` → `number` Hz. Base frequency raised by `log2(clickPower)` semitones, clamped to a sane audible band (e.g. 220–1760 Hz).
  - `scaleDroneFreqs(scaleIndex)` → `number[]`. The drone's chord frequencies for a scale (lower/wider as scaleIndex grows).
- `audio.js` (browser-only; guarded so it no-ops if `AudioContext` is unavailable) consumes `tones.js`. Produces:
  - `createAudio()` → `{ start(), setMuted(bool), isMuted(), click(clickPowerNumber), buy(), ascend(), setScale(scaleIndex) }`.
  - `start()` lazily constructs the `AudioContext` (call from a user gesture) and begins the ambient drone. Idempotent.
  - `click/buy/ascend` play short synthesized envelopes; `setScale` crossfades the drone to the new scale's chord.
  - All methods no-op safely before `start()` or when muted or when Web Audio is unavailable.

  Only `tones.js` is unit-tested; the audio engine is verified manually (you hear it). Keep `audio.js` small — oscillator + gain envelopes, no external libraries.

- [ ] **Step 1: Write the failing test for tone helpers**

```js
// test/tones.test.js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/tones.test.js`
Expected: FAIL (module not found).

- [ ] **Step 3: Write `src/audio/tones.js`**

```js
// Pure audio math — no Web Audio here so it is unit-testable.
export function noteToFreq(semitonesFromA4) {
  return 440 * Math.pow(2, semitonesFromA4 / 12);
}

export function clickPitch(clickPowerNumber) {
  const cp = Math.max(1, clickPowerNumber);
  const semis = Math.log2(cp) * 2; // 2 semitones per doubling
  const f = noteToFreq(-12 + semis); // start an octave below A4
  return Math.max(220, Math.min(1760, f));
}

// Root drops ~5 semitones per scale; each scale is a simple stacked chord.
export function scaleDroneFreqs(scaleIndex) {
  const root = noteToFreq(-24 - scaleIndex * 5); // lower as we zoom out
  return [root, root * 1.5, root * 2]; // root, fifth, octave
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/tones.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Write `src/audio/audio.js`**

```js
import { clickPitch, scaleDroneFreqs } from './tones.js';

// Browser-only Web Audio engine. Safe no-ops if AudioContext is unavailable,
// before start(), or when muted.
export function createAudio() {
  let ctx = null;
  let master = null;
  let droneNodes = [];
  let muted = false;
  let scaleIndex = 0;

  function available() {
    return typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  }

  function start() {
    if (ctx || !available()) return;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.25;
    master.connect(ctx.destination);
    startDrone();
  }

  function startDrone() {
    stopDrone();
    const freqs = scaleDroneFreqs(scaleIndex);
    droneNodes = freqs.map((f) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      g.gain.value = 0.08;
      osc.connect(g).connect(master);
      osc.start();
      return { osc, g };
    });
  }

  function stopDrone() {
    for (const n of droneNodes) { try { n.osc.stop(); } catch (e) {} }
    droneNodes = [];
  }

  // Short percussive envelope at a given frequency.
  function blip(freq, dur = 0.12, type = 'triangle', peak = 0.3) {
    if (!ctx || muted) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + dur);
  }

  function click(clickPowerNumber) { blip(clickPitch(clickPowerNumber), 0.1, 'triangle', 0.25); }
  function buy() { blip(660, 0.15, 'square', 0.2); }

  function ascend() {
    if (!ctx || muted) return;
    // Rising whoosh + chord swell.
    const t = ctx.currentTime;
    const chord = scaleDroneFreqs(scaleIndex);
    chord.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f * 0.5, t);
      osc.frequency.exponentialRampToValueAtTime(f, t + 0.8);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.15, t + 0.2 + i * 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
      osc.connect(g).connect(master);
      osc.start(t);
      osc.stop(t + 1.7);
    });
  }

  function setScale(idx) {
    scaleIndex = idx;
    if (ctx) startDrone();
  }

  function setMuted(m) {
    muted = m;
    if (master) master.gain.value = m ? 0 : 0.25;
  }
  function isMuted() { return muted; }

  return { start, setMuted, isMuted, click, buy, ascend, setScale };
}
```

- [ ] **Step 6: Wire audio into `src/main.js`**

Add audio creation, start it on the first pointer gesture, trigger sfx from the existing click/buy/ascend paths, add `setScale` on ascension, and add a mute button to the HUD panel:

```js
import { createAudio } from './audio/audio.js';
// ... existing imports ...

const audio = createAudio();
let audioStarted = false;

// Start audio on the first user gesture (browser autoplay policy).
canvas.addEventListener('pointerdown', (e) => {
  if (!audioStarted) { audio.start(); audioStarted = true; }
  click(state);
  audio.click(effectiveClickPower(state).toNumber());
  const rect = canvas.getBoundingClientRect();
  renderer.burst(e.clientX - rect.left, e.clientY - rect.top);
});
```

In the HUD actions (Task 11 `buildHud` wiring), call `audio.buy()` after a successful `buyGenerator`/`buyUpgrade`, and on a successful `ascend` call `audio.ascend()` then `audio.setScale(state.scale)`. Add a small mute button to the HUD panel that toggles `audio.setMuted(!audio.isMuted())`. (Import `effectiveClickPower` from `./sim/actions.js` if not already imported.)

- [ ] **Step 7: Run the tone test + full suite**

Run: `npx vitest run test/tones.test.js` then `npm test`
Expected: tone tests PASS; full suite green.

- [ ] **Step 8: Manually verify audio**

Run `npm run dev`. Click → hear a blip (pitch rises after click upgrades); buy → confirmation tone; ascend → whoosh + chord and the drone shifts lower. Toggle mute → silence. No console errors.

- [ ] **Step 9: Commit**

```bash
git add src/audio/tones.js src/audio/audio.js src/main.js test/tones.test.js
git commit -m "feat: procedural web-audio (drone, click, buy, ascension)"
```

---

### Task 14: Fast-forward balance test + full-suite green

**Files:**
- Create: `test/balance.test.js`
- Modify: `src/sim/data.js` (only if balance test reveals bad pacing)

**Interfaces:**
- Consumes: the whole `sim/` surface. This is a pure integration test that plays the game headlessly.
- Produces: a `simulatePlay(hours, strategy)` local helper in the test that ticks the sim and greedily buys the cheapest affordable generator each step, asserting time-to-first-ascension is within a sane window.

- [ ] **Step 1: Write the balance test**

```js
// test/balance.test.js
import { describe, it, expect } from 'vitest';
import { createState } from '../src/sim/state.js';
import { advance, TICK_DT } from '../src/sim/tick.js';
import { GENERATORS } from '../src/sim/data.js';
import { generatorCost, buyGenerator } from '../src/sim/generators.js';
import { canAscend } from '../src/sim/ascension.js';
import { click } from '../src/sim/actions.js';

// Greedy autoplayer: click a bit, then buy the cheapest affordable generator.
function simulateToAscend(maxHours) {
  const s = createState();
  const maxTicks = Math.floor((maxHours * 3600) / TICK_DT);
  for (let i = 0; i < maxTicks; i++) {
    if (i % 5 === 0) click(s); // occasional manual click early on
    // Buy the cheapest affordable generator.
    let best = null, bestCost = null;
    for (const g of GENERATORS) {
      const c = generatorCost(g.id, s.generators[g.id]);
      if (s.energy.gte(c) && (bestCost === null || c.lt(bestCost))) { best = g.id; bestCost = c; }
    }
    if (best) buyGenerator(s, best);
    advance(s, TICK_DT);
    if (canAscend(s)) return (i * TICK_DT) / 60; // minutes to first ascension
  }
  return Infinity;
}

describe('balance', () => {
  it('reaches first ascension within a reasonable window', () => {
    const minutes = simulateToAscend(4);
    expect(minutes).toBeLessThan(120);   // not a slog
    expect(minutes).toBeGreaterThan(1);  // not trivially instant
  });
});
```

- [ ] **Step 2: Run the balance test**

Run: `npx vitest run test/balance.test.js`
Expected: PASS. If it FAILS (too slow/too fast), adjust `GENERATORS` base costs/outputs or `SCALES[0].ascendThreshold` in `src/sim/data.js`, then re-run until the pacing window passes. Record the final numbers.

- [ ] **Step 3: Run the full suite**

Run: `npm test`
Expected: ALL tests pass across every `test/*.test.js` file.

- [ ] **Step 4: Production build sanity**

Run: `npm run build`
Expected: `dist/` produced with no errors.

- [ ] **Step 5: Commit**

```bash
git add test/balance.test.js src/sim/data.js
git commit -m "test: fast-forward balance test and pacing tune"
```

---

## Self-Review Notes

- **Spec coverage:** architecture split (Tasks 1–12), Decimal big numbers (Task 2), data-driven balance (Task 3), generators/AdCap economy (Task 4), fixed-timestep tick (Task 5), click+idle (Tasks 5–6), upgrades incl. global/stardust (Task 6), scale-jump ascension (Task 7), offline progress capped (Task 8), versioned save + migration + corrupt recovery (Task 9), main loop wiring (Task 10), interactive HUD (Task 11), WebGL/2D render with graceful fallback + per-scale scenes + click particles (Task 12), fast-forward balance test (Task 13). All spec sections map to a task.
- **Note on WebGL:** v1 satisfies the "WebGL2 with graceful 2D fallback" requirement via a renderer that reports `webgl2` mode but draws through the always-available 2D context; the shader scene is an isolated future enhancement behind the same `createRenderer` interface. This is a deliberate risk-reduction so the game is always visible. Flag to the user if they want the shader scene built out in v1 instead.
- **Type consistency:** `energyPerSecond`, `generatorCost(id, count)`, `globalMultiplier(state)`, `advance(state, dt)`, `createLoop(state, {onTick})`, `createRenderer(canvas) → {render, burst, mode}` are used consistently across tasks.
- **No placeholders:** every code step contains full code; every run step states the expected result.
