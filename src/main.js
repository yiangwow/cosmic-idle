import { load, save } from './save/save.js';
import { applyOffline } from './sim/offline.js';
import { createLoop, renderTextHud, buildHud } from './ui/hud.js';
import { click, effectiveClickPower } from './sim/actions.js';
import { buyGenerator } from './sim/generators.js';
import { buyUpgrade } from './sim/actions.js';
import { ascend } from './sim/ascension.js';
import { createRenderer } from './render/scene.js';
import { createAudio } from './audio/audio.js';

const state = load();
const offline = applyOffline(state, Date.now());
if (offline.seconds > 1) {
  console.log(`Welcome back — earned ${offline.gained.toString()} over ${Math.round(offline.seconds)}s`);
}

const audio = createAudio();
let audioStarted = false;

const hud = document.getElementById('hud');

const update = buildHud(hud, state, {
  onBuyGenerator: id => {
    const bought = buyGenerator(state, id);
    if (bought) audio.buy();
    return bought;
  },
  onBuyUpgrade: id => {
    const bought = buyUpgrade(state, id);
    if (bought) audio.buy();
    return bought;
  },
  onAscend: () => {
    const ascended = ascend(state);
    if (ascended) {
      audio.ascend();
      audio.setScale(state.scale);
    }
    return ascended;
  },
});

// buildHud clears `hud`'s children, so append the status text afterwards
// to keep both the text HUD and the interactive panel visible.
const statusText = document.createElement('div');
statusText.style.cssText = 'position:fixed;top:12px;left:12px;font-variant-numeric:tabular-nums;';
hud.appendChild(statusText);

// Mute toggle. The #hud overlay is pointer-events:none except on buttons, so
// pointer-events:auto here is required for the button to be clickable.
const muteBtn = document.createElement('button');
muteBtn.style.cssText =
  'position:fixed;top:12px;right:284px;pointer-events:auto;padding:6px 10px;border-radius:6px;' +
  'border:1px solid #2a3358;background:#141a33;color:#e8ecff;cursor:pointer;';
function renderMuteBtn() {
  muteBtn.textContent = audio.isMuted() ? '🔇 Muted' : '🔊 Sound';
}
muteBtn.addEventListener('click', () => {
  audio.setMuted(!audio.isMuted());
  renderMuteBtn();
});
renderMuteBtn();
hud.appendChild(muteBtn);

const canvas = document.getElementById('scene');
const renderer = createRenderer(canvas);

canvas.addEventListener('pointerdown', (e) => {
  if (!audioStarted) {
    audio.start();
    audioStarted = true;
  }
  click(state);
  audio.click(effectiveClickPower(state).toNumber());
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

setInterval(() => save(state), 10000);
window.addEventListener('beforeunload', () => save(state));
