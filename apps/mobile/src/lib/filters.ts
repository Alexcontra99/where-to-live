// Filters ↔ engine adapter. Pure TypeScript (no React Native imports) so it runs under vitest.
// The UI edits a core `Filters` object; these helpers apply the prototype's input rules (app.js :336-371)
// and make sure whatever reaches the engine passes validateFilters().
import {
  ARRIVE_OPTS,
  exampleFilters,
  CATS,
  MAX_PEOPLE,
  MAX_PLACES,
  MODES,
  NOISE,
  NOISE_OPTS,
  cloneFilters,
  defaultFilters,
  validateFilters,
  type CatFilter,
  type CatKey,
  type CatMode,
  type Filters,
  type PersonFilter,
  type Place,
  type PlaceFilter,
} from '@wtl/core';

const num = (text: string): number => {
  const v = Number(text.replace(',', '.').trim());
  return Number.isFinite(v) ? v : 0;
};

/**
 * Max commute minutes: app.js `+value || 30`. The input's min 5 / max 90 only bound its stepper there, so typed
 * values are kept as they are (120 stays 120). Negative values, which validateFilters() rejects, also give 30.
 */
export const parseMax = (text: string): number => {
  const v = num(text);
  return v > 0 ? v : 30;
};

/** Budget / size: app.js `+value || null` (negative values are treated as not set). */
export const parseOptional = (text: string): number | null => {
  const v = num(text);
  return v > 0 ? v : null;
};

/** Metres for categories and places: app.js `+value || 0`, never negative. */
export const parseMetres = (text: string): number => Math.max(0, num(text));

/** Label for a point picked on the map (app.js pickOnMap). */
export const pointLabel = (lat: number, lon: number): string =>
  `Point ${lat.toFixed(4)}, ${lon.toFixed(4)}`;

export const newPerson = (n: number): PersonFilter => ({
  label: `Person ${n + 1}`,
  dest: null,
  mode: 'transit',
  max: 30,
});

export const newPlace = (): PlaceFilter => ({ name: 'My place', loc: null, mode: 'near', m: 1000 });

/** Category mode change: app.js switches the default 800 m to 300 m when "At least" is chosen. */
export function setCatMode(c: CatFilter, mode: CatMode): CatFilter {
  return { mode, m: mode === 'far' && c.m === 800 ? 300 : c.m };
}

/** Number of filters that create a check (people with a destination, noise, categories, places with a location). */
export function activeCount(f: Filters): number {
  let n = f.people.filter((p) => p.dest).length;
  n += NOISE.filter(([k]) => f.noise[k]).length;
  n += CATS.filter(([k]) => f.cats[k].mode !== 'any').length;
  n += f.places.filter((p) => p.loc).length;
  return n;
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null;
const finite = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);

function readPlace(x: unknown): Place | null {
  if (!isObj(x) || !finite(x.lat) || !finite(x.lon) || Math.abs(x.lat) > 90) return null;
  return { lat: x.lat, lon: x.lon, ...(typeof x.label === 'string' ? { label: x.label } : {}) };
}

/**
 * Filters read back from storage (or anything untrusted): every field that is missing or malformed falls back
 * to the prototype's default, so an old or corrupted save never blocks the app.
 */
export function restoreFilters(raw: unknown): Filters {
  const f = defaultFilters();
  if (!isObj(raw)) return f;
  if (Array.isArray(raw.people)) {
    const people = raw.people.slice(0, MAX_PEOPLE).map((p, n): PersonFilter => {
      const d = newPerson(n);
      if (!isObj(p)) return d;
      return {
        label: d.label,
        dest: readPlace(p.dest),
        mode: MODES.some(([m]) => m === p.mode) ? (p.mode as PersonFilter['mode']) : d.mode,
        max: finite(p.max) && p.max > 0 ? p.max : d.max,
      };
    });
    if (people.length) f.people = people;
  }
  if (ARRIVE_OPTS.some((a) => a === raw.arrive)) f.arrive = raw.arrive as Filters['arrive'];
  if (finite(raw.budget) && raw.budget > 0) f.budget = raw.budget;
  if (finite(raw.size) && raw.size > 0) f.size = raw.size;
  if (isObj(raw.noise)) {
    const noise = raw.noise;
    for (const [k] of NOISE) {
      const v = noise[k];
      if (NOISE_OPTS.some(([t]) => t === v)) f.noise[k] = v as Filters['noise'][typeof k];
    }
  }
  if (isObj(raw.cats)) {
    const cats = raw.cats;
    for (const [k] of CATS) {
      const c = cats[k];
      if (isObj(c) && (c.mode === 'any' || c.mode === 'near' || c.mode === 'far') && finite(c.m))
        f.cats[k] = { mode: c.mode, m: Math.max(0, c.m) };
    }
  }
  if (Array.isArray(raw.places))
    f.places = raw.places
      .slice(0, MAX_PLACES)
      .filter(isObj)
      .map((p): PlaceFilter => ({
        name: typeof p.name === 'string' && p.name ? p.name : 'My place',
        loc: readPlace(p.loc),
        mode: p.mode === 'far' ? 'far' : 'near',
        m: finite(p.m) ? Math.max(0, p.m) : 1000,
      }));
  return validateFilters(f).length ? defaultFilters() : f;
}

/**
 * The filters handed to the engine: a snapshot of the UI state with labels filled in and blank place names
 * replaced (app.js uses "My place"). Throws only if the UI let an invalid value through (a bug).
 */
export function toEngineFilters(ui: Filters): Filters {
  const f = cloneFilters(ui);
  // Only the engine's fields: UI-only keys (the `id` of a card) are left out.
  f.people = f.people.map(({ dest, mode, max, label }, n) => ({
    label: label || `Person ${n + 1}`,
    dest,
    mode,
    max,
  }));
  f.places = f.places.map(({ name, loc, mode, m }) => ({
    name: name.trim() || 'My place',
    loc,
    mode,
    m,
  }));
  const errs = validateFilters(f);
  if (errs.length) throw new RangeError(`Invalid filters from the UI: ${errs.join('; ')}`);
  return f;
}

/** Stable key of what the engine sees, to skip re-evaluating when nothing that matters changed. */
export const filtersKey = (f: Filters): string => JSON.stringify(toEngineFilters(f));

/**
 * "Load an example" as app.js does it: it sets the people, budget, size, noise, supermarket and park, and keeps
 * everything else (arrival time, other categories, my places).
 */
export function applyExample(cur: Filters): Filters {
  const ex = exampleFilters();
  const f = cloneFilters(cur);
  f.people = ex.people;
  f.budget = ex.budget;
  f.size = ex.size;
  f.noise = ex.noise;
  f.cats.supermarket = ex.cats.supermarket;
  f.cats.park = ex.cats.park;
  return f;
}

// Stable ids for the person and place cards (React keys, and edit targets that survive removals).
// They live in the UI state only; toEngineFilters() drops them.
export type UiPerson = PersonFilter & { id: string };
export type UiPlace = PlaceFilter & { id: string };
export interface UiFilters extends Filters {
  people: UiPerson[];
  places: UiPlace[];
}

let seq = 0;
const nextId = (): string => `c${++seq}`;
const idOf = (x: object): string | undefined => {
  const id = (x as { id?: unknown }).id;
  return typeof id === 'string' ? id : undefined;
};

/** Gives every person and place an id (keeps existing ones). */
export function withIds(f: Filters): UiFilters {
  return {
    ...f,
    people: f.people.map((p) => ({ ...p, id: idOf(p) ?? nextId() })),
    places: f.places.map((p) => ({ ...p, id: idOf(p) ?? nextId() })),
  };
}

export const newUiPerson = (n: number): UiPerson => ({ ...newPerson(n), id: nextId() });
export const newUiPlace = (): UiPlace => ({ ...newPlace(), id: nextId() });

/** Deep copy that keeps the ids. */
export const cloneUi = (f: UiFilters): UiFilters => cloneFilters(f) as UiFilters;

export type { CatKey };
