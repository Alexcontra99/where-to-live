import { describe, expect, it } from 'vitest';
import type { Grid, Transit } from '@wtl/data-lux';
import {
  createGridGeo,
  createTransit,
  estRent,
  fmtKm2,
  fmtM,
  km,
  monoTotal,
  noiseWord,
  TRANSFER_S,
  WALK_S_PER_KM,
} from '../src';

describe('rent', () => {
  it('total rent never falls as size grows', () => {
    for (const L of [0.7, 0.879, 1.0, 1.312]) {
      let prev = 0;
      for (let S = 10; S <= 250; S += 0.25) {
        const r = estRent({ L }, S);
        expect(r).toBeGreaterThanOrEqual(prev);
        prev = r;
      }
    }
  });

  it('monoTotal is the running max of S × f(S)', () => {
    expect(monoTotal(27)).toBeCloseTo(27 * 56.3, 9);
    expect(monoTotal(145)).toBeGreaterThanOrEqual(145 * 21.0);
  });
});

describe('km', () => {
  it('is 0 for the same point and symmetric', () => {
    expect(km(49.6, 6.1, 49.6, 6.1)).toBe(0);
    expect(km(49.6, 6.1, 49.61, 6.12)).toBe(km(49.61, 6.12, 49.6, 6.1));
  });
  it('uses 111.2 km per degree of latitude and 72.1 per degree of longitude', () => {
    expect(km(49.6, 6.1, 49.7, 6.1)).toBeCloseTo(11.12, 9);
    expect(km(49.6, 6.1, 49.6, 6.2)).toBeCloseTo(7.21, 9);
    expect(km(0, 0, 0.3 / 111.2, 0.4 / 72.1)).toBeCloseTo(0.5, 9);
  });
});

describe('format', () => {
  it('fmtKm2, fmtM, noiseWord', () => {
    expect(fmtKm2(1, 0.05)).toBe('<0.1 km²');
    expect(fmtKm2(10, 0.0225)).toBe('0.2 km²');
    expect(fmtM(6000)).toBe('6+ km');
    expect(fmtM(1234)).toBe('1.2 km');
    expect(fmtM(234)).toBe('230 m');
    expect(noiseWord(75, 1)).toBe('extremely loud (75+ dB)');
    expect(noiseWord(0, 2)).toBe('under 55 dB');
    expect(noiseWord(0, 1)).toBe('not mapped');
  });
});

describe('latest() on a tiny synthetic timetable', () => {
  // Stops on one parallel, ~7 km apart, plus D 72 m east of A (a footpath from A).
  const lat = 49.6;
  const A: [number, number] = [lat, 6.1];
  const B: [number, number] = [lat, 6.2];
  const C: [number, number] = [lat, 6.3];
  const D: [number, number] = [lat, 6.101];
  const grid: Grid = {
    lat0: 49.5,
    lon0: 6.0,
    dlat: 0.1,
    dlon: 0.1,
    rows: 2,
    cols: 4,
    built: 'test',
    area: Array(8).fill(0),
    noise_road: Array(8).fill(0),
    noise_rail: Array(8).fill(0),
    noise_air: Array(8).fill(0),
    noise_cov: Array(8).fill(2),
    dist: {} as Grid['dist'],
  };
  // Connections sorted by departure, latest first (as build_data.py writes them):
  // [dep, arr, from, to, trip, flags]; flags: 1 = boarding allowed, 2 = alighting allowed.
  const timetable = (arrAtB: number): Transit => ({
    day: 'test',
    stride: 6,
    stops: [A, B, C, D],
    conns: [1700, 2000, 1, 2, 1, 3, 1000, arrAtB, 0, 1, 0, 3],
  });
  const dAD = km(...A, ...D);
  const T = 2100;

  it('chains a transfer when it leaves ≥ 3 min to change', () => {
    const tr = createTransit(timetable(1500), createGridGeo(grid));
    const L = tr.latest(...C, T);
    expect(L[2]).toBe(T); // at the destination stop: leave at T
    expect(L[1]).toBe(1700); // B: board trip 1
    expect(L[0]).toBe(1000); // A: trip 0 arrives B at 1500 ≤ 1700 - 180
    expect(L[3]).toBeCloseTo(1000 - dAD * WALK_S_PER_KM, 9); // D: walk to A
    expect(1500).toBeLessThanOrEqual(1700 - TRANSFER_S);
  });

  it('drops a transfer shorter than the minimum change time', () => {
    const tr = createTransit(timetable(1600), createGridGeo(grid));
    const L = tr.latest(...C, T);
    expect(L[1]).toBe(1700);
    expect(L[0]).toBe(-1e9);
    expect(L[3]).toBe(-1e9);
  });

  it('ignores connections departing after the deadline', () => {
    const tr = createTransit(timetable(1500), createGridGeo(grid));
    const L = tr.latest(...C, 1600);
    expect(L[2]).toBe(1600);
    expect(L[1]).toBe(-1e9);
    expect(L[0]).toBe(-1e9);
  });

  it('refuses connections that are not sorted latest first', () => {
    const tt = timetable(1500);
    const asc = { ...tt, conns: [...tt.conns.slice(6), ...tt.conns.slice(0, 6)] };
    expect(() => createTransit(asc, createGridGeo(grid))).toThrow(/latest first/);
    const ragged = { ...tt, conns: tt.conns.slice(0, 7) };
    expect(() => createTransit(ragged, createGridGeo(grid))).toThrow(/multiple of 6/);
  });

  it('starts the scan at the first departure ≤ T (T on, before and after departures)', () => {
    const tr = createTransit(timetable(1500), createGridGeo(grid));
    for (const T of [-1, 999, 1000, 1699, 1700, 1701, 1e9]) {
      const L = tr.latest(...C, T);
      expect(L[2]).toBe(T);
      // Trip 1 (dep 1700, arrives C at 2000) only counts when it arrives by T.
      expect(L[1]).toBe(T >= 2000 ? 1700 : -1e9);
    }
    expect(tr.latest(...C, 2000)[1]).toBe(1700);
  });
});
