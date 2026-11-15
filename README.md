# AlgoGallery

Endless, free, procedurally generated images and videos in **82 aesthetics** across 16 categories, including glassmorphism, Y2K chrome, Frutiger Aero, vaporwave, risograph, halftone, ASCII, Bayer dither, ink wash, solarpunk, alien-core, bento grids and more.

- Every pixel is made by an algorithm running on your device.
- No prompts, no stock images, no AI models, no copyrighted assets.
- Output is **CC0**.

Open the site and pick **Image** or **Video**, then press **Next**. The ⚙ icon (top right) lets you choose styles, palette, effects, aspect ratio, loop length, export size and seed.

## URL API

GitHub Pages is static, so the "API" is a URL that renders deterministically in the browser. The same parameters always give the same output.

```
render.html?style=risograph&seed=42&w=1080&h=1350          → full-bleed canvas
render.html?mode=video&style=synthwave&seed=7&dur=8         → seamless 8 s loop
render.html?style=ascii-3d&seed=3&download=1                → auto-downloads the PNG
index.html?cat=retro,print                                  → viewer limited to categories
```

| param | values |
|---|---|
| `mode` | `image` (default), `video` |
| `style` | a style id, or a comma list to pick randomly from (see [`api/styles.json`](api/styles.json)) |
| `cat` | category ids: `ui, retro, futurism, nature, mood, analog, print, ink, text, pixel, geometry, math, shader, illustration, typography, webdesign` |
| `seed` | any uint32 |
| `palette` | `auto`, `random`, or a palette name (`aurora, vapor, synth, riso, gameboy, …`) |
| `fx` | `auto, none, film, crt, vhs, glitch, bitmap, dither, gameboy, pixel, halftone, cmyk, ascii, matrix, stipple, duotone, paper` |
| `w`, `h` | exact render size in px |
| `aspect` | `1:1, 4:5, 9:16, 16:9` |
| `dur` | loop length in seconds (video) |
| `embed` | `1` hides all UI (`render.html` sets this automatically) |
| `download` | `1` auto-saves the PNG (image) or the MP4/WebM loop (video) |

Embedding works as an iframe: `<iframe src="https://<user>.github.io/algogallary/render.html?style=nebula&mode=video">`.
Once a page has rendered, `window.__algogallery.current` reports `{id, seed, palette}`.

## How it works

A style has three layers. Mixing them is what gives so many distinct looks from a small engine.

1. **Generator**:
   - 38 WebGL fragment shaders: noise, SDFs, raymarching, Voronoi, Truchet, fractals, metaballs, caustics, and others.
   - 15 Canvas2D generators for layout, type and simulation: bento, neubrutalism, flow fields, circle packing, strange attractors, UI kits, web heroes, and others.
2. **Palette**: 45 curated 5-colour palettes plus a seeded harmony generator.
3. **Post-FX uber-shader**: grain, vignette, scanlines, CRT curvature, chromatic aberration, glitch, bloom, light leaks, paper, posterize, pixelate, and the modes Bayer dither, halftone (mono and CMYK), ASCII, digital rain, stipple, and gradient map.

### Performance on any device

- **Rendering:**
  - Uses WebGL1 / GLSL ES 1.00 for maximum device coverage.
  - No build step and no dependencies (about 100 KB of JS).
- **Speed:**
  - Shaders compile off the main thread with `KHR_parallel_shader_compile`.
  - The next style is precompiled while you look at the current one.
  - Image mode renders a single frame and then idles, so it doesn't drain the battery.
- **Video:**
  - The resolution adapts to the measured frame rate.
  - Device pixel ratio is capped and the pixel budget is bounded.
  - Loops are seamless: time runs on a circle.
- **Glass UI:**
  - Few blurred layers with small radii.
  - It drops to solid panels on low-end devices, under `prefers-reduced-transparency`, or when FPS collapses.
  - `prefers-reduced-motion` is respected.
- **Video export:** `MediaRecorder`, MP4 (H.264) where supported, otherwise WebM.

### Controls
- `→` / `Space` / swipe left: next
- `←` / swipe right: previous
- `D`: download
- `S`: settings
- `F` or tap: immersive mode

## Development

```
python3 -m http.server   # then open http://localhost:8000
node tools/export-styles.mjs   # regenerate api/styles.json
```

To add a style:
1. Write a generator in `js/gens-shader.js` (a `vec3 gen()`) or `js/gens-2d.js`.
2. Register it in `js/styles.js` with palettes and an FX stack.

## Deploy

Settings → Pages → Source: **GitHub Actions**. The workflow `.github/workflows/pages.yml` publishes on every push to `main`.

## Research

`research/` holds the aesthetics catalogue (139 researched styles with techniques) and the build notes. It is the roadmap for adding more styles.

## License

Code is MIT. Generated images and videos are CC0 1.0 (public domain).
