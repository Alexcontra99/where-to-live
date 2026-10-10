import type { Grid } from '@wtl/data-lux';
import { KX, KY } from './constants';

export interface LatLon {
  lat: number;
  lon: number;
}

/** Straight-line km (equirectangular, local scale; app.js km). */
export const km = (a1: number, o1: number, a2: number, o2: number): number =>
  Math.hypot((a1 - a2) * KY, (o1 - o2) * KX);

export type Bounds = [[number, number], [number, number]];

export interface GridGeo {
  readonly rows: number;
  readonly cols: number;
  /** Number of cells (rows × cols). */
  readonly n: number;
  /** km² per cell. */
  readonly cellKm2: number;
  /** Cell centres. */
  readonly cLat: Float64Array;
  readonly cLon: Float64Array;
  /** Cell index for a point, or -1 outside the grid. */
  cellAt(lat: number, lon: number): number;
  cellCenter(i: number): LatLon;
  /** [[south, west], [north, east]] of one cell. */
  cellBounds(i: number): Bounds;
  /** Closed ring of [lon, lat] (GeoJSON order) for one cell. */
  cellPolygon(i: number): [number, number][];
  /** [[south, west], [north, east]] of the whole grid (for an image overlay). Row 0 is the south edge. */
  bounds(): Bounds;
}

export function createGridGeo(G: Grid): GridGeo {
  const n = G.rows * G.cols;
  const cLat = new Float64Array(n);
  const cLon = new Float64Array(n);
  for (let r = 0; r < G.rows; r++)
    for (let c = 0; c < G.cols; c++) {
      const i = r * G.cols + c;
      cLat[i] = G.lat0 + (r + 0.5) * G.dlat;
      cLon[i] = G.lon0 + (c + 0.5) * G.dlon;
    }
  const cellAt = (lat: number, lon: number): number => {
    const r = Math.floor((lat - G.lat0) / G.dlat);
    const c = Math.floor((lon - G.lon0) / G.dlon);
    return r < 0 || c < 0 || r >= G.rows || c >= G.cols ? -1 : r * G.cols + c;
  };
  const cellBounds = (i: number): Bounds => {
    const r = Math.floor(i / G.cols);
    const c = i % G.cols;
    const s = G.lat0 + r * G.dlat;
    const w = G.lon0 + c * G.dlon;
    return [
      [s, w],
      [s + G.dlat, w + G.dlon],
    ];
  };
  return {
    rows: G.rows,
    cols: G.cols,
    n,
    cellKm2: G.dlat * KY * (G.dlon * KX),
    cLat,
    cLon,
    cellAt,
    cellCenter: (i) => ({ lat: cLat[i]!, lon: cLon[i]! }),
    cellBounds,
    cellPolygon(i) {
      const [[s, w], [nth, e]] = cellBounds(i);
      return [
        [w, s],
        [e, s],
        [e, nth],
        [w, nth],
        [w, s],
      ];
    },
    bounds: () => [
      [G.lat0, G.lon0],
      [G.lat0 + G.rows * G.dlat, G.lon0 + G.cols * G.dlon],
    ],
  };
}
