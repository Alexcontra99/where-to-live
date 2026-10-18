import type { Area, LuxData } from '@wtl/data-lux';
import { areaRentColour, cellColour, rentColour, type RentOpts } from './colour';
import { cellInfo, type CellInfo } from './cellInfo';
import { commuteKey, commuteSteps, type CommuteQuery } from './commute';
import { ONE_AWAY_COLOUR, type RGBA } from './constants';
import {
  evaluateFilters,
  summarise,
  type CommuteFn,
  type Evaluation,
  type Summary,
} from './evaluate';
import { cloneFilters, validateFilters, type Filters } from './filters';
import { createGridGeo, type GridGeo } from './geo';
import { eurM2 } from './rent';
import { createTransit, type TransitIndex } from './transit';

export interface EngineEvaluation extends Evaluation {
  /** Snapshot of the filters this evaluation was computed from. */
  filters: Filters;
}

/**
 * The part of AbortSignal the engine uses (structural, so a DOM, Node or React Native polyfill signal fits).
 * Without addEventListener the abort is noticed at the next pause.
 */
export interface AbortSignalLike {
  readonly aborted: boolean;
  readonly reason?: unknown;
  addEventListener?(type: 'abort', listener: () => void): void;
  removeEventListener?(type: 'abort', listener: () => void): void;
}

export interface AsyncOptions {
  /**
   * Cancels the call: it rejects with signal.reason (or an Error named "AbortError"). The shared work behind
   * it stops at the next pause once no other caller waits for it (a started stop-index build is finished,
   * since every transit commute needs it).
   */
  signal?: AbortSignalLike;
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
  /**
   * precompute() in chunks, handing the thread back between them (call at app start). The signal only
   * rejects this call: the shared index build carries on.
   */
  precomputeAsync(opts?: AsyncOptions): Promise<void>;
  /**
   * Minutes from every cell to a destination; memoised per (5-decimal point, mode, arrival) in an LRU of 64.
   * Returns a fresh copy each call, so callers may mutate it without corrupting the cache.
   * As in app.js, the value is computed from the exact point, and points that round to the same key share it.
   * app.js never evicts (the first such point wins for good); here the next aliasing point after an eviction
   * recomputes it. The difference is at most a ~1 m shift of the destination.
   */
  commute(p: CommuteQuery, arriveH: number): Float32Array;
  /**
   * commute() that yields between stop-index chunks and between the transit deadline scans. Concurrent calls
   * for the same key share one computation (run with the first caller's pause and chunk).
   */
  commuteAsync(p: CommuteQuery, arriveH: number, opts?: AsyncOptions): Promise<Float32Array>;
  /** Throws a RangeError when validateFilters(filters) reports problems. */
  evaluate(filters: Filters): EngineEvaluation;
  /**
   * evaluate() that first computes the commutes with commuteAsync(), so the thread stays responsive;
   * the final synchronous step only counts failures (a few ms). Pass a signal and abort the previous call
   * when the filters change, so a stale evaluation never resolves after a newer one.
   */
  evaluateAsync(filters: Filters, opts?: AsyncOptions): Promise<EngineEvaluation>;
  summary(ev: EngineEvaluation): Summary;
  /** Rent colour of a cell; `filtered` defaults to "at least one active filter" when an evaluation is passed. */
  rentColour(i: number, o: RentOpts | EngineEvaluation, filtered?: boolean): RGBA;
  /** Map fill: rent colour if the cell fits, grey if one filter away, null = transparent. */
  cellColour(i: number, ev: EngineEvaluation): RGBA | null;
  /**
   * RGBA image of the map fill, `cols` × `rows` pixels with north at the top (same as the prototype canvas).
   * Pair with grid.bounds() for an image overlay. `out`, if given, must have length rows × cols × 4.
   */
  paint(ev: EngineEvaluation, out?: Uint8ClampedArray): Uint8ClampedArray;
  /**
   * Tap card for a cell, from the evaluation's own filter snapshot. `i` must be on the grid: check
   * grid.cellAt(...) >= 0 first (app.js opens no popup there); an off-grid index throws a RangeError.
   */
  cellInfo(i: number, ev: EngineEvaluation): CellInfo;
  /** Tap card for a cell from explicit filters (ev, if given, must come from the same filters). */
  cellInfo(i: number, filters: Filters, ev?: Evaluation | null): CellInfo;
}

declare const setTimeout: (cb: () => void, ms: number) => unknown;
const macrotask = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

function abortError(signal: AbortSignalLike): unknown {
  if (signal.reason !== undefined) return signal.reason;
  const e = new Error('The operation was aborted');
  e.name = 'AbortError';
  return e;
}
function throwIfAborted(signal: AbortSignalLike | undefined): void {
  if (signal?.aborted) throw abortError(signal);
}

const COMMUTE_CACHE_SIZE = 64;
const EUR_CACHE_SIZE = 4096;

interface Waiter {
  signal: AbortSignalLike | undefined;
  resolve(v: Float32Array): void;
  reject(e: unknown): void;
  off(): void;
}

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

  // LRU: a Map keeps insertion order; a hit moves to the end, so the first key is the least recently used.
  const cache = new Map<string, Float32Array>();
  const cacheGet = (key: string): Float32Array | undefined => {
    const hit = cache.get(key);
    if (hit) {
      cache.delete(key);
      cache.set(key, hit);
    }
    return hit;
  };
  const remember = (key: string, out: Float32Array): Float32Array => {
    cache.delete(key);
    cache.set(key, out);
    if (cache.size > COMMUTE_CACHE_SIZE) cache.delete(cache.keys().next().value!);
    return out;
  };
  // One entry per (price level, size); cleared when it fills up (e.g. after dragging a size slider).
  const eurCache = new Map<string, number>();
  const eur = (a: Area, S: number): number => {
    const k = `${a.L}|${S}`;
    let v = eurCache.get(k);
    if (v === undefined) {
      if (eurCache.size >= EUR_CACHE_SIZE) eurCache.clear();
      eurCache.set(k, (v = eurM2(a, S)));
    }
    return v;
  };

  // Internal: returns the cached array itself (never handed to callers without a copy).
  const commute = (p: CommuteQuery, arriveH: number): Float32Array => {
    const key = commuteKey(p, arriveH);
    const hit = cacheGet(key);
    if (hit) return hit;
    const it = commuteSteps(G, grid, transit, p, arriveH);
    let r = it.next();
    while (!r.done) r = it.next();
    return remember(key, r.value);
  };

  // In-flight async commutes per key: callers share one computation, which stops once all of them abort.
  const inflight = new Map<string, Set<Waiter>>();
  const runCommute = async (
    key: string,
    waiters: Set<Waiter>,
    p: CommuteQuery,
    arriveH: number,
    opts: AsyncOptions,
  ): Promise<void> => {
    const pause = opts.pause ?? macrotask;
    /** Rejects the waiters whose signal has fired; true while someone still wants the result. */
    const wanted = (): boolean => {
      for (const w of waiters)
        if (w.signal?.aborted) {
          waiters.delete(w);
          w.off();
          w.reject(abortError(w.signal));
        }
      return waiters.size > 0;
    };
    try {
      if (p.mode === 'transit') await transit.cellStopsAsync(pause, opts.chunk);
      if (!wanted()) return;
      const it = commuteSteps(G, grid, transit, p, arriveH);
      let r = it.next();
      let result: Float32Array | undefined;
      while (!r.done) {
        await pause();
        if (!wanted()) return;
        result = cache.get(key); // a sync commute() may have computed it meanwhile
        if (result) break;
        r = it.next();
      }
      result ??= remember(key, r.value as Float32Array);
      for (const w of waiters) {
        w.off();
        w.resolve(result);
      }
    } catch (e) {
      for (const w of waiters) {
        w.off();
        w.reject(e);
      }
    } finally {
      waiters.clear();
      if (inflight.get(key) === waiters) inflight.delete(key);
    }
  };
  // Internal: resolves to the cached array itself.
  const commuteAsync = (
    p: CommuteQuery,
    arriveH: number,
    opts: AsyncOptions = {},
  ): Promise<Float32Array> => {
    const { signal } = opts;
    if (signal?.aborted) return Promise.reject(abortError(signal));
    const key = commuteKey(p, arriveH);
    const hit = cacheGet(key);
    if (hit) return Promise.resolve(hit);
    const existing = inflight.get(key);
    const waiters = existing ?? new Set<Waiter>();
    if (!existing) inflight.set(key, waiters);
    const promise = new Promise<Float32Array>((resolve, reject) => {
      const w: Waiter = { signal, resolve, reject, off: () => {} };
      waiters.add(w);
      if (signal?.addEventListener) {
        const onAbort = (): void => {
          if (!waiters.delete(w)) return;
          w.off();
          reject(abortError(signal));
        };
        signal.addEventListener('abort', onAbort);
        w.off = () => signal.removeEventListener?.('abort', onAbort);
      }
    });
    // Started after the first waiter joined: a walk / bike commute finishes without yielding.
    if (!existing) void runCommute(key, waiters, p, arriveH, opts);
    return promise;
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
      throwIfAborted(opts.signal);
      await transit.cellStopsAsync(opts.pause ?? macrotask, opts.chunk);
      throwIfAborted(opts.signal);
    },
    commute: (p, arriveH) => commute(p, arriveH).slice(),
    commuteAsync: async (p, arriveH, opts) => (await commuteAsync(p, arriveH, opts)).slice(),
    evaluate(filters) {
      const f = checked(filters);
      return { ...evaluateFilters(G, grid, commute, f), filters: f };
    },
    async evaluateAsync(filters, opts = {}) {
      const f = checked(filters);
      throwIfAborted(opts.signal);
      // Keep the awaited arrays here instead of re-reading the shared cache, which may have evicted them.
      const got = new Map<string, Float32Array>();
      for (const p of f.people)
        if (p.dest) {
          const q: CommuteQuery = { lat: p.dest.lat, lon: p.dest.lon, mode: p.mode };
          got.set(commuteKey(q, f.arrive), await commuteAsync(q, f.arrive, opts));
        }
      throwIfAborted(opts.signal);
      const local: CommuteFn = (q, a) => got.get(commuteKey(q, a)) ?? commute(q, a);
      return { ...evaluateFilters(G, grid, local, f), filters: f };
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
      const len = rows * cols * 4;
      if (out && out.length !== len)
        throw new RangeError(
          `paint: out must have length ${len} (${cols} × ${rows} × 4), got ${out.length}`,
        );
      const img = out ?? new Uint8ClampedArray(len);
      img.fill(0);
      // cellColour's rules with one colour per area per call, written straight into the image.
      const filtered = ev.checks.length > 0;
      const fit = new Uint8Array(areas.length * 4);
      areas.forEach((a, k) => fit.set(areaRentColour(a, ev.filters, filtered, eur), k * 4));
      const [gr, gg, gb, ga] = ONE_AWAY_COLOUR;
      const { fails } = ev;
      const area = G.area;
      for (let r = 0; r < rows; r++) {
        const row = (rows - 1 - r) * cols;
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const k = area[i]!;
          if (k < 0) continue;
          const f = fails[i]!;
          const p = (row + c) * 4;
          if (f === 0) {
            if (k < areas.length) {
              const q = k * 4;
              img[p] = fit[q]!;
              img[p + 1] = fit[q + 1]!;
              img[p + 2] = fit[q + 2]!;
              img[p + 3] = fit[q + 3]!;
            } else img.set(areaRentColour(undefined, ev.filters, filtered, eur), p);
          } else if (f === 1) {
            img[p] = gr;
            img[p + 1] = gg;
            img[p + 2] = gb;
            img[p + 3] = ga;
          }
        }
      }
      return img;
    },
    cellInfo(i: number, a: Filters | EngineEvaluation, ev: Evaluation | null = null): CellInfo {
      if ('checks' in a) return cellInfo(G, areas, i, a.filters, a, commute);
      return cellInfo(G, areas, i, a, ev, commute);
    },
  };
}
