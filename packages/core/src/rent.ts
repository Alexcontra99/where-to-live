import type { Area } from '@wtl/data-lux';
import { DEFAULT_SIZE, L_NAT, RENT_SOURCE, SIZE_CURVE } from './constants';

/** €/m² for a flat of S m²: log-linear interpolation of the size curve, flat outside it (app.js fSize). */
export function fSize(S: number): number {
  const first = SIZE_CURVE[0]!;
  const last = SIZE_CURVE[SIZE_CURVE.length - 1]!;
  if (S <= first[0]) return first[1];
  if (S >= last[0]) return last[1];
  for (let j = 1; j < SIZE_CURVE.length; j++) {
    const [s0, v0] = SIZE_CURVE[j - 1]!;
    const [s1, v1] = SIZE_CURVE[j]!;
    if (S <= s1)
      return v0 + ((Math.log(S) - Math.log(s0)) / (Math.log(s1) - Math.log(s0))) * (v1 - v0);
  }
  return NaN; // unreachable for numbers; app.js returns undefined (→ NaN) for NaN input
}

/** Total rent must never fall when size grows: running maximum of s × f(s) (app.js monoTotal). */
export function monoTotal(S: number): number {
  // Past the last knot f is constant, so s × f(s) only grows: the loop can stop there. Same result as app.js
  // (same products, same max), but O(1) for huge sizes instead of O(S).
  const stop = Math.min(S, SIZE_CURVE[SIZE_CURVE.length - 1]![0]);
  let m = 0;
  for (let s = 15; s <= stop; s++) m = Math.max(m, s * fSize(s));
  return Math.max(m, S * fSize(S));
}

/** Estimated asking €/m² for S m² in an area with price level `L` (app.js eurM2). */
export function eurM2(a: { L: number | null }, S: number): number {
  return (monoTotal(S) / S) * 1.04 * Math.sqrt((a.L as number) / L_NAT);
}

/** Estimated monthly asking rent (€) for S m². */
export const estRent = (a: { L: number | null }, S: number): number => S * eurM2(a, S);

/** The size used for rent when the user has not set one (app.js refSize). */
export const refSize = (size: number | null | undefined): number => size || DEFAULT_SIZE;

/**
 * Where an area's rent figure comes from, so the UI can label modelled numbers and cite sources.
 * - published: the area's own published average asking rent (Observatoire / data.public.lu).
 * - city-average: a Luxembourg City district without its own row; uses the city's published average.
 * - national-model: no published rent; price level is the national level of the size model.
 */
export type RentBasis = 'published' | 'city-average' | 'national-model';

export interface RentProvenance {
  basis: RentBasis;
  /** Key into @wtl/data-lux meta.json `sources` (null for the national model). */
  source: string | null;
}

export function rentProvenance(a: Pick<Area, 'kind' | 'estimated' | 'L_default'>): RentProvenance {
  if (a.L_default) return { basis: 'national-model', source: null };
  if (a.estimated) return { basis: 'city-average', source: RENT_SOURCE.commune };
  return {
    basis: 'published',
    source: a.kind === 'district' ? RENT_SOURCE.district : RENT_SOURCE.commune,
  };
}
