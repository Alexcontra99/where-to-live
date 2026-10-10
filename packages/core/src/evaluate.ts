import type { Area, Grid } from '@wtl/data-lux';
import { CATS, NOISE, NOISE_CHECK_WORDS, shortLabel } from './constants';
import type { Filters } from './filters';
import { fmtKm2 } from './format';
import { km, type GridGeo } from './geo';
import { estRent, refSize } from './rent';

export type CheckSource =
  | { kind: 'person'; index: number }
  | { kind: 'noise'; key: string }
  | { kind: 'cat'; key: string }
  | { kind: 'place'; index: number };

export interface Check {
  /** Sentence for the cell card ("Person 1: commute over 30 min"). */
  name: string;
  /** Label for the blocker list ("Person 1 commute"). */
  short: string;
  source: CheckSource;
  /** True if cell i fails this check. */
  fail(i: number): boolean;
}

export interface Evaluation {
  checks: Check[];
  /** Failed checks per cell (only cells inside an area; 0 elsewhere). */
  fails: Uint8Array;
  /** Index of the last failing check per cell, -1 if none (the failing check when fails = 1). */
  only: Int16Array;
  /** Commute minutes per person (null when the person has no destination). */
  commutes: (Float32Array | null)[];
}

export type CommuteFn = (
  p: { lat: number; lon: number; mode: Filters['people'][number]['mode'] },
  arriveH: number,
) => Float32Array;

/** Build checks in app.js order (people, noise, categories, places) and count failures per cell. */
export function evaluateFilters(G: Grid, geo: GridGeo, commute: CommuteFn, f: Filters): Evaluation {
  const { cLat, cLon, n: N } = geo;
  const checks: Check[] = [];
  const commutes: (Float32Array | null)[] = [];
  f.people.forEach((p, n) => {
    if (!p.dest) {
      commutes.push(null);
      return;
    }
    const t = commute({ lat: p.dest.lat, lon: p.dest.lon, mode: p.mode }, f.arrive);
    commutes.push(t);
    const label = p.label ?? `Person ${n + 1}`;
    const max = p.max;
    checks.push({
      name: `${label}: commute over ${max} min`,
      short: `${label} commute`,
      source: { kind: 'person', index: n },
      fail: (i) => t[i]! > max,
    });
  });
  for (const [k, label] of NOISE) {
    const thr = f.noise[k];
    if (!thr) continue;
    const arr = G[`noise_${k}` as const];
    checks.push({
      name: `${label}: ${NOISE_CHECK_WORDS[thr]}`,
      short: `${label} noise`,
      source: { kind: 'noise', key: k },
      fail: (i) => arr[i]! >= thr,
    });
  }
  for (const [k, label] of CATS) {
    const c = f.cats[k];
    if (!c || c.mode === 'any') continue;
    const d = G.dist[k];
    const m = c.m;
    const short = shortLabel(label);
    checks.push(
      c.mode === 'near'
        ? {
            name: `${label}: none within ${m} m`,
            short,
            source: { kind: 'cat', key: k },
            fail: (i) => d[i]! * 10 > m,
          }
        : {
            name: `${label}: one closer than ${m} m`,
            short,
            source: { kind: 'cat', key: k },
            fail: (i) => d[i]! * 10 < m,
          },
    );
  }
  f.places.forEach((pl, n) => {
    if (!pl.loc) return;
    const { lat, lon } = pl.loc;
    const m = pl.m;
    checks.push(
      pl.mode === 'near'
        ? {
            name: `${pl.name}: more than ${m} m away`,
            short: pl.name,
            source: { kind: 'place', index: n },
            fail: (i) => km(cLat[i]!, cLon[i]!, lat, lon) * 1000 > m,
          }
        : {
            name: `${pl.name}: closer than ${m} m`,
            short: pl.name,
            source: { kind: 'place', index: n },
            fail: (i) => km(cLat[i]!, cLon[i]!, lat, lon) * 1000 < m,
          },
    );
  });
  const fails = new Uint8Array(N);
  const only = new Int16Array(N).fill(-1);
  const area = G.area;
  checks.forEach((ch, j) => {
    for (let i = 0; i < N; i++)
      if (area[i]! >= 0 && ch.fail(i)) {
        fails[i]!++;
        only[i] = j;
      }
  });
  return { checks, fails, only, commutes };
}

export interface AreaMatch {
  /** Index into areas. */
  area: number;
  name: string;
  cells: number;
  km2: number;
  /** "1.2 km²" / "<0.1 km²". */
  km2Label: string;
  /** Estimated asking rent (€, rounded) for `size` m². */
  estRent: number;
}

export interface Blocker {
  /** Index into evaluation.checks. */
  check: number;
  short: string;
  name: string;
  /** Cells where this is the only failing check. */
  cells: number;
  km2: number;
  km2Label: string;
  /** cells / max cells over all blockers (bar width, 0–1). */
  share: number;
}

export interface Summary {
  /** Cells that pass every check. */
  fitCells: number;
  fitKm2: number;
  fitKm2Label: string;
  /** Cells failing exactly one check (grey on the map). */
  oneAwayCells: number;
  /** Districts or communes with at least one matching cell. */
  areaCount: number;
  /** Size used for rent estimates (user size or 60 m²). */
  size: number;
  /** Up to 8 areas with the most matching space, largest first (ties keep grid order). */
  topAreas: AreaMatch[];
  /** Checks that are the only failure somewhere, in check order. Empty when no cell is one filter away. */
  blockers: Blocker[];
  /** The blocker covering the most area (first in check order on ties), or null. */
  topBlocker: Blocker | null;
}

/** Results panel data (app.js summary). */
export function summarise(
  G: Grid,
  areas: Area[],
  cellKm2: number,
  ev: Evaluation,
  f: Pick<Filters, 'size'>,
): Summary {
  const { checks, fails, only } = ev;
  const N = fails.length;
  let g = 0;
  let a = 0;
  const per = new Map<number, number>();
  const lim = new Array<number>(checks.length).fill(0);
  for (let i = 0; i < N; i++) {
    const ar = G.area[i]!;
    if (ar < 0) continue;
    if (fails[i] === 0) {
      g++;
      per.set(ar, (per.get(ar) || 0) + 1);
    } else if (fails[i] === 1) {
      a++;
      lim[only[i]!]!++;
    }
  }
  const S = refSize(f.size);
  const topAreas = [...per.entries()]
    .sort((x, y) => y[1] - x[1])
    .slice(0, 8)
    .map(([k, cells]) => ({
      area: k,
      name: areas[k]!.name,
      cells,
      km2: cells * cellKm2,
      km2Label: fmtKm2(cells, cellKm2),
      estRent: Math.round(estRent(areas[k]!, S)),
    }));
  const maxLim = Math.max(1, ...lim);
  const blockers: Blocker[] = [];
  if (a)
    checks.forEach((ch, j) => {
      const cells = lim[j]!;
      if (!cells) return;
      blockers.push({
        check: j,
        short: ch.short,
        name: ch.name,
        cells,
        km2: cells * cellKm2,
        km2Label: fmtKm2(cells, cellKm2),
        share: cells / maxLim,
      });
    });
  let topBlocker: Blocker | null = null;
  for (const b of blockers) if (!topBlocker || b.cells > topBlocker.cells) topBlocker = b;
  return {
    fitCells: g,
    fitKm2: g * cellKm2,
    fitKm2Label: fmtKm2(g, cellKm2),
    oneAwayCells: a,
    areaCount: per.size,
    size: S,
    topAreas,
    blockers,
    topBlocker,
  };
}
