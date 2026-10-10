import { ONE_AWAY_COLOUR, defaultFilters, type EngineEvaluation } from '@wtl/core';
import { describe, expect, it } from 'vitest';
import { toEngineFilters } from '../src/lib/filters';
import {
  ONE_AWAY_CSS,
  buildCellLayer,
  cellFill,
  fillColour,
  rgba,
  type CellFill,
} from '../src/lib/mapFill';
import { exampleEvaluation, getTestEngine } from './engine';

const engine = getTestEngine();
const G = engine.data.grid;
const areas = engine.data.areas;
const layer = buildCellLayer(G, engine.grid);

/** The colour a feature gets from the fill-color expression, resolved in plain TS. */
function colourOf(fill: CellFill, k: number): string | null {
  const code = fill.codes[k]!;
  if (code === 0) return null;
  if (code === 1) return ONE_AWAY_CSS;
  return fill.palette[code - 2]!;
}

/** Every feature's colour equals core cellColour() for its cell (null = not drawn). */
function expectSameAsEngine(ev: EngineEvaluation): CellFill {
  const fill = cellFill(G, areas, layer.cells, ev);
  expect(fill.codes).toHaveLength(layer.cells.length);
  const mismatches: number[] = [];
  for (let k = 0; k < layer.cells.length; k++) {
    const want = engine.cellColour(layer.cells[k]!, ev);
    if (colourOf(fill, k) !== (want ? rgba(want) : null)) mismatches.push(k);
  }
  expect(mismatches).toEqual([]);
  return fill;
}

describe('buildCellLayer', () => {
  it('has one closed polygon per covered cell, k = feature position', () => {
    const covered = G.area.filter((a) => a >= 0).length;
    expect(layer.cells.length).toBe(covered);
    expect(layer.geojson.features).toHaveLength(covered);
    layer.geojson.features.forEach((f, k) => {
      expect(f.properties.k).toBe(k);
      expect(f.id).toBe(k);
      expect(G.area[layer.cells[k]!]).toBeGreaterThanOrEqual(0);
    });
    const ring = layer.geojson.features[0]!.geometry.coordinates[0]!;
    expect(ring[0]).toEqual(ring[ring.length - 1]);
    // [lon, lat] inside Luxembourg.
    const [lon, lat] = ring[0]!;
    expect(lon).toBeGreaterThan(5.7);
    expect(lon).toBeLessThan(6.6);
    expect(lat).toBeGreaterThan(49.4);
    expect(lat).toBeLessThan(50.2);
  });
  it('the polygon of a feature contains its cell centre', () => {
    const k = Math.floor(layer.cells.length / 2);
    const i = layer.cells[k]!;
    const ring = layer.geojson.features[k]!.geometry.coordinates[0]!;
    const lons = ring.map((p) => p[0]!);
    const lats = ring.map((p) => p[1]!);
    const cLat = engine.grid.cLat[i]!;
    const cLon = engine.grid.cLon[i]!;
    expect(cLon).toBeGreaterThan(Math.min(...lons));
    expect(cLon).toBeLessThan(Math.max(...lons));
    expect(cLat).toBeGreaterThan(Math.min(...lats));
    expect(cLat).toBeLessThan(Math.max(...lats));
    expect(engine.grid.cellAt(cLat, cLon)).toBe(i);
  });
});

describe('cellFill (same rules as core cellColour / prototype draw)', () => {
  it('no filters: every covered cell gets its light rent colour', () => {
    const fill = expectSameAsEngine(engine.evaluate(defaultFilters()));
    expect(fill.codes.every((c) => c >= 2)).toBe(true);
  });

  it('example: 0 failures = rent colour, 1 = grey, more = hidden', () => {
    const ev = exampleEvaluation();
    const fill = expectSameAsEngine(ev);
    const count = (pred: (c: number) => boolean) => fill.codes.filter(pred).length;
    expect(count((c) => c === 0)).toBeGreaterThan(0);
    expect(count((c) => c === 1)).toBeGreaterThan(0);
    expect(count((c) => c >= 2)).toBeGreaterThan(0);
    const wrong = fill.codes.filter((c, k) => {
      const f = ev.fails[layer.cells[k]!]!;
      return !(f === 0 ? c >= 2 : f === 1 ? c === 1 : c === 0);
    });
    expect(wrong).toEqual([]);
  });

  it('rent never hides a cell: a tiny budget recolours but keeps the same cells', () => {
    const ui = defaultFilters();
    ui.noise.road = 65;
    const loose = engine.evaluate(toEngineFilters(ui));
    ui.size = 60;
    ui.budget = 1;
    const tight = engine.evaluate(toEngineFilters(ui));
    expect(Array.from(tight.fails)).toEqual(Array.from(loose.fails));
    const a = cellFill(G, areas, layer.cells, loose);
    const b = expectSameAsEngine(tight);
    expect(a.codes.map((c) => c === 0)).toEqual(b.codes.map((c) => c === 0));
  });

  it('palette has one entry per distinct colour, all of them used', () => {
    const fill = cellFill(G, areas, layer.cells, exampleEvaluation());
    expect(new Set(fill.palette).size).toBe(fill.palette.length);
    expect(new Set(fill.codes.filter((c) => c >= 2)).size).toBe(fill.palette.length);
  });
});

describe('fillColour expression', () => {
  it('maps codes to colours with a transparent fallback', () => {
    const fill: CellFill = {
      codes: [0, 1, 2, 3, 2],
      palette: ['rgba(1,2,3,0.5)', 'rgba(4,5,6,1)'],
    };
    expect(fillColour(fill)).toEqual([
      'match',
      ['at', ['get', 'k'], ['literal', [0, 1, 2, 3, 2]]],
      1,
      ONE_AWAY_CSS,
      2,
      'rgba(1,2,3,0.5)',
      3,
      'rgba(4,5,6,1)',
      'rgba(0,0,0,0)',
    ]);
  });
  it('rgba() writes alpha as a 0–1 fraction', () => {
    expect(rgba([140, 140, 140, 70])).toBe('rgba(140,140,140,0.275)');
    expect(rgba([8, 81, 156])).toBe('rgba(8,81,156,1)');
    expect(ONE_AWAY_CSS).toBe(rgba(ONE_AWAY_COLOUR));
  });
});
