import type { Grid } from '@wtl/data-lux';
import {
  BIKE_MIN_PER_KM,
  BIKE_UP_MIN_PER_M,
  DEADLINE_FROM_MIN,
  DEADLINE_STEP_MIN,
  DEADLINE_TO_MIN,
  WALK_MIN_PER_KM,
  WALK_S_PER_KM,
  WALK_UP_MIN_PER_M,
  type Mode,
} from './constants';
import { km, type GridGeo } from './geo';
import type { TransitIndex } from './transit';

export interface CommuteQuery {
  lat: number;
  lon: number;
  mode: Mode;
}

/**
 * Minutes from every cell centre to a destination (app.js commute). Float32Array of length rows × cols.
 * Transit: average over arrival deadlines from -30 to +15 min around `arriveH` (hours, e.g. 8.5).
 */
export function computeCommute(
  G: Grid,
  geo: GridGeo,
  tr: TransitIndex,
  p: CommuteQuery,
  arriveH: number,
): Float32Array {
  const N = geo.n;
  const { cLat, cLon } = geo;
  const out = new Float32Array(N);
  if (p.mode !== 'transit') {
    const f = p.mode === 'walk' ? WALK_MIN_PER_KM : BIKE_MIN_PER_KM;
    const di = geo.cellAt(p.lat, p.lon);
    const elev = G.elev;
    const zD = di >= 0 && elev ? elev[di]! : null;
    const up = p.mode === 'walk' ? WALK_UP_MIN_PER_M : BIKE_UP_MIN_PER_M;
    for (let i = 0; i < N; i++)
      out[i] =
        km(cLat[i]!, cLon[i]!, p.lat, p.lon) * f +
        (zD !== null ? Math.max(0, zD - elev![i]!) * up : 0);
    return out;
  }
  const cs = tr.cellStops();
  const T0 = arriveH * 3600;
  const deadlines: number[] = [];
  for (let m = DEADLINE_FROM_MIN; m <= DEADLINE_TO_MIN; m += DEADLINE_STEP_MIN)
    deadlines.push(T0 + m * 60);
  const direct = new Float32Array(N);
  for (let i = 0; i < N; i++) direct[i] = km(cLat[i]!, cLon[i]!, p.lat, p.lon) * WALK_S_PER_KM;
  const { off, idx, w } = cs;
  for (const T of deadlines) {
    const L = tr.latest(p.lat, p.lon, T);
    for (let i = 0; i < N; i++) {
      let best = direct[i]!;
      for (let k = off[i]!; k < off[i + 1]!; k++) {
        const v = T - (L[idx[k]!]! - w[k]!);
        if (v < best) best = v;
      }
      out[i]! += best / 60 / deadlines.length;
    }
  }
  return out;
}

/** Cache key as in app.js (5-decimal coordinates, mode, arrival hour). */
export const commuteKey = (p: CommuteQuery, arriveH: number): string =>
  [p.lat.toFixed(5), p.lon.toFixed(5), p.mode, arriveH].join('|');
