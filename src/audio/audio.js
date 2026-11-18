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
    for (const n of droneNodes) { try { n.osc.stop(); } catch (e) { /* already stopped */ } }
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
