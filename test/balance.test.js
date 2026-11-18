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
