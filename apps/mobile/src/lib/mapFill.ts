// Result grid for MapLibre. Pure TypeScript (no React Native imports) so it runs under vitest.
//
// Speed: the ~10k cell polygons are built and sent to the native map once (one feature per covered cell, with
// property `k` = its position in `cells`). A new evaluation only changes the layer's fill-color expression:
// a literal array with one small colour code per cell, looked up with ["at", ["get", "k"], codes].
import {
  ONE_AWAY_COLOUR,
  areaRentColour,
  type EngineEvaluation,
  type GridGeo,
  type RGBA,
} from '@wtl/core';
import type { Area, Grid } from '@wtl/data-lux';

export interface CellLayer {
  /** Grid index of each feature, in feature order (only cells inside a covered area). */
  cells: Int32Array;
  geojson: GeoJSON.FeatureCollection<GeoJSON.Polygon, { k: number }>;
}

/** Built once per dataset. */
export function buildCellLayer(G: Grid, grid: GridGeo): CellLayer {
  const idx: number[] = [];
  for (let i = 0; i < grid.n; i++) if (G.area[i]! >= 0) idx.push(i);
  const features = idx.map((i, k): GeoJSON.Feature<GeoJSON.Polygon, { k: number }> => ({
    type: 'Feature',
    id: k,
    properties: { k },
    geometry: { type: 'Polygon', coordinates: [grid.cellPolygon(i)] },
  }));
  return { cells: Int32Array.from(idx), geojson: { type: 'FeatureCollection', features } };
}

export const rgba = ([r, g, b, a]: readonly number[]): string =>
  `rgba(${r},${g},${b},${+((a ?? 255) / 255).toFixed(3)})`;

export interface CellFill {
  /** Colour code per feature: 0 = not drawn, 1 = one filter away, 2+ = palette[code - 2]. */
  codes: number[];
  /** CSS colours for codes 2+. */
  palette: string[];
}

/**
 * Same rules as the prototype draw() (app.js :185-198) and core paint(): cells passing every check get their
 * area's rent colour, cells failing exactly one are grey, the rest are not drawn.
 */
export function cellFill(
  G: Grid,
  areas: Area[],
  cells: Int32Array,
  ev: Pick<EngineEvaluation, 'fails' | 'checks' | 'filters'>,
): CellFill {
  const filtered = ev.checks.length > 0;
  const palette: string[] = [];
  const paletteCode = new Map<string, number>();
  // One colour per area (rent depends only on the area and the rent filters).
  const areaCode = new Int16Array(areas.length + 1).fill(-1);
  const codeFor = (col: RGBA): number => {
    const css = rgba(col);
    let c = paletteCode.get(css);
    if (c === undefined) {
      c = palette.push(css) + 1;
      paletteCode.set(css, c);
    }
    return c;
  };
  const codes = new Array<number>(cells.length);
  for (let k = 0; k < cells.length; k++) {
    const i = cells[k]!;
    const f = ev.fails[i]!;
    if (f === 0) {
      const a = G.area[i]!;
      const slot = a < areas.length ? a : areas.length;
      if (areaCode[slot] === -1)
        areaCode[slot] = codeFor(areaRentColour(areas[a], ev.filters, filtered));
      codes[k] = areaCode[slot]!;
    } else codes[k] = f === 1 ? 1 : 0;
  }
  return { codes, palette };
}

export const ONE_AWAY_CSS = rgba(ONE_AWAY_COLOUR);

/** fill-color expression for a CellFill (MapLibre style spec). */
export function fillColour(fill: CellFill): unknown[] {
  const pairs: (number | string)[] = [1, ONE_AWAY_CSS];
  fill.palette.forEach((css, j) => pairs.push(j + 2, css));
  return ['match', ['at', ['get', 'k'], ['literal', fill.codes]], ...pairs, 'rgba(0,0,0,0)'];
}
