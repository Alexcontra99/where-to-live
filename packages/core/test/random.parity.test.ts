// Adversarial parity: randomised scenarios (deterministic seeds) run through the ORIGINAL prototipo/app.js
// and @wtl/core. Compares commutes, latest(), checks/fails/only, rent colour, paint, summary and cell cards.
import { beforeAll, describe, expect, it } from 'vitest';
import {
  CAT_KEYS,
  cellInfoLines,
  createEngine,
  defaultFilters,
  type Engine,
  type Filters,
  type Mode,
  type NoiseThreshold,
} from '../src';
import { loadLuxData } from './data';
import { htmlToLines, loadPrototype, type Prototype } from './prototype';

let proto: Prototype;
let engine: Engine;

beforeAll(() => {
  proto = loadPrototype();
  engine = createEngine(loadLuxData());
});

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomFilters(seed: number): Filters {
  const rnd = mulberry32(seed);
  const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)]!;
  const G = engine.data.grid;
  // Mostly inside the grid, sometimes just outside it.
  const point = () => ({
    lat: G.lat0 - 0.02 + rnd() * (G.rows * G.dlat + 0.04),
    lon: G.lon0 - 0.02 + rnd() * (G.cols * G.dlon + 0.04),
  });
  const f = defaultFilters();
  const modes: Mode[] = ['transit', 'walk', 'bike'];
  const nPeople = 1 + Math.floor(rnd() * 2);
  f.people = [];
  for (let n = 0; n < nPeople; n++)
    f.people.push({
      label: `Person ${n + 1}`,
      dest: rnd() < 0.9 ? point() : null,
      mode: pick(modes),
      max: 5 + 5 * Math.floor(rnd() * 18),
    });
  f.arrive = pick([7.5, 8, 8.5, 9] as const);
  f.budget = rnd() < 0.6 ? Math.round(800 + rnd() * 3500) : null;
  f.size = rnd() < 0.7 ? pick([10, 15, 27, 33.5, 45, 60, 61, 79.9, 100, 144, 145, 210]) : null;
  const thr: NoiseThreshold[] = [0, 55, 60, 65, 70];
  f.noise = { road: pick(thr), rail: pick(thr), air: pick(thr) };
  for (const k of CAT_KEYS) {
    const mode = pick(['any', 'any', 'near', 'far'] as const);
    f.cats[k] = {
      mode,
      m: pick([0, 50, 100, 150, 295, 300, 305, 800, 1000, 2500, 5990, 6000, 7000]),
    };
  }
  const nPlaces = Math.floor(rnd() * 3);
  for (let n = 0; n < nPlaces; n++)
    f.places.push({
      name: `Place ${n}`,
      loc: rnd() < 0.85 ? point() : null,
      mode: pick(['near', 'far'] as const),
      m: pick([50, 500, 1000, 2000, 5000]),
    });
  return f;
}

function applyToPrototype(f: Filters): void {
  const s = proto.state;
  const copy = JSON.parse(JSON.stringify(f)) as Filters;
  s.people = copy.people.map((p, n) => ({ ...p, label: p.label ?? `Person ${n + 1}` }));
  s.arrive = copy.arrive;
  s.budget = copy.budget;
  s.size = copy.size;
  s.noise = copy.noise;
  s.cats = copy.cats;
  s.places = copy.places;
}

function firstDiff(a: ArrayLike<number>, b: ArrayLike<number>): number {
  if (a.length !== b.length) return 0;
  for (let i = 0; i < a.length; i++) if (!Object.is(a[i], b[i])) return i;
  return -1;
}

const SEEDS = process.env.SEEDS
  ? process.env.SEEDS.split(',').map(Number)
  : [1, 7, 42, 1234, 99991];

describe.each(SEEDS)('random parity seed %i', (seed) => {
  it('commutes, checks, fails, only, rent colour, paint, summary and cell cards match', () => {
    const f = randomFilters(seed);
    applyToPrototype(f);

    for (const p of f.people) {
      if (!p.dest) continue;
      const q = { lat: p.dest.lat, lon: p.dest.lon, mode: p.mode };
      const want = proto.commute(q, f.arrive);
      const got = engine.commute(q, f.arrive);
      const i = firstDiff(got, want);
      expect(i, `seed ${seed} ${p.mode} cell ${i}: core ${got[i]} vs proto ${want[i]}`).toBe(-1);
    }

    const want = proto.evaluate();
    const ev = engine.evaluate(f);
    expect(ev.checks.map((c) => [c.name, c.short])).toEqual(
      want.checks.map((c) => [c.name, c.short]),
    );
    expect(firstDiff(ev.fails, want.fails)).toBe(-1);
    expect(firstDiff(ev.only, want.only)).toBe(-1);

    // Rent colour on every cell, and the painted image rebuilt from the prototype's draw() rules.
    const { rows, cols, n } = engine.grid;
    const img = engine.paint(ev);
    const G = engine.data.grid;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const rc = Array.from(proto.rentColour(i));
        const gc = engine.rentColour(i, ev);
        if (rc.join() !== gc.join()) expect(gc, `rent cell ${i}`).toEqual(rc);
        const p = ((rows - 1 - r) * cols + c) * 4;
        const fl = want.fails[i];
        const exp =
          G.area[i]! < 0
            ? [0, 0, 0, 0]
            : fl === 0
              ? rc
              : fl === 1
                ? [140, 140, 140, 70]
                : [0, 0, 0, 0];
        const px = Array.from(img.subarray(p, p + 4));
        if (px.join() !== exp.join()) expect(px, `paint cell ${i}`).toEqual(exp);
      }

    // Summary: compare the full HTML-derived numbers.
    const html = proto.summaryHtml();
    const s = engine.summary(ev);
    const fit = /<b>(.*?)<\/b> fit · (\d+) district/.exec(html);
    expect(s.fitKm2Label).toBe(fit?.[1]);
    expect(s.areaCount).toBe(Number(fit?.[2]));
    const top = [
      ...html.matchAll(
        /<li>(.*?) <span class="hint">· (.*?) · about €(-?\d+|NaN) for (\d+(?:\.\d+)?) m²<\/span><\/li>/g,
      ),
    ].map((m) => [m[1], m[2], m[3], m[4]].join('|'));
    expect(
      s.topAreas.map((a) => [a.name, a.km2Label, String(a.estRent), String(s.size)].join('|')),
    ).toEqual(top);
    const blockers = [
      ...html.matchAll(
        /<div>([^<]*?) · (.*?)<\/div><div class="bar"><i style="width:([^%]*)%"><\/i><\/div>/g,
      ),
    ].map((m) => [m[1], m[2], m[3]].join('|'));
    expect(
      s.blockers.map((b) =>
        [
          b.short,
          b.km2Label,
          String((100 * b.cells) / Math.max(1, ...s.blockers.map((x) => x.cells))),
        ].join('|'),
      ),
    ).toEqual(blockers);

    // Cell cards on 300 random cells (inside and outside areas).
    const rnd = mulberry32(seed ^ 0xabcdef);
    for (let k = 0; k < 300; k++) {
      const i = Math.floor(rnd() * n);
      const c = engine.grid.cellCenter(i);
      const w = htmlToLines(proto.popupHtml(c.lat, c.lon));
      const g = cellInfoLines(engine.cellInfo(i, f, ev));
      if (g.join('\n') !== w.join('\n')) expect(g, `card cell ${i}`).toEqual(w);
    }
  });
});

describe('random latest() parity', () => {
  it('matches at 40 random destinations and deadlines (seed 2024)', () => {
    const rnd = mulberry32(2024);
    const G = engine.data.grid;
    for (let k = 0; k < 40; k++) {
      const lat = G.lat0 + rnd() * G.rows * G.dlat;
      const lon = G.lon0 + rnd() * G.cols * G.dlon;
      const T = Math.round(4 * 3600 + rnd() * 20 * 3600);
      const want = proto.latest(lat, lon, T);
      const got = engine.transit.latest(lat, lon, T);
      const i = firstDiff(got, want);
      expect(i, `(${lat}, ${lon}) T=${T} stop ${i}: ${got[i]} vs ${want[i]}`).toBe(-1);
    }
  });

  it('cellAt matches on random and boundary points (seed 77)', () => {
    const rnd = mulberry32(77);
    const G = engine.data.grid;
    for (let k = 0; k < 2000; k++) {
      const r = Math.floor(rnd() * (G.rows + 4)) - 2;
      const c = Math.floor(rnd() * (G.cols + 4)) - 2;
      const onEdge = rnd() < 0.5;
      const lat = G.lat0 + (r + (onEdge ? 0 : rnd())) * G.dlat;
      const lon = G.lon0 + (c + (onEdge ? 0 : rnd())) * G.dlon;
      expect(engine.grid.cellAt(lat, lon)).toBe(proto.cellAt(lat, lon));
    }
  });
});
