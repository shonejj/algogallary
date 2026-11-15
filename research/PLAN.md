# Build Plan (Phases 2+)

## Product
GitHub Pages site with a landing screen offering **Image** or **Video**.
- **Next** button renders a new random style and seed.
- **Settings icon (top right):** pick specific styles or categories, choose palette, size, duration and seed, and toggle "lock style".
- **Also generates web-design pieces:** palette cards, patterns, UI showcases, type posters and site sections.
- **No prompts.** Everything is procedural and seeded, so the same seed gives the same output.

## Architecture (static, no server)
- Vanilla ES modules, no build step, so Pages serves it directly.
- `engine/` holds:
  - seeded RNG (mulberry32)
  - noise
  - palettes
  - generators (one module per style group)
  - an FX pipeline (WebGL2 fragment shaders, with a Canvas2D fallback)
- `styles.json` is the registry: each style = generator + palette rule + FX stack + params.
- **Video:** the same shaders driven by time `t` in a loop. Export with `MediaRecorder` (WebM) from `canvas.captureStream`, with a fixed duration (3-10 s) and seamless loops via periodic time functions.
- **"API" via URL params, because Pages is static:** `/?mode=image&style=risograph&seed=42&w=1080&h=1350` renders that exact result. An `?embed=1` mode returns just the canvas. A `/render.html` page can be used by `<img>` alternatives (screenshots) or opened directly. A true `.png` URL cannot be produced server-side on Pages, so we need either pre-rendered galleries committed by GitHub Actions (headless Chromium renders `/api/<style>/<seed>.png`) or client-side rendering. Recommend both.
- **Pre-rendered image API:** a GitHub Action renders N seeds per style to `/api/img/<style>/<seed>.png` and `.webm`, plus an `index.json`, so other sites can hotlink real files.

## Phases
1. **Research:** done (this folder).
2. **Engine core (DONE):** RNG, noise, palettes, WebGL harness, FX stack, UI shell (Image/Video, Next, settings).
3. **Styles v1 (DONE, 82 styles):** one per major family, covering glass, aurora, bitmap and dither, ASCII, halftone, riso, ink, vaporwave, synthwave, Frutiger, solarpunk, holographic, flow fields, Truchet, etc.
4. **Video mode and export (DONE):** MediaRecorder MP4 or WebM, seamless loops.
5. **Web-design generators (DONE: hero, UI kit, palette card, pattern, bento)** (palette, pattern, UI, type, section).
6. **Styles v2:** expand toward all 139.
7. **GitHub Action** for pre-rendered API, docs page and CC0 licence.

## Open questions for you
- Is client-side rendering plus pre-rendered files via Actions acceptable for the "URL as API"? (Pages cannot run server code.)
- Preferred video format: WebM (native recording) or MP4 (needs Action-side ffmpeg)?
- Do you want me to continue into Phase 2 next?

## Phase 3 (done): unbounded generation
- **Remix engine:** any generator × any generator, with 12 blends, masks (a third generator, 12 shapes, noise, self, split, gradient), 7 transforms, displacement and grading.
- **Creature engine:** a smooth signed-distance body with continuous proportions, replacing the fixed-species Canvas characters.
- **GPU transitions:** dissolve, iris, wipe, pixelate, glitch, ripple, zoom.
- **Full URL parameter API,** `embed.js` for img, video and canvas, a static WebP library with a manual GitHub Action to regenerate it, and generated titles.

## Next ideas
- Lift the shader generators' discrete modes into continuous parameters, especially the original 82 styles.
- 3D raymarched worlds, typography and poster grammars, and more creature parts (wings, shells, fins).
- A serverless renderer (for example Cloudflare Workers + WebGPU) for true on-the-fly `<img src>` with arbitrary params.
