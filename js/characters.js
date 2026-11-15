// Procedural character generator (Canvas2D). Every part is chosen independently from the seed:
// species × head × eyes × mouth × accessories × art style × background × composition × colours.
const TAU = Math.PI * 2;
const SPECIES = ['robot', 'astronaut', 'alien', 'spirit', 'cat', 'mushroom', 'knight', 'blob'];
const EYES = ['dots', 'anime', 'visor', 'cyclops', 'three', 'sleepy', 'ring', 'star'];
const MOUTHS = ['smile', 'o', 'cat', 'grin', 'none', 'grill', 'fang', 'flat'];
const ACCS = ['antenna', 'horns', 'halo', 'sprout', 'headphones', 'crown', 'none', 'none', 'scarf', 'flower', 'ears'];
const STYLES = ['flat', 'outline', 'outline', 'neon', 'soft', 'soft'];
const BGS = ['sky', 'burst', 'rings', 'grid', 'dots', 'sun', 'stars'];
const NAMES = ['Pixel', 'Momo', 'Bolt', 'Nori', 'Ziggy', 'Lumen', 'Pip', 'Orbit', 'Kiko', 'Fable', 'Echo', 'Mochi', 'Rune', 'Tofu', 'Nova', 'Juno', 'Sprocket', 'Wisp', 'Taro', 'Quill'];

function rr(c, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function ell(c, x, y, rx, ry, rot = 0) { c.beginPath(); c.ellipse(x, y, Math.max(rx, 0.1), Math.max(ry, 0.1), rot, 0, TAU); }

function makeChar(rng, P) {
  const cols = [P[1], P[2], P[3]];
  return {
    sp: rng.pick(SPECIES), eyes: rng.pick(EYES), mouth: rng.pick(MOUTHS), acc: rng.pick(ACCS), acc2: rng.pick(['none', 'none', 'scarf', 'cape', 'badge', 'blush']),
    body: rng.pick(cols), acc_c: rng.pick([P[3], P[4], P[2]]), iris: rng.pick([P[1], P[2], P[3]]), squash: rng.float(0.85, 1.2),
    headW: rng.float(0.42, 0.6), wave: rng.chance(0.5), ph: rng.float(0, TAU), blink: rng.float(0, 1), tilt: rng.float(-0.12, 0.12),
  };
}

export function character(ctx, W, H, rng, P) {
  const U = Math.min(W, H) / 1000;
  const style = rng.pick(STYLES), bg = rng.pick(BGS), comp = rng.pick(['solo', 'solo', 'solo', 'duo', 'trio']);
  const OUT = P[0], dark = style === 'neon' || rng.chance(0.45);
  const chars = Array.from({ length: comp === 'solo' ? 1 : comp === 'duo' ? 2 : 3 }, () => makeChar(rng, P));
  const name = rng.pick(NAMES) + (rng.chance(0.4) ? '-' + rng.int(1, 99) : '');
  const parts = Array.from({ length: 26 }, () => ({ x: rng.float(), y: rng.float(), r: rng.float(2, 7), s: rng.float(0.3, 1.2), k: rng.int(0, 2) }));
  const label = rng.chance(0.6);

  function paint(fill, o = {}) {
    if (style === 'neon') { ctx.shadowColor = fill; ctx.shadowBlur = 14 * U; ctx.strokeStyle = fill; ctx.lineWidth = (o.lw || 4) * U; ctx.stroke(); ctx.shadowBlur = 0; if (o.solid) { ctx.globalAlpha = 0.15; ctx.fillStyle = fill; ctx.fill(); ctx.globalAlpha = 1; } return; }
    ctx.fillStyle = fill; ctx.fill();
    if (style === 'soft' && !o.noShade) {
      ctx.save(); ctx.clip(); const b = o.box || [0, 0, W, H];
      const g = ctx.createLinearGradient(b[0], b[1], b[0] + b[2], b[1] + b[3]); g.addColorStop(0, 'rgba(255,255,255,.35)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,.25)');
      ctx.fillStyle = g; ctx.fillRect(b[0], b[1], b[2], b[3]); ctx.restore();
    }
    if (style === 'outline' && !o.noLine) { ctx.lineWidth = (o.lw || 6) * U; ctx.strokeStyle = OUT; ctx.lineJoin = 'round'; ctx.stroke(); }
  }

  function background(t) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    if (dark) { g.addColorStop(0, P[0]); g.addColorStop(1, P[1]); } else { g.addColorStop(0, P[4]); g.addColorStop(1, P[3]); }
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H * 0.48, R = Math.max(W, H);
    ctx.save();
    if (bg === 'burst') { ctx.translate(cx, cy); ctx.rotate(t * TAU / 12); for (let i = 0; i < 24; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, i * TAU / 24, (i + 0.5) * TAU / 24); ctx.fillStyle = dark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.05)'; ctx.fill(); } }
    else if (bg === 'rings') { for (let i = 12; i > 0; i--) { ell(ctx, cx, cy, i * 70 * U * (1 + 0.03 * Math.sin(t * TAU + i)), i * 70 * U * (1 + 0.03 * Math.sin(t * TAU + i))); ctx.fillStyle = i % 2 ? (dark ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,.25)') : 'rgba(0,0,0,0)'; ctx.fill(); } }
    else if (bg === 'grid') { const hz = H * 0.72; ctx.fillStyle = P[2]; ell(ctx, cx, hz - 40 * U, 180 * U, 180 * U); ctx.fill(); ctx.fillStyle = dark ? P[0] : P[1]; ctx.fillRect(0, hz, W, H - hz); ctx.strokeStyle = P[3]; ctx.lineWidth = 2 * U; for (let i = -20; i <= 20; i++) { ctx.beginPath(); ctx.moveTo(cx + i * 30 * U, hz); ctx.lineTo(cx + i * 200 * U, H); ctx.stroke(); } for (let j = 0; j < 10; j++) { const y = hz + Math.pow((j + (t * 2) % 1) / 10, 2) * (H - hz); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); } }
    else if (bg === 'dots') { ctx.fillStyle = dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)'; for (let x = 0; x < W; x += 36 * U) for (let y = 0; y < H; y += 36 * U) { ctx.beginPath(); ctx.arc(x + ((y / (36 * U)) % 2) * 18 * U, y, 5 * U, 0, TAU); ctx.fill(); } }
    else if (bg === 'sun') { const sg = ctx.createRadialGradient(cx, cy - 60 * U, 0, cx, cy - 60 * U, 420 * U); sg.addColorStop(0, P[4]); sg.addColorStop(0.45, P[3] + 'aa'); sg.addColorStop(1, P[3] + '00'); ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H); for (let i = 0; i < 4; i++) { const y = H * (0.2 + i * 0.12), x = ((i * 0.37 + t) % 1) * (W + 400 * U) - 200 * U; ctx.fillStyle = 'rgba(255,255,255,.55)'; rr(ctx, x, y, 220 * U, 36 * U, 18 * U); ctx.fill(); rr(ctx, x + 40 * U, y - 22 * U, 110 * U, 40 * U, 20 * U); ctx.fill(); } }
    else if (bg === 'stars' || bg === 'sky') { for (const p of parts) { ctx.fillStyle = dark ? P[4] : '#ffffff'; ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * TAU * (p.k + 1) + p.x * 9)); ctx.beginPath(); ctx.arc(p.x * W, p.y * H * 0.8, p.r * U * 0.6, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; if (bg === 'sky') { ctx.fillStyle = P[2]; ell(ctx, W * 0.82, H * 0.2, 70 * U, 70 * U); ctx.fill(); ctx.strokeStyle = P[4]; ctx.lineWidth = 6 * U; ell(ctx, W * 0.82, H * 0.2, 120 * U, 26 * U, -0.3); ctx.stroke(); } }
    ctx.restore();
    // ground shadow plate
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ell(ctx, cx, H * 0.86, W * 0.42, 30 * U); ctx.fill();
  }

  function eyes(c, hx, hy, hw, t, sp) {
    const blink = (Math.sin(t * TAU * 2 + c.blink * 6) > 0.97) ? 0.12 : 1;
    const ex = hw * 0.22, ey = hy, er = hw * 0.1;
    const white = '#ffffff', ink = sp === 'robot' || style === 'neon' ? P[4] : '#141018';
    const eye = (x, y, r) => {
      if (c.eyes === 'anime') { ell(ctx, x, y, r * 1.1, r * 1.45 * blink); paint(white, { noShade: true, lw: 4 }); ell(ctx, x, y + r * 0.2 * blink, r * 0.75, r * 1.05 * blink); paint(c.iris, { noShade: true, noLine: true }); ell(ctx, x, y + r * 0.3 * blink, r * 0.38, r * 0.55 * blink); paint('#141018', { noShade: true, noLine: true }); ell(ctx, x - r * 0.35, y - r * 0.4 * blink, r * 0.28, r * 0.28 * blink); paint(white, { noShade: true, noLine: true }); }
      else if (c.eyes === 'sleepy') { ctx.beginPath(); ctx.arc(x, y, r, 0.15 * Math.PI, 0.85 * Math.PI); ctx.lineWidth = 5 * U; ctx.strokeStyle = ink; ctx.lineCap = 'round'; ctx.stroke(); }
      else if (c.eyes === 'ring') { ell(ctx, x, y, r, r * blink); ctx.lineWidth = 5 * U; ctx.strokeStyle = ink; ctx.stroke(); ell(ctx, x, y, r * 0.35, r * 0.35 * blink); ctx.fillStyle = ink; ctx.fill(); }
      else if (c.eyes === 'star') { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r * 0.45 : r * 1.1; ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad * blink); } ctx.closePath(); paint(c.acc_c, { noShade: true, lw: 3 }); }
      else { ell(ctx, x, y, r * 0.75, r * 0.75 * blink); ctx.fillStyle = ink; ctx.fill(); if (style !== 'neon') { ell(ctx, x - r * 0.25, y - r * 0.25, r * 0.22, r * 0.22 * blink); ctx.fillStyle = '#fff'; ctx.fill(); } }
    };
    if (c.eyes === 'visor') { rr(ctx, hx - hw * 0.36, ey - er * 0.9, hw * 0.72, er * 1.8 * blink, er); ctx.shadowColor = c.acc_c; ctx.shadowBlur = 18 * U; ctx.fillStyle = c.acc_c; ctx.fill(); ctx.shadowBlur = 0; const sx = hx - hw * 0.3 + ((t * 2) % 1) * hw * 0.6; ctx.fillStyle = '#fff'; ctx.fillRect(sx, ey - er * 0.5, 6 * U, er * blink); }
    else if (c.eyes === 'cyclops') { const r0 = c.eyes === 'cyclops' ? er * 2 : er; const sv = c.eyes; c.eyes = 'anime'; eye(hx, ey, r0); c.eyes = sv; }
    else if (c.eyes === 'three') { eye(hx - ex, ey + er * 0.4, er * 0.8); eye(hx + ex, ey + er * 0.4, er * 0.8); eye(hx, ey - er * 1.3, er * 0.8); }
    else { eye(hx - ex, ey, er); eye(hx + ex, ey, er); }
  }
  function mouth(c, hx, my, hw, t) {
    const w = hw * 0.16, ink = style === 'neon' ? P[4] : '#141018';
    ctx.lineWidth = 5 * U; ctx.strokeStyle = ink; ctx.lineCap = 'round'; ctx.beginPath();
    if (c.mouth === 'smile') { ctx.arc(hx, my - w * 0.4, w, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
    else if (c.mouth === 'o') { ell(ctx, hx, my, w * 0.45, w * (0.45 + 0.15 * Math.sin(t * TAU * 2))); ctx.fillStyle = ink; ctx.fill(); }
    else if (c.mouth === 'cat') { ctx.arc(hx - w * 0.5, my - w * 0.2, w * 0.5, 0.1 * Math.PI, 0.9 * Math.PI); ctx.moveTo(hx + w, my - w * 0.2); ctx.arc(hx + w * 0.5, my - w * 0.2, w * 0.5, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke(); }
    else if (c.mouth === 'grin') { ctx.moveTo(hx - w * 1.2, my); ctx.quadraticCurveTo(hx, my + w * 1.4, hx + w * 1.2, my); ctx.closePath(); ctx.fillStyle = ink; ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(hx - w * 0.8, my, w * 1.6, w * 0.35); }
    else if (c.mouth === 'grill') { for (let i = -2; i <= 2; i++) { ctx.moveTo(hx + i * w * 0.4, my - w * 0.3); ctx.lineTo(hx + i * w * 0.4, my + w * 0.3); } ctx.stroke(); }
    else if (c.mouth === 'fang') { ctx.moveTo(hx - w, my); ctx.lineTo(hx + w, my); ctx.stroke(); ctx.beginPath(); ctx.moveTo(hx + w * 0.3, my); ctx.lineTo(hx + w * 0.5, my + w * 0.5); ctx.lineTo(hx + w * 0.7, my); ctx.fillStyle = '#fff'; ctx.fill(); }
    else if (c.mouth === 'flat') { ctx.moveTo(hx - w * 0.6, my); ctx.lineTo(hx + w * 0.6, my); ctx.stroke(); }
  }

  function drawChar(c, x, base, s, t) {
    const bob = Math.sin(t * TAU * 2 + c.ph) * 8 * U * (c.sp === 'spirit' || c.sp === 'blob' ? 2.5 : 1);
    const hw = s * c.headW, bodyW = s * 0.36 * c.squash, bodyH = s * 0.38;
    const ghost = c.sp === 'spirit' || c.sp === 'blob';
    const by = base - bodyH + bob * 0.4, hy = ghost ? by - hw * 0.12 + bob * 0.4 : by - hw * 0.62 + bob;
    ctx.save(); ctx.translate(x, base); ctx.rotate(c.tilt * 0.5 + Math.sin(t * TAU + c.ph) * 0.03); ctx.translate(-x, -base);
    // cape behind
    if (c.acc2 === 'cape') { ctx.beginPath(); ctx.moveTo(x - bodyW * 0.5, by + 10 * U); ctx.quadraticCurveTo(x - bodyW * 1.1 + Math.sin(t * TAU * 2) * 20 * U, base, x - bodyW * 0.9, base + 10 * U); ctx.lineTo(x + bodyW * 0.9, base + 10 * U); ctx.quadraticCurveTo(x + bodyW * 1.1, base, x + bodyW * 0.5, by + 10 * U); ctx.closePath(); paint(c.acc_c); }
    // legs / base
    if (c.sp !== 'spirit' && c.sp !== 'blob') { for (const sgn of [-1, 1]) { rr(ctx, x + sgn * bodyW * 0.28 - s * 0.05, base - s * 0.14, s * 0.1, s * 0.16, s * 0.04); paint(c.sp === 'robot' ? P[1] : c.body); } }
    // body
    if (c.sp === 'spirit' || c.sp === 'blob') {
      const bw = bodyW * 0.85, topY = by - hw * 0.55;
      ctx.beginPath(); ctx.moveTo(x - bw, base - 10 * U); ctx.lineTo(x - bw, topY + bw); ctx.arc(x, topY + bw, bw, Math.PI, TAU); ctx.lineTo(x + bw, base - 10 * U);
      for (let i = 6; i >= 0; i--) { const px = x - bw + i * bw * 2 / 6, py = base - 10 * U + Math.sin(t * TAU * 2 + i) * 12 * U * (i % 2 ? 1 : -1); ctx.lineTo(px, py); }
      ctx.closePath(); paint(c.body, { box: [x - bw, topY, bw * 2, base - topY] });
    } else if (c.sp === 'mushroom') { rr(ctx, x - bodyW * 0.45, by - hw * 0.2, bodyW * 0.9, bodyH + hw * 0.2, bodyW * 0.35); paint('#f3ead7', { box: [x - bodyW, by, bodyW * 2, bodyH] }); }
    else { rr(ctx, x - bodyW * 0.5, by, bodyW, bodyH * 0.92, c.sp === 'robot' || c.sp === 'knight' ? s * 0.04 : bodyW * 0.4); paint(c.body, { box: [x - bodyW, by, bodyW * 2, bodyH] });
      if (c.sp === 'robot' || c.sp === 'astronaut') { rr(ctx, x - bodyW * 0.25, by + bodyH * 0.25, bodyW * 0.5, bodyH * 0.3, 6 * U); paint(P[0], { noShade: true, lw: 3 }); for (let i = 0; i < 3; i++) { ell(ctx, x - bodyW * 0.14 + i * bodyW * 0.14, by + bodyH * 0.4, 5 * U, 5 * U); ctx.fillStyle = [P[3], P[4], P[2]][i]; ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * TAU * 3 + i); ctx.fill(); ctx.globalAlpha = 1; } } }
    // arms
    if (c.sp !== 'mushroom' && c.sp !== 'spirit' && c.sp !== 'blob') for (const sgn of [-1, 1]) {
      const ang = c.wave && sgn === 1 ? -(2.3 + 0.45 * Math.sin(t * TAU * 2)) : -sgn * (0.35 + 0.08 * Math.sin(t * TAU * 2 + sgn));
      ctx.save(); ctx.translate(x + sgn * bodyW * 0.46, by + bodyH * 0.18); ctx.rotate(ang);
      rr(ctx, -s * 0.035, 0, s * 0.07, s * 0.24, s * 0.035); paint(c.body, { lw: 5 }); ctx.restore();
    }
    if (c.acc2 === 'scarf') { rr(ctx, x - bodyW * 0.55, by - 6 * U, bodyW * 1.1, s * 0.07, s * 0.03); paint(c.acc_c); rr(ctx, x + bodyW * 0.15, by, s * 0.06, s * 0.18 + Math.sin(t * TAU * 2) * 6 * U, s * 0.03); paint(c.acc_c); }
    if (c.acc2 === 'badge') { ell(ctx, x + bodyW * 0.2, by + bodyH * 0.3, s * 0.04, s * 0.04); paint(c.acc_c, { lw: 3 }); }
    // head
    const hx = x;
    if (c.acc === 'ears' || c.sp === 'cat') for (const sgn of [-1, 1]) { ctx.beginPath(); const ex = hx + sgn * hw * 0.32, ey = hy - hw * 0.35; ctx.moveTo(ex - sgn * hw * 0.2, ey + hw * 0.1); ctx.lineTo(ex + sgn * hw * 0.08, ey - hw * 0.38 + Math.sin(t * TAU * 2 + sgn) * 4 * U); ctx.lineTo(ex + sgn * hw * 0.2, ey + hw * 0.12); ctx.closePath(); paint(c.body); }
    if (c.acc === 'horns') for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.moveTo(hx + sgn * hw * 0.22, hy - hw * 0.38); ctx.quadraticCurveTo(hx + sgn * hw * 0.5, hy - hw * 0.5, hx + sgn * hw * 0.42, hy - hw * 0.8); ctx.lineTo(hx + sgn * hw * 0.34, hy - hw * 0.42); ctx.closePath(); paint('#f2ead8'); }
    if (c.acc === 'antenna') { ctx.beginPath(); ctx.moveTo(hx, hy - hw * 0.45); ctx.lineTo(hx + Math.sin(t * TAU * 2) * 10 * U, hy - hw * 0.85); ctx.lineWidth = 5 * U; ctx.strokeStyle = style === 'neon' ? c.acc_c : P[0]; ctx.stroke(); ell(ctx, hx + Math.sin(t * TAU * 2) * 10 * U, hy - hw * 0.87, 12 * U, 12 * U); ctx.shadowColor = c.acc_c; ctx.shadowBlur = 20 * U; paint(c.acc_c, { noShade: true }); ctx.shadowBlur = 0; }
    if (c.sp === 'mushroom') { ctx.beginPath(); ctx.ellipse(hx, hy - hw * 0.05, hw * 0.75, hw * 0.55, 0, Math.PI, TAU); ctx.closePath(); paint(c.body, { box: [hx - hw, hy - hw, hw * 2, hw] }); for (let i = 0; i < 4; i++) { ell(ctx, hx + (i - 1.5) * hw * 0.32, hy - hw * (0.25 + 0.15 * (i % 2)), hw * 0.08, hw * 0.06); ctx.fillStyle = '#fff'; ctx.fill(); } rr(ctx, hx - hw * 0.38, hy - hw * 0.05, hw * 0.76, hw * 0.5, hw * 0.2); paint('#f3ead7'); }
    else if (c.sp === 'robot' || c.sp === 'knight') { rr(ctx, hx - hw * 0.5, hy - hw * 0.42, hw, hw * 0.84, hw * (c.sp === 'robot' ? 0.18 : 0.4)); paint(c.sp === 'knight' ? '#b9c0cc' : c.body, { box: [hx - hw, hy - hw, hw * 2, hw * 2] }); if (c.sp === 'knight') { rr(ctx, hx - hw * 0.35, hy - hw * 0.05, hw * 0.7, hw * 0.1, 4 * U); ctx.fillStyle = '#141018'; ctx.fill(); ctx.beginPath(); ctx.moveTo(hx, hy - hw * 0.42); ctx.quadraticCurveTo(hx + hw * 0.6 + Math.sin(t * TAU * 2) * 10 * U, hy - hw * 0.9, hx + hw * 0.7, hy - hw * 0.5); ctx.lineWidth = 10 * U; ctx.strokeStyle = c.acc_c; ctx.stroke(); } }
    else if (c.sp === 'astronaut') { ell(ctx, hx, hy, hw * 0.55, hw * 0.52); paint('#eef1f6', { box: [hx - hw, hy - hw, hw * 2, hw * 2] }); rr(ctx, hx - hw * 0.4, hy - hw * 0.28, hw * 0.8, hw * 0.55, hw * 0.25); const vg = ctx.createLinearGradient(hx - hw * 0.4, hy - hw * 0.3, hx + hw * 0.4, hy + hw * 0.3); vg.addColorStop(0, P[1]); vg.addColorStop(1, P[0]); paint(vg, { noShade: true }); ell(ctx, hx - hw * 0.2, hy - hw * 0.12, hw * 0.1, hw * 0.05, -0.5); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fill(); }
    else if (c.sp === 'alien') { ell(ctx, hx, hy - hw * 0.05, hw * 0.52, hw * 0.6); paint(c.body, { box: [hx - hw, hy - hw, hw * 2, hw * 2] }); }
    else if (c.sp === 'spirit' || c.sp === 'blob') { /* head is the body top */ }
    else { ell(ctx, hx, hy, hw * 0.52, hw * 0.47); paint(c.body, { box: [hx - hw, hy - hw, hw * 2, hw * 2] }); }
    const fy = c.sp === 'spirit' || c.sp === 'blob' ? by - hw * 0.05 : c.sp === 'mushroom' ? hy + hw * 0.18 : hy;
    if (c.sp !== 'knight') { const efw = c.sp === 'astronaut' ? hw * 0.85 : hw; if (!(c.sp === 'astronaut' && c.eyes === 'visor')) eyes(c, hx, fy - hw * 0.04, efw, t, c.sp); mouth(c, hx, fy + hw * 0.2, efw, t); }
    if (c.acc2 === 'blush' || c.sp === 'cat') for (const sgn of [-1, 1]) { ell(ctx, hx + sgn * hw * 0.3, fy + hw * 0.12, hw * 0.08, hw * 0.05); ctx.fillStyle = 'rgba(255,110,140,.45)'; ctx.fill(); }
    if (c.acc === 'halo') { ell(ctx, hx, hy - hw * 0.62 + Math.sin(t * TAU * 2) * 4 * U, hw * 0.32, hw * 0.08); ctx.lineWidth = 7 * U; ctx.strokeStyle = '#ffe28a'; ctx.shadowColor = '#ffe28a'; ctx.shadowBlur = 20 * U; ctx.stroke(); ctx.shadowBlur = 0; }
    if (c.acc === 'sprout') { ctx.beginPath(); ctx.moveTo(hx, hy - hw * 0.45); ctx.lineTo(hx, hy - hw * 0.7); ctx.lineWidth = 5 * U; ctx.strokeStyle = '#3f8f3a'; ctx.stroke(); for (const sgn of [-1, 1]) { ell(ctx, hx + sgn * hw * 0.1, hy - hw * 0.72, hw * 0.1, hw * 0.05, sgn * 0.5 + Math.sin(t * TAU * 2) * 0.2); paint('#6fcf5a', { noShade: true, lw: 3 }); } }
    if (c.acc === 'crown') { ctx.beginPath(); const cy = hy - hw * 0.42; ctx.moveTo(hx - hw * 0.22, cy); for (let i = 0; i <= 4; i++) ctx.lineTo(hx - hw * 0.22 + i * hw * 0.11, cy - (i % 2 ? hw * 0.08 : hw * 0.2)); ctx.lineTo(hx + hw * 0.22, cy); ctx.closePath(); paint('#ffd24a', { lw: 4 }); }
    if (c.acc === 'headphones') { ctx.beginPath(); ctx.arc(hx, hy, hw * 0.56, Math.PI * 1.05, Math.PI * 1.95); ctx.lineWidth = 9 * U; ctx.strokeStyle = c.acc_c; ctx.stroke(); for (const sgn of [-1, 1]) { rr(ctx, hx + sgn * hw * 0.55 - hw * 0.08, hy - hw * 0.12, hw * 0.16, hw * 0.26, hw * 0.06); paint(c.acc_c); } }
    if (c.acc === 'flower') { const fx = hx + hw * 0.32, fy2 = hy - hw * 0.35; for (let i = 0; i < 5; i++) { ell(ctx, fx + Math.cos(i * TAU / 5 + t * TAU) * hw * 0.07, fy2 + Math.sin(i * TAU / 5 + t * TAU) * hw * 0.07, hw * 0.06, hw * 0.06); paint(c.acc_c, { noShade: true, lw: 3 }); } ell(ctx, fx, fy2, hw * 0.04, hw * 0.04); ctx.fillStyle = '#ffd24a'; ctx.fill(); }
    ctx.restore();
  }

  return {
    draw(t) {
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      background(t);
      const n = chars.length, base = H * 0.86;
      const sizes = n === 1 ? [Math.min(W * 0.85, H * 0.95)] : n === 2 ? [Math.min(W * 0.55, H * 0.82), Math.min(W * 0.36, H * 0.55)] : [Math.min(W * 0.36, H * 0.6), Math.min(W * 0.42, H * 0.72), Math.min(W * 0.36, H * 0.6)];
      const xs = n === 1 ? [W / 2] : n === 2 ? [W * 0.4, W * 0.72] : [W * 0.2, W * 0.5, W * 0.8];
      const order = n === 3 ? [0, 2, 1] : [...Array(n).keys()];
      for (const i of order) drawChar(chars[i], xs[i], base, sizes[i], t);
      // floating particles
      for (const p of parts.slice(0, 12)) { const y = ((p.y - t * p.s) % 1 + 1) % 1; ctx.globalAlpha = 0.6; ctx.fillStyle = p.k ? P[3] : P[4]; ctx.beginPath(); ctx.arc(p.x * W, y * H, p.r * U, 0, TAU); ctx.fill(); }
      ctx.globalAlpha = 1;
      if (label) { const fs = 34 * U; ctx.font = `800 ${fs}px Inter, system-ui, sans-serif`; const tw = ctx.measureText(name).width; const lx = W / 2 - tw / 2 - 22 * U, ly = H * 0.925; rr(ctx, lx, ly, tw + 44 * U, fs * 1.5, fs * 0.75); ctx.fillStyle = dark ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.6)'; ctx.fill(); ctx.fillStyle = dark ? P[4] : P[0]; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(name, W / 2, ly + fs * 0.75); }
    },
  };
}
