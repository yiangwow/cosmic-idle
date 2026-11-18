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
