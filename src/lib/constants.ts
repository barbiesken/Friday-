// Central content + configuration for the Day-Date 40 experience.
// Reference: Rolex Day-Date 40 Platinum 228236 — 40mm, 950 platinum,
// ice-blue dial, fluted bezel, President bracelet, Calibre 3255.
// This is an unofficial concept / tribute. Not affiliated with Rolex SA.

export type SectionDef = {
  id: string;
  index: number;
  kicker: string;
  title: string;
  body?: string;
};

export const SECTIONS: SectionDef[] = [
  {
    id: 'open',
    index: 0,
    kicker: 'Rolex',
    title: 'Day-Date 40',
    body: 'The achievement of an ideal.',
  },
  {
    id: 'hero',
    index: 1,
    kicker: 'Reference 228236',
    title: 'Assembled from the absolute',
    body: 'Nine components. One ideal. Scroll to bring them together.',
  },
  {
    id: 'dial',
    index: 2,
    kicker: 'The Ice-Blue Dial',
    title: 'Reserved for Platinum.',
    body: 'A sunray finish that exists on no other metal in the catalogue.',
  },
  {
    id: 'bezel',
    index: 3,
    kicker: 'The Fluted Bezel',
    title: 'Light, machined into ceremony',
    body: 'Each flute turned in 950 platinum to refract the room around you.',
  },
  {
    id: 'calibre',
    index: 4,
    kicker: 'Calibre 3255',
    title: 'Seventy hours of certainty',
    body: 'Chronergy escapement. Paramagnetic blue Parachrom hairspring. −2/+2 s a day.',
  },
  {
    id: 'bracelet',
    index: 5,
    kicker: 'The President',
    title: 'Articulated for a lifetime',
    body: 'Semi-circular three-piece links with the concealed Crownclasp.',
  },
  {
    id: 'water',
    index: 6,
    kicker: 'Oyster',
    title: 'Sealed to one hundred metres',
    body: 'A hermetic case, guaranteed waterproof to 100m / 330ft.',
  },
  {
    id: 'time',
    index: 7,
    kicker: 'Day & Date',
    title: 'From first light to the stars',
    body: 'The instantaneous day at twelve. The date beneath the Cyclops.',
  },
  {
    id: 'finale',
    index: 8,
    kicker: '1956 — Today',
    title: "The President's watch",
    body: 'The achievement of an ideal.',
  },
];

export const TOTAL_SECTIONS = SECTIONS.length;

// Per-part explode vectors (added to assembled position * explode amount).
// Units are scene units; the watch lives around the origin, facing +Z.
export const PART_EXPLODE: Record<string, [number, number, number]> = {
  crystal: [0, 0, 1.75],
  cyclops: [0.22, 0.52, 2.1],
  hands: [0, 0, 1.15],
  dial: [0, 0, 0.6],
  bezel: [0, 1.9, 0.25],
  case: [0, 0, -0.25],
  movement: [0, 0, -1.55],
  crown: [2.1, -0.1, 0],
  braceletTop: [0, 2.9, -0.1],
  braceletBottom: [0, -2.9, -0.1],
};

// Camera framing per section (position + look target), lerped on scroll.
export const CAMERA_KEYS: { pos: [number, number, number]; target: [number, number, number]; fov: number }[] = [
  { pos: [0, 0.2, 9.2], target: [0, 0, 0], fov: 32 }, // 01 open — distant orbit
  { pos: [0.6, 0.6, 8.0], target: [0, 0, 0], fov: 36 }, // 02 hero — explode
  { pos: [0, 0, 4.4], target: [0, 0, 0.4], fov: 30 }, // 03 dial macro
  { pos: [0, 2.0, 4.6], target: [0, 1.4, 0], fov: 34 }, // 04 bezel
  { pos: [0.2, -0.2, 5.0], target: [0, 0, -0.6], fov: 38 }, // 05 calibre (caseback)
  { pos: [0, -2.2, 5.4], target: [0, -1.6, 0], fov: 40 }, // 06 bracelet
  { pos: [0, 0, 7.2], target: [0, 0, 0], fov: 34 }, // 07 water
  { pos: [0, 0, 4.8], target: [0, 0, 0.3], fov: 30 }, // 08 time
  { pos: [0, 0.1, 8.6], target: [0, 0, 0], fov: 32 }, // 09 finale pullback
];

export const COLORS = {
  ink: '#050607',
  platinum: '#e6e8ec',
  platinumDim: '#9aa0a8',
  ice: '#a9c7d6',
  iceBright: '#cfe6f0',
  iceDeep: '#5d8395',
} as const;

export const SPECS = [
  { k: 'Reference', v: '228236' },
  { k: 'Diameter', v: '40 mm' },
  { k: 'Material', v: '950 Platinum' },
  { k: 'Dial', v: 'Ice Blue, sunray' },
  { k: 'Bezel', v: 'Fluted platinum' },
  { k: 'Bracelet', v: 'President' },
  { k: 'Movement', v: 'Calibre 3255' },
  { k: 'Power reserve', v: '70 hours' },
  { k: 'Waterproof', v: '100 m / 330 ft' },
  { k: 'Precision', v: '−2 / +2 s per day' },
] as const;
