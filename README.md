# AlgoGallery

**An unbounded generator of free, algorithmic images and videos:** worlds, creatures, remixes, glassmorphism, Y2K, risograph, ASCII, ink, dither and more.

- Every pixel is computed by code in the browser: no prompts, no AI models, no stock images, no scraped references. Output is **CC0**.
- **Live:** https://shonejj.github.io/algogallary/
- **Embeds:** https://shonejj.github.io/algogallary/examples.html

## Why it doesn't repeat

Nothing is a fixed list of pictures. Every result is a recipe drawn from continuous parameter spaces:

| Layer | What varies |
|---|---|
| **Generators** | 40 WebGL shader generators and 14 Canvas2D generators, each with its own seeded parameters |
| **Worlds** | A parallax scene composer with about 20 independent choices: sky, celestial body, clouds, terrain, water, structures, flora, creatures, a character, weather, light, camera travel |
| **Creatures** | One signed-distance body where head, ears, horns, antennae, arms, legs and tail are smoothly fused, with continuous proportions. Eyes, mouth, material (cel, soft, gummy, plush), pattern and background are chosen per seed. There are no fixed species. |
| **Remix** | Any generator × any generator, combined with: <ul><li>12 blend modes</li><li>a mask: a third generator's brightness, 12 shapes, noise, self, split or gradient</li><li>a transform per layer: kaleidoscope, mirror, tile, polar, swirl, fisheye, spin</li><li>displacement warp, hue rotation, saturation</li></ul> |
| **Palettes** | 57 curated palettes, a seeded harmony generator, or your own hex colours |
| **Effects** | Grain, bloom, light leak, paper, vignette, scanlines, CRT, chromatic aberration, glitch, posterize, pixelate, Bayer dither, halftone (mono or CMYK), ASCII, digital rain, stipple, gradient map |
| **Titles** | Every artwork gets a generated title |

A seed is a 32-bit integer, and many parameters are continuous. Combined with the remix engine, the space has no practical end.

## URL API

The same parameters always give the same output:
- `index.html?…` opens the viewer.
- `render.html?…` gives a full-bleed canvas (embed/iframe).
- `embed.js` turns `<img>`, `<video>` and `<canvas>` tags on any site into renders.

```
render.html?style=remix&seed=42
render.html?style=dreamscape&seed=7&sky=night&terrain=isles&hero=astronaut&weather=snow
render.html?style=creatures&seed=5&material=gummy&eyes=1
render.html?style=nebula&mix=truchet&blend=screen&mask=shape&shape=star&xa=kaleido
render.html?style=floating-isles&colors=101820,f2aa4c,ffffff&grain=0.1&dither=bayer&cell=3
render.html?mode=video&style=neon-city&seed=3&dur=8&download=1
```

| Param | Values |
|---|---|
| `style` | Style id, or a comma list to pick from. Ids are in [`api/styles.json`](api/styles.json). |
| `cat` | `remix, world, character, ui, retro, futurism, nature, mood, analog, print, ink, text, pixel, geometry, math, shader, illustration, typography, webdesign` |
| `seed` | uint32 |
| `mode` | `image`, `video` |
| `w`, `h`, `aspect` | Size in px, or `1:1, 4:5, 9:16, 16:9` |
| `dur` | Video loop length in seconds |
| `time` | 0–1, the moment of the loop to show for a still |
| **Remix** | |
| `mix` | Second style id |
| `blend` | `normal, multiply, screen, overlay, difference, add, softlight, dodge, color, lumamap, displace, exclusion` |
| `mask` | `none, luma, shape, noise, self, split, gradient`, or a style id to use its brightness |
| `shape` | `circle, arch, star, heart, moon, diamond, ring, flower, hex, dots, stripes, blob` |
| `xa`, `xb` | Transform for layer A or B: `kaleido, mirror, tile, polar, swirl, fisheye, spin` |
| `amount, xamt, warp, thr, soft, inv, hue, sat, scale, rot` | Continuous mix controls |
| **Colour** | |
| `palette` | A name, or `random` |
| `colors` | 1–5 hex colours, e.g. `0b0217,ff6ad5,c8fff4` |
| `reverse` | `1` flips the palette |
| **Effects** | |
| `fx` | Preset: `none, film, crt, vhs, glitch, bitmap, dither, gameboy, pixel, halftone, cmyk, ascii, matrix, stipple, duotone, paper` |
| `grain, vig, scan, ca, glitch, pixel, poster, curve, leak, paper, bloom, contrast` | Individual effect amounts |
| `dither`, `cell`, `tone` | Mode `none, bayer, halftone, ascii, matrix, stipple, gradient`, then cell size, then `0` palette, `1` two-tone or `2` source colours |
| **Worlds** | |
| `sky` | `night, golden, day, alien` |
| `body` | `none, sun, moon, planet, twin, giant` |
| `clouds` | `none, cumulus, streaks, aurora` |
| `terrain` | `peaks, dunes, mesas, isles, hills, spires` |
| `water` | `0` or `1` |
| `build` | `none, city, spires, ruins, pyramids, torii, lighthouse, turbines, megaring` |
| `flora` | `none, pines, trees, palms, mushrooms, crystals, grass` |
| `creature` | `none, birds, whale, jellyfish, airships, fireflies` |
| `hero` | `none, wanderer, robot, astronaut, duo, deer` |
| `weather` | `clear, rain, snow, mist, dust, embers, petals` |
| `rays`, `cam`, `haze`, `layers` | Light rays, camera travel speed, haze, number of layers |
| **Creatures** | |
| `material` | `cel, soft, gummy, plush` |
| `eyes` | `1–3` |
| **Other** | |
| `transition` | `dissolve, iris, wipe, pixelate, glitch, ripple, zoom` |
| `download` | `1` auto-saves the PNG (image) or the MP4/WebM loop (video) |

### Using it on other websites

1. **embed.js** (live, any params, random per load, no server):
   ```html
   <script type="module" src="https://shonejj.github.io/algogallary/embed.js"></script>
   <img   data-algogallery="style=remix&w=1200&h=750" data-algogallery-click>
   <video data-algogallery="style=dreamscape&seed=7&dur=8" autoplay muted loop playsinline></video>
   ```
2. **Pre-rendered library** for plain `<img src>` with no JavaScript. It lists stable WebP files in [`api/library.json`](api/library.json), for example `https://shonejj.github.io/algogallary/lib/creatures/1009.webp`. Regenerate it with `node tools/render-library.cjs`.
3. **iframe**: `<iframe src="https://shonejj.github.io/algogallary/render.html?style=remix&mode=video">`.

GitHub Pages is static hosting. A plain `<img src>` therefore can't render brand-new parameters on request; it can only point to a pre-rendered file. The embed script and iframe give you every parameter live.

## App

- **Image** or **Video**, then **Next** or swipe.
- GPU transitions between artworks (dissolve, iris, wipe, pixelate, glitch, ripple, zoom).
- **Settings (⚙):**
  - style pool
  - Remix: mix with, blend, mask, transform
  - transition, palette, effects, aspect, loop length, export size, quality, seed and lock
- **Exports:** PNG, plus MP4 or WebM loops.

## Development

```
python3 -m http.server 8765       # open http://localhost:8765
node tools/export-styles.mjs      # regenerate api/styles.json
node tools/render-library.cjs     # regenerate the static library (needs Playwright)
```

| File | Contents |
|---|---|
| `js/engine.js` | Recipes: seeds and overrides become layers, composite, palette and effects |
| `js/renderer.js` | WebGL pipeline: layers → composite → post-FX → transition |
| `js/gens-shader.js`, `js/world.js`, `js/creatures.js` | Shader generators |
| `js/gens-2d.js` | Canvas2D generators |
| `js/styles.js` | Style registry |

Pages serves the `main` branch root.

## License

Code is MIT. Generated images and videos are CC0 1.0 (public domain).
