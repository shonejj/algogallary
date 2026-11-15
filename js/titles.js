// Procedural titles: combinatorial, effectively unlimited, and written from scratch (no external lists).
const ADJ = 'amber azure bright brittle calm cobalt coral cosmic crystal dusky electric emerald faded feral fluid foggy gentle gilded glass gloaming golden hollow humming hushed indigo iron jade kinetic lantern liquid lucid lunar marble midnight misty molten neon nocturnal opal pale paper pastel phantom pixel plush quiet radiant restless rose rusted sable scarlet shimmering silent silver slow soft solar static stray sunken tidal tiny twilight umber velvet violet wandering wild woven'.split(' ');
const NOUN = 'archive atlas aurora beacon bloom canyon cascade cathedral cipher comet current dawn delta drift dune echo ember field fjord garden glacier grove harbor horizon isle lagoon lantern meadow mesa mirage monolith moon nebula oasis orbit orchard outpost parade passage pavilion petal prism quarry reef relic ridge ritual river ruin signal sky spire spore station summit swell temple terrace thicket tide tower valley vapor vessel vista voyage wave wilds'.split(' ');
const FORM = ['{A} {N}', 'The {A} {N}', '{N} of {A} {N2}', '{A} {N} No. {K}', '{N} & {N2}', 'Study for a {A} {N}', '{A} {N}, {A2}'];
const syl = ['ka', 'lo', 'mi', 'ra', 'ze', 'nu', 'vo', 'ti', 'sa', 'ri', 'el', 'an', 'or', 'yu', 'qu', 'xi'];
export function makeTitle(rng) {
  const cap = (w) => w[0].toUpperCase() + w.slice(1);
  let t = rng.pick(FORM).replace('{A2}', rng.pick(ADJ)).replace('{A}', cap(rng.pick(ADJ))).replace('{N2}', cap(rng.pick(NOUN))).replace('{N}', cap(rng.pick(NOUN))).replace('{K}', rng.int(1, 9999));
  if (rng.chance(0.15)) t = cap(rng.pick(syl) + rng.pick(syl) + rng.pick(syl)) + ' — ' + t;
  return t;
}
