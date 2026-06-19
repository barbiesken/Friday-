// Central content + configuration for the Day-Date 40 experience.
// Reference: Rolex Day-Date 40 Platinum 228236 — 40mm, 950 platinum,
// ice-blue dial, fluted bezel, President bracelet, Calibre 3255.
// This is an unofficial concept / tribute. Not affiliated with Rolex SA.

export type Cam = { pos: [number, number, number]; target: [number, number, number]; fov: number };

export type SectionDef = {
  id: string;
  index: number;
  kicker: string;
  title: string;
  body?: string;
  cam: Cam;
};

// 15 chapters. The watch begins assembled (glamour), blows apart at the
// "exploded view", then reassembles one component per chapter until — by the
// finale — it is whole again.
export const SECTIONS: SectionDef[] = [
  {
    id: 'open',
    index: 0,
    kicker: 'Rolex',
    title: 'Day-Date 40',
    body: 'The achievement of an ideal.',
    cam: { pos: [0, 0.3, 9.6], target: [0, 0, 0], fov: 30 },
  },
  {
    id: 'exploded',
    index: 1,
    kicker: 'Reference 228236',
    title: 'Ten components. One ideal.',
    body: 'An exploded view of everything that becomes a Day-Date. Keep scrolling — it assembles, piece by piece.',
    cam: { pos: [1.4, 0.9, 8.8], target: [0, 0, 0], fov: 44 },
  },
  {
    id: 'case',
    index: 2,
    kicker: 'The Oyster Case',
    title: 'Carved from a single block',
    body: 'A 950-platinum middle case machined from solid metal, then mirror-finished.',
    cam: { pos: [0.2, 0.1, 5.4], target: [0, 0, 0], fov: 34 },
  },
  {
    id: 'bezel',
    index: 3,
    kicker: 'The Fluted Bezel',
    title: 'Light, machined into ceremony',
    body: 'Sixty platinum flutes turned to refract the room around you.',
    cam: { pos: [0, 0.3, 4.6], target: [0, 0, 0.3], fov: 32 },
  },
  {
    id: 'dial',
    index: 4,
    kicker: 'The Ice-Blue Dial',
    title: 'Reserved for Platinum.',
    body: 'A sunray finish that exists on no other metal in the catalogue.',
    cam: { pos: [0, 0, 3.9], target: [0, 0, 0.35], fov: 28 },
  },
  {
    id: 'indexes',
    index: 5,
    kicker: 'Applied Indexes',
    title: 'Set, not printed',
    body: 'Each hour marker applied by hand in solid white gold and polished to a mirror.',
    cam: { pos: [0.5, 0.35, 3.7], target: [0, 0, 0.35], fov: 26 },
  },
  {
    id: 'hands',
    index: 6,
    kicker: 'The Hands',
    title: 'Time, given form',
    body: 'Faceted hour and minute hands; a sweeping seconds hand in tempered ice.',
    cam: { pos: [0, 0, 3.6], target: [0, 0, 0.4], fov: 26 },
  },
  {
    id: 'crystal',
    index: 7,
    kicker: 'Sapphire Crystal',
    title: 'A window, virtually invisible',
    body: 'Scratch-proof sapphire with anti-reflective clarity, doming gently over the dial.',
    cam: { pos: [0.7, 0.6, 4.2], target: [0, 0, 0.45], fov: 30 },
  },
  {
    id: 'cyclops',
    index: 8,
    kicker: 'The Cyclops',
    title: 'The date, magnified 2.5×',
    body: 'A small sapphire lens, set precisely over the date aperture at three o’clock.',
    cam: { pos: [1.15, 0.1, 3.7], target: [1.0, 0, 0.5], fov: 26 },
  },
  {
    id: 'calibre',
    index: 9,
    kicker: 'Calibre 3255',
    title: 'Seventy hours of certainty',
    body: 'Chronergy escapement. Paramagnetic blue Parachrom hairspring. −2/+2 s a day.',
    cam: { pos: [0, 0, 5.0], target: [0, 0, -0.4], fov: 34 },
  },
  {
    id: 'rotor',
    index: 10,
    kicker: 'Perpetual Rotor',
    title: 'Wound by a life in motion',
    body: 'A 950-platinum oscillating weight winds the mainspring with every movement of the wrist.',
    cam: { pos: [0.7, 0.7, 4.5], target: [0.2, 0.2, -0.35], fov: 30 },
  },
  {
    id: 'crown',
    index: 11,
    kicker: 'Twinlock Crown',
    title: 'Sealed at the touch',
    body: 'A screw-down crown with two sealed zones, hidden beneath the fluted crown guard.',
    cam: { pos: [2.6, 0.0, 4.2], target: [1.6, 0, 0], fov: 30 },
  },
  {
    id: 'bracelet',
    index: 12,
    kicker: 'The President',
    title: 'Articulated for a lifetime',
    body: 'Semi-circular three-piece links and the concealed Crownclasp, made for platinum alone.',
    cam: { pos: [0, 0, 7.0], target: [0, 0, 0], fov: 48 },
  },
  {
    id: 'water',
    index: 13,
    kicker: 'Oyster',
    title: 'Sealed to one hundred metres',
    body: 'A hermetic case, guaranteed waterproof to 100m / 330ft.',
    cam: { pos: [0, 0, 7.4], target: [0, 0, 0], fov: 34 },
  },
  {
    id: 'finale',
    index: 14,
    kicker: '1956 — Today',
    title: "The President's watch",
    body: 'The achievement of an ideal.',
    cam: { pos: [0, 0.1, 9.2], target: [0, 0, 0], fov: 30 },
  },
];

export const TOTAL_SECTIONS = SECTIONS.length;
export const CAMERA_KEYS: Cam[] = SECTIONS.map((s) => s.cam);

// Per-part explode vectors (added to assembled position * explode amount).
export const PART_EXPLODE: Record<string, [number, number, number]> = {
  crystal: [0, 0, 2.4],
  cyclops: [0.4, 0.7, 2.9],
  hands: [0, 0, 1.5],
  indexes: [0, 0, 1.1],
  dial: [0, 0, 0.85],
  bezel: [0, 2.6, 0.4],
  case: [-0.2, 0, -0.4],
  movement: [0, 0, -2.1],
  crown: [2.9, -0.2, 0],
  braceletTop: [0, 3.8, -0.2],
  braceletBottom: [0, -3.8, -0.2],
};

// The chapter index at which each component locks into place (assembles).
export const PART_ASSEMBLE_AT: Record<string, number> = {
  case: 2,
  bezel: 3,
  dial: 4,
  indexes: 5,
  hands: 6,
  crystal: 7,
  cyclops: 8,
  movement: 9,
  crown: 11,
  braceletTop: 12,
  braceletBottom: 12,
};

// Chapters where the watch is flipped to reveal the movement (caseback).
export const CASEBACK_SECTIONS = [9, 10];

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
