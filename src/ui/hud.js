import { advance, TICK_DT } from '../sim/tick.js';
import { formatNumber } from '../sim/bignum.js';
import { generatorCost, energyPerSecond } from '../sim/generators.js';
import { canAscend, stardustReward } from '../sim/ascension.js';
import { SCALES, GENERATORS, UPGRADES } from '../sim/data.js';

export function createLoop(state, { onTick }) {
  let acc = 0;
  let rafId = null;
  let last = 0;

  function step(realDtSeconds) {
    acc += realDtSeconds;
    // Epsilon guard: TICK_DT (1/20) isn't exactly representable in binary
    // floating point, so repeated subtraction can leave acc a hair below
    // TICK_DT even when a whole number of ticks' worth of time has elapsed.
    while (acc >= TICK_DT - 1e-9) {
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
      b.textContent = `${vm.label} — cost ${formatNumber(vm.cost)}`;
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
    ascendBtn.textContent = `Ascend (+${formatNumber(asc.reward)} stardust)`;
  }

  return update;
}
