import { Renderer } from './renderer.js';
import { STYLES, STYLE_MAP, CATEGORIES, FX_PRESETS } from './styles.js';
import { PALETTES, PALETTE_NAMES, randomPalette, hexToRgb } from './palettes.js';
import { makeRng, randSeed, makeNoise } from './rng.js';
import { CANVAS_GENS } from './gens-2d.js';

const $ = (s) => document.querySelector(s);
const app = $('#app'), stage = $('#stage'), ghost = $('#ghost'), gctx = ghost.getContext('2d');
const store = {
  get(k, d) { try { const v = localStorage.getItem('ag:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('ag:' + k, JSON.stringify(v)); } catch { /* private mode */ } },
};
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------- settings + URL API ---------------- */
const DEF = { mode: 'image', pool: null, palette: 'auto', fx: 'auto', aspect: 'screen', size: 'screen', dur: 6, quality: 'auto', lock: false };
const S = { ...DEF, ...store.get('settings', {}) };
const Q = new URLSearchParams(location.search);
const embed = Q.get('embed') === '1';
const autoDl = Q.get('download') === '1';
const ASPECTS = ['screen', '1:1', '4:5', '9:16', '16:9'];
if (Q.has('mode')) S.mode = Q.get('mode') === 'video' ? 'video' : 'image';
let urlPool = [];
if (Q.has('style')) urlPool = Q.get('style').split(',').filter((id) => STYLE_MAP[id]);
if (Q.has('cat')) { const cats = Q.get('cat').split(','); urlPool = urlPool.concat(STYLES.filter((s) => cats.includes(s.cat)).map((s) => s.id)); }
if (urlPool.length) S.pool = [...new Set(urlPool)];
if (Q.has('palette')) { const p = Q.get('palette'); if (p === 'auto' || p === 'random' || PALETTES[p]) S.palette = p; }
if (Q.has('fx') && Q.get('fx') in FX_PRESETS) S.fx = Q.get('fx');
if (Q.has('aspect') && ASPECTS.includes(Q.get('aspect'))) S.aspect = Q.get('aspect');
if (Q.has('dur')) S.dur = Math.min(30, Math.max(1, +Q.get('dur') || 6));
const forcedW = Math.round(+Q.get('w') || 0), forcedH = Math.round(+Q.get('h') || 0);
const forced = forcedW > 0 && forcedH > 0;
const seedParam = Q.has('seed') ? (parseInt(Q.get('seed'), 10) >>> 0) : null;
const deepLink = Q.has('style') || Q.has('seed') || Q.has('mode') || Q.has('cat') || embed;
const save = () => store.set('settings', S);

/* ---------------- renderer ---------------- */
let R;
try { R = new Renderer(stage); } catch (e) {
  $('.hero p').textContent = 'Sorry, this device or browser has WebGL turned off, so nothing can be rendered here. ' + e.message;
  $('.choices').remove(); app.classList.remove('boot'); app.classList.add('landing');
  throw e;
}
stage.addEventListener('webglcontextlost', (e) => { e.preventDefault(); toast('Graphics context lost. Reloading…'); setTimeout(() => location.reload(), 900); });

const lowEnd = (navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);
if (lowEnd) document.documentElement.classList.add('lite');
let autoScale = lowEnd ? 0.7 : 1;

/* ---------------- sizing ---------------- */
function ratio() {
  if (forced) return forcedW / forcedH;
  if (S.aspect === 'screen') return null;
  const [a, b] = S.aspect.split(':').map(Number); return a / b;
}
function layout() {
  const vw = innerWidth, vh = innerHeight, ar = ratio();
  let cw = vw, ch = vh;
  if (ar) {
    const small = vw < 640, mw = embed ? vw : vw * (small ? 0.94 : 0.84), mh = embed ? vh : vh * (small ? 0.7 : 0.78);
    if (mw / mh > ar) { ch = mh; cw = ch * ar; } else { cw = mw; ch = cw / ar; }
  }
  app.classList.toggle('framed', !!ar && !embed);
  document.documentElement.style.setProperty('--cw', cw + 'px');
  document.documentElement.style.setProperty('--ch', ch + 'px');
  return { cw, ch };
}
function quality() { return S.quality === 'high' ? 1 : S.quality === 'eco' ? 0.6 : autoScale; }
function fitSize() {
  const { cw, ch } = layout();
  if (forced && embed) return R.setSize(forcedW, forcedH);
  const video = S.mode === 'video' || landing;
  const dpr = Math.min(devicePixelRatio || 1, video ? 1.5 : 2);
  const k = dpr * (video ? quality() : Math.max(quality(), 0.85)) * (landing ? 0.6 : 1);
  let w = cw * k, h = ch * k; const cap = video ? 2.4e6 : 8e6;
  if (w * h > cap) { const f = Math.sqrt(cap / (w * h)); w *= f; h *= f; }
  return R.setSize(w, h);
}

/* ---------------- jobs ---------------- */
let cur = null, landing = !deepLink;
async function build(id, seed) {
  const st = STYLE_MAP[id], rng = makeRng(seed);
  const seed4 = [rng.next(), rng.next(), rng.next(), rng.next()];
  const p4 = st.p ? st.p.slice() : [rng.next(), rng.next(), rng.next(), rng.next()];
  const preset = S.fx === 'auto' ? null : FX_PRESETS[S.fx];
  let palName = S.palette !== 'auto' ? S.palette : rng.pick(st.pals);
  if (preset && preset.pal && S.palette === 'auto') palName = preset.pal;
  const palHex = palName === 'random' ? randomPalette(rng) : (PALETTES[palName] || PALETTES.aurora);
  const fx = preset ? { ...preset } : { ...st.fx };
  const job = { st, id, seed, seed4, p4, palName, palHex, pal: new Float32Array(palHex.flatMap(hexToRgb)), fx, phase0: rng.next() };
  if (st.gen.startsWith('s:')) job.prog = await R.load(st.gen.slice(2));
  return job;
}
function makePainter(job) {
  const c = R.ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none';
  job.painter = CANVAS_GENS[job.st.gen.slice(2)](c, R.w, R.h, makeRng(job.seed ^ 0x9e3779b9), job.palHex, makeNoise(makeRng(job.seed + 7)), { video: S.mode === 'video' || landing });
  job.pw = R.w; job.ph = R.h;
}
function frame(phase, time) {
  if (!cur) return;
  if (!cur.prog && (!cur.painter || cur.pw !== R.w || cur.ph !== R.h)) makePainter(cur);
  R.draw({ prog: cur.prog, painter: cur.painter, phase, time, seed: cur.seed4, p: cur.p4, pal: cur.pal, fx: cur.fx });
}
const animating = () => S.mode === 'video' || landing;
function renderStill() { if (cur && !animating()) frame(cur.phase0, cur.phase0 * 10); }

/* ---------------- animation loop + adaptive quality ---------------- */
let raf = 0, t0 = performance.now(), paused = false, pauseAt = 0, recording = false;
let lastTs = 0, acc = 0, n = 0, good = 0;
function loop(ts) {
  raf = requestAnimationFrame(loop);
  if (!cur || paused) return;
  const el = (ts - t0) / 1000;
  frame((el / S.dur) % 1, el);
  if (lastTs && !recording && S.quality === 'auto') {
    const dt = ts - lastTs; if (dt < 250) { acc += dt; n++; }
    if (n >= 24) {
      const avg = acc / n; acc = n = 0;
      if (avg > 24 && autoScale > 0.4) { autoScale = Math.max(0.4, autoScale * 0.82); good = 0; fitSize(); if (autoScale <= 0.5) document.documentElement.classList.add('lite'); }
      else if (avg < 17.5 && autoScale < 1) { if (++good > 4) { autoScale = Math.min(1, autoScale * 1.12); good = 0; fitSize(); } }
    }
  }
  lastTs = ts;
}
function startLoop() { if (!raf) { lastTs = 0; raf = requestAnimationFrame(loop); } }
function stopLoop() { cancelAnimationFrame(raf); raf = 0; }
document.addEventListener('visibilitychange', () => { if (document.hidden) stopLoop(); else if (animating()) startLoop(); });

/* ---------------- show / transitions ---------------- */
let token = 0, hist = [], hi = -1, upcoming = null;
const loaderEl = $('#loader');
function loader(on, text) { if (text) $('#loaderText').textContent = text; loaderEl.classList.toggle('show', on); }

async function show(id, seed, opts = {}) {
  const my = ++token, st = STYLE_MAP[id];
  const lt = setTimeout(() => loader(true, 'Generating · ' + st.name), 140);
  let job;
  try { job = await build(id, seed); } catch (e) {
    clearTimeout(lt); loader(false); console.error(e);
    if (my === token) { toast('Skipped ' + st.name + ' (not supported here)'); if (!opts.noRetry) return next(); }
    return;
  }
  clearTimeout(lt);
  if (my !== token) return;
  const withFx = !!cur && !opts.instant && !embed;
  if (withFx) { ghost.width = stage.width; ghost.height = stage.height; gctx.drawImage(stage, 0, 0); ghost.className = 'show'; }
  cur = job; fitSize();
  t0 = performance.now();
  if (animating()) { frame(0, 0); startLoop(); } else renderStill();
  if (withFx) {
    requestAnimationFrame(() => requestAnimationFrame(() => { ghost.className = 'show out'; }));
    setTimeout(() => { if (ghost.className === 'show out') ghost.className = ''; }, 820);
    stage.classList.remove('enter'); void stage.offsetWidth; stage.classList.add('enter');
  }
  loader(false);
  if (!landing) meta();
  if (opts.push !== false) { hist = hist.slice(0, hi + 1); hist.push({ id, seed }); if (hist.length > 200) hist.shift(); hi = hist.length - 1; }
  syncUrl();
  prefetch();
}

function pool() {
  const list = (S.pool || []).filter((id) => STYLE_MAP[id]);
  return list.length ? list : STYLES.map((s) => s.id);
}
function pick() {
  if (S.lock && cur && !landing) return { id: cur.id, seed: randSeed() };
  const p = pool(), recent = hist.slice(-Math.min(6, p.length - 1)).map((h) => h.id);
  const cand = p.filter((id) => !recent.includes(id));
  const list = cand.length ? cand : p;
  return { id: list[Math.floor(Math.random() * list.length)], seed: randSeed() };
}
function prefetch() {
  upcoming = pick();
  const st = STYLE_MAP[upcoming.id];
  if (st.gen.startsWith('s:')) (window.requestIdleCallback || setTimeout)(() => R.load(st.gen.slice(2)).catch(() => {}), { timeout: 600 });
}
function next() {
  if (hi < hist.length - 1) { hi++; const h = hist[hi]; return show(h.id, h.seed, { push: false }); }
  const u = upcoming && (!S.lock || (cur && upcoming.id === cur.id)) && pool().includes(upcoming.id) ? upcoming : pick();
  upcoming = null; return show(u.id, u.seed);
}
function prev() { if (hi > 0) { hi--; const h = hist[hi]; show(h.id, h.seed, { push: false }); } else toast('This is the first one'); }
const rerender = () => cur && show(cur.id, cur.seed, { push: false });

/* ---------------- meta / url ---------------- */
const metaIn = $('.metaIn');
function meta() {
  metaIn.classList.add('swap');
  setTimeout(() => {
    $('#styleName').textContent = cur.st.name;
    $('#styleSub').textContent = `${CATEGORIES[cur.st.cat]} · ${cur.palName} · #${cur.seed}`;
    metaIn.classList.remove('swap');
  }, reduceMotion ? 0 : 180);
}
function params(full) {
  const q = new URLSearchParams();
  q.set('mode', S.mode); if (cur) { q.set('style', cur.id); q.set('seed', cur.seed); }
  if (S.palette !== 'auto') q.set('palette', S.palette);
  if (S.fx !== 'auto') q.set('fx', S.fx);
  if (forced) { q.set('w', forcedW); q.set('h', forcedH); } else if (S.aspect !== 'screen') q.set('aspect', S.aspect);
  if (S.mode === 'video' && (full || S.dur !== 6)) q.set('dur', S.dur);
  return q;
}
const baseUrl = () => location.href.split(/[?#]/)[0].replace(/(index|render)\.html$/, '');
function syncUrl() {
  if (!embed && !landing) history.replaceState(null, '', '?' + params());
  const api = baseUrl() + 'render.html?' + params(true);
  $('#apiUrl').textContent = api; $('#openApi').href = api;
}

/* ---------------- downloads ---------------- */
function saveBlob(blob, name) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
function exportSize(maxEdge) {
  if (forced) return [forcedW, forcedH];
  const ar = R.w / R.h;
  if (S.size === 'screen') { const f = Math.max(1, 1600 / Math.max(R.w, R.h)); return [R.w * f, R.h * f].map((v) => Math.min(v, maxEdge || 1e9)); }
  const L = Math.min(+S.size, maxEdge || 1e9);
  return ar >= 1 ? [L, L / ar] : [L * ar, L];
}
async function downloadImage() {
  if (!cur) return;
  loader(true, 'Rendering PNG');
  await new Promise((r) => setTimeout(r, 30));
  const [w, h] = exportSize(), pw = R.w, ph = R.h;
  R.setSize(w, h);
  const phase = animating() ? ((performance.now() - t0) / 1000 / S.dur) % 1 : cur.phase0;
  stopLoop(); frame(phase, phase * 10);
  const blob = await new Promise((r) => stage.toBlob(r, 'image/png'));
  R.setSize(pw, ph); if (animating()) startLoop(); else renderStill();
  loader(false);
  if (blob) { saveBlob(blob, `algogallery-${cur.id}-${cur.seed}.png`); toast(`Saved PNG · ${Math.round(w)}×${Math.round(h)}`); }
}
async function recordVideo() {
  if (!cur || recording) return;
  const types = ['video/mp4;codecs=avc1.42E01E', 'video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  const mime = window.MediaRecorder && stage.captureStream ? types.find((t) => MediaRecorder.isTypeSupported(t)) : null;
  if (!mime) { toast('Video recording is not supported in this browser'); return; }
  recording = true; paused = false; app.classList.remove('paused');
  const pw = R.w, ph = R.h;
  if (S.size !== 'screen' || forced) { const [w, h] = exportSize(1920); R.setSize(w, h); }
  const stream = stage.captureStream(60), chunks = [];
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: Math.round(Math.min(16e6, Math.max(4e6, R.w * R.h * 6))) });
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const recEl = $('#rec'), bar = $('#recBar'); recEl.classList.add('show');
  const dur = S.dur * 1000; const start = performance.now();
  const tick = () => { if (!recording) return; bar.style.width = Math.min(100, (performance.now() - start) / dur * 100) + '%'; requestAnimationFrame(tick); }; tick();
  rec.onstop = () => {
    recording = false; recEl.classList.remove('show'); bar.style.width = '0';
    if (R.w !== pw || R.h !== ph) R.setSize(pw, ph);
    const ext = mime.includes('mp4') ? 'mp4' : 'webm';
    saveBlob(new Blob(chunks, { type: mime.split(';')[0] }), `algogallery-${cur.id}-${cur.seed}-${S.dur}s.${ext}`);
    toast(`Saved ${ext.toUpperCase()} loop`);
    if (S.mode !== 'video') stopLoop();
  };
  t0 = performance.now(); startLoop();
  rec.start(250);
  setTimeout(() => rec.state !== 'inactive' && rec.stop(), dur + 120);
}
const download = () => (S.mode === 'video' ? recordVideo() : downloadImage());

/* ---------------- toast ---------------- */
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200); }

/* ---------------- mode ---------------- */
function applyMode() {
  app.classList.toggle('video', S.mode === 'video');
  fitSize();
  if (animating()) { t0 = performance.now(); startLoop(); } else { stopLoop(); renderStill(); }
  segs();
  syncUrl();
}

/* ---------------- settings panel ---------------- */
const panel = $('#panel'), sBtn = $('#settingsBtn');
function togglePanel(on = !panel.classList.contains('open')) {
  panel.classList.toggle('open', on); panel.setAttribute('aria-hidden', String(!on)); sBtn.setAttribute('aria-expanded', String(on));
}
function seg(el, key, cb) {
  el.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; S[key] = b.dataset.v; save(); segs(); cb && cb(); });
}
function segs() {
  for (const [el, key] of [[$('#modeSeg'), 'mode'], [$('#aspectSeg'), 'aspect'], [$('#sizeSeg'), 'size'], [$('#qualSeg'), 'quality']])
    el.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v === S[key]));
  $('#durRange').value = S.dur; $('#durVal').textContent = S.dur + 's';
  $('.vsec').style.display = S.mode === 'video' ? '' : 'none';
  $('#lockStyle').checked = S.lock;
  if (cur) $('#seedInput').value = cur.seed;
}
seg($('#modeSeg'), 'mode', applyMode);
seg($('#aspectSeg'), 'aspect', () => { fitSize(); renderStill(); syncUrl(); });
seg($('#sizeSeg'), 'size');
seg($('#qualSeg'), 'quality', () => { autoScale = 1; fitSize(); renderStill(); });
$('#durRange').addEventListener('input', (e) => { S.dur = +e.target.value; $('#durVal').textContent = S.dur + 's'; save(); syncUrl(); });
$('#lockStyle').addEventListener('change', (e) => { S.lock = e.target.checked; save(); upcoming = null; });
$('#seedGo').addEventListener('click', () => { const v = parseInt($('#seedInput').value, 10); if (cur && v >= 0) show(cur.id, v >>> 0); });
$('#seedInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#seedGo').click(); });

function buildStyleList() {
  const list = $('#styleList'), on = new Set(S.pool || STYLES.map((s) => s.id));
  list.innerHTML = '';
  for (const [cat, label] of Object.entries(CATEGORIES)) {
    const items = STYLES.filter((s) => s.cat === cat); if (!items.length) continue;
    const box = document.createElement('div'); box.className = 'cat'; box.dataset.cat = cat;
    const h = document.createElement('h4'); h.innerHTML = `${label} <small>${items.length}</small>`;
    h.addEventListener('click', () => { const all = items.every((s) => on.has(s.id)); items.forEach((s) => all ? on.delete(s.id) : on.add(s.id)); commit(); });
    const chips = document.createElement('div'); chips.className = 'chips';
    for (const s of items) {
      const c = document.createElement('button'); c.className = 'chip' + (on.has(s.id) ? ' on' : ''); c.textContent = s.name; c.dataset.id = s.id; c.dataset.q = (s.name + ' ' + s.id + ' ' + label + ' ' + s.tags).toLowerCase();
      c.addEventListener('click', () => { on.has(s.id) ? on.delete(s.id) : on.add(s.id); commit(); });
      c.addEventListener('dblclick', () => { show(s.id, randSeed()); });
      chips.appendChild(c);
    }
    box.append(h, chips); list.appendChild(box);
  }
  function commit() {
    S.pool = on.size === STYLES.length ? null : [...on]; save(); upcoming = null;
    list.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', on.has(c.dataset.id)));
    $('#styleCount').textContent = `${on.size} / ${STYLES.length}`;
  }
  $('#allStyles').onclick = () => { STYLES.forEach((s) => on.add(s.id)); commit(); };
  $('#noStyles').onclick = () => { on.clear(); commit(); toast('No styles selected, so every style is in the mix'); };
  $('#styleSearch').oninput = (e) => {
    const q = e.target.value.trim().toLowerCase();
    list.querySelectorAll('.cat').forEach((b) => { let any = false; b.querySelectorAll('.chip').forEach((c) => { const m = !q || c.dataset.q.includes(q); c.style.display = m ? '' : 'none'; any ||= m; }); b.style.display = any ? '' : 'none'; });
  };
  $('#styleCount').textContent = `${on.size} / ${STYLES.length}`;
}
function buildPalettes() {
  const box = $('#palList'); box.innerHTML = '';
  const mk = (v, label, cols) => {
    const b = document.createElement('button'); b.className = 'pal' + (v === 'auto' ? ' auto' : '') + (S.palette === v ? ' on' : ''); b.dataset.v = v;
    b.innerHTML = `<i>${cols ? cols.map((c) => `<b style="background:${c}"></b>`).join('') : ''}</i>${label}`;
    b.onclick = () => { S.palette = v; save(); box.querySelectorAll('.pal').forEach((x) => x.classList.toggle('on', x.dataset.v === v)); rerender(); };
    box.appendChild(b);
  };
  mk('auto', 'Style default'); mk('random', 'Random', ['#ff6ec7', '#7f5af0', '#2cb67d', '#ffd23f', '#e0f7ff']);
  PALETTE_NAMES.forEach((n) => mk(n, n, PALETTES[n]));
}
function buildFx() {
  const box = $('#fxList'); box.innerHTML = '';
  Object.keys(FX_PRESETS).forEach((k) => {
    const b = document.createElement('button'); b.className = 'chip' + (S.fx === k ? ' on' : ''); b.textContent = k === 'auto' ? 'Style default' : k; b.dataset.v = k;
    b.onclick = () => { S.fx = k; save(); box.querySelectorAll('.chip').forEach((x) => x.classList.toggle('on', x.dataset.v === k)); rerender(); };
    box.appendChild(b);
  });
}
async function copy(text, msg) {
  try { await navigator.clipboard.writeText(text); toast(msg); } catch { prompt('Copy this link:', text); }
}

/* ---------------- events ---------------- */
$('#nextBtn').onclick = () => next();
$('#prevBtn').onclick = () => prev();
$('#dlBtn').onclick = () => download();
$('#linkBtn').onclick = () => copy(baseUrl() + 'render.html?' + params(true), 'API link copied');
$('#copyApi').onclick = () => copy($('#apiUrl').textContent, 'API link copied');
$('#playBtn').onclick = () => {
  paused = !paused; app.classList.toggle('paused', paused);
  if (paused) pauseAt = performance.now(); else t0 += performance.now() - pauseAt;
};
sBtn.onclick = () => togglePanel();
$('#closePanel').onclick = () => togglePanel(false);
$('#homeBtn').onclick = () => { landing = true; app.classList.add('landing'); togglePanel(false); fitSize(); startLoop(); history.replaceState(null, '', location.pathname); };
document.querySelectorAll('[data-open-api]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); enter(S.mode); togglePanel(true); setTimeout(() => $('#apiSec').scrollIntoView({ behavior: 'smooth' }), 400); }));
document.querySelectorAll('.choice').forEach((b) => {
  b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); b.style.setProperty('--mx', e.clientX - r.left + 'px'); b.style.setProperty('--my', e.clientY - r.top + 'px'); });
  b.addEventListener('click', () => enter(b.dataset.mode));
});
function enter(mode) {
  S.mode = mode; save(); landing = false; app.classList.remove('landing');
  applyMode(); next();
}
addEventListener('keydown', (e) => {
  if (e.target.matches('input, textarea') || e.metaKey || e.ctrlKey || landing) return;
  if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
  else if (e.key === 'ArrowLeft') prev();
  else if (e.key === 'd') download();
  else if (e.key === 's') togglePanel();
  else if (e.key === 'f' || e.key === 'h') app.classList.toggle('immersive');
  else if (e.key === 'Escape') { togglePanel(false); app.classList.remove('immersive'); }
});
// swipe / tap on stage
let tx = 0, ty = 0, tt = 0;
const wrap = $('#stageWrap');
wrap.addEventListener('pointerdown', (e) => { tx = e.clientX; ty = e.clientY; tt = performance.now(); });
wrap.addEventListener('pointerup', (e) => {
  if (landing) return;
  const dx = e.clientX - tx, dy = e.clientY - ty;
  if (Math.abs(dx) > 60 && Math.abs(dy) < 90) { dx < 0 ? next() : prev(); return; }
  if (Math.abs(dx) < 8 && Math.abs(dy) < 8 && performance.now() - tt < 400) {
    if (panel.classList.contains('open')) togglePanel(false); else app.classList.toggle('immersive');
  }
});
let rz;
addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { fitSize(); renderStill(); }, 120); });

/* ---------------- boot ---------------- */
buildStyleList(); buildPalettes(); buildFx(); segs();
if (embed) app.classList.add('embed');
app.classList.toggle('landing', landing);
app.classList.toggle('video', S.mode === 'video');
(async () => {
  if (landing) {
    await show('aurora-gradient', randSeed(), { instant: true, push: false, noRetry: true });
    // warm up the first pick
    prefetch();
  } else {
    const p = pool();
    const id = urlPool.length ? urlPool[Math.floor(Math.random() * urlPool.length)] : p[Math.floor(Math.random() * p.length)];
    await show(id, seedParam ?? randSeed(), { instant: true });
    if (autoDl) setTimeout(download, 300);
  }
  requestAnimationFrame(() => app.classList.remove('boot'));
  window.__algogallery = { ready: true, get current() { return cur && { id: cur.id, seed: cur.seed, palette: cur.palName }; }, show, next, styles: STYLES.map((s) => s.id) };
})();
