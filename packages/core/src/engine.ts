import type { Area, LuxData } from '@wtl/data-lux';
import { cellColour, rentColour, type RentOpts } from './colour';
import { cellInfo, type CellInfo } from './cellInfo';
import { commuteKey, commuteSteps, type CommuteQuery } from './commute';
import type { RGBA } from './constants';
import { evaluateFilters, summarise, type Evaluation, type Summary } from './evaluate';
import { cloneFilters, validateFilters, type Filters } from './filters';
import { createGridGeo, type GridGeo } from './geo';
import { eurM2 } from './rent';
import { createTransit, type TransitIndex } from './transit';

export interface EngineEvaluation extends Evaluation {
  /** Snapshot of the filters this evaluation was computed from. */
  filters: Filters;
}

export interface AsyncOptions {
  /**
   * Called between work chunks; the default waits one macrotask (setTimeout 0) so a single JS thread
   * (React Native / Hermes) can render and handle touches meanwhile.
   */
  pause?: () => Promise<void>;
  /** Cells per chunk while building the per-cell stop index (default 500). */
  chunk?: number;
}

export interface Engine {
  readonly data: LuxData;
  /** Grid geometry: n, rows, cols, cellKm2, cellAt, cellCenter, cellBounds, cellPolygon, bounds. */
  readonly grid: GridGeo;
  readonly transit: TransitIndex;
  /** Build the per-cell stop lists and footpaths now (otherwise done on the first transit commute). */
  precompute(): void;
  /** precompute() in chunks, handing the thread back between them (call at app start). */
  precomputeAsync(opts?: AsyncOptions): Promise<void>;
  /**
   * Minutes from every cell to a destination; memoised per (5-decimal point, mode, arrival).
   * Returns a fresh copy each call, so callers may mutate it without corrupting the cache.
   */
  commute(p: CommuteQuery, arriveH: number): Float32Array;
  /** commute() that yields between stop-index chunks and between the transit deadline scans. */
  commuteAsync(p: CommuteQuery, arriveH: number, opts?: AsyncOptions): Promise<Float32Array>;
  /** Throws a RangeError when validateFilters(filters) reports problems. */
  evaluate(filters: Filters): EngineEvaluation;
  /**
   * evaluate() that first computes the commutes with commuteAsync(), so the thread stays responsive;
   * the final synchronous step only counts failures (a few ms).
   */
  evaluateAsync(filters: Filters, opts?: AsyncOptions): Promise<EngineEvaluation>;
  summary(ev: EngineEvaluation): Summary;
  /** Rent colour of a cell; `filtered` defaults to "at least one active filter" when an evaluation is passed. */
  rentColour(i: number, o: RentOpts | EngineEvaluation, filtered?: boolean): RGBA;
  /** Map fill: rent colour if the cell fits, grey if one filter away, null = transparent. */
  cellColour(i: number, ev: EngineEvaluation): RGBA | null;
  /**
   * RGBA image of the map fill, `cols` × `rows` pixels with north at the top (same as the prototype canvas).
   * Pair with grid.bounds() for an image overlay.
   */
  paint(ev: EngineEvaluation, out?: Uint8ClampedArray): Uint8ClampedArray;
  /** Tap card for a cell, from the evaluation's own filter snapshot. */
  cellInfo(i: number, ev: EngineEvaluation): CellInfo;
  /** Tap card for a cell from explicit filters (ev, if given, must come from the same filters). */
  cellInfo(i: number, filters: Filters, ev?: Evaluation | null): CellInfo;
}

declare const setTimeout: (cb: () => void, ms: number) => unknown;
const macrotask = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

function checked(filters: Filters): Filters {
  const errs = validateFilters(filters);
  if (errs.length) throw new RangeError(`Invalid filters: ${errs.join('; ')}`);
  return cloneFilters(filters);
}

export function createEngine(data: LuxData): Engine {
  const G = data.grid;
  const areas = data.areas;
  const grid = createGridGeo(G);
  const transit = createTransit(data.transit, grid);
  const cache = new Map<string, Float32Array>();
  const eurCache = new Map<string, number>();
  const eur = (a: Area, S: number): number => {
    const k = `${a.L}|${S}`;
    let v = eurCache.get(k);
    if (v === undefined) eurCache.set(k, (v = eurM2(a, S)));
    return v;
  };

  const remember = (key: string, out: Float32Array): Float32Array => {
    cache.set(key, out);
    if (cache.size > 64) cache.delete(cache.keys().next().value!);
    return out;
  };
  // Internal: returns the cached array itself (never handed to callers without a copy).
  const commute = (p: CommuteQuery, arriveH: number): Float32Array => {
    const key = commuteKey(p, arriveH);
    const hit = cache.get(key);
    if (hit) return hit;
    const it = commuteSteps(G, grid, transit, p, arriveH);
    let r = it.next();
    while (!r.done) r = it.next();
    return remember(key, r.value);
  };
  const commuteAsync = async (
    p: CommuteQuery,
    arriveH: number,
    opts: AsyncOptions = {},
  ): Promise<Float32Array> => {
    const pause = opts.pause ?? macrotask;
    const key = commuteKey(p, arriveH);
    const hit = cache.get(key);
    if (hit) return hit;
    if (p.mode === 'transit') await transit.cellStopsAsync(pause, opts.chunk);
    const it = commuteSteps(G, grid, transit, p, arriveH);
    let r = it.next();
    while (!r.done) {
      await pause();
      r = it.next();
    }
    return cache.get(key) ?? remember(key, r.value);
  };

  const isEval = (o: RentOpts | EngineEvaluation): o is EngineEvaluation => 'checks' in o;

  return {
    data,
    grid,
    transit,
    precompute() {
      transit.footpaths();
      transit.cellStops();
    },
    async precomputeAsync(opts = {}) {
      await transit.cellStopsAsync(opts.pause ?? macrotask, opts.chunk);
    },
    commute: (p, arriveH) => commute(p, arriveH).slice(),
    commuteAsync: async (p, arriveH, opts) => (await commuteAsync(p, arriveH, opts)).slice(),
    evaluate(filters) {
      const f = checked(filters);
      return { ...evaluateFilters(G, grid, commute, f), filters: f };
    },
    async evaluateAsync(filters, opts) {
      const f = checked(filters);
      for (const p of f.people)
        if (p.dest)
          await commuteAsync({ lat: p.dest.lat, lon: p.dest.lon, mode: p.mode }, f.arrive, opts);
      // All commutes are cached now (≤ 2 people, cache holds 64), so this is the cheap counting pass.
      return { ...evaluateFilters(G, grid, commute, f), filters: f };
    },
    summary: (ev) => summarise(G, areas, grid.cellKm2, ev, ev.filters),
    rentColour(i, o, filtered) {
      if (isEval(o))
        return rentColour(G, areas, i, o.filters, filtered ?? o.checks.length > 0, eur);
      return rentColour(G, areas, i, o, filtered ?? false, eur);
    },
    cellColour: (i, ev) => cellColour(G, areas, i, ev.fails, ev.filters, ev.checks.length > 0, eur),
    paint(ev, out) {
      const { rows, cols } = grid;
      const img = out ?? new Uint8ClampedArray(rows * cols * 4);
      img.fill(0);
      const filtered = ev.checks.length > 0;
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const col = cellColour(G, areas, i, ev.fails, ev.filters, filtered, eur);
          if (col) img.set(col, ((rows - 1 - r) * cols + c) * 4);
        }
      return img;
    },
    cellInfo(i: number, a: Filters | EngineEvaluation, ev: Evaluation | null = null): CellInfo {
      if ('checks' in a) return cellInfo(G, areas, i, a.filters, a, commute);
      return cellInfo(G, areas, i, a, ev, commute);
    },
  };
}
