// Each palette: 5 colours, roughly [0]=darkest/background ... [4]=lightest/accent.
export const PALETTES = {
  aurora:   ['#070b1f', '#1b3a6b', '#16c2b8', '#c552e0', '#f0f4ff'],
  dusk:     ['#140a26', '#4a1d5e', '#e0457b', '#ff9e64', '#ffe5c4'],
  candy:    ['#2b1055', '#7f5af0', '#ff6ec7', '#7ef9ff', '#fffbe6'],
  ocean:    ['#03121f', '#0b3c5d', '#1d8cb5', '#5ce1e6', '#e6fbff'],
  sunset:   ['#1d0b2d', '#6a0f49', '#e8505b', '#f9a826', '#fdf1c7'],
  vapor:    ['#120025', '#2d1b69', '#ff3cac', '#ffb86b', '#7fffd4'],
  synth:    ['#0a0014', '#24005a', '#ff2a6d', '#ffcc00', '#05d9e8'],
  aero:     ['#0e5a2a', '#46b94a', '#47a8f5', '#b6f06a', '#ffffff'],
  darkaero: ['#020a1c', '#08305c', '#1a7bd1', '#5ef2ff', '#d6f5ff'],
  chrome:   ['#0d0f1a', '#3b4a6b', '#ff7bd5', '#9fd8ff', '#f4f6ff'],
  opal:     ['#1b1530', '#8e7dbe', '#f5b3d6', '#a8f0e0', '#fbf8ff'],
  alien:    ['#04030d', '#16123a', '#6c3ff0', '#3ff0b5', '#e9fff8'],
  neon:     ['#05010d', '#1a0b3b', '#ff00a0', '#00f0ff', '#f9f871'],
  solar:    ['#163b20', '#3f8f3a', '#9ccc45', '#ffd166', '#fff6d8'],
  forest:   ['#0f1a12', '#2c4a2e', '#6b8f4e', '#c9b77d', '#f2ead3'],
  glacier:  ['#0a1a2f', '#2d5d8a', '#7fb6e3', '#c9e8ff', '#f7fcff'],
  goth:     ['#060406', '#2a0a12', '#7a0f24', '#b3b3c2', '#f2f0f5'],
  riso:     ['#1a1a1a', '#ff48b0', '#0078bf', '#ffe800', '#f5efe0'],
  risoB:    ['#202020', '#ff6c2f', '#00a95c', '#765ba7', '#f7f1e3'],
  ink:      ['#121212', '#b22a2a', '#555555', '#a39e93', '#f3eee2'],
  sepia:    ['#2b1d0e', '#6b4a2b', '#a67c52', '#d9b88f', '#f7ead3'],
  pastel:   ['#5a4e7c', '#f7a6c3', '#a6d8f7', '#c9f2c7', '#fff8f0'],
  gummy:    ['#2a0e3d', '#ff3d6e', '#ff9f1c', '#2ec4b6', '#fdf0ff'],
  clay:     ['#3d3a4b', '#f4a79d', '#9fd3c7', '#ffd8a8', '#f6efe9'],
  bauhaus:  ['#111111', '#d62828', '#f7b538', '#1d4e89', '#f1ece2'],
  memphis:  ['#1b1b1b', '#ff5fa2', '#25c2a0', '#ffd23f', '#f8f4e3'],
  brutal:   ['#111111', '#ff6b6b', '#ffd93d', '#6bcbef', '#fffbe6'],
  deco:     ['#07120f', '#0f3b2e', '#1b6b55', '#c9a14a', '#f3e2b3'],
  mono:     ['#0b0b0b', '#3a3a3a', '#7a7a7a', '#bdbdbd', '#f4f4f4'],
  paper:    ['#1c1c1c', '#4d4d4d', '#8c8c8c', '#d8d2c4', '#f6f1e6'],
  gameboy:  ['#0f380f', '#306230', '#5c8a2a', '#8bac0f', '#9bbc0f'],
  pico:     ['#1d2b53', '#7e2553', '#ff004d', '#ffa300', '#fff1e8'],
  cga:      ['#000000', '#aa00aa', '#ff55ff', '#55ffff', '#ffffff'],
  matrix:   ['#000000', '#003b00', '#008f11', '#00ff41', '#d5ffd9'],
  amber:    ['#0a0500', '#3d1f00', '#a35200', '#ffb000', '#ffe6b0'],
  blueprint:['#0b2a5b', '#123f80', '#3f6fb5', '#9cc0f0', '#eaf2ff'],
  cyan:     ['#062035', '#0b4f6c', '#01baef', '#a3f7ff', '#fbfbff'],
  lava:     ['#12020a', '#5c0b25', '#e63946', '#ff9f1c', '#ffe8a3'],
  mint:     ['#0d2b2b', '#1f6f6a', '#4fd1c5', '#b8f2e6', '#f7fffd'],
  earth:    ['#2a1f14', '#5e4b35', '#a1825f', '#d9c3a0', '#f4ecdd'],
  ice:      ['#0b1020', '#283a6b', '#9db4ff', '#e0e8ff', '#ffffff'],
  wine:     ['#160812', '#4b1238', '#a3245c', '#e88aa8', '#fbe3ea'],
  citrus:   ['#1e2a14', '#3f7d20', '#a7d129', '#ffd23f', '#fffbea'],
  noir:     ['#000000', '#141414', '#2b2b2b', '#e5e5e5', '#ffffff'],
  poet:     ['#1f1a17', '#4a3b33', '#8a6f5c', '#d8c8b4', '#f7f1e8'],
};

export const PALETTE_NAMES = Object.keys(PALETTES);

const hsl = (h, s, l) => {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const x = (v) => Math.round(v * 255).toString(16).padStart(2, '0');
  return '#' + x(f(0)) + x(f(8)) + x(f(4));
};
// Seeded harmonious palette: analogous / triad / split / complementary
export function randomPalette(rng) {
  const h = rng.float(0, 360), scheme = rng.pick([[0, 25, 50], [0, 120, 240], [0, 150, 210], [0, 180, 30], [0, 30, 180]]);
  const s = rng.float(55, 90);
  return [
    hsl((h + scheme[0]) % 360, s * 0.6, rng.float(5, 12)),
    hsl((h + scheme[0]) % 360, s, rng.float(25, 35)),
    hsl((h + scheme[1]) % 360, s, rng.float(48, 58)),
    hsl((h + scheme[2]) % 360, s, rng.float(62, 72)),
    hsl((h + scheme[1]) % 360, s * 0.5, rng.float(88, 96)),
  ];
}
export function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
