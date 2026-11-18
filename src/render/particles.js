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
