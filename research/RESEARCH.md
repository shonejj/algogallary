# Phase 1 Research: Aesthetics & Generative Style Catalog

## What this is and its limits
- **Machine-readable catalog:** `styles.json` (generated from `styles.psv`) holds **139 styles** in 16 categories. Each has a core technique, palette, signature traits and a video-motion idea.
- **Pinterest was not analysed directly.** The sandbox cannot resolve `www.pinterest.com`, and Pinterest is login-walled, so I looked at no images and scraped no pins. Instead I used:
  - Pinterest Predicts 2026 coverage (Axios, Guardian, NSS, Fashion United and others)
  - aesthetics wikis (Wikipedia list of internet aesthetics, Aesthetics Wiki, Frutiger Aero pages)
  - 2026 web-design trend roundups (Bubble, Line25, Fireart, DesignRush)
  - generative-art references (Tyler Hobbs on flow fields, Iñigo Quílez on SDFs, creative-coding courses)
  - my own knowledge of the techniques
- **Gaps:**
  - Several sources are vendor blogs or fan wikis, so treat trend rankings as opinion.
  - Searches returned nothing useful on Cyber Aero, acid graphics, weirdcore, dithering, ASCII, plasma, moiré or CRT. Those entries rest on my knowledge, not on fetched sources.
- **To do real Pinterest analysis:** allow `pinterest.com` in the environment network settings. Even then it likely needs a login or API key, and image content still needs vision analysis. An alternative is for you to export a few boards' images into the repo, and I'll analyse those.

## Round 2 (before building Phase 2)
- **Crawling:** a Playwright crawl of Pinterest, Behance, Dribbble, ArtStation and other image sites was not possible. The sandbox network blocks those hosts, and the request to allow them was declined. Research stayed on web search.
- **More Pinterest Predicts 2026 aesthetics:**
  - **Wilderkind:** nature, bugs, deer, earthy.
  - **Neo Deco:** Art Deco geometry, metals, deep tones.
  - **Vamp Romantic:** glossy goth.
  - **Gimme Gummy.**
  - **Opera/Circus:** theatrical, masquerade.
- **Platform facts that shaped the engine:**
  - **WebCodecs:** now in Safari 26, but MP4 needs a muxer. `MediaRecorder` with MP4 (H.264) is available in Chromium and Safari, so it's the zero-dependency choice, with WebM as a fallback.
  - **`backdrop-filter`:** cost grows with blur radius and the number of blurred layers, and it's janky on low-end Android and iOS. Keep it at ≤18px on a few small surfaces and fall back to solid based on measured FPS.
  - **View Transitions:** same-document support is broad, but transitions are done with a canvas snapshot plus CSS, so they work everywhere.
  - **OffscreenCanvas WebGL in workers:** unreliable in Safari, so the engine renders on the main thread with parallel shader compile.

## Pinterest Predicts 2026 signals (from press coverage)
- Pinterest is moving away from minimalism toward maximalism and experimentation, with faster micro-trends.
- **Alien-core / Extra Celestial:** searches +80%.
- **Opalescent / iridescent / holographic:** searches +115%.
- **Gummy / jelly bright, tactile textures.**
- **Cool Blue / glacier / frost.**
- **Glitchy glam, lace, glossy goth.**
- **Poetcore** (literary, serif type) and **Glamoratti.**

I have mapped these to `alien-core`, `holographic`, `gummy-jelly`, `cool-blue-glacier`, `glitch`, `goth-glossy` and `poetry-card`. The coverage also mentioned circus and '80s inspiration, which I did not catalogue yet.

## 2026 web-design signals
- Bento grids and dark mode are still the most cited trends.
- **Tactile brutalism:** 1px borders, mono type, raw grids.
- Grain and noise overlays, used as a reaction against polished, AI-generated visuals.
- Expressive and kinetic type, and variable fonts.
- Soft gradients and layered shapes.

## Taxonomy (139 styles)
| Category | Count | Examples |
|---|---|---|
| ui | 14 | glassmorphism, neubrutalism, bento, aurora, liquid glass |
| retro | 17 | Y2K, Frutiger Aero, vaporwave, synthwave, Memphis, Bauhaus, Art Deco |
| futurism | 5 | cyberpunk, holographic, alien-core, HUD |
| nature | 3 | solarpunk, biopunk, cottagecore |
| mood | 5 | dark academia, glossy goth, glacier, dreamcore, liminal |
| analog | 8 | VHS, CRT, glitch, pixel sort, film grain, Polaroid |
| print | 10 | risograph, halftone, screenprint, woodcut, blueprint, ukiyo-e |
| ink | 7 | sumi-e, ink bleed and marbling, splatter, watercolor |
| text | 4 | ASCII, ANSI, Matrix rain, Braille |
| pixel | 10 | 1-bit, Floyd-Steinberg, Bayer, stipple, pixel art, voxel |
| geometry | 12 | Truchet, moiré, Voronoi, mandala, Penrose |
| math | 12 | fractals, attractors, reaction-diffusion, physarum, L-systems |
| shader | 14 | domain warp, metaballs, SDF raymarch, fluid, nebula |
| illustration | 7 | paper cut, duotone, lo-fi scene, collage |
| typography | 6 | kinetic type, variable-font poster, text scramble |
| webdesign | 5 | generated site section, palette card, seamless pattern |

## Key finding: styles are layers, not fixed looks
Most Pinterest aesthetics come from combining three layers. This is what lets thousands of unique outputs come from a small engine.

1. **Generator (what is drawn):** noise fields, SDF shapes, flow fields, Voronoi, Truchet tiles, fractals, reaction-diffusion, L-systems, particles, type and layout.
2. **Palette system:** cosine (IQ) palettes, harmony rules (analogous, triad, split), named palettes (Gameboy, PICO-8, synthwave, Frutiger, risograph inks), and a seeded generator.
3. **Post-process FX stack (the look):**
   - Texture and tone: grain, halation and bloom, vignette, light leaks, duotone/gradient map.
   - Print and digital: halftone, dither (Bayer, Floyd-Steinberg, blue noise), pixelate, ASCII map, posterize.
   - Display and lens: scanlines and CRT curvature, chromatic aberration, glitch slices, lens flare.
   - Stylise and distort: paper texture, ink edge, misregistration, displacement, glass blur, refraction, moiré.

Example: vaporwave = grid generator + sunset palette + scanlines + chromatic aberration. Riso = shapes + 2 inks + halftone + misregistration + grain.

## Copyright-safe rule
Everything is built from math and code, with no copied images, fonts or brand marks. Use only open fonts (SIL OFL) or system and generated glyphs. Output is CC0.
