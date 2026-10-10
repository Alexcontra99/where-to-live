// Constants copied verbatim from prototipo/app.js (lines 6-43). Keep values identical: parity tests compare
// every cell against the prototype.

export const KX = 72.1; // km per degree of lon here
export const KY = 111.2; // km per degree of lat
/** To/from/between stops: 4.5 km/h × 1.5 over straight line (validated against mobiliteit.lu, 18 trips). */
export const WALK_S_PER_KM = 1200;
/** Minimum time to change vehicles. */
export const TRANSFER_S = 180;
/** Radius for stops reachable on foot from a cell or a destination. */
export const STOP_RADIUS_KM = 1.2;
/** Radius for walking transfers between stops. */
export const FOOTPATH_RADIUS_KM = 0.25;

export const CATS = [
  ['supermarket', 'Supermarkets'],
  ['pharmacy', 'Pharmacies'],
  ['hospital', 'Hospitals'],
  ['school', 'Schools'],
  ['nursery', 'Nurseries (0–4)'],
  ['afterschool', 'After-school care'],
  ['university', 'Universities'],
  ['park', 'Parks'],
  ['gym', 'Gyms'],
  ['nightlife', 'Bars & nightlife'],
  ['bikeshare', "Vel'oh bike stations"],
] as const;
export type CatKey = (typeof CATS)[number][0];
export const CAT_KEYS: readonly CatKey[] = CATS.map(([k]) => k);
/** Category label without the bracketed note ("Nurseries (0–4)" → "Nurseries"). */
export const shortLabel = (label: string): string => label.replace(/ \(.*\)/, '');

export const NOISE = [
  ['road', 'Road traffic'],
  ['rail', 'Trains'],
  ['air', 'Aircraft'],
] as const;
export type NoiseKey = (typeof NOISE)[number][0];
/** 0 = don't mind. Official Lden bands (EU Directive 2002/49/EC); 55 = WHO guideline. */
export const NOISE_OPTS = [
  [0, "Don't mind"],
  [70, 'Avoid extremely loud'],
  [65, 'Avoid very loud'],
  [60, 'Avoid loud'],
  [55, 'Avoid above WHO guideline'],
] as const;
export type NoiseThreshold = (typeof NOISE_OPTS)[number][0];
export const NOISE_CHECK_WORDS: Record<Exclude<NoiseThreshold, 0>, string> = {
  55: 'above WHO guideline (55 dB+)',
  60: 'loud or worse (60 dB+)',
  65: 'very loud or worse (65 dB+)',
  70: 'extremely loud (70 dB+)',
};

export const MODES = [
  ['transit', 'Public transport'],
  ['walk', 'Walk'],
  ['bike', 'Bike'],
] as const;
export type Mode = (typeof MODES)[number][0];

export const ARRIVE_OPTS = [7.5, 8, 8.5, 9] as const;
export type ArriveH = (typeof ARRIVE_OPTS)[number];

export type RGB = readonly [number, number, number];
export type RGBA = [number, number, number, number];

/** [max ratio of estimated rent / budget, colour, legend]. */
export const RENT_BUDGET: readonly (readonly [number, RGB, string])[] = [
  [0.85, [26, 127, 55], 'Well under budget'],
  [1.0, [124, 201, 106], 'Up to budget'],
  [1.15, [240, 180, 41], 'Up to 15% over'],
  [Infinity, [209, 73, 91], 'More than 15% over'],
];
/** [upper bound €/m² (exclusive), colour]. */
export const RENT_M2: readonly (readonly [number, RGB])[] = [
  [33, [198, 219, 239]],
  [35, [158, 202, 225]],
  [37, [107, 174, 214]],
  [40, [49, 130, 189]],
  [Infinity, [8, 81, 156]],
];
export const NO_RENT_COLOUR: RGBA = [150, 150, 150, 120];
export const ONE_AWAY_COLOUR: RGBA = [140, 140, 140, 70];
/** Rent colour alpha with / without active filters (lighter until the user sets a filter). */
export const RENT_ALPHA_FILTERED = 135;
export const RENT_ALPHA_IDLE = 80;

/** Observatoire de l'Habitat 2025 size curve [m², €/m²]; "< 50 m²" anchored at 27 m². */
export const SIZE_CURVE: readonly (readonly [number, number])[] = [
  [27, 56.3],
  [60, 31.9],
  [80, 26.9],
  [100, 26.1],
  [120, 22.9],
  [145, 21.0],
];
export const L_NAT = 0.879;
/** Reference flat size when the user has not set one. */
export const DEFAULT_SIZE = 60;
/** meta.json `sources` keys of the published asking-rent tables (data.public.lu), per area kind. */
export const RENT_SOURCE = {
  district: 'loyers_quartiers.xlsx',
  commune: 'loyers_communes.xls',
} as const;

/** Filter limits checked by validateFilters (keep the per-cell failure count far below 255). */
export const MAX_PEOPLE = 2;
export const MAX_PLACES = 50;

/** Walk / bike: minutes per straight-line km (walk ×1.3 at 4.5 km/h, bike ×1.4 at 15 km/h). */
export const WALK_MIN_PER_KM = 17.5;
export const BIKE_MIN_PER_KM = 6;
/** Uphill penalty on the net climb to the destination, min per metre. */
export const WALK_UP_MIN_PER_M = 0.07;
export const BIKE_UP_MIN_PER_M = 0.1;
/** Transit: average over arrival deadlines from 30 min before to 15 min after the chosen time, every 5 min. */
export const DEADLINE_FROM_MIN = -30;
export const DEADLINE_TO_MIN = 15;
export const DEADLINE_STEP_MIN = 5;
