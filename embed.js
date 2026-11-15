// AlgoGallery embed: drop this on any website to turn tags into generated art, rendered in the visitor's browser.
//   <script type="module" src="https://shonejj.github.io/algogallary/embed.js"></script>
//   <img   data-algogallery="style=remix&seed=42&w=1200&h=800">
//   <video data-algogallery="style=dreamscape&seed=7&w=960&h=540" autoplay muted loop playsinline></video>
//   <canvas data-algogallery="style=creatures"></canvas>
// Omit seed for a fresh artwork on every page load. Add data-algogallery-click to reroll on click.
import { Renderer } from './js/renderer.js';
import { makeRecipe, prepare, drawJob, overridesFrom } from './js/engine.js';
import { STYLES, STYLE_MAP } from './js/styles.js';
import { randSeed } from './js/rng.js';

const SEL = '[data-algogallery]';
let shared = null, queue = Promise.resolve();

function spec(el) {
  const q = new URLSearchParams(el.getAttribute('data-algogallery') || '');
  const seed = q.has('seed') && !el.__reroll ? parseInt(q.get('seed'), 10) >>> 0 : randSeed();
  let ids = (q.get('style') || '').split(',').filter((id) => STYLE_MAP[id]);
  if (q.has('cat')) { const c = q.get('cat').split(','); ids = ids.concat(STYLES.filter((s) => c.includes(s.cat)).map((s) => s.id)); }
  if (!ids.length) ids = STYLES.filter((s) => s.rich).map((s) => s.id);
  const id = ids[seed % ids.length];
  const w = +q.get('w') || +el.getAttribute('width') || el.clientWidth || 800, h = +q.get('h') || +el.getAttribute('height') || el.clientHeight || 500;
  const recipe = makeRecipe(id, seed, overridesFrom(q), { palette: q.get('palette') || 'auto', fx: q.get('fx') || 'auto' });
  return { q, seed, id, w: Math.min(w, 4096), h: Math.min(h, 4096), recipe, dur: Math.max(1, +q.get('dur') || 6) };
}

function renderImage(el) {
  queue = queue.then(async () => {
    const s = spec(el);
    shared = shared || new Renderer(document.createElement('canvas'));
    shared.setSize(s.w, s.h);
    const job = await prepare(shared, s.recipe);
    drawJob(shared, job, s.recipe.phase0, s.recipe.phase0 * 10, null, false);
    const fmt = { jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' }[s.q.get('fmt')] || 'image/png';
    const blob = await new Promise((r) => shared.canvas.toBlob(r, fmt, 0.92));
    if (el.__url) URL.revokeObjectURL(el.__url);
    el.__url = URL.createObjectURL(blob); el.src = el.__url;
    if (!el.alt) el.alt = s.recipe.title;
    el.dataset.algoSeed = s.seed; el.dataset.algoTitle = s.recipe.title;
  }).catch((e) => console.warn('[algogallery]', e));
  return queue;
}

async function renderLive(el) {
  const s = spec(el);
  if (el.__stop) el.__stop();
  const canvas = el.tagName === 'CANVAS' ? el : document.createElement('canvas');
  const R = new Renderer(canvas); R.setSize(s.w, s.h);
  const job = await prepare(R, s.recipe);
  let raf = 0, visible = true, t0 = performance.now();
  const tick = (ts) => { raf = requestAnimationFrame(tick); if (!visible) return; const el2 = (ts - t0) / 1000; drawJob(R, job, (el2 / s.dur) % 1, el2, null, true); };
  raf = requestAnimationFrame(tick);
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((e) => { visible = e[0].isIntersecting; }) : null;
  if (io) io.observe(el);
  el.__stop = () => { cancelAnimationFrame(raf); io && io.disconnect(); };
  if (el.tagName === 'VIDEO') {
    el.muted = true; el.playsInline = true; el.setAttribute('playsinline', '');
    el.srcObject = canvas.captureStream(30); el.play().catch(() => {});
  }
  el.dataset.algoSeed = s.seed; el.dataset.algoTitle = s.recipe.title;
}

function render(el) {
  if (el.hasAttribute('data-algogallery-click') && !el.__click) { el.__click = true; el.style.cursor = 'pointer'; el.addEventListener('click', () => { el.__reroll = true; render(el); }); }
  return el.tagName === 'IMG' ? renderImage(el) : renderLive(el);
}

function scan(root = document) { root.querySelectorAll(SEL).forEach((el) => { if (!el.__algo) { el.__algo = true; render(el); } }); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => scan()); else scan();
new MutationObserver((m) => m.forEach((r) => {
  r.addedNodes.forEach((n) => { if (n.nodeType === 1) { if (n.matches(SEL)) { n.__algo = true; render(n); } scan(n); } });
  r.removedNodes.forEach((n) => { if (n.nodeType === 1) [n, ...n.querySelectorAll(SEL)].forEach((e) => e.__stop && e.__stop()); });
})).observe(document.documentElement, { childList: true, subtree: true });

window.AlgoGallery = { render, scan, styles: STYLES.map((s) => s.id) };
