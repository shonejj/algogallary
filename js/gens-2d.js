// Canvas2D generators: create(ctx, W, H, rng, pal, noise) -> { draw(phase) }
// Cheap to redraw every frame so they animate in video mode.
const TAU = Math.PI * 2;
const SANS = 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const DISPLAY = '"Arial Black", "Helvetica Neue", Impact, system-ui, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';
const WORDS = ['SIGNAL', 'DRIFT', 'NOVA', 'ECHO', 'BLOOM', 'PULSE', 'ORBIT', 'FLUX', 'HALO', 'PRISM', 'VOID', 'DREAM', 'WAVE', 'GLOW', 'SOLAR', 'CHROME', 'STATIC', 'LUCID', 'AURA', 'NEON', 'ZENITH', 'EMBER', 'TIDE', 'ATLAS', 'MOTION', 'FORM', 'SPACE', 'LIGHT'];
const HEADLINES = ['Build something luminous', 'Design at the speed of thought', 'Made from pure math', 'Ship the future, softly', 'Every pixel, generated', 'Shape the signal', 'Tools for curious minds', 'A calmer way to create', 'Where ideas take form', 'Light, structure, motion'];
const SUBS = ['Procedural visuals for interfaces, posters and motion.', 'No assets, no prompts. Just algorithms and taste.', 'Infinite variations from a single seed.', 'Fast, open and free for everyone.'];
const LINES = ['the hour folds into a quiet blue', 'we kept the light in our pockets', 'every street remembers rain', 'a small moon hums over the sea', 'paper boats of unsent letters', 'ink drying on the edge of morning'];

function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function fitText(ctx, text, font, weight, maxW, maxSize) {
  let s = maxSize; ctx.font = `${weight} ${s}px ${font}`;
  const w = ctx.measureText(text).width; if (w > maxW) s = Math.floor(s * maxW / w);
  ctx.font = `${weight} ${s}px ${font}`; return s;
}
function star(ctx, x, y, r, n = 5, inner = 0.45, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) { const a = rot + i * Math.PI / n, rad = i % 2 ? r * inner : r; ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); }
  ctx.closePath();
}
const lum = (hex) => { const n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16 & 255) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255; };
const ink = (hex, P) => lum(hex) > 0.55 ? P[0] : P[4];

export const CANVAS_GENS = {

  brutal(ctx, W, H, rng, P) {
    const U = Math.min(W, H) / 1000, cols = W > H ? 3 : 2, rows = W > H ? 2 : 3;
    const cells = []; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push([c, r]);
    const cards = rng.shuffle(cells).slice(0, rng.int(3, cells.length)).map(([c, r]) => ({
      x: (c + rng.float(0.05, 0.15)) * W / cols, y: (r + rng.float(0.1, 0.2)) * H / rows,
      w: W / cols * rng.float(0.65, 0.8), h: H / rows * rng.float(0.55, 0.72),
      col: rng.pick([P[1], P[2], P[3]]), word: rng.pick(WORDS), ph: rng.float(0, TAU), rot: rng.float(-0.04, 0.04),
    }));
    const head = rng.pick(WORDS) + ' ' + rng.pick(WORDS);
    const stickers = Array.from({ length: 4 }, () => ({ x: rng.float(0.05, 0.95) * W, y: rng.float(0.05, 0.95) * H, r: rng.float(30, 70) * U, n: rng.int(5, 12), c: rng.pick(P.slice(1, 4)), ph: rng.float(0, TAU) }));
    return { draw(ph) {
      ctx.fillStyle = P[4]; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = P[0] + '22'; for (let x = 20 * U; x < W; x += 40 * U) for (let y = 20 * U; y < H; y += 40 * U) ctx.fillRect(x, y, 3 * U, 3 * U);
      const lw = 6 * U, sh = 12 * U;
      for (const c of cards) {
        const bob = Math.sin(ph * TAU + c.ph) * 8 * U;
        ctx.save(); ctx.translate(c.x + c.w / 2, c.y + c.h / 2 + bob); ctx.rotate(c.rot);
        ctx.fillStyle = P[0]; rr(ctx, -c.w / 2 + sh, -c.h / 2 + sh, c.w, c.h, 18 * U); ctx.fill();
        ctx.fillStyle = c.col; rr(ctx, -c.w / 2, -c.h / 2, c.w, c.h, 18 * U); ctx.fill();
        ctx.lineWidth = lw; ctx.strokeStyle = P[0]; ctx.stroke();
        ctx.fillStyle = P[0]; const s = fitText(ctx, c.word, DISPLAY, 900, c.w * 0.8, c.h * 0.3);
        ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(c.word, -c.w / 2 + 28 * U, -c.h / 2 + 24 * U);
        ctx.font = `600 ${s * 0.28}px ${SANS}`; ctx.fillText('Generated · No assets', -c.w / 2 + 28 * U, -c.h / 2 + 34 * U + s);
        const bw = c.w * 0.42, bh = 56 * U, bx = -c.w / 2 + 28 * U, by = c.h / 2 - bh - 28 * U;
        ctx.fillStyle = P[0]; rr(ctx, bx + 6 * U, by + 6 * U, bw, bh, bh / 2); ctx.fill();
        ctx.fillStyle = P[4]; rr(ctx, bx, by, bw, bh, bh / 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = P[0]; ctx.font = `800 ${bh * 0.4}px ${SANS}`; ctx.textBaseline = 'middle'; ctx.textAlign = 'center'; ctx.fillText('CLICK →', bx + bw / 2, by + bh / 2);
        ctx.restore();
      }
      for (const s of stickers) {
        ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(ph * TAU * 0.25 + s.ph);
        star(ctx, 0, 0, s.r, s.n, 0.55); ctx.fillStyle = s.c; ctx.fill(); ctx.lineWidth = lw * 0.8; ctx.strokeStyle = P[0]; ctx.stroke(); ctx.restore();
      }
      ctx.save(); ctx.translate(W / 2, H * 0.08 + 30 * U); ctx.rotate(-0.03);
      const s = fitText(ctx, head, DISPLAY, 900, W * 0.7, 90 * U); const tw = ctx.measureText(head).width;
      ctx.fillStyle = P[0]; ctx.fillRect(-tw / 2 - 24 * U + sh / 2, -s * 0.65 + sh / 2, tw + 48 * U, s * 1.3);
      ctx.fillStyle = P[2]; ctx.fillRect(-tw / 2 - 24 * U, -s * 0.65, tw + 48 * U, s * 1.3);
      ctx.lineWidth = lw; ctx.strokeStyle = P[0]; ctx.strokeRect(-tw / 2 - 24 * U, -s * 0.65, tw + 48 * U, s * 1.3);
      ctx.fillStyle = P[0]; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(head, 0, 0); ctx.restore();
    } };
  },

  bento(ctx, W, H, rng, P) {
    const U = Math.min(W, H) / 1000, pad = 28 * U, gap = 18 * U;
    const tiles = [];
    const split = (x, y, w, h, d) => {
      if (d > 3 || (d > 1 && rng.chance(0.3)) || w < 220 * U || h < 180 * U) { tiles.push({ x, y, w, h, k: rng.int(0, 5), c: rng.int(1, 3), v: rng.float(), ph: rng.float(0, TAU) }); return; }
      if (w / h > rng.float(0.7, 1.4)) { const s = rng.float(0.35, 0.65) * w; split(x, y, s - gap / 2, h, d + 1); split(x + s + gap / 2, y, w - s - gap / 2, h, d + 1); }
      else { const s = rng.float(0.35, 0.65) * h; split(x, y, w, s - gap / 2, d + 1); split(x, y + s + gap / 2, w, h - s - gap / 2, d + 1); }
    };
    split(pad, pad, W - pad * 2, H - pad * 2, 0);
    const title = rng.pick(HEADLINES);
    return { draw(ph) {
      ctx.fillStyle = P[0]; ctx.fillRect(0, 0, W, H);
      tiles.forEach((t, i) => {
        const g = ctx.createLinearGradient(t.x, t.y, t.x + t.w, t.y + t.h);
        g.addColorStop(0, P[t.c] + 'ff'); g.addColorStop(1, P[0] === P[t.c] ? P[1] : P[t.c] + '99');
        ctx.fillStyle = i === 0 ? g : '#ffffff10'; rr(ctx, t.x, t.y, t.w, t.h, 26 * U); ctx.fill();
        ctx.strokeStyle = '#ffffff22'; ctx.lineWidth = 1.5 * U; ctx.stroke();
        ctx.save(); rr(ctx, t.x, t.y, t.w, t.h, 26 * U); ctx.clip();
        const fg = i === 0 ? ink(P[t.c], P) : P[4], m = 24 * U, s = Math.min(t.w, t.h);
        ctx.fillStyle = fg; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        if (i === 0) { const fs = fitText(ctx, title, SANS, 800, t.w - m * 2, s * 0.16); ctx.fillText(title, t.x + m, t.y + m); ctx.globalAlpha = 0.7; ctx.font = `500 ${fs * 0.4}px ${SANS}`; ctx.fillText(rng && SUBS[i % SUBS.length], t.x + m, t.y + m + fs * 1.3); ctx.globalAlpha = 1; }
        else if (t.k === 0) { const n = Math.round(t.v * 900 + 100); ctx.font = `800 ${s * 0.3}px ${SANS}`; ctx.fillText(n + (t.v > 0.5 ? 'k' : '%'), t.x + m, t.y + t.h - m - s * 0.32); ctx.globalAlpha = 0.6; ctx.font = `500 ${s * 0.08}px ${SANS}`; ctx.fillText(rng ? WORDS[(i * 7) % WORDS.length].toLowerCase() + ' rate' : '', t.x + m, t.y + m); ctx.globalAlpha = 1; }
        else if (t.k === 1) { const n = 12, bw = (t.w - m * 2) / n; for (let b = 0; b < n; b++) { const hgt = (0.2 + 0.8 * Math.abs(Math.sin(b * 1.7 + t.v * 9 + ph * TAU))) * (t.h - m * 2) * 0.7; ctx.fillStyle = b % 3 ? P[t.c] : P[4]; rr(ctx, t.x + m + b * bw + bw * 0.15, t.y + t.h - m - hgt, bw * 0.7, hgt, bw * 0.3); ctx.fill(); } }
        else if (t.k === 2) { const cx = t.x + t.w / 2, cy = t.y + t.h / 2, r = s * 0.32; ctx.lineWidth = r * 0.22; ctx.strokeStyle = '#ffffff1a'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke(); ctx.strokeStyle = P[t.c]; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + TAU * (0.3 + 0.6 * t.v) * (0.9 + 0.1 * Math.sin(ph * TAU))); ctx.stroke(); ctx.fillStyle = P[4]; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `800 ${r * 0.5}px ${SANS}`; ctx.fillText(Math.round((0.3 + 0.6 * t.v) * 100) + '%', cx, cy); }
        else if (t.k === 3) { for (let k = 0; k < 4; k++) { const cy = t.y + m + k * (t.h - m * 2) / 4; ctx.fillStyle = '#ffffff14'; rr(ctx, t.x + m, cy, t.w - m * 2, (t.h - m * 2) / 4 - 10 * U, 12 * U); ctx.fill(); ctx.fillStyle = P[1 + k % 3]; ctx.beginPath(); ctx.arc(t.x + m + 26 * U, cy + ((t.h - m * 2) / 4 - 10 * U) / 2, 12 * U, 0, TAU); ctx.fill(); } }
        else { const cx = t.x + t.w * 0.5, cy = t.y + t.h * 0.5; for (let k = 0; k < 3; k++) { const g2 = ctx.createRadialGradient(cx + Math.cos(ph * TAU + k * 2) * s * 0.2, cy + Math.sin(ph * TAU + k * 2) * s * 0.2, 0, cx, cy, s * 0.6); g2.addColorStop(0, P[1 + k] + 'cc'); g2.addColorStop(1, P[1 + k] + '00'); ctx.fillStyle = g2; ctx.fillRect(t.x, t.y, t.w, t.h); } }
        ctx.restore();
      });
    } };
  },

  memphis(ctx, W, H, rng, P) {
    const U = Math.min(W, H) / 1000, items = [];
    for (let i = 0; i < 46; i++) items.push({ t: rng.int(0, 6), x: rng.float() * W, y: rng.float() * H, s: rng.float(30, 90) * U, r: rng.float(0, TAU), c: rng.pick(P.slice(0, 4)), ph: rng.float(0, TAU) });
    return { draw(ph) {
      ctx.fillStyle = P[4]; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = P[0] + '30'; for (let x = 0; x < W; x += 28 * U) for (let y = 0; y < H; y += 28 * U) { ctx.beginPath(); ctx.arc(x + ((y / (28 * U)) % 2) * 14 * U, y, 2.5 * U, 0, TAU); ctx.fill(); }
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const it of items) {
        ctx.save(); ctx.translate(it.x, it.y + Math.sin(ph * TAU + it.ph) * 6 * U); ctx.rotate(it.r + Math.sin(ph * TAU + it.ph) * 0.15);
        ctx.fillStyle = it.c; ctx.strokeStyle = it.c; ctx.lineWidth = 9 * U; const s = it.s;
        if (it.t === 0) { ctx.beginPath(); for (let k = 0; k <= 40; k++) { const x = -s + k * s / 20; ctx.lineTo(x, Math.sin(k * 0.6) * s * 0.25); } ctx.stroke(); }
        else if (it.t === 1) { ctx.beginPath(); ctx.moveTo(0, -s * 0.6); ctx.lineTo(s * 0.6, s * 0.5); ctx.lineTo(-s * 0.6, s * 0.5); ctx.closePath(); ctx.fill(); ctx.strokeStyle = P[0]; ctx.lineWidth = 4 * U; ctx.stroke(); }
        else if (it.t === 2) { ctx.beginPath(); ctx.arc(0, 0, s * 0.4, 0, TAU); ctx.fill(); }
        else if (it.t === 3) { ctx.beginPath(); for (let k = 0; k < 7; k++) ctx.lineTo(-s + k * s / 3, (k % 2 ? 1 : -1) * s * 0.2); ctx.stroke(); }
        else if (it.t === 4) { ctx.beginPath(); ctx.arc(0, 0, s * 0.5, 0, Math.PI); ctx.fill(); ctx.strokeStyle = P[0]; ctx.lineWidth = 4 * U; ctx.stroke(); }
        else if (it.t === 5) { ctx.lineWidth = 4 * U; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(k * s * 0.2, -s * 0.5); ctx.lineTo(k * s * 0.2, s * 0.5); ctx.stroke(); } }
        else { ctx.fillRect(-s * 0.08, -s * 0.4, s * 0.16, s * 0.8); ctx.fillRect(-s * 0.4, -s * 0.08, s * 0.8, s * 0.16); }
        ctx.restore();
      }
    } };
  },

  bauhaus(ctx, W, H, rng, P) {
    const n = rng.int(3, 6), cs = Math.max(W, H) / n, cols = Math.ceil(W / cs), rows = Math.ceil(H / cs), cells = [];
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) cells.push({ x, y, t: rng.int(0, 6), r: rng.int(0, 3), a: rng.pick(P.slice(0, 4)), b: rng.pick(P.slice(1, 5)), ph: rng.float() });
    return { draw(ph) {
      for (const c of cells) {
        const x = c.x * cs, y = c.y * cs; ctx.fillStyle = c.b === c.a ? P[4] : c.b; ctx.fillRect(x, y, cs + 1, cs + 1);
        ctx.save(); ctx.translate(x + cs / 2, y + cs / 2); ctx.rotate(c.r * Math.PI / 2 + (Math.floor((ph + c.ph) * 4) % 4 === 0 && ph > 0 ? 0 : 0)); ctx.fillStyle = c.a; const h = cs / 2;
        ctx.beginPath();
        if (c.t === 0) { ctx.moveTo(-h, -h); ctx.arc(-h, -h, cs, 0, Math.PI / 2); }
        else if (c.t === 1) { ctx.arc(0, 0, h * 0.8, 0, TAU); }
        else if (c.t === 2) { ctx.moveTo(-h, h); ctx.arc(0, h, h, Math.PI, TAU); }
        else if (c.t === 3) { ctx.moveTo(-h, -h); ctx.lineTo(h, -h); ctx.lineTo(-h, h); }
        else if (c.t === 4) { ctx.rect(-h, -h, h, cs); }
        else { ctx.arc(0, 0, h, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.fillStyle = c.b; ctx.arc(0, 0, h * 0.45, 0, TAU); }
        ctx.fill(); ctx.restore();
      }
    } };
  },

  swiss(ctx, W, H, rng, P) {
    const U = Math.min(W, H) / 1000, word = rng.pick(WORDS), word2 = rng.pick(WORDS), cols = 12, m = 48 * U;
    const circ = { x: rng.float(0.3, 0.8) * W, y: rng.float(0.25, 0.6) * H, r: rng.float(0.15, 0.3) * Math.min(W, H) };
    const acc = rng.pick([P[1], P[2], P[3]]), rotate = rng.chance(0.4);
    return { draw(ph) {
      ctx.fillStyle = P[4]; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = P[0] + '18'; ctx.lineWidth = 1 * U; for (let i = 0; i <= cols; i++) { const x = m + i * (W - m * 2) / cols; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(circ.x + Math.sin(ph * TAU) * 20 * U, circ.y, circ.r, 0, TAU); ctx.fill();
      ctx.fillStyle = P[0]; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.save(); if (rotate) { ctx.translate(m, H - m); ctx.rotate(-Math.PI / 2); ctx.translate(-m, -(H - m)); }
      const s = fitText(ctx, word, SANS, 900, (rotate ? H : W) - m * 2, H * 0.3); ctx.fillText(word, m - s * 0.05, H - m);
      ctx.restore();
      ctx.font = `700 ${s * 0.3}px ${SANS}`; ctx.fillText(word2.toLowerCase(), m, m + s * 0.3);
      ctx.font = `400 ${16 * U}px ${SANS}`;
      const tx = W - m - (W - m * 2) * 4 / cols;
      ['Internationale', 'Typografie', 'Ausstellung', '', 'Generative Grid', 'No. ' + rng.int(1, 99), String(2026)].forEach((t, i) => ctx.fillText(t, tx, m + 20 * U + i * 22 * U));
      ctx.fillStyle = P[0]; ctx.fillRect(m, H * 0.5, (W - m * 2) * 0.33, 8 * U);
    } };
  },

  flow(ctx, W, H, rng, P, N, opts = {}) {
    const U = Math.min(W, H) / 1000, sc = rng.float(0.0012, 0.003) / U, curl = rng.float(1.5, 4), cnt = Math.round(rng.int(900, 1600) * Math.min(1.5, W * H / 1e6 + 0.5) * (opts.video ? 0.4 : 1));
    const lines = Array.from({ length: cnt }, () => ({ x: rng.float() * W, y: rng.float() * H, c: P[rng.int(1, 4)], w: rng.float(0.6, 2.4) * U, len: rng.int(40, 140) }));
    const off = rng.float(0, 100);
    return { draw(ph) {
      ctx.fillStyle = P[0]; ctx.fillRect(0, 0, W, H); ctx.lineCap = 'round';
      const t = Math.cos(ph * TAU) * 0.4, t2 = Math.sin(ph * TAU) * 0.4;
      for (const l of lines) {
        ctx.strokeStyle = l.c; ctx.globalAlpha = 0.75; ctx.lineWidth = l.w; ctx.beginPath();
        let x = l.x, y = l.y; ctx.moveTo(x, y);
        for (let i = 0; i < l.len; i++) { const a = N.fbm(x * sc + off + t, y * sc + t2, 3) * TAU * curl; x += Math.cos(a) * 3 * U; y += Math.sin(a) * 3 * U; ctx.lineTo(x, y); if (x < 0 || x > W || y < 0 || y > H) break; }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    } };
  },

  packing(ctx, W, H, rng, P) {
    const U = Math.min(W, H) / 1000, circles = [], maxR = rng.float(60, 160) * U, minR = 3 * U;
    for (let tries = 0; tries < 9000 && circles.length < 1400; tries++) {
      const x = rng.float() * W, y = rng.float() * H; let r = maxR;
      for (const c of circles) { const d = Math.hypot(c.x - x, c.y - y) - c.r - 2 * U; if (d < r) r = d; if (r < minR) break; }
      if (r >= minR) circles.push({ x, y, r, c: P[rng.int(1, 4)], k: rng.int(0, 3), ph: rng.float(0, TAU) });
    }
    return { draw(ph) {
      ctx.fillStyle = P[0]; ctx.fillRect(0, 0, W, H);
      for (const c of circles) {
        const r = c.r * (0.92 + 0.08 * Math.sin(ph * TAU + c.ph));
        ctx.fillStyle = c.c; ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, TAU); ctx.fill();
        if (c.k === 0 && r > 10 * U) { ctx.fillStyle = P[0]; ctx.beginPath(); ctx.arc(c.x, c.y, r * 0.45, 0, TAU); ctx.fill(); }
        if (c.k === 1 && r > 10 * U) { ctx.strokeStyle = P[4]; ctx.lineWidth = r * 0.1; ctx.beginPath(); ctx.arc(c.x, c.y, r * 0.65, 0, TAU); ctx.stroke(); }
      }
    } };
  },

  attractor(ctx, W, H, rng, P, N, opts = {}) {
    // search for Clifford parameters that give a spread-out (non-degenerate) attractor
    let a0, b0, c0, d0;
    for (let k = 0; k < 40; k++) {
      a0 = rng.float(-2, 2); b0 = rng.float(-2, 2); c0 = rng.float(-2, 2); d0 = rng.float(-2, 2);
      const seen = new Set(); let x = 0.1, y = 0.1;
      for (let i = 0; i < 6000; i++) { const nx = Math.sin(a0 * y) + c0 * Math.cos(a0 * x); y = Math.sin(b0 * x) + d0 * Math.cos(b0 * y); x = nx; if (i > 100) seen.add(((x * 20) | 0) * 1000 + ((y * 20) | 0)); }
      if (seen.size > 900) break;
    }
    const img = ctx.createImageData(W, H), dens = new Float32Array(W * H);
    const cols = P.map(h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
    const ramp = (t) => { t = Math.min(0.999, Math.max(0, t)) * 4; const i = Math.floor(t), f = t - i, A = cols[i], B = cols[i + 1]; return [A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f, A[2] + (B[2] - A[2]) * f]; };
    return { draw(ph) {
      const a = a0 + 0.08 * Math.sin(ph * TAU), b = b0 + 0.08 * Math.cos(ph * TAU), c = c0, d = d0;
      dens.fill(0); let x = 0.1, y = 0.1, mx = 0;
      const n = opts.video ? Math.min(160000, W * H * 0.25) : Math.min(900000, W * H * 0.8), s = Math.min(W, H) / 4.4;
      for (let i = 0; i < n; i++) {
        const nx = Math.sin(a * y) + c * Math.cos(a * x), ny = Math.sin(b * x) + d * Math.cos(b * y); x = nx; y = ny;
        const px = (W / 2 + x * s) | 0, py = (H / 2 + y * s) | 0;
        if (px >= 0 && px < W && py >= 0 && py < H) { const k = py * W + px; const v = ++dens[k]; if (v > mx) mx = v; }
      }
      const lm = Math.log(mx + 1), D = img.data;
      for (let i = 0; i < W * H; i++) { const t = Math.log(dens[i] + 1) / lm; const col = ramp(Math.pow(t, 0.8)); D[i * 4] = col[0]; D[i * 4 + 1] = col[1]; D[i * 4 + 2] = col[2]; D[i * 4 + 3] = 255; }
      ctx.putImageData(img, 0, 0);
    } };
  },

  palette(ctx, W, H, rng, P) {
    const U = Math.min(W, H) / 1000, name = rng.pick(WORDS) + ' ' + rng.pick(['Dusk', 'Bloom', 'Tide', 'Garden', 'Signal', 'Archive', 'Static']);
    return { draw(ph) {
      ctx.fillStyle = '#f6f4ef'; ctx.fillRect(0, 0, W, H);
      const m = 60 * U, vert = H > W * 1.1, n = 5;
      for (let i = 0; i < n; i++) {
        const t = (i + 0.06 * Math.sin(ph * TAU + i)) ;
        let x, y, w, h;
        if (vert) { x = m; w = W - m * 2; h = (H - m * 3.5) / n; y = m * 2.5 + i * h; } else { y = m * 2.5; h = H - m * 3.5; w = (W - m * 2) / n; x = m + i * w; }
        ctx.fillStyle = P[i]; ctx.fillRect(x, y, w + 1, h + 1);
        ctx.fillStyle = ink(P[i], P); ctx.font = `600 ${22 * U}px ${MONO}`; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
        ctx.fillText(P[i].toUpperCase(), x + 20 * U, y + h - 20 * U);
        const n2 = parseInt(P[i].slice(1), 16); ctx.font = `400 ${15 * U}px ${MONO}`; ctx.globalAlpha = 0.7;
        ctx.fillText(`RGB ${n2 >> 16 & 255} ${n2 >> 8 & 255} ${n2 & 255}`, x + 20 * U, y + h - 50 * U); ctx.globalAlpha = 1; void t;
      }
      ctx.fillStyle = '#111'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.font = `800 ${46 * U}px ${SANS}`; ctx.fillText(name, m, m * 1.6);
      ctx.font = `400 ${18 * U}px ${MONO}`; ctx.textAlign = 'right'; ctx.fillText('palette · algogallery', W - m, m * 1.6);
    } };
  },

  uikit(ctx, W, H, rng, P) {
    const U = Math.min(W, H) / 1000, theme = rng.pick(['glass', 'brutal', 'soft', 'dark']);
    const title = rng.pick(HEADLINES);
    const blobs = Array.from({ length: 4 }, (_, i) => ({ x: rng.float() * W, y: rng.float() * H, r: rng.float(0.25, 0.5) * Math.max(W, H), c: P[1 + i % 3] }));
    const box = (x, y, w, h, r, fillc, opts = {}) => {
      if (theme === 'brutal') { ctx.fillStyle = P[0]; rr(ctx, x + 8 * U, y + 8 * U, w, h, r); ctx.fill(); ctx.fillStyle = fillc; rr(ctx, x, y, w, h, r); ctx.fill(); ctx.lineWidth = 4 * U; ctx.strokeStyle = P[0]; ctx.stroke(); }
      else if (theme === 'soft') { ctx.save(); ctx.shadowColor = '#00000030'; ctx.shadowBlur = 30 * U; ctx.shadowOffsetX = 10 * U; ctx.shadowOffsetY = 10 * U; ctx.fillStyle = fillc; rr(ctx, x, y, w, h, r); ctx.fill(); ctx.shadowColor = '#ffffffcc'; ctx.shadowOffsetX = -10 * U; ctx.shadowOffsetY = -10 * U; ctx.fill(); ctx.restore(); }
      else if (theme === 'glass') { ctx.fillStyle = opts.solid ? fillc : '#ffffff26'; rr(ctx, x, y, w, h, r); ctx.fill(); ctx.strokeStyle = '#ffffff66'; ctx.lineWidth = 1.5 * U; ctx.stroke(); }
      else { ctx.fillStyle = opts.solid ? fillc : '#ffffff0d'; rr(ctx, x, y, w, h, r); ctx.fill(); ctx.strokeStyle = '#ffffff1f'; ctx.lineWidth = 1.5 * U; ctx.stroke(); }
    };
    return { draw(ph) {
      const bg = theme === 'brutal' ? P[4] : theme === 'soft' ? '#e6e9ef' : P[0];
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      if (theme === 'glass') for (const b of blobs) { const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r); g.addColorStop(0, b.c); g.addColorStop(1, b.c + '00'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
      const fg = theme === 'brutal' || theme === 'soft' ? '#16161a' : '#ffffff', acc = P[2], m = 60 * U;
      const soft = theme === 'soft' ? '#e6e9ef' : null;
      ctx.fillStyle = fg; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      const fs = fitText(ctx, title, SANS, 800, W - m * 2, 56 * U); ctx.fillText(title, m, m);
      const colW = (W - m * 3) / 2; let y = m + fs * 1.6;
      // buttons
      box(m, y, colW * 0.46, 64 * U, theme === 'brutal' ? 12 * U : 32 * U, soft || acc, { solid: true });
      ctx.fillStyle = theme === 'soft' ? acc : ink(acc, P); ctx.font = `700 ${22 * U}px ${SANS}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Get started', m + colW * 0.23, y + 32 * U);
      box(m + colW * 0.52, y, colW * 0.46, 64 * U, theme === 'brutal' ? 12 * U : 32 * U, soft || P[4]);
      ctx.fillStyle = theme === 'brutal' || theme === 'soft' ? '#16161a' : fg; ctx.fillText('Learn more', m + colW * 0.75, y + 32 * U);
      y += 100 * U;
      // toggle + slider
      const on = Math.sin(ph * TAU) > 0;
      box(m, y, 110 * U, 56 * U, 28 * U, soft || (on ? acc : '#ffffff33'), { solid: true });
      ctx.fillStyle = theme === 'soft' ? (on ? acc : '#b8bcc6') : '#ffffff'; ctx.beginPath(); ctx.arc(m + (on ? 82 : 28) * U, y + 28 * U, 20 * U, 0, TAU); ctx.fill();
      const sx = m + 150 * U, sw = colW - 150 * U, val = 0.5 + 0.35 * Math.sin(ph * TAU);
      box(sx, y + 20 * U, sw, 16 * U, 8 * U, soft || '#ffffff33', { solid: true });
      ctx.fillStyle = acc; rr(ctx, sx, y + 20 * U, sw * val, 16 * U, 8 * U); ctx.fill();
      ctx.fillStyle = theme === 'brutal' ? P[4] : '#ffffff'; ctx.beginPath(); ctx.arc(sx + sw * val, y + 28 * U, 18 * U, 0, TAU); ctx.fill(); if (theme === 'brutal') { ctx.lineWidth = 4 * U; ctx.strokeStyle = P[0]; ctx.stroke(); }
      y += 96 * U;
      // input
      box(m, y, colW, 64 * U, theme === 'brutal' ? 10 * U : 18 * U, soft || '#ffffff');
      ctx.fillStyle = theme === 'brutal' || theme === 'soft' ? '#16161a88' : fg + 'aa'; ctx.textAlign = 'left'; ctx.font = `400 ${20 * U}px ${SANS}`; ctx.fillText('you@example.com', m + 22 * U, y + 32 * U);
      y += 96 * U;
      // chips
      let cx = m; ['Design', 'Motion', 'Code', 'Type'].forEach((t, i) => { ctx.font = `600 ${18 * U}px ${SANS}`; const w = ctx.measureText(t).width + 40 * U; box(cx, y, w, 44 * U, 22 * U, soft || P[1 + i % 3], { solid: i === 0 }); ctx.fillStyle = theme === 'brutal' || theme === 'soft' ? '#16161a' : fg; ctx.fillText(t, cx + 20 * U, y + 22 * U); cx += w + 14 * U; });
      // card on right
      const cxr = m * 2 + colW, cy = m + fs * 1.6, ch = H - cy - m;
      box(cxr, cy, colW, ch, theme === 'brutal' ? 14 * U : 30 * U, soft || P[4]);
      const g = ctx.createLinearGradient(cxr, cy, cxr + colW, cy + ch * 0.5); g.addColorStop(0, P[1]); g.addColorStop(1, P[3]);
      ctx.fillStyle = g; rr(ctx, cxr + 20 * U, cy + 20 * U, colW - 40 * U, ch * 0.45, 20 * U); ctx.fill();
      ctx.fillStyle = theme === 'brutal' || theme === 'soft' ? '#16161a' : fg; ctx.font = `800 ${28 * U}px ${SANS}`; ctx.textBaseline = 'top';
      ctx.fillText(rng ? WORDS[(title.length) % WORDS.length] : '', cxr + 24 * U, cy + ch * 0.45 + 44 * U);
      ctx.globalAlpha = 0.6; ctx.font = `400 ${18 * U}px ${SANS}`; ctx.fillText('Generated component · ' + theme, cxr + 24 * U, cy + ch * 0.45 + 84 * U); ctx.globalAlpha = 1;
      ctx.fillStyle = P[1 + (title.length % 3)]; ctx.beginPath(); ctx.arc(cxr + colW - 50 * U, cy + ch - 50 * U, 26 * U, 0, TAU); ctx.fill();
    } };
  },

  kinetic(ctx, W, H, rng, P) {
    const U = Math.min(W, H) / 1000, words = rng.shuffle(WORDS).slice(0, rng.int(3, 5)), mode = rng.int(0, 2), bg = rng.chance(0.5) ? P[0] : P[4], fg = bg === P[0] ? P[4] : P[0];
    return { draw(ph) {
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const lh = H / (words.length + 0.5);
      words.forEach((w, i) => {
        const fs = fitText(ctx, w, DISPLAY, 900, W * 0.9, lh * 1.05), cy = lh * (i + 0.75), tw = ctx.measureText(w).width;
        let x = W / 2 - tw / 2;
        for (let k = 0; k < w.length; k++) {
          const ch = w[k], cw = ctx.measureText(ch).width, t = ph * TAU - k * 0.35 - i * 0.8;
          ctx.save(); ctx.translate(x + cw / 2, cy);
          if (mode === 0) ctx.translate(0, Math.sin(t) * fs * 0.15);
          else if (mode === 1) ctx.scale(1, 0.6 + 0.4 * Math.abs(Math.cos(t)));
          else ctx.rotate(Math.sin(t) * 0.25);
          ctx.fillStyle = (k + i) % 5 === 0 ? P[2] : fg; ctx.fillText(ch, 0, 0); ctx.restore(); x += cw;
        }
      });
    } };
  },

  pattern(ctx, W, H, rng, P) {
    const U = Math.min(W, H) / 1000, s = rng.float(50, 130) * U, kind = rng.int(0, 5), bg = P[rng.pick([0, 4])], c1 = P[rng.int(1, 3)], c2 = P[rng.int(1, 3)];
    return { draw(ph) {
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); const off = ph * s * 2;
      ctx.lineWidth = s * 0.12; ctx.lineCap = 'round';
      for (let y = -s * 2; y < H + s * 2; y += s) for (let x = -s * 2; x < W + s * 2; x += s) {
        const X = x + (kind % 2 ? off : 0) % s, Y = y + (kind % 2 ? 0 : off) % s, alt = ((Math.round(x / s) + Math.round(y / s)) & 1);
        ctx.fillStyle = alt ? c1 : c2; ctx.strokeStyle = alt ? c1 : c2;
        if (kind === 0) { ctx.beginPath(); ctx.arc(X, Y, s * 0.2, 0, TAU); ctx.fill(); }
        else if (kind === 1) { ctx.fillRect(X - s * 0.25, Y - s * 0.06, s * 0.5, s * 0.12); ctx.fillRect(X - s * 0.06, Y - s * 0.25, s * 0.12, s * 0.5); }
        else if (kind === 2) { ctx.beginPath(); ctx.arc(X, Y, s * 0.5, 0, Math.PI); ctx.stroke(); }
        else if (kind === 3) { ctx.beginPath(); ctx.moveTo(X - s / 2, Y); ctx.lineTo(X, Y - s * 0.3); ctx.lineTo(X + s / 2, Y); ctx.stroke(); }
        else if (kind === 4) { star(ctx, X, Y, s * 0.3, 4, 0.35); ctx.fill(); }
        else { ctx.beginPath(); ctx.moveTo(X - s * 0.3, Y - s * 0.3); ctx.lineTo(X + s * 0.3, Y + s * 0.3); ctx.stroke(); }
      }
    } };
  },

  spiro(ctx, W, H, rng, P) {
    const U = Math.min(W, H) / 1000, layers = rng.int(3, 6), sets = Array.from({ length: layers }, (_, i) => ({ R: rng.float(200, 380) * U, r: rng.float(40, 190) * U * (rng.chance(0.5) ? 1 : -1), d: rng.float(40, 200) * U, c: P[1 + i % 4], w: rng.float(0.6, 1.6) * U }));
    return { draw(ph) {
      ctx.fillStyle = P[0]; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'lighter';
      for (const s of sets) {
        ctx.strokeStyle = s.c; ctx.globalAlpha = 0.7; ctx.lineWidth = s.w; ctx.beginPath();
        const k = (s.R - s.r) / s.r, rotA = ph * TAU / layers;
        for (let t = 0; t <= TAU * 40; t += 0.02) {
          const x = (s.R - s.r) * Math.cos(t + rotA) + s.d * Math.cos(k * t), y = (s.R - s.r) * Math.sin(t + rotA) - s.d * Math.sin(k * t);
          ctx.lineTo(W / 2 + x, H / 2 + y);
        }
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    } };
  },

  webhero(ctx, W, H, rng, P) {
    const U = Math.min(W, H) / 1000, head = rng.pick(HEADLINES), sub = rng.pick(SUBS), brand = rng.pick(WORDS), dark = rng.chance(0.6);
    const bg = dark ? P[0] : P[4], fg = dark ? '#ffffff' : '#111111', acc = P[2];
    const blobs = Array.from({ length: 3 }, (_, i) => ({ x: rng.float(0.5, 0.95), y: rng.float(0.3, 0.8), r: rng.float(0.15, 0.3), c: P[1 + i], ph: rng.float(0, TAU) }));
    return { draw(ph) {
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); const m = 56 * U;
      for (const b of blobs) { const x = b.x * W + Math.cos(ph * TAU + b.ph) * 30 * U, y = b.y * H + Math.sin(ph * TAU + b.ph) * 30 * U, r = b.r * Math.max(W, H); const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, b.c + 'dd'); g.addColorStop(1, b.c + '00'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
      ctx.fillStyle = fg; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = `800 ${26 * U}px ${SANS}`; ctx.fillText('◆ ' + brand, m, m);
      ctx.font = `500 ${18 * U}px ${SANS}`; ctx.globalAlpha = 0.75; const nav = ['Product', 'Pricing', 'Docs', 'Blog']; let nx = W - m - 140 * U - nav.length * 100 * U; if (W > 800 * U) nav.forEach((t, i) => ctx.fillText(t, nx + i * 100 * U, m)); ctx.globalAlpha = 1;
      ctx.fillStyle = fg; rr(ctx, W - m - 130 * U, m - 24 * U, 130 * U, 48 * U, 24 * U); ctx.fill(); ctx.fillStyle = bg; ctx.textAlign = 'center'; ctx.font = `700 ${17 * U}px ${SANS}`; ctx.fillText('Sign up', W - m - 65 * U, m);
      ctx.fillStyle = fg + '18'; rr(ctx, m, H * 0.28 - 50 * U, 260 * U, 40 * U, 20 * U); ctx.fill(); ctx.fillStyle = fg; ctx.textAlign = 'left'; ctx.font = `600 ${15 * U}px ${SANS}`; ctx.fillText('✦  New · Generated layouts', m + 18 * U, H * 0.28 - 30 * U);
      const words = head.split(' '); const half = Math.ceil(words.length / 2); const l1 = words.slice(0, half).join(' '), l2 = words.slice(half).join(' ');
      const fs = fitText(ctx, l1.length > l2.length ? l1 : l2, SANS, 800, W * 0.62, 110 * U);
      ctx.textBaseline = 'alphabetic'; ctx.fillText(l1, m, H * 0.28 + fs); ctx.fillStyle = acc; ctx.fillText(l2, m, H * 0.28 + fs * 2.05);
      ctx.fillStyle = fg; ctx.globalAlpha = 0.7; ctx.font = `400 ${24 * U}px ${SANS}`; ctx.fillText(sub, m, H * 0.28 + fs * 2.05 + 60 * U); ctx.globalAlpha = 1;
      const by = H * 0.28 + fs * 2.05 + 110 * U; ctx.fillStyle = acc; rr(ctx, m, by, 200 * U, 60 * U, 30 * U); ctx.fill(); ctx.fillStyle = ink(acc, P); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `700 ${20 * U}px ${SANS}`; ctx.fillText('Start free →', m + 100 * U, by + 30 * U);
      ctx.strokeStyle = fg + '55'; ctx.lineWidth = 1.5 * U; rr(ctx, m + 220 * U, by, 180 * U, 60 * U, 30 * U); ctx.stroke(); ctx.fillStyle = fg; ctx.fillText('Watch demo', m + 310 * U, by + 30 * U);
    } };
  },

  poem(ctx, W, H, rng, P) {
    const U = Math.min(W, H) / 1000, lines = rng.shuffle(LINES).slice(0, 4), num = rng.int(1, 64);
    return { draw(ph) {
      ctx.fillStyle = P[4]; ctx.fillRect(0, 0, W, H); const m = 90 * U;
      ctx.strokeStyle = P[2] + '55'; ctx.lineWidth = 1 * U; for (let y = m * 2; y < H - m; y += 46 * U) { ctx.beginPath(); ctx.moveTo(m, y); ctx.lineTo(W - m, y); ctx.stroke(); }
      ctx.strokeStyle = P[1] + '88'; ctx.beginPath(); ctx.moveTo(m * 1.6, m); ctx.lineTo(m * 1.6, H - m); ctx.stroke();
      ctx.fillStyle = P[0]; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.font = `italic 400 ${30 * U}px ${SERIF}`; ctx.fillText(`no. ${num}`, m * 1.9, m * 1.6);
      lines.forEach((l, i) => { const a = Math.min(1, Math.max(0, ph * 5 - i)); ctx.globalAlpha = ph === 0 ? 1 : 0.25 + 0.75 * a; const fs = fitText(ctx, l, SERIF, 400, W - m * 4, 54 * U); ctx.fillText(l, m * 1.9, m * 2.6 + i * fs * 2.2); });
      ctx.globalAlpha = 1; ctx.fillStyle = P[1]; ctx.font = `italic 400 ${22 * U}px ${SERIF}`; ctx.textAlign = 'right'; ctx.fillText('— anonymous, generated', W - m, H - m);
    } };
  },
};
