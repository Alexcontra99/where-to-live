// Serialisable search filters: mirrors the prototype's `state` (app.js :131-137) and its form inputs.
import {
  CATS,
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
