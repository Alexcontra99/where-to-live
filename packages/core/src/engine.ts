import type { Area, LuxData } from '@wtl/data-lux';
import { cellColour, rentColour, type RentOpts } from './colour';
import { cellInfo, type CellInfo } from './cellInfo';
import { commuteKey, computeCommute, type CommuteQuery } from './commute';
import type { RGBA } from './constants';
import { evaluateFilters, summarise, type Evaluation, type Summary } from './evaluate';
import type { Filters } from './filters';
import { createGridGeo, type GridGeo } from './geo';
import { eurM2 } from './rent';
import { createTransit, type TransitIndex } from './transit';

export interface EngineEvaluation extends Evaluation {
  /** Snapshot of the filters this evaluation was computed from. */
  filters: Filters;
}

export interface Engine {
  readonly data: LuxData;
  /** Grid geometry: n, rows, cols, cellKm2, cellAt, cellCenter, cellBounds, cellPolygon, bounds. */
  readonly grid: GridGeo;
  readonly transit: TransitIndex;
  /** Build the per-cell stop lists and footpaths now (otherwise done on the first transit commute). */
  precompute(): void;
  /** Minutes from every cell to a destination; memoised per (5-decimal point, mode, arrival). */
  commute(p: CommuteQuery, arriveH: number): Float32Array;
  evaluate(filters: Filters): EngineEvaluation;
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
  cellInfo(i: number, filters: Filters, ev?: Evaluation | null): CellInfo;
}

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

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

  const commute = (p: CommuteQuery, arriveH: number): Float32Array => {
    const key = commuteKey(p, arriveH);
    let out = cache.get(key);
    if (!out) {
      out = computeCommute(G, grid, transit, p, arriveH);
      cache.set(key, out);
      if (cache.size > 64) cache.delete(cache.keys().next().value!);
    }
    return out;
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
    commute,
    evaluate(filters) {
      const f = clone(filters);
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
    cellInfo: (i, filters, ev = null) => cellInfo(G, areas, i, filters, ev, commute),
  };
}
