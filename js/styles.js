// Style registry: a style = generator + palette set + post-FX stack (+ fixed params).
// gen: 's:<name>' = shader generator, 'c:<name>' = Canvas2D generator.
export const CATEGORIES = {
  ui: 'Interface', retro: 'Retro & Nostalgia', futurism: 'Futurism', nature: 'Nature & Eco', mood: 'Mood & Core',
  analog: 'Analog & Glitch', print: 'Print', ink: 'Ink & Paint', text: 'Text Art', pixel: 'Pixel & Dither',
  geometry: 'Geometry', math: 'Math Art', shader: 'Shader Art', illustration: 'Illustration', typography: 'Typography', webdesign: 'Web Design',
};

const S = (id, name, cat, gen, pals, fx = {}, p = null, tags = '') => ({ id, name, cat, gen, pals, fx, p, tags });

export const STYLES = [
  // Interface
  S('glassmorphism', 'Glassmorphism', 'ui', 's:glass', ['aurora', 'candy', 'dusk', 'ocean', 'random'], { grain: .035 }),
  S('liquid-glass', 'Liquid Glass', 'ui', 's:liquidglass', ['candy', 'pastel', 'gummy', 'citrus', 'random'], { grain: .03 }),
  S('aurora-gradient', 'Aurora Gradient', 'ui', 's:aurora', ['aurora', 'dusk', 'ocean', 'alien'], { grain: .06, vig: .3 }),
  S('mesh-gradient', 'Mesh Gradient', 'ui', 's:mesh', ['candy', 'sunset', 'pastel', 'mint', 'random'], { grain: .03 }),
  S('grainy-gradient', 'Grainy Gradient', 'ui', 's:mesh', ['dusk', 'sunset', 'wine', 'random'], { grain: .18, vig: .2 }),
  S('neumorphism', 'Neumorphism', 'ui', 's:neumorph', ['clay', 'pastel', 'mint', 'ice'], { grain: .02 }),
  S('neubrutalism', 'Neubrutalism', 'ui', 'c:brutal', ['brutal', 'memphis', 'citrus']),
  S('bento-grid', 'Bento Grid', 'ui', 'c:bento', ['aurora', 'neon', 'candy', 'ocean', 'synth'], { grain: .02 }),
  S('claymorphism', 'Claymorphism', 'ui', 's:clay', ['clay', 'pastel', 'gummy'], { grain: .02 }, [0, 0, 0, 0]),
  S('gummy-jelly', 'Gummy Jelly', 'ui', 's:clay', ['gummy', 'candy', 'citrus'], { bloom: .3 }, [1, 0, 0, 0], 'pinterest-2026'),
  // Retro
  S('y2k-chrome', 'Y2K Chrome', 'retro', 's:chrome', ['chrome', 'ice', 'candy'], { grain: .03, bloom: .4 }),
  S('frutiger-aero', 'Frutiger Aero', 'retro', 's:aero', ['aero'], { bloom: .35, grain: .02 }),
  S('dark-aero', 'Dark Aero', 'retro', 's:orbs', ['darkaero'], { bloom: .5, grain: .03 }),
  S('vaporwave', 'Vaporwave', 'retro', 's:retrowave', ['vapor', 'candy'], { scan: .25, ca: .35, grain: .05 }, [0, 0, 0, 0]),
  S('synthwave', 'Synthwave / Outrun', 'retro', 's:retrowave', ['synth', 'neon', 'sunset'], { bloom: .45, scan: .15, grain: .03 }, [1, 0, 0, 0]),
  S('memphis', 'Memphis Design', 'retro', 'c:memphis', ['memphis', 'brutal', 'pastel'], { grain: .03 }),
  S('bauhaus', 'Bauhaus Tiles', 'retro', 'c:bauhaus', ['bauhaus', 'risoB', 'memphis'], { paper: .6, grain: .05 }),
  S('swiss-poster', 'Swiss International', 'retro', 'c:swiss', ['bauhaus', 'mono', 'brutal'], { grain: .04, paper: .3 }),
  S('art-deco', 'Art Deco', 'retro', 's:deco', ['deco', 'goth'], { grain: .04, vig: .3 }),
  S('neo-deco', 'Neo Deco', 'retro', 's:deco', ['wine', 'ocean', 'deco'], { bloom: .35, grain: .03 }, null, 'pinterest-2026'),
  S('retro-sunburst', '70s Sunburst', 'retro', 's:sunburst', ['sunset', 'earth', 'citrus'], { paper: .6, grain: .06 }),
  // Futurism
  S('cyberpunk-city', 'Cyberpunk City', 'futurism', 's:cyber', ['neon', 'synth', 'vapor'], { bloom: .55, ca: .25, grain: .05, vig: .3 }),
  S('holographic', 'Holographic Foil', 'futurism', 's:holo', ['opal', 'candy', 'pastel'], { grain: .03 }, null, 'pinterest-2026'),
  S('alien-core', 'Alien-core', 'futurism', 's:orbs', ['alien', 'opal', 'neon'], { bloom: .45, grain: .04 }, null, 'pinterest-2026'),
  S('sdf-sculpture', 'SDF Sculpture', 'futurism', 's:raymarch', ['candy', 'aurora', 'chrome', 'gummy'], { grain: .03, vig: .3 }),
  // Nature
  S('solarpunk', 'Solarpunk', 'nature', 's:solar', ['solar', 'citrus', 'forest'], { grain: .04, leak: .2 }),
  S('wilderkind', 'Wilderkind Mist', 'nature', 's:landscape', ['forest', 'earth'], { paper: .5, grain: .06, vig: .3 }, null, 'pinterest-2026'),
  S('glacier', 'Glacier Crystal', 'nature', 's:voronoi', ['glacier', 'ice'], { bloom: .3, grain: .03 }, [0, 0, 0, 0], 'pinterest-2026'),
  S('bioluminescent', 'Bioluminescent Cells', 'nature', 's:voronoi', ['alien', 'neon', 'mint'], { bloom: .4, grain: .03 }, [1, 0, 0, 0]),
  S('caustics', 'Water Caustics', 'nature', 's:caustics', ['ocean', 'cyan', 'mint'], { grain: .02 }),
  // Mood
  S('dreamcore', 'Dreamcore', 'mood', 's:clouds', ['pastel', 'candy'], { vig: .6, grain: .08, ca: .25, leak: .35 }),
  S('vamp-gothic', 'Vamp Romantic Lace', 'mood', 's:kaleido', ['goth', 'wine'], { vig: .5, grain: .05 }, [1, 0, 0, 0], 'pinterest-2026'),
  S('poetcore', 'Poetcore Card', 'mood', 'c:poem', ['poet', 'sepia', 'paper'], { paper: .8, grain: .05 }, null, 'pinterest-2026'),
  // Analog
  S('vhs-tape', 'VHS Tape', 'analog', 's:warp', ['vapor', 'dusk', 'sunset'], { ca: .8, glitch: .35, scan: .3, grain: .12, vig: .4 }),
  S('crt-terminal', 'CRT Terminal', 'analog', 's:raymarch', ['amber', 'matrix'], { mode: 'gradient', scan: .6, curve: .15, vig: .6, grain: .04, contrast: 1.3 }),
  S('glitch-art', 'Glitch Art', 'analog', 's:holo', ['neon', 'synth', 'random'], { glitch: 1, ca: 1, scan: .2, grain: .06 }),
  S('film-35mm', '35mm Film', 'analog', 's:landscape', ['sunset', 'dusk', 'earth'], { grain: .12, leak: .5, vig: .45 }),
  // Print
  S('risograph', 'Risograph', 'print', 's:riso', ['riso', 'risoB'], { grain: .06 }),
  S('halftone-pop', 'Pop Art Halftone', 'print', 's:sunburst', ['memphis', 'brutal', 'pico'], { mode: 'halftone', tone: 0, cell: 10 }),
  S('cmyk-halftone', 'CMYK Halftone', 'print', 's:warp', ['sunset', 'candy', 'aurora'], { mode: 'halftone', tone: 2, cell: 7, grain: .03 }),
  S('blueprint', 'Blueprint', 'print', 's:blueprint', ['blueprint'], { grain: .03, vig: .3 }),
  S('screenprint', 'Screenprint Landscape', 'print', 's:landscape', ['sunset', 'citrus', 'risoB', 'random'], { poster: 4, grain: .06, paper: .4 }),
  // Ink
  S('ink-enso', 'Ensō Ink', 'ink', 's:enso', ['ink'], { grain: .03 }),
  S('ink-mountains', 'Ink Wash Mountains', 'ink', 's:inkscape', ['ink', 'sepia'], { grain: .04 }),
  S('marbling', 'Paper Marbling', 'ink', 's:marble', ['ocean', 'wine', 'deco', 'sunset', 'random'], { grain: .03 }),
  S('watercolor', 'Watercolor Wash', 'ink', 's:watercolor', ['pastel', 'clay', 'citrus', 'mint'], { paper: .5 }),
  S('stipple', 'Stipple Sculpture', 'ink', 's:raymarch', ['paper', 'sepia'], { mode: 'stipple', cell: 5, contrast: 1.2 }),
  // Text
  S('ascii-plasma', 'ASCII Plasma', 'text', 's:plasma', ['matrix', 'amber', 'neon', 'aurora'], { mode: 'ascii', cell: 12, tone: 0 }),
  S('ascii-3d', 'ASCII 3D', 'text', 's:raymarch', ['mono', 'amber', 'cyan'], { mode: 'ascii', cell: 10, tone: 1, contrast: 1.4 }),
  S('matrix-rain', 'Digital Rain', 'text', 's:warp', ['matrix'], { mode: 'matrix', cell: 16, tone: 0, bloom: 0 }),
  // Pixel
  S('bitmap-1bit', '1-bit Bitmap', 'pixel', 's:metaballs', ['mono', 'paper', 'noir'], { mode: 'bayer', tone: 1, cell: 2 }),
  S('bayer-dither', 'Bayer Dither', 'pixel', 's:warp', ['pico', 'cga', 'synth'], { mode: 'bayer', tone: 0, cell: 3 }),
  S('gameboy', 'Game Boy', 'pixel', 's:landscape', ['gameboy'], { pixel: 5, mode: 'bayer', tone: 0, cell: 5 }),
  S('pixel-art', 'Pixel Art Landscape', 'pixel', 's:landscape', ['pico', 'sunset', 'dusk'], { pixel: 7, poster: 6 }),
  S('color-dither', 'Ordered Colour Dither', 'pixel', 's:aurora', ['aurora', 'candy', 'dusk'], { mode: 'bayer', tone: 2, cell: 3 }),
  // Geometry
  S('op-art', 'Op Art', 'geometry', 's:opart', ['mono', 'noir', 'bauhaus'], {}, [0.5, 0, 0, 0]),
  S('moire', 'Moiré Interference', 'geometry', 's:opart', ['noir', 'mono', 'deco'], {}, [0.1, 0, 0, 0]),
  S('op-lines', 'Line Interference', 'geometry', 's:opart', ['mono', 'riso'], {}, [0.9, 0, 0, 0]),
  S('truchet', 'Truchet Weave', 'geometry', 's:truchet', ['candy', 'deco', 'aurora', 'random'], { grain: .03 }, [0, 0, 0, 0]),
  S('truchet-maze', 'Truchet Maze', 'geometry', 's:truchet', ['noir', 'riso', 'gameboy'], {}, [1, 0, 0, 0]),
  S('kaleidoscope', 'Kaleidoscope Mandala', 'geometry', 's:kaleido', ['sunset', 'deco', 'opal', 'random'], { vig: .3 }, [0, 0, 0, 0]),
  S('low-poly', 'Low Poly', 'geometry', 's:lowpoly', ['sunset', 'ocean', 'forest', 'dusk'], { grain: .02 }),
  S('stained-glass', 'Stained Glass', 'geometry', 's:voronoi', ['sunset', 'deco', 'candy', 'random'], { grain: .03 }, [0, 0, 0, 0]),
  // Math
  S('julia-fractal', 'Julia Fractal', 'math', 's:julia', ['aurora', 'sunset', 'neon', 'ocean', 'random']),
  S('turing-pattern', 'Turing Pattern', 'math', 's:turing', ['mono', 'ink', 'mint', 'wine']),
  S('flow-field', 'Flow Field', 'math', 'c:flow', ['aurora', 'sunset', 'ocean', 'random'], { grain: .03 }),
  S('circle-packing', 'Circle Packing', 'math', 'c:packing', ['memphis', 'bauhaus', 'citrus', 'random']),
  S('strange-attractor', 'Strange Attractor', 'math', 'c:attractor', ['aurora', 'lava', 'ice', 'neon'], { bloom: .3 }),
  S('topographic', 'Topographic Lines', 'math', 's:topo', ['mono', 'blueprint', 'earth'], {}, [0, 0, 0, 0]),
  S('contour-map', 'Contour Map', 'math', 's:topo', ['forest', 'earth', 'glacier'], { paper: .3 }, [1, 0, 0, 0]),
  S('spirograph', 'Spirograph', 'math', 'c:spiro', ['neon', 'aurora', 'synth']),
  S('ridgelines', 'Ridgelines', 'math', 's:ridges', ['noir', 'mono', 'ink'], { grain: .04 }),
  // Shader
  S('domain-warp', 'Domain Warp', 'shader', 's:warp', ['lava', 'ocean', 'wine', 'random']),
  S('plasma', 'Demoscene Plasma', 'shader', 's:plasma', ['synth', 'neon', 'random'], {}, [1, 0, 0, 0]),
  S('lava-lamp', 'Lava Lamp', 'shader', 's:metaballs', ['lava', 'sunset', 'candy'], { grain: .03, vig: .3 }),
  S('nebula', 'Nebula', 'shader', 's:nebula', ['aurora', 'dusk', 'alien'], { grain: .03 }),
  // Illustration
  S('flat-landscape', 'Flat Landscape', 'illustration', 's:landscape', ['sunset', 'dusk', 'ocean', 'forest', 'random'], { grain: .05 }),
  // Typography
  S('kinetic-type', 'Kinetic Type', 'typography', 'c:kinetic', ['noir', 'brutal', 'synth', 'random']),
  // Web design
  S('web-hero', 'Web Hero Section', 'webdesign', 'c:webhero', ['aurora', 'candy', 'synth', 'ocean', 'random']),
  S('ui-kit', 'UI Component Sheet', 'webdesign', 'c:uikit', ['candy', 'aurora', 'brutal', 'pastel']),
  S('palette-card', 'Palette Card', 'webdesign', 'c:palette', ['random']),
  S('seamless-pattern', 'Seamless Pattern', 'webdesign', 'c:pattern', ['memphis', 'bauhaus', 'riso', 'random']),
];

export const STYLE_MAP = Object.fromEntries(STYLES.map((s) => [s.id, s]));

// FX overrides selectable in settings / via ?fx=
export const FX_PRESETS = {
  auto: null,
  none: {},
  film: { grain: .12, vig: .45, leak: .45 },
  crt: { scan: .55, curve: .15, ca: .35, vig: .55, grain: .05, bloom: .3 },
  vhs: { ca: .8, glitch: .35, scan: .3, grain: .12, vig: .4 },
  glitch: { glitch: 1, ca: 1, grain: .06 },
  bitmap: { mode: 'bayer', tone: 1, cell: 2 },
  dither: { mode: 'bayer', tone: 0, cell: 3 },
  gameboy: { pixel: 5, mode: 'bayer', tone: 0, cell: 5, pal: 'gameboy' },
  pixel: { pixel: 7, poster: 6 },
  halftone: { mode: 'halftone', tone: 1, cell: 9 },
  cmyk: { mode: 'halftone', tone: 2, cell: 7 },
  ascii: { mode: 'ascii', tone: 0, cell: 11 },
  matrix: { mode: 'matrix', tone: 0, cell: 16, pal: 'matrix' },
  stipple: { mode: 'stipple', cell: 5 },
  duotone: { mode: 'gradient', contrast: 1.2 },
  paper: { paper: .8, grain: .05 },
};
