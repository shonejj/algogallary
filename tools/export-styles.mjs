// Generates api/styles.json: the machine-readable index of styles, categories, palettes and FX presets.
import { writeFileSync, mkdirSync } from 'node:fs';
import { STYLES, CATEGORIES, FX_PRESETS } from '../js/styles.js';
import { PALETTES } from '../js/palettes.js';
mkdirSync(new URL('../api/', import.meta.url), { recursive: true });
const out = {
  name: 'AlgoGallery', license: 'CC0-1.0',
  endpoint: 'render.html', viewer: 'index.html',
  params: { note: 'see README for the full list (mix, blend, mask, shape, xa, xb, warp, colors, world and creature controls, effects)', mode: 'image|video', style: 'id or comma list', cat: 'category ids', seed: 'uint32', palette: 'auto|random|<name>', fx: Object.keys(FX_PRESETS).join('|'), w: 'px', h: 'px', aspect: '1:1|4:5|9:16|16:9', dur: 'seconds (video)', download: '1 = auto-save file' },
  categories: CATEGORIES,
  styles: STYLES.map(({ id, name, cat, gen, pals, tags, rich, remix }) => ({ id, name, category: cat, engine: remix ? 'composite' : gen.startsWith('s:') ? 'webgl' : 'canvas2d', rich: !!rich, palettes: pals, tags: tags ? tags.split(' ') : [] })),
  palettes: PALETTES,
  fx: Object.keys(FX_PRESETS),
};
writeFileSync(new URL('../api/styles.json', import.meta.url), JSON.stringify(out, null, 1));
console.log(`wrote ${out.styles.length} styles`);
