// Renders a static library of images for plain <img src> use (no JS needed on the embedding site).
// Usage: python3 -m http.server 8765 &  node tools/render-library.cjs [perStyle=2] [extraRich=12]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), PER = +process.argv[2] || 2, EXTRA = +process.argv[3] || 12;
const BASE = process.env.BASE || 'http://localhost:8765';
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 960, height: 600 } });
  await p.goto(BASE + '/index.html?embed=1&mode=image&w=960&h=600&style=aurora-gradient&seed=1');
  await p.waitForFunction(() => window.__algogallery && window.__algogallery.ready, null, { timeout: 120000 });
  const styles = JSON.parse(fs.readFileSync(path.join(ROOT, 'api/styles.json'), 'utf8')).styles;
  const items = [];
  for (const st of styles) {
    const n = PER + (st.rich ? EXTRA : 0);
    for (let k = 1; k <= n; k++) {
      const seed = k * 1009;
      await p.evaluate(async ([id, seed]) => window.__algogallery.show(id, seed, { instant: true }), [st.id, seed]);
      const data = await p.evaluate(() => document.getElementById('stage').toDataURL('image/webp', 0.7));
      const rel = `lib/${st.id}/${seed}.webp`;
      fs.mkdirSync(path.join(ROOT, 'lib', st.id), { recursive: true });
      fs.writeFileSync(path.join(ROOT, rel), Buffer.from(data.split(',')[1], 'base64'));
      const cur = await p.evaluate(() => window.__algogallery.current);
      items.push({ style: st.id, seed, title: cur.title, src: rel, live: `render.html?style=${st.id}&seed=${seed}` });
    }
    process.stdout.write('.');
  }
  fs.writeFileSync(path.join(ROOT, 'api/library.json'), JSON.stringify({ size: [960, 600], format: 'webp', count: items.length, items }, null, 1));
  console.log(`\n${items.length} images`);
  await b.close();
})();
