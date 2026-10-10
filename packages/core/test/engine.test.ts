// The engine's own behaviour (memo cache, input snapshots, paint orientation, async API, validation),
// beyond parity with the prototype.
import { describe, expect, it } from 'vitest';
import {
  checkFails,
  cloneFilters,
  createEngine,
  type Engine,
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

  it('rejects values outside the allowed sets (noise bands, modes, arrival hour)', () => {
    const bad: [string, (f: Filters) => void][] = [
      ['noise.road', (f) => (f.noise.road = 50 as never)],
      ['noise.air', (f) => (f.noise.air = 75 as never)],
      ['cats.park.mode', (f) => (f.cats.park = { mode: 'none' as never, m: 500 })],
      [
        'places[0].mode',
        (f) => (f.places = [{ name: 'x', loc: null, mode: 'Near' as never, m: 100 }]),
      ],
      ['places[0].m', (f) => (f.places = [{ name: 'x', loc: null, mode: 'far', m: -100 }])],
      ['arrive', (f) => (f.arrive = 25 as never)],
      ['arrive', (f) => (f.arrive = NaN as never)],
      ['people[0].mode', (f) => (f.people[0]!.mode = 'car' as never)],
    ];
    for (const [what, mutate] of bad) {
      const f = defaultFilters();
      mutate(f);
      expect(validateFilters(f).join(' ')).toContain(what);
      expect(() => engine.evaluate(f)).toThrow(RangeError);
    }
    // Off-menu but meaningful values stay valid.
    const ok = defaultFilters();
    ok.arrive = 6.25 as never;
    ok.cats.park = { mode: 'any', m: -1 }; // ignored while mode is "any"
    expect(validateFilters(ok)).toEqual([]);
  });

  it('is structured-cloneable and the clone gives the same cards and image', () => {
    const f = exampleFilters();
    f.places = [{ name: 'Gym', loc: { lat: 49.61, lon: 6.13 }, mode: 'near', m: 2000 }];
    const ev = engine.evaluate(f);
    const copy = structuredClone(ev);
    expect(copy.checks.length).toBe(ev.checks.length);
    expect('fail' in copy.checks[0]!).toBe(false);
    for (let i = 0; i < engine.grid.n; i += 11)
      ev.checks.forEach((ch, j) => expect(checkFails(copy.checks[j]!, i)).toBe(ch.fail(i)));
    const i = engine.grid.cellAt(49.6116, 6.1319);
    expect(engine.cellInfo(i, copy)).toEqual(engine.cellInfo(i, ev));
    expect(Array.from(engine.paint(copy))).toEqual(Array.from(engine.paint(ev)));
  });

  it('cellInfo throws for an index off the grid (app.js opens no popup there)', () => {
    const ev = engine.evaluate(defaultFilters());
    for (const i of [-1, engine.grid.n, 1.5, NaN])
      expect(() => engine.cellInfo(i, ev)).toThrow(RangeError);
    const outside = data.grid.area.indexOf(-1);
    expect(engine.cellInfo(outside, ev).area).toBeNull();
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
  it('rejects an output buffer of the wrong size', () => {
    const ev = engine.evaluate(defaultFilters());
    const { rows, cols } = engine.grid;
    expect(() => engine.paint(ev, new Uint8ClampedArray(rows * cols * 4 - 4))).toThrow(RangeError);
    expect(() => engine.paint(ev, new Uint8ClampedArray(rows * cols * 4 + 4))).toThrow(RangeError);
    const out = new Uint8ClampedArray(rows * cols * 4).fill(7);
    expect(engine.paint(ev, out)).toBe(out);
    expect(Array.from(out)).toEqual(Array.from(engine.paint(ev)));
  });

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

/** Counts reverse connection scans (one per transit deadline) on an engine. */
function countScans(e: Engine): () => number {
  let n = 0;
  const latest = e.transit.latest;
  (e.transit as { latest: typeof latest }).latest = (...a) => {
    n++;
    return latest(...a);
  };
  return () => n;
}
const tick = async (): Promise<void> => {};
const isAbort = (e: unknown): boolean => e instanceof Error && e.name === 'AbortError';

describe('async cancellation and sharing', () => {
  it('overlapping commuteAsync calls for one key share a single computation', async () => {
    const e = createEngine(data);
    e.precompute();
    const scans = countScans(e);
    const [a, b, c] = await Promise.all([
      e.commuteAsync(KIRCHBERG, 8, { pause: tick }),
      e.commuteAsync(KIRCHBERG, 8, { pause: tick }),
      e.commuteAsync({ ...KIRCHBERG, lat: 49.626100001 }, 8), // same 5-decimal key
    ]);
    expect(scans()).toBe(10); // 10 deadlines, once
    expect(a).not.toBe(b); // each caller gets its own copy
    expect(sameArray(a, b)).toBe(true);
    expect(sameArray(a, c)).toBe(true);
    expect(sameArray(a, engine.commute(KIRCHBERG, 8))).toBe(true);
  });

  it('two overlapping evaluateAsync calls: the aborted one rejects, the other scans each key once', async () => {
    const e = createEngine(data);
    const scans = countScans(e);
    const f = exampleFilters();
    const first = new AbortController();
    let pauses = 0;
    const pause = async (): Promise<void> => {
      if (++pauses === 20) first.abort(); // during the first person's deadline scans
    };
    const p1 = e.evaluateAsync(f, { pause, signal: first.signal, chunk: 1000 });
    const p2 = e.evaluateAsync(f, { pause });
    await expect(p1).rejects.toSatisfy(isAbort);
    const ev = await p2;
    expect(scans()).toBe(20); // 2 people × 10 deadlines, no duplicate work
    const ref = engine.evaluate(f);
    expect(sameArray(ev.fails, ref.fails)).toBe(true);
    expect(sameArray(ev.only, ref.only)).toBe(true);
  });

  it('stops the computation once every caller has aborted, and caches nothing', async () => {
    const e = createEngine(data);
    e.precompute();
    const scans = countScans(e);
    const a = new AbortController();
    const b = new AbortController();
    let pauses = 0;
    const pause = async (): Promise<void> => {
      if (++pauses === 3) a.abort();
      if (pauses === 5) b.abort();
    };
    const pa = e.commuteAsync(KIRCHBERG, 8, { pause, signal: a.signal });
    const pb = e.commuteAsync(KIRCHBERG, 8, { pause, signal: b.signal });
    await expect(pa).rejects.toSatisfy(isAbort);
    await expect(pb).rejects.toSatisfy(isAbort);
    await new Promise((r) => setTimeout(r, 0));
    expect(scans()).toBeLessThan(10);
    const before = scans();
    e.commute(KIRCHBERG, 8);
    expect(scans() - before).toBe(10); // recomputed: the aborted run left no cache entry
  });

  it('rejects at once on an aborted signal, and polls a signal without listeners', async () => {
    const e = createEngine(data);
    const scans = countScans(e);
    const done = new AbortController();
    done.abort(new Error('stale'));
    await expect(e.commuteAsync(KIRCHBERG, 8, { signal: done.signal })).rejects.toThrow('stale');
    await expect(e.evaluateAsync(exampleFilters(), { signal: done.signal })).rejects.toThrow(
      'stale',
    );
    await expect(e.precomputeAsync({ signal: done.signal })).rejects.toThrow('stale');
    expect(scans()).toBe(0);
    // A bare { aborted } object is checked at each pause; nothing is scanned after it fires.
    const bare = { aborted: false };
    let pauses = 0;
    const pause = async (): Promise<void> => {
      if (++pauses === 5) bare.aborted = true; // during the stop-index build (~16 pauses)
    };
    await expect(
      e.commuteAsync(KIRCHBERG, 8, { pause, signal: bare, chunk: 1000 }),
    ).rejects.toSatisfy(isAbort);
    expect(scans()).toBe(0);
  });
});

describe('commute cache recency', () => {
  it('keeps a key that is used again (LRU, not FIFO)', () => {
    const e = createEngine(data);
    let computed = 0;
    const cellAt = e.grid.cellAt;
    (e.grid as { cellAt: typeof cellAt }).cellAt = (lat, lon) => {
      computed++; // a walk commute calls cellAt once per computation
      return cellAt(lat, lon);
    };
    const q = (k: number): CommuteQuery => ({ lat: 49.6 + k * 1e-3, lon: 6.1, mode: 'walk' });
    e.commute(q(0), 8);
    for (let k = 1; k <= 100; k++) {
      e.commute(q(k), 8);
      e.commute(q(0), 8); // keeps q(0) the most recently used
    }
    expect(computed).toBe(101);
    e.commute(q(1), 8); // an old entry, evicted by now
    expect(computed).toBe(102);
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
