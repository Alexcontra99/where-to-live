// The engine's own behaviour (memo cache, input snapshots, paint orientation, async API, validation),
// beyond parity with the prototype.
import { describe, expect, it } from 'vitest';
import {
  cloneFilters,
  createEngine,
  defaultFilters,
  createGridGeo,
  evaluateFilters,
  exampleFilters,
  fSize as fSizeRef,
  MAX_PLACES,
  monoTotal,
  ONE_AWAY_COLOUR,
  validateFilters,
  type CommuteQuery,
  type Filters,
} from '../src';
import { loadLuxData } from './data';

const data = loadLuxData();
const engine = createEngine(data);
const KIRCHBERG: CommuteQuery = { lat: 49.6261, lon: 6.161, mode: 'transit' };

const sameArray = (a: ArrayLike<number>, b: ArrayLike<number>): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (!Object.is(a[i], b[i])) return false;
  return true;
};

describe('commute memo cache', () => {
  it('keys on arrival time, mode and destination', () => {
    const at8 = engine.commute(KIRCHBERG, 8);
    const at9 = engine.commute(KIRCHBERG, 9);
    expect(sameArray(at8, at9)).toBe(false);
    const walk = engine.commute({ ...KIRCHBERG, mode: 'walk' }, 8);
    const bike = engine.commute({ ...KIRCHBERG, mode: 'bike' }, 8);
    expect(sameArray(at8, walk)).toBe(false);
    expect(sameArray(walk, bike)).toBe(false);
    const elsewhere = engine.commute({ ...KIRCHBERG, lat: 49.6109, lon: 6.1262 }, 8);
    expect(sameArray(at8, elsewhere)).toBe(false);
    // Same key up to 5 decimals → same values.
    expect(sameArray(engine.commute({ ...KIRCHBERG, lat: 49.626100001 }, 8), at8)).toBe(true);
  });

  it('hands out copies, so callers cannot corrupt the cache', () => {
    const a = engine.commute(KIRCHBERG, 8.5);
    const before = a[0]!;
    a[0] = 999;
    expect(engine.commute(KIRCHBERG, 8.5)[0]).toBe(before);
    const f = exampleFilters();
    const ev = engine.evaluate(f);
    const c0 = ev.commutes[0]![0]!;
    ev.commutes[0]![0] = 999;
    expect(engine.evaluate(f).commutes[0]![0]).toBe(c0);
  });

  it('recomputes an evicted entry (> 64 keys) to identical values', () => {
    const e = createEngine(data);
    const q = (k: number): CommuteQuery => ({ lat: 49.6 + k * 1e-3, lon: 6.1, mode: 'walk' });
    const first = e.commute(q(0), 8);
    for (let k = 1; k <= 65; k++) e.commute(q(k), 8);
    expect(sameArray(e.commute(q(0), 8), first)).toBe(true);
    // A transit entry too.
    const t = e.commute(KIRCHBERG, 8);
    for (let k = 100; k <= 165; k++) e.commute(q(k), 8);
    expect(sameArray(e.commute(KIRCHBERG, 8), t)).toBe(true);
  });
});

describe('evaluate', () => {
  it('does not mutate its input and snapshots it', () => {
    const f = exampleFilters();
    const copy = JSON.parse(JSON.stringify(f)) as Filters;
    const ev = engine.evaluate(f);
    expect(f).toEqual(copy);
    expect(ev.filters).toEqual(f);
    expect(ev.filters).not.toBe(f);
    f.cats.park.m = 5000;
    expect(ev.filters.cats.park.m).toBe(500);
  });

  it('cloneFilters keeps non-JSON numbers', () => {
    const f = defaultFilters();
    f.budget = Infinity;
    expect(cloneFilters(f).budget).toBe(Infinity);
  });

  it('rejects non-finite or negative numbers instead of silently changing them', () => {
    const bad: [string, (f: Filters) => void][] = [
      ['budget', (f) => (f.budget = Infinity)],
      ['size', (f) => (f.size = NaN)],
      ['size', (f) => (f.size = -5)],
      ['people[0].max', (f) => (f.people[0]!.max = NaN)],
      ['people[0].dest', (f) => (f.people[0]!.dest = { lat: NaN, lon: 6 })],
      ['cats.park.m', (f) => (f.cats.park = { mode: 'near', m: Infinity })],
      [
        'places',
        (f) =>
          (f.places = Array.from({ length: MAX_PLACES + 1 }, () => ({
            name: 'x',
            loc: null,
            mode: 'near',
            m: 1,
          }))),
      ],
      ['people', (f) => (f.people = [])],
    ];
    for (const [what, mutate] of bad) {
      const f = defaultFilters();
      mutate(f);
      const errs = validateFilters(f);
      expect(errs.join(' ')).toContain(what);
      expect(() => engine.evaluate(f)).toThrow(RangeError);
    }
    expect(validateFilters(defaultFilters())).toEqual([]);
    expect(validateFilters(exampleFilters())).toEqual([]);
  });

  it('cellInfo(i, ev) uses the evaluation snapshot', () => {
    const f = exampleFilters();
    const ev = engine.evaluate(f);
    const i = engine.grid.cellAt(49.6116, 6.1319);
    const a = engine.cellInfo(i, ev);
    expect(a).toEqual(engine.cellInfo(i, f, ev));
    f.size = 120; // the stale-filters mix the explicit overload allows; the snapshot overload does not
    expect(engine.cellInfo(i, ev)).toEqual(a);
  });
});

describe('fails counter', () => {
  it('saturates at 255 instead of wrapping', () => {
    // 300 failing places: more than validateFilters allows, so call evaluateFilters directly.
    const f = defaultFilters();
    f.places = Array.from({ length: 300 }, (_, n) => ({
      name: `P${n}`,
      loc: { lat: 0, lon: 0 },
      mode: 'near' as const,
      m: 1,
    }));
    const ev = evaluateFilters(data.grid, createGridGeo(data.grid), () => new Float32Array(0), f);
    let max = 0;
    for (const v of ev.fails) if (v > max) max = v;
    expect(ev.checks.length).toBe(300);
    expect(max).toBe(255);
  });
});

describe('paint', () => {
  it('puts north at the top and uses cellColour per pixel', () => {
    const ev = engine.evaluate(exampleFilters());
    const img = engine.paint(ev);
    const { rows, cols } = engine.grid;
    let grey = 0;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const px = Array.from(
          img.subarray(((rows - 1 - r) * cols + c) * 4, ((rows - 1 - r) * cols + c) * 4 + 4),
        );
        const want = engine.cellColour(i, ev);
        expect(px).toEqual(want ?? [0, 0, 0, 0]);
        if (ev.fails[i] === 1 && data.grid.area[i]! >= 0) {
          expect(want).toEqual([...ONE_AWAY_COLOUR]);
          grey++;
        }
      }
    expect(grey).toBeGreaterThan(0);
    // Row 0 is the south edge: its centre is the southernmost latitude.
    expect(engine.grid.cellCenter(0).lat).toBeLessThan(
      engine.grid.cellCenter((rows - 1) * cols).lat,
    );
  });
});

describe('async API', () => {
  it('commuteAsync and evaluateAsync match the sync results and yield along the way', async () => {
    const e = createEngine(data);
    let pauses = 0;
    const pause = async () => {
      pauses++;
    };
    const f = exampleFilters();
    const evA = await e.evaluateAsync(f, { pause, chunk: 1000 });
    expect(pauses).toBeGreaterThan(14 + 2 * 10); // 14 index chunks + 10 deadline scans per person
    const evS = createEngine(data).evaluate(f);
    expect(sameArray(evA.fails, evS.fails)).toBe(true);
    expect(sameArray(evA.only, evS.only)).toBe(true);
    for (let n = 0; n < 2; n++) expect(sameArray(evA.commutes[n]!, evS.commutes[n]!)).toBe(true);
    const c = await e.commuteAsync({ ...KIRCHBERG, mode: 'bike' }, 8, { pause });
    expect(sameArray(c, e.commute({ ...KIRCHBERG, mode: 'bike' }, 8))).toBe(true);
  });

  it('precomputeAsync builds the same index as precompute, sharing one build', async () => {
    const a = createEngine(data);
    const b = createEngine(data);
    expect(a.transit.ready).toBe(false);
    await Promise.all([a.precomputeAsync({ pause: async () => {} }), a.precomputeAsync()]);
    expect(a.transit.ready).toBe(true);
    b.precompute();
    const x = a.transit.cellStops();
    const y = b.transit.cellStops();
    expect(sameArray(x.off, y.off)).toBe(true);
    expect(sameArray(x.idx, y.idx)).toBe(true);
    expect(sameArray(x.w, y.w)).toBe(true);
  });
});

describe('geometry and rent edge cases', () => {
  it('cellAt returns -1 for non-finite input', () => {
    expect(engine.grid.cellAt(NaN, NaN)).toBe(-1);
    expect(engine.grid.cellAt(49.6, Infinity)).toBe(-1);
  });

  it('monoTotal stays fast and exact for huge sizes', () => {
    const t0 = performance.now();
    const v = monoTotal(1e9);
    expect(performance.now() - t0).toBeLessThan(50);
    expect(v).toBe(1e9 * 21.0);
    for (const S of [10, 27, 60.5, 144, 145, 145.5, 146, 200, 333.3]) {
      // Reference: the unbounded running maximum from app.js.
      let m = 0;
      for (let s = 15; s <= S; s++) m = Math.max(m, s * fSizeRef(s));
      expect(monoTotal(S)).toBe(Math.max(m, S * fSizeRef(S)));
    }
  });

  it('labels where each area rent comes from', () => {
    const ev = engine.evaluate(defaultFilters());
    const s = engine.summary(ev);
    const bases = new Set(s.topAreas.map((a) => a.rentProvenance.basis));
    expect(bases.size).toBeGreaterThan(0);
    const counts = { published: 0, 'city-average': 0, 'national-model': 0 };
    for (let k = 0; k < data.areas.length; k++) {
      const i = data.grid.area.indexOf(k);
      if (i < 0) continue;
      const card = engine.cellInfo(i, ev);
      const a = data.areas[k]!;
      if (a.eur_m2 === null) expect(card.rent).toBeNull();
      else {
        expect(card.rent!.eurM2).toBe(a.eur_m2);
        counts[card.rent!.provenance.basis]++;
        expect(card.rent!.provenance.source).not.toBeNull();
      }
    }
    expect(counts.published).toBeGreaterThan(0);
    expect(counts['national-model']).toBe(0); // no published rent → no rent line at all
  });
});
