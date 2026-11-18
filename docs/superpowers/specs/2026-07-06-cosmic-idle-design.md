# Cosmic Idle — Design Spec

**Date:** 2026-07-06
**Status:** Approved
**Author:** yiangwow

## Overview

A cosmic-themed incremental (idle) game. The player starts as a single spark of
energy, clicks to seed production, buys auto-generators, and **ascends** through
cosmic scales — spark → star → galaxy → universe. Each ascension is a prestige
that resets local progress for a permanent multiplier and visually transforms the
entire scene.

Built with **Vite + WebGL2** for a full visual production, with a strict
separation between the pure simulation (numbers) and the render/UI layers (views).

## Goals

- A satisfying click+idle loop with real long-term progression (4 scale tiers).
- Big spectacle: each ascension changes the whole cosmic scene.
- Clean engineering: simulation is pure, deterministic, and fully unit-tested;
  balance lives in data, not logic.
- Never hard-crashes: graceful WebGL fallback, safe save migration, offline math.

## Non-Goals (v1 / YAGNI)

- Dimensional "each generator produces the tier below" economy (stretch only).
- Multiplayer, accounts, cloud saves, or a backend of any kind.
- Mobile-specific UI (should not break on mobile, but desktop-first).
- Sound (may be added later; not in v1 scope).

## Architecture

Three independent layers around **one source of truth** (`GameState`).

```
cosmic-idle/
├── index.html
├── src/
│   ├── main.js            # wires fixed-timestep sim loop + rAF render loop + UI events
│   ├── sim/               # PURE logic — no DOM, no GL. Fully unit-tested.
│   │   ├── state.js       # GameState factory + the single source of truth shape
│   │   ├── data.js        # scale / generator / upgrade definitions (all balance numbers)
│   │   ├── generators.js  # cost + output curves, buy logic
│   │   ├── tick.js        # advance(state, dtSeconds) — deterministic
│   │   ├── ascension.js   # prestige: reset local progress, award Stardust, unlock next scale
│   │   ├── offline.js     # compute capped away-time earnings
│   │   └── bignum.js      # thin wrapper over break_infinity.js (Decimal)
│   ├── render/            # WebGL scene — READS state, never writes
│   │   ├── scene.js       # WebGL2 setup, per-scale renderers, ascension transition
│   │   └── particles.js   # click bursts + production-intensity glow
│   ├── ui/                # DOM HUD overlay on top of the canvas
│   │   └── hud.js         # resource counters, generator buy buttons, upgrade panel, ascend button
│   └── save/
│       └── save.js        # versioned serialize/deserialize to localStorage
└── test/                  # Vitest specs for everything in sim/ + save/
```

**Invariant:** `sim/` imports nothing from `render/`, `ui/`, or the DOM. The
render and UI layers are pure functions of `GameState`. Input events call `sim/`
mutators; the loops read state back out.

## Data Flow

1. **Input** (canvas click, buy button, ascend) → dispatches an action that calls
   a `sim/` mutator on `GameState`.
2. **Fixed-timestep loop** (accumulator, 20 ticks/sec) calls `tick.advance(state, dt)`
   independent of framerate → deterministic simulation, clean offline handling.
3. **rAF render loop** reads `GameState` → draws the WebGL scene and updates the
   DOM HUD. Never mutates state.
4. **Autosave** every ~10s and on `beforeunload`.

## Economy

- **Big numbers:** `break_infinity.js` (`Decimal`) via `sim/bignum.js`. All
  resource/cost/output math goes through Decimal to survive past `1e308`.
- **Core resource: Energy**, reflavored per scale (photons → fusion → starlight → cosmic).
- **Generators (v1 = AdCap-style):** ~5 auto-producers per scale. Each has a base
  cost, geometric cost growth per purchase, and a direct Energy/sec output. Simple,
  proven, easy to balance.
- **Click + idle hybrid:** clicking the central object emits `clickPower` Energy.
  Dominant early game, negligible late game (by design).
- **Upgrades:** three families — click-power boosts, per-generator multipliers,
  and global multipliers. Purchasable with Energy; some global ones with Stardust.
- **Prestige currency: Stardust.** Awarded on Ascension by a formula over Energy
  earned this run. Grants a permanent global production multiplier that persists
  across all resets.

All generator/upgrade/scale numbers live in `sim/data.js` so balancing never
touches logic.

### Stardust formula (initial)

`stardustGained = floor( k * sqrt(energyEarnedThisRun / scaleThreshold) )`,
tuned in `data.js`. Exact constants are a balance concern, iterated via the
fast-forward test.

## Scales & Prestige

Four cosmic scales, each a distinct WebGL scene. **Ascend** is available once
Energy crosses that scale's threshold; it resets Energy + generators + local
upgrades, awards Stardust, and advances `state.scale`.

1. **Spark** — a lone pulsing mote in a dark field.
2. **Star** — an ignited star with a corona; clicks throw solar flares.
3. **Galaxy** — the star becomes one point in a rotating spiral of particles.
4. **Universe** — the galaxy is one node in a cosmic web of galaxies.

Ascension plays a **zoom-out / white-flash transition** and rebuilds the scene for
the new scale. Scene brightness/intensity scales with `log(energyPerSec)` so
growth is visually felt. Each click emits a particle burst.

## Rendering

- **WebGL2** fragment-shader-driven cosmic object + a GPU/CPU particle system.
- Per-scale renderers selected by `state.scale`.
- **Graceful degradation:** if WebGL2 is unavailable, fall back to a 2D canvas
  renderer so the game still runs (reduced spectacle, never a crash).
- Render layer reads a read-only snapshot/reference of `GameState`.

## Save System

- One **versioned** JSON blob in `localStorage`.
- Autosave every ~10s and on `beforeunload`.
- **Offline progress:** on load, compute elapsed wall-clock time since last save,
  cap it (default 8h), fast-forward the sim at the saved production rate, and show
  a "Welcome back — you earned X" summary.
- **Migration & safety:** on load, check `saveVersion`. Known-older → run migration.
  Corrupt/unparseable/incompatible → fall back to a fresh game with a
  non-destructive warning (old blob preserved under a backup key). Catch
  `localStorage` quota errors; never crash the game loop.

## Error Handling

- All Decimal ops guard against `NaN`/`Infinity` leaking into state.
- Save load is fully defensive (see above).
- WebGL context loss → attempt restore; on failure, drop to 2D fallback.
- UI actions validate affordability through `sim/` before mutating.

## Testing

- **Vitest** over the pure `sim/` + `save/` modules:
  - Generator cost + output curves at various purchase counts.
  - `tick.advance` determinism (same input → same output).
  - Offline earnings math, including the cap.
  - Ascension: correct reset, Stardust award, scale advance, multiplier persistence.
  - Bignum edge cases (very large values, zero, formatting).
  - Save round-trip (serialize → deserialize equality) + version migration.
- **Fast-forward balance test:** simulate N hours of play and assert
  time-to-first-ascension lands in a target window (pacing sanity).
- **Render/UI:** manual + screenshot verification (visual-verify loop), not unit
  tested in v1.

## Milestones (rough, for the plan)

1. Project scaffold: Vite, structure, `bignum`, `GameState`, empty loops.
2. Economy core: generators, upgrades, tick, click — playable with a text HUD.
3. Save/load + offline progress.
4. Ascension + the four scales' logic.
5. WebGL render layer + per-scale scenes + transitions.
6. Balance pass via fast-forward test; polish.

## Open Questions

None blocking. Balance constants (`k`, thresholds, cost growth) are expected to be
iterated during milestone 6, not pinned now.
