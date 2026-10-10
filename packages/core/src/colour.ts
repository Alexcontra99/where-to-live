import type { Area, Grid } from '@wtl/data-lux';
import {
  NO_RENT_COLOUR,
  ONE_AWAY_COLOUR,
  RENT_ALPHA_FILTERED,
  RENT_ALPHA_IDLE,
  RENT_BUDGET,
  RENT_M2,
  type RGBA,
} from './constants';
import type { Filters } from './filters';
import { eurM2, refSize } from './rent';

export type RentOpts = Pick<Filters, 'budget' | 'size'>;

/**
 * Rent colour of a cell (app.js rentColour). Rent never excludes: it only colours cells that pass.
 * Against the budget when both budget and size are set, otherwise by €/m² for the chosen (or 60 m²) flat.
 * `filtered` = at least one active check (darker fill).
 */
export function rentColour(
  G: Grid,
  areas: Area[],
  i: number,
  o: RentOpts,
  filtered: boolean,
  eur: (a: Area, S: number) => number = eurM2,
): RGBA {
  return areaRentColour(areas[G.area[i]!], o, filtered, eur);
}

/** rentColour for every cell of an area (undefined = no area: the no-rent grey, as app.js). */
export function areaRentColour(
  a: Area | undefined,
  o: RentOpts,
  filtered: boolean,
  eur: (a: Area, S: number) => number = eurM2,
): RGBA {
  if (!a || !a.L) return [...NO_RENT_COLOUR];
  const alpha = filtered ? RENT_ALPHA_FILTERED : RENT_ALPHA_IDLE;
  if (o.budget && o.size) {
    const t = (o.size * eur(a, o.size)) / o.budget;
    return [...RENT_BUDGET.find((b) => t <= b[0])![1], alpha];
  }
  const S = refSize(o.size);
  return [...RENT_M2.find((b) => eur(a, S) < b[0])![1], alpha];
}

/** Map fill of a cell (app.js draw): rent colour if it fits, grey if one filter away, null = transparent. */
export function cellColour(
  G: Grid,
  areas: Area[],
  i: number,
  fails: Uint8Array,
  o: RentOpts,
  filtered: boolean,
  eur?: (a: Area, S: number) => number,
): RGBA | null {
  if (G.area[i]! < 0) return null;
  const f = fails[i];
  return f === 0
    ? rentColour(G, areas, i, o, filtered, eur)
    : f === 1
      ? [...ONE_AWAY_COLOUR]
      : null;
}
