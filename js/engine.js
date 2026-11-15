// Engine: turns (style, seed, overrides) into a fully specified, reproducible recipe, then into
// renderable layers. Shared by the gallery app (app.js) and the embed script (embed.js).
import { STYLES, STYLE_MAP, FX_PRESETS, ART } from './styles.js';
import { PALETTES, PALETTE_NAMES, randomPalette, hexToRgb } from './palettes.js';
import { makeRng, makeNoise } from './rng.js';
import { CANVAS_GENS } from './gens-2d.js';
import { worldConfig } from './world.js';
import { creatureConfig } from './creatures.js';
import { makeTitle } from './titles.js';

export const BLENDS = ['normal', 'multiply', 'screen', 'overlay', 'difference', 'add', 'softlight', 'dodge', 'color', 'lumamap', 'displace', 'exclusion'];
export const XFORMS = ['none', 'kaleido', 'mirror', 'tile', 'polar', 'swirl', 'fisheye', 'spin'];
export const MASKS = ['none', 'luma', 'shape', 'noise', 'self', 'split', 'gradient'];
export const SHAPES = ['circle', 'arch', 'star', 'heart', 'moon', 'diamond', 'ring', 'flower', 'hex', 'dots', 'stripes', 'blob'];
export const TRANSITIONS = ['dissolve', 'iris', 'wipe', 'pixelate', 'glitch', 'ripple', 'zoom'];
export const FX_KEYS = ['grain', 'vig', 'scan', 'ca', 'glitch', 'pixel', 'poster', 'curve', 'leak', 'paper', 'bloom', 'contrast', 'cell', 'tone'];
const WORLD_KEYS = {
  sky: [0, ['night', 'golden', 'day', 'alien']], body: [1, ['none', 'sun', 'moon', 'planet', 'twin', 'giant']], clouds: [2, ['none', 'cumulus', 'streaks', 'aurora']],
  terrain: [4, ['peaks', 'dunes', 'mesas', 'isles', 'hills', 'spires']], water: [5, ['0', '1']], layers: [6, null],
  build: [8, ['none', 'city', 'spires', 'ruins', 'pyramids', 'torii', 'lighthouse', 'turbines', 'megaring']],
  flora: [12, ['none', 'pines', 'trees', 'palms', 'mushrooms', 'crystals', 'grass']], creature: [14, ['none', 'birds', 'whale', 'jellyfish', 'airships', 'fireflies']],
  hero: [15, ['none', 'wanderer', 'robot', 'astronaut', 'duo', 'deer']], weather: [16, ['clear', 'rain', 'snow', 'mist', 'dust', 'embers', 'petals']],
  rays: [17, ['0', '1']], cam: [18, null], haze: [19, null],
};
const MIXABLE = () => STYLES.filter((s) => !s.noMix);
const num = (v, d) => (v == null || v === '' || isNaN(+v) ? d : +v);
const idx = (list, v, d) => { if (v == null) return d; const i = list.indexOf(String(v)); return i >= 0 ? i : (isNaN(+v) ? d : +v); };

function expandColors(list) {
  const hex = list.map((h) => '#' + h.replace('#', '').slice(0, 6)).filter((h) => /^#[0-9a-fA-F]{6}$/.test(h));
  if (!hex.length) return null;
  const rgb = hex.map(hexToRgb), out = [];
  for (let i = 0; i < 5; i++) {
    const t = rgb.length === 1 ? 0 : (i / 4) * (rgb.length - 1), k = Math.min(rgb.length - 2, Math.floor(t)), f = t - Math.max(0, k);
    const a = rgb[Math.max(0, k)], b = rgb[Math.min(rgb.length - 1, Math.max(0, k) + 1)] || a;
    out.push('#' + [0, 1, 2].map((j) => Math.round((a[j] + (b[j] - a[j]) * f) * 255).toString(16).padStart(2, '0')).join(''));
  }
  return out;
}

function layerSpec(st, rng, O, isMain) {
  const L = { style: st.id, gen: st.gen, seed4: [rng.next(), rng.next(), rng.next(), rng.next()], p: st.p ? st.p.slice() : [rng.next(), rng.next(), rng.next(), rng.next()], w: null, desc: '', pals: st.pals };
  if (st.world) {
    const wc = worldConfig(rng, st.world); L.w = wc.W; L.pals = wc.pals; L.desc = wc.desc;
    if (isMain) for (const [k, [i, names]] of Object.entries(WORLD_KEYS)) if (O[k] != null) L.w[i] = names ? idx(names, O[k], L.w[i]) : num(O[k], L.w[i]);
  } else if (st.creature) {
    const cc = creatureConfig(rng, isMain ? { ...st.copts, material: O.material != null ? idx(['cel', 'soft', 'gummy', 'plush'], O.material, null) : (st.copts && st.copts.material), eyes: O.eyes ? +O.eyes : null } : { ...st.copts });
    L.w = cc.W; L.p = cc.p; L.desc = cc.desc;
  }
  return L;
}

/** Build a complete, serialisable recipe. O = overrides (usually URL params as a plain object). */
export function makeRecipe(styleId, seed, O = {}, settings = {}) {
  let st = STYLE_MAP[styleId] || STYLES[0];
  let hsh = 2166136261; for (const ch of st.id) hsh = Math.imul(hsh ^ ch.charCodeAt(0), 16777619);
  const rng = makeRng((seed ^ hsh) >>> 0);
  if (st.force) O = { ...st.force, ...O };
  const R = { style: st.id, seed: seed >>> 0, title: makeTitle(makeRng((seed ^ 0x51ed27) >>> 0)) };
  const remix = !!st.remix;
  const pickStyle = (avoid) => { const list = MIXABLE().filter((s) => s.id !== avoid && !s.remix); return list[Math.floor(rng.next() * list.length)]; };
  let A = remix ? (STYLE_MAP[O.a] || pickStyle()) : st;
  if (remix && A.creature && rng.chance(0.5)) A = pickStyle(A.id);
  const layers = [layerSpec(A, rng, O, true)];
  // ---- composite (remix, or any style with mix=/mask=/shape=/xf params) ----
  let comp = null;
  const wantsComp = remix || O.mix || O.mask || O.shape || O.xa || O.blend || O.warp || O.hue || O.sat;
  if (wantsComp) {
    const B = O.mix ? STYLE_MAP[O.mix] : (remix ? pickStyle(A.id) : null);
    if (B) layers.push(layerSpec(B, rng, {}, false));
    let mask = idx(MASKS, O.mask, remix ? rng.pick([0, 1, 2, 2, 2, 3, 3, 4, 4, 5]) : (O.shape ? 2 : 0));
    let maskStyle = STYLE_MAP[O.mask] || null;
    if (maskStyle) mask = 1; else if (mask === 1) maskStyle = pickStyle(A.id);
    if (mask === 1 && maskStyle) { if (layers.length < 2) layers.push(layerSpec(A, rng, {}, false)); layers[2] = layerSpec(maskStyle, rng, {}, false); }
    const blend = idx(BLENDS, O.blend, remix ? rng.pick([0, 0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 6, 8, 9, 9, 9, 10, 10, 11]) : 0);
    if (blend === 0 && mask === 0 && O.mask == null) mask = rng.pick([2, 2, 3, 4, 5]);
    comp = {
      blend, amount: num(O.amount, remix ? rng.float(0.65, 1) : 1), mask, thr: num(O.thr, rng.float(0.35, 0.65)), soft: num(O.soft, rng.float(0.01, 0.2)),
      xa: idx(XFORMS, O.xa, remix && rng.chance(0.45) ? rng.int(1, 7) : 0), xb: idx(XFORMS, O.xb, remix && rng.chance(0.35) ? rng.int(1, 7) : 0), xamt: num(O.xamt, rng.next()),
      warp: num(O.warp, blend === 10 ? rng.float(0.3, 1) : (remix && rng.chance(0.25) ? rng.float(0.05, 0.4) : 0)),
      shape: idx(SHAPES, O.shape, rng.int(0, SHAPES.length - 1)), inv: O.inv != null ? +O.inv : (rng.chance(0.3) ? 1 : 0),
      hue: num(O.hue, remix && rng.chance(0.2) ? rng.float(-0.5, 0.5) : 0), sat: num(O.sat, remix ? rng.float(0.85, 1.3) : 1),
      scale: num(O.scale, rng.float(0.8, 1.7)), rot: num(O.rot, rng.chance(0.5) ? 0 : rng.float(-0.6, 0.6)),
    };
    if (mask === 2 && O.mask == null && !remix) comp.mask = 2;
    if (!B && comp.mask === 0 && !comp.xa && !comp.warp) comp.mask = 2;
  }
  layers.forEach((L, i) => { L.phaseOff = i ? rng.next() : 0; });
  // ---- palette ----
  let palName = settings.palette && settings.palette !== 'auto' ? settings.palette : rng.pick(remix ? [...PALETTE_NAMES, 'random', 'random', 'random'] : layers[0].pals);
  const preset = settings.fx && settings.fx !== 'auto' ? FX_PRESETS[settings.fx] : null;
  if (preset && preset.pal && (!settings.palette || settings.palette === 'auto')) palName = preset.pal;
  let palHex = palName === 'random' ? randomPalette(rng) : (PALETTES[palName] || PALETTES.aurora);
  if (O.palette && (PALETTES[O.palette] || O.palette === 'random')) { palName = O.palette; palHex = O.palette === 'random' ? randomPalette(rng) : PALETTES[O.palette]; }
  if (O.colors) { const c = expandColors(String(O.colors).split(/[,\s]+/)); if (c) { palHex = c; palName = 'custom'; } }
  if (O.reverse === '1') palHex = palHex.slice().reverse();
  // ---- effects ----
  let fx = preset ? { ...preset } : remix ? { ...rng.pick(Object.values(ART)) } : { ...(Array.isArray(st.fx) ? rng.pick(st.fx) : st.fx) };
  delete fx.pal;
  if (O.dither) fx.mode = O.dither === 'none' ? 'none' : O.dither;
  for (const k of FX_KEYS) if (O[k] != null) fx[k] = num(O[k], fx[k]);
  // ---- assemble ----
  R.palName = palName; R.palHex = palHex; R.fx = fx; R.layers = layers.map(({ pals, ...l }) => l); R.comp = comp;
  R.phase0 = O.time != null ? num(O.time, 0) % 1 : rng.next();
  R.transition = idx(TRANSITIONS, O.transition, Math.floor(rng.next() * TRANSITIONS.length));
  const names = layers.map((l) => STYLE_MAP[l.style].name);
  R.name = remix || layers.length > 1 ? (names.length > 1 ? `${names[0]} × ${names[1]}` : names[0]) : st.name;
  const cdesc = comp ? [BLENDS[comp.blend], comp.mask ? (comp.mask === 2 ? SHAPES[comp.shape] + ' mask' : MASKS[comp.mask] + ' mask') : '', comp.xa ? XFORMS[comp.xa] : '', comp.warp ? 'warp' : ''].filter(Boolean).join(' · ') : '';
  R.desc = [layers[0].desc, cdesc].filter(Boolean).join(' · ');
  return R;
}

/** Turn a recipe into a renderable job (compiles shaders; painters are created per render size). */
export async function prepare(Rr, recipe) {
  const layers = await Promise.all(recipe.layers.map(async (l) => {
    const o = { gen: l.gen, seed: new Float32Array(l.seed4), p: new Float32Array(l.p), w: l.w ? new Float32Array(l.w) : null, phaseOff: l.phaseOff, spec: l };
    if (l.gen.startsWith('s:')) o.prog = await Rr.load(l.gen.slice(2));
    return o;
  }));
  return { recipe, layers, comp: recipe.comp, fx: recipe.fx, pal: new Float32Array(recipe.palHex.flatMap(hexToRgb)), pw: 0, ph: 0 };
}

export function ensurePainters(Rr, job, video) {
  if (job.pw === Rr.w && job.ph === Rr.h && job.pv === video) return;
  job.layers.forEach((L, i) => {
    if (L.prog) return;
    const c = Rr.ctx2d(i); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    const s = job.recipe.seed + i * 7919;
    L.painter = CANVAS_GENS[L.gen.slice(2)](c, Rr.w, Rr.h, makeRng((s ^ 0x9e3779b9) >>> 0), job.recipe.palHex, makeNoise(makeRng(s + 7)), { video });
  });
  job.pw = Rr.w; job.ph = Rr.h; job.pv = video;
}

export function drawJob(Rr, job, phase, time, tr, video = false) {
  ensurePainters(Rr, job, video);
  Rr.draw({ layers: job.layers, comp: job.comp, fx: job.fx, pal: job.pal, phase, time, tr });
}

/** Known URL override keys (everything except paging/meta params). */
export const OVERRIDE_KEYS = ['a', 'mix', 'mask', 'shape', 'blend', 'amount', 'thr', 'soft', 'xa', 'xb', 'xamt', 'warp', 'inv', 'hue', 'sat', 'scale', 'rot', 'palette', 'colors', 'reverse', 'dither', 'time', 'transition', 'material', 'eyes', ...FX_KEYS, ...Object.keys(WORLD_KEYS)];
export function overridesFrom(params) { const O = {}; for (const k of OVERRIDE_KEYS) if (params.has(k)) O[k] = params.get(k); return O; }
