import type { Transit } from '@wtl/data-lux';
import { FOOTPATH_RADIUS_KM, STOP_RADIUS_KM, TRANSFER_S, WALK_S_PER_KM } from './constants';
import { km, type GridGeo } from './geo';

/** Stops near a point: parallel arrays of stop index and straight-line km, in app.js order. */
export interface Near {
  idx: number[];
  d: number[];
}

/** Compressed per-cell (or per-stop) list: entries off[i]..off[i+1]-1 belong to i. */
export interface Csr<W extends Float32Array | Float64Array> {
  off: Int32Array;
  idx: Int32Array;
  /** Walking seconds. */
  w: W;
}

export interface TransitIndex {
  readonly nStops: number;
  readonly nConns: number;
  readonly nTrips: number;
  nearStops(lat: number, lon: number, rkm: number): Near;
  /** Walking transfers between stops within 250 m (lazy). */
  footpaths(): Csr<Float64Array>;
  /** Stops within 1.2 km of each cell centre (lazy, memoised). */
  cellStops(): Csr<Float32Array>;
  /**
   * Same as cellStops(), but built in chunks of `chunk` cells, awaiting `pause()` between chunks so a
   * single-threaded runtime (Hermes) can keep handling UI events. Concurrent calls share one build.
   */
  cellStopsAsync(pause: () => Promise<void>, chunk?: number): Promise<Csr<Float32Array>>;
  /** True once the per-cell stop index exists (the next transit commute will not build it). */
  readonly ready: boolean;
  /**
   * Reverse connection scan (app.js latest): for every stop, the latest time (s since midnight) one can leave it
   * and still reach (dla, dlo) by T, walking ≤ 1.2 km at the end. -1e9 = unreachable.
   */
  latest(dla: number, dlo: number, T: number): Float64Array;
}

// Spatial hash on a ~0.5 km lattice (1/200° lat × 1/140° lon), same buckets as app.js hkey.
// Numeric key instead of the "i:j" string: unique while |j| < 5e5, i.e. any longitude.
const hkey = (i: number, j: number): number => i * 1e6 + j;

export function createTransit(TR: Transit, geo: GridGeo): TransitIndex {
  const S = TR.stops;
  const NS = S.length;
  const W = TR.stride || 5;
  // One typed copy of the flat connection list (the scan loop reads it ~10× per transit commute), checked
  // once: departures must be in descending order (latest first), which the reverse scan relies on.
  const C = Float64Array.from(TR.conns);
  const NC = Math.floor(C.length / W);
  if (NC * W !== C.length)
    throw new Error(`transit.conns length ${C.length} is not a multiple of ${W}`);
  let NT = 0;
  for (let k = 0; k < NC; k++) {
    const o = k * W;
    if (k > 0 && C[o]! > C[o - W]!)
      throw new Error(`transit.conns must be sorted by departure, latest first (connection ${k})`);
    if (C[o + 4]! >= NT) NT = C[o + 4]! + 1;
  }
  /** First connection with dep ≤ T (all before it depart later and are skipped by the scan). */
  const firstDepAtOrBefore = (T: number): number => {
    let lo = 0;
    let hi = NC;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (C[mid * W]! > T) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };

  const sLat = new Float64Array(NS);
  const sLon = new Float64Array(NS);
  const hash = new Map<number, number[]>();
  S.forEach(([la, lo], s) => {
    sLat[s] = la;
    sLon[s] = lo;
    const k = hkey(Math.floor(la * 200), Math.floor(lo * 140));
    let b = hash.get(k);
    if (!b) hash.set(k, (b = []));
    b.push(s);
  });

  function nearStops(la: number, lo: number, rkm: number): Near {
    const ci = Math.floor(la * 200);
    const cj = Math.floor(lo * 140);
    const span = Math.ceil(rkm / 0.5) + 1;
    const idx: number[] = [];
    const d: number[] = [];
    for (let i = ci - span; i <= ci + span; i++)
      for (let j = cj - span; j <= cj + span; j++) {
        const b = hash.get(hkey(i, j));
        if (!b) continue;
        for (const s of b) {
          const dd = km(la, lo, sLat[s]!, sLon[s]!);
          if (dd <= rkm) {
            idx.push(s);
            d.push(dd);
          }
        }
      }
    return { idx, d };
  }

  let fp: Csr<Float64Array> | null = null;
  function footpaths(): Csr<Float64Array> {
    if (fp) return fp;
    const off = new Int32Array(NS + 1);
    const idx: number[] = [];
    const w: number[] = [];
    for (let s = 0; s < NS; s++) {
      off[s] = idx.length;
      const near = nearStops(sLat[s]!, sLon[s]!, FOOTPATH_RADIUS_KM);
      for (let k = 0; k < near.idx.length; k++) {
        if (near.idx[k] === s) continue;
        idx.push(near.idx[k]!);
        w.push(near.d[k]! * WALK_S_PER_KM);
      }
    }
    off[NS] = idx.length;
    return (fp = { off, idx: Int32Array.from(idx), w: Float64Array.from(w) });
  }

  let cs: Csr<Float32Array> | null = null;
  /** Builds the per-cell stop index; yields after every `chunk` cells (the sync path ignores the yields). */
  function* buildCellStops(chunk: number): Generator<void, Csr<Float32Array>> {
    const N = geo.n;
    const off = new Int32Array(N + 1);
    const idx: number[] = [];
    const w: number[] = [];
    for (let i = 0; i < N; i++) {
      if (i > 0 && i % chunk === 0) yield;
      off[i] = idx.length;
      const near = nearStops(geo.cLat[i]!, geo.cLon[i]!, STOP_RADIUS_KM);
      for (let k = 0; k < near.idx.length; k++) {
        idx.push(near.idx[k]!);
        w.push(near.d[k]! * WALK_S_PER_KM);
      }
    }
    off[N] = idx.length;
    return { off, idx: Int32Array.from(idx), w: Float32Array.from(w) };
  }
  function cellStops(): Csr<Float32Array> {
    if (cs) return cs;
    const it = buildCellStops(Infinity);
    let r = it.next();
    while (!r.done) r = it.next();
    return (cs = r.value);
  }
  let pending: Promise<Csr<Float32Array>> | null = null;
  function cellStopsAsync(pause: () => Promise<void>, chunk = 500): Promise<Csr<Float32Array>> {
    if (cs) return Promise.resolve(cs);
    return (pending ??= (async () => {
      try {
        await pause();
        footpaths(); // ~1 ms: one nearStops per stop
        await pause();
        const it = buildCellStops(Math.max(1, chunk));
        let r = it.next();
        while (!r.done) {
          await pause();
          if (cs) return cs; // a sync cellStops() finished it meanwhile
          r = it.next();
        }
        return (cs ??= r.value);
      } finally {
        pending = null;
      }
    })());
  }

  function latest(dla: number, dlo: number, T: number): Float64Array {
    const Lf = new Float64Array(NS).fill(-1e9);
    const Lb = new Float64Array(NS).fill(-1e9);
    const ok = new Uint8Array(NT);
    const fpt = footpaths();
    const end = nearStops(dla, dlo, STOP_RADIUS_KM);
    for (let k = 0; k < end.idx.length; k++) Lf[end.idx[k]!] = T - end.d[k]! * WALK_S_PER_KM;
    for (let k = firstDepAtOrBefore(T); k < NC; k++) {
      const o = k * W;
      const dep = C[o]!;
      if (dep > T) continue; // unreachable for sorted data; kept as in app.js
      const arr = C[o + 1]!;
      const a = C[o + 2]!;
      const b = C[o + 3]!;
      const t = C[o + 4]!;
      const fl = W > 5 ? C[o + 5]! : 3;
      // fl bit 1: boarding allowed at a; bit 2: alighting allowed at b
      if (ok[t] || (fl & 2 && (arr <= Lf[b]! || arr <= Lb[b]! - TRANSFER_S))) {
        ok[t] = 1;
        if (fl & 1 && dep > Lb[a]!) {
          Lb[a] = dep;
          for (let f = fpt.off[a]!; f < fpt.off[a + 1]!; f++) {
            const q = fpt.idx[f]!;
            const v = dep - fpt.w[f]!;
            if (v > Lb[q]!) Lb[q] = v;
          }
        }
      }
    }
    for (let s = 0; s < NS; s++) if (Lf[s]! > Lb[s]!) Lb[s] = Lf[s]!;
    return Lb;
  }

  return {
    nStops: NS,
    nConns: NC,
    nTrips: NT,
    get ready() {
      return cs !== null;
    },
    nearStops,
    footpaths,
    cellStops,
    cellStopsAsync,
    latest,
  };
}
