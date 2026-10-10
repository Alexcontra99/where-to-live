// Serialisable search filters: mirrors the prototype's `state` (app.js :131-137) and its form inputs.
import {
  CATS,
  MAX_PEOPLE,
  MAX_PLACES,
  MODES,
  NOISE,
  type ArriveH,
  type CatKey,
  type Mode,
  type NoiseKey,
  type NoiseThreshold,
} from './constants';
import type { LatLon } from './geo';

export interface Place extends LatLon {
  /** Shown to the user (geocoder result or "Point lat, lon"). */
  label?: string;
}

export interface PersonFilter {
  /** Defaults to "Person 1" / "Person 2". */
  label?: string;
  /** Work or study address; null = not set yet (no check). */
  dest: Place | null;
  mode: Mode;
  /** Max minutes door to door. */
  max: number;
}

export type CatMode = 'any' | 'near' | 'far';

export interface CatFilter {
  /** any = don't mind, near = one within `m` metres, far = none closer than `m` metres. */
  mode: CatMode;
  m: number;
}

export interface PlaceFilter {
  name: string;
  /** null = not set yet (no check). */
  loc: Place | null;
  /** near = within `m` metres, far = at least `m` metres. */
  mode: 'near' | 'far';
  m: number;
}

export interface Filters {
  /** One or two people. */
  people: PersonFilter[];
  /** Arrival time in hours: 7.5, 8, 8.5 or 9. */
  arrive: ArriveH;
  /** Monthly budget in €; null = not set (colours by €/m²). Rent never excludes a cell. */
  budget: number | null;
  /** Flat size in m²; null = not set (60 m² reference). */
  size: number | null;
  noise: Record<NoiseKey, NoiseThreshold>;
  cats: Record<CatKey, CatFilter>;
  places: PlaceFilter[];
}

/** The prototype's initial state. */
export function defaultFilters(): Filters {
  return {
    people: [{ label: 'Person 1', dest: null, mode: 'transit', max: 30 }],
    arrive: 8.5,
    budget: null,
    size: null,
    noise: { road: 0, rail: 0, air: 0 },
    cats: Object.fromEntries(CATS.map(([k]) => [k, { mode: 'any', m: 800 }])) as Record<
      CatKey,
      CatFilter
    >,
    places: [],
  };
}

/** The prototype's "Load an example" button (app.js :375-385). */
export function exampleFilters(): Filters {
  const f = defaultFilters();
  f.people = [
    {
      label: 'Person 1',
      dest: { lat: 49.6261, lon: 6.161, label: 'Kirchberg (tram stop Universitéit)' },
      mode: 'transit',
      max: 30,
    },
    {
      label: 'Person 2',
      dest: { lat: 49.6109, lon: 6.1262, label: 'City centre (Hamilius)' },
      mode: 'transit',
      max: 30,
    },
  ];
  f.budget = 2600;
  f.size = 60;
  f.noise = { road: 65, rail: 0, air: 55 };
  f.cats.supermarket = { mode: 'near', m: 800 };
  f.cats.park = { mode: 'near', m: 500 };
  return f;
}

/** Deep copy of a filters object; unlike a JSON round trip it keeps every number as is. */
export function cloneFilters(f: Filters): Filters {
  const copy = (x: unknown): unknown => {
    if (Array.isArray(x)) return x.map(copy);
    if (x !== null && typeof x === 'object')
      return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, copy(v)]));
    return x;
  };
  return copy(f) as Filters;
}

/**
 * Problems that would make the engine compute nonsense (NaN, Infinity, negative distances) or run away
 * (huge place lists). Empty = valid. engine.evaluate() throws a RangeError listing them.
 * Only checks sanity; any finite, non-negative value the prototype form accepts stays valid.
 */
export function validateFilters(f: Filters): string[] {
  const errs: string[] = [];
  const num = (v: unknown, what: string): void => {
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0)
      errs.push(`${what} must be a finite number ≥ 0 (got ${String(v)})`);
  };
  const point = (p: LatLon, what: string): void => {
    if (!Number.isFinite(p.lat) || !Number.isFinite(p.lon) || Math.abs(p.lat) > 90)
      errs.push(`${what} must have finite lat/lon (got ${String(p.lat)}, ${String(p.lon)})`);
  };
  if (!Array.isArray(f.people) || f.people.length < 1 || f.people.length > MAX_PEOPLE)
    errs.push(`people must have 1 to ${MAX_PEOPLE} entries`);
  else
    f.people.forEach((p, n) => {
      if (!MODES.some(([m]) => m === p.mode))
        errs.push(`people[${n}].mode is unknown: ${String(p.mode)}`);
      num(p.max, `people[${n}].max`);
      if (p.dest) point(p.dest, `people[${n}].dest`);
    });
  if (!Number.isFinite(f.arrive)) errs.push(`arrive must be a finite number of hours`);
  if (f.budget !== null) num(f.budget, 'budget');
  if (f.size !== null) num(f.size, 'size');
  for (const [k] of NOISE) num(f.noise?.[k], `noise.${k}`);
  for (const [k] of CATS) {
    const c = f.cats?.[k];
    if (!c) errs.push(`cats.${k} is missing`);
    else if (c.mode !== 'any') num(c.m, `cats.${k}.m`);
  }
  if (!Array.isArray(f.places) || f.places.length > MAX_PLACES)
    errs.push(`places must have at most ${MAX_PLACES} entries`);
  else
    f.places.forEach((pl, n) => {
      num(pl.m, `places[${n}].m`);
      if (pl.loc) point(pl.loc, `places[${n}].loc`);
    });
  return errs;
}
