import { GENERATORS } from '../sim/data.js';
import { coreRadius, elementCount, sceneDensity, intensity as sceneIntensity } from './visualModel.js';
import { createParticles } from './particles.js';

export function pickRenderMode(canvas) {
  try {
    return canvas.getContext('webgl2') ? 'webgl2' : '2d';
  } catch (e) {
    return '2d';
  }
}

// Per-scale identity (spark, star, galaxy, universe): each scale must read as
// visually distinct so ascending is legible from color/arrangement alone,
// not just the HUD number.
const SCALE_PALETTE = [
  { core: '#8fd0ff', accent: '#cdeeff', bg: '#05060a' }, // spark: small icy point
  { core: '#ffb347', accent: '#ffe0a3', bg: '#0a0703' }, // star: warm fusion glow
  { core: '#c79bff', accent: '#9fd6ff', bg: '#07050d' }, // galaxy: violet spiral
  { core: '#ff9bd0', accent: '#ffffff', bg: '#0a0510' }, // universe: bright web
];

const MIN_CORE_PX = 24;
const MAX_CORE_PX = 260;

function now() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function pixelRatio() {
  return (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
}

// Deterministic pseudo-random in [0,1) so background sparkle/inner-disc
// points don't jitter to new positions every frame.
function pseudoRandom(i, seed) {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function createRenderer(canvas) {
  const mode = pickRenderMode(canvas);
  const particles = createParticles();
  const startT = now();
  let lastT = startT;

  // v1 draws via the always-available 2D context so the game is guaranteed
  // visible; `mode` still reports 'webgl2' when available for a future
  // shader-based scene to slot in behind this same interface.
  const ctx = canvas && typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null;

  function resize() {
    if (!canvas) return;
    const dpr = pixelRatio();
    const w = canvas.clientWidth || canvas.width || 1;
    const h = canvas.clientHeight || canvas.height || 1;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
  }
  if (typeof window !== 'undefined' && canvas) {
    window.addEventListener('resize', resize);
  }
  resize();

  function drawBackground(w, h, palette, density, t, dpr) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, w, h);

    const starCount = Math.round(20 + density * 220);
    ctx.fillStyle = palette.accent;
    for (let i = 0; i < starCount; i++) {
      const sx = pseudoRandom(i, 1) * w;
      const sy = pseudoRandom(i, 2) * h;
      const flicker = 0.3 + 0.7 * Math.abs(Math.sin(t * 0.6 + i));
      ctx.globalAlpha = 0.12 + flicker * 0.45;
      const size = (1 + (i % 3)) * dpr;
      ctx.fillRect(sx, sy, size, size);
    }
    ctx.globalAlpha = 1;
  }

  function drawCore(cx, cy, radius, palette, glow) {
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(1, radius));
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.25, palette.core);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.55 + glow * 0.45;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(1, radius), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // What-you-own-is-what-you-see: each generator tier gets a distinct
  // arrangement so buying visibly crowds/expands the scene.
  //   tier 0 emitter  -> orbiting motes just outside the core
  //   tier 1 core     -> scattered inner disc, inside the glow
  //   tier 2 reactor  -> a rotating ring
  //   tier 3 nexus    -> a wider ring + radial spoke "arms"
  //   tier 4 engine   -> the outermost, multi-arm structure
  // At galaxy/universe scale the same tiers instead populate a rotating
  // spiral/web whose arm count grows with tier and whose point count is
  // still `elementCount(state, genId)`.
  function drawGeneratorRingsAndDiscs(cx, cy, radius, genIndex, n, t, dpr) {
    if (genIndex === 0) {
      const shellR = radius * 1.6 + 10 * dpr;
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * Math.PI * 2 + t * 0.4;
        const x = cx + Math.cos(ang) * shellR;
        const y = cy + Math.sin(ang) * shellR;
        ctx.globalAlpha = 0.55;
        ctx.fillRect(x - dpr, y - dpr, 2 * dpr, 2 * dpr);
      }
    } else if (genIndex === 1) {
      const discR = radius * 0.75;
      for (let i = 0; i < n; i++) {
        const rr = discR * Math.sqrt(pseudoRandom(i, 10));
        const ang = pseudoRandom(i, 11) * Math.PI * 2 + t * 0.05;
        const x = cx + Math.cos(ang) * rr;
        const y = cy + Math.sin(ang) * rr;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(x - dpr, y - dpr, 2 * dpr, 2 * dpr);
      }
    } else {
      const shellR = radius * (1.8 + (genIndex - 2) * 0.9);
      const rot = t * (0.12 / genIndex);
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * Math.PI * 2 + rot;
        const x = cx + Math.cos(ang) * shellR;
        const y = cy + Math.sin(ang) * shellR;
        ctx.globalAlpha = 0.45 + (i % 5) / 20;
        ctx.fillRect(x - 1.5 * dpr, y - 1.5 * dpr, 3 * dpr, 3 * dpr);
      }
      // Nexus and engine additionally sprout radial "arms" (spokes) linking
      // the ring back toward the core, so higher tiers visibly reach further.
      if (genIndex >= 3) {
        const spokes = Math.min(8, Math.max(2, Math.round(n / 6)));
        ctx.globalAlpha = 0.25;
        for (let s = 0; s < spokes; s++) {
          const ang = (s / spokes) * Math.PI * 2 + rot;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(ang) * radius * 1.1, cy + Math.sin(ang) * radius * 1.1);
          ctx.lineTo(cx + Math.cos(ang) * shellR, cy + Math.sin(ang) * shellR);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawGeneratorSpiral(cx, cy, radius, genIndex, n, scaleIdx, t, dpr) {
    const arms = 2 + genIndex;
    const shellMax = radius * (1.6 + genIndex * 0.75);
    const perArm = Math.max(1, Math.ceil(n / arms));
    let prevX = null, prevY = null, prevArm = -1;
    for (let i = 0; i < n; i++) {
      const arm = i % arms;
      const frac = Math.floor(i / arms) / perArm;
      const ang = (arm / arms) * Math.PI * 2 + frac * 2.6 + t * (0.18 - genIndex * 0.02);
      const rr = shellMax * (0.12 + frac * 0.88);
      const x = cx + Math.cos(ang) * rr;
      const y = cy + Math.sin(ang) * rr;
      ctx.globalAlpha = 0.4 + frac * 0.4;
      ctx.fillRect(x - 1.5 * dpr, y - 1.5 * dpr, 3 * dpr, 3 * dpr);
      // Universe scale: thread a faint web between consecutive points on the
      // same arm, on top of the spiral, so the structure reads as a "web".
      if (scaleIdx === 3 && arm === prevArm && prevX !== null) {
        ctx.globalAlpha = 0.12;
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      prevX = x; prevY = y; prevArm = arm;
    }
    ctx.globalAlpha = 1;
  }

  function render(state) {
    const t0 = now();
    const dt = Math.min((t0 - lastT) / 1000, 0.05);
    lastT = t0;
    particles.update(dt);

    if (!ctx || !canvas) return;
    const w = canvas.width, h = canvas.height;
    if (!w || !h) return;
    const cx = w / 2, cy = h / 2;
    const dpr = pixelRatio();
    const t = (t0 - startT) / 1000;

    const scaleIdx = Math.max(0, Math.min(SCALE_PALETTE.length - 1, state.scale || 0));
    const palette = SCALE_PALETTE[scaleIdx];
    const glow = sceneIntensity(state);
    const density = sceneDensity(state);
    const radius = coreRadius(state, MIN_CORE_PX, MAX_CORE_PX) * dpr;

    drawBackground(w, h, palette, density, t, dpr);
    drawCore(cx, cy, radius, palette, glow);

    ctx.fillStyle = palette.accent;
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = Math.max(1, dpr);
    for (let gi = 0; gi < GENERATORS.length; gi++) {
      const n = elementCount(state, GENERATORS[gi].id);
      if (n <= 0) continue;
      if (scaleIdx >= 2) {
        drawGeneratorSpiral(cx, cy, radius, gi, n, scaleIdx, t, dpr);
      } else {
        drawGeneratorRingsAndDiscs(cx, cy, radius, gi, n, t, dpr);
      }
    }

    // Click particles, drawn last so they always read on top.
    ctx.fillStyle = palette.accent;
    for (const p of particles.parts) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillRect(p.x, p.y, 3 * dpr, 3 * dpr);
    }
    ctx.globalAlpha = 1;
  }

  function burst(x, y) {
    const dpr = pixelRatio();
    particles.burst(x * dpr, y * dpr);
  }

  return { render, burst, mode };
}
