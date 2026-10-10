// Verifier-written adversarial parity: randomised scenarios (fixed seeds) aimed at tie-breaks and edges
// (stop-exact destinations, cell-edge points, off-menu arrival times, metres equal to grid distances,
// budgets that put the rent ratio exactly on a colour threshold, real-valued sizes, async API).
// Every scenario runs through the ORIGINAL prototipo/app.js (node:vm) and @wtl/core.
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

/** Edge-seeking random filters. */
function edgyFilters(seed: number): Filters {
  const rnd = mulberry32(seed);
  const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)]!;
  const G = engine.data.grid;
  const stops = engine.data.transit.stops;
  const N = G.rows * G.cols;
  const point = (): { lat: number; lon: number } => {
    const kind = rnd();
    if (kind < 0.35) {
      // exactly on a stop (distance 0 to that stop)
      const s = stops[Math.floor(rnd() * stops.length)]!;
      return { lat: s[0], lon: s[1] };
    }
    if (kind < 0.6) {
      // exactly on a cell corner / edge
      const r = Math.floor(rnd() * G.rows);
      const c = Math.floor(rnd() * G.cols);
      return { lat: G.lat0 + r * G.dlat, lon: G.lon0 + (c + (rnd() < 0.5 ? 0 : 0.5)) * G.dlon };
    }
    if (kind < 0.8) {
      // exactly on a cell centre
      const i = Math.floor(rnd() * N);
      return engine.grid.cellCenter(i);
    }
    return {
      lat: G.lat0 + rnd() * G.rows * G.dlat,
      lon: G.lon0 + rnd() * G.cols * G.dlon,
    };
  };
  const f = defaultFilters();
  const modes: Mode[] = ['transit', 'walk', 'bike'];
  f.people = [];
  const nPeople = 1 + Math.floor(rnd() * 2);
  for (let n = 0; n < nPeople; n++)
    f.people.push({
      label: `Person ${n + 1}`,
      dest: point(),
      mode: pick(modes),
      // real-valued max close to typical commute values -> ties on t[i] > max
      max: pick([0, 5, 12.5, 20, 30, 45, 60, 90]),
    });
  // off-menu arrival times, including early morning and late evening (sparse service)
  f.arrive = pick([5, 6.25, 7.5, 8, 8.5, 9, 12.75, 18, 22.5, 23.9] as const) as Filters['arrive'];
  const thr: NoiseThreshold[] = [0, 55, 60, 65, 70];
  f.noise = { road: pick(thr), rail: pick(thr), air: pick(thr) };
  // metres taken from actual grid distances (value × 10) so `>` and `<` ties are hit
  for (const k of CAT_KEYS) {
    const d = G.dist[k];
    const mode = pick(['any', 'near', 'far'] as const);
    f.cats[k] = { mode, m: d[Math.floor(rnd() * N)]! * 10 };
  }
  const nPlaces = 1 + Math.floor(rnd() * 3);
  for (let n = 0; n < nPlaces; n++) {
    const loc = point();
    // metres equal to the km to some cell centre × 1000 (exact tie for that cell)
    const ci = Math.floor(rnd() * N);
    const c = engine.grid.cellCenter(ci);
    const dx = Math.hypot((c.lat - loc.lat) * 111.2, (c.lon - loc.lon) * 72.1) * 1000;
    f.places.push({ name: `Place ${n}`, loc, mode: pick(['near', 'far'] as const), m: dx });
  }
  // real-valued sizes around knots, and the budget put exactly on the 0.85 / 1.0 / 1.15 thresholds of one area
  f.size = pick([null, 14.2, 27, 27.0001, 59.99, 60.5, 99.5, 144.999, 145, 145.5, 333]);
  if (f.size !== null && rnd() < 0.8) {
    const areas = engine.data.areas;
    const a = areas[Math.floor(rnd() * areas.length)]!;
    const rent = f.size * proto.eurM2(a, f.size);
    f.budget = rent / pick([0.85, 1.0, 1.15]);
  } else f.budget = rnd() < 0.5 ? Math.round(500 + rnd() * 4000) : null;
  return f;
}

function compareAll(f: Filters, label: string): void {
  applyToPrototype(f);
  for (const p of f.people) {
    if (!p.dest) continue;
    const q = { lat: p.dest.lat, lon: p.dest.lon, mode: p.mode };
    const want = proto.commute(q, f.arrive);
    const got = engine.commute(q, f.arrive);
    const i = firstDiff(got, want);
    expect(i, `${label} ${p.mode} cell ${i}: core ${got[i]} vs proto ${want[i]}`).toBe(-1);
  }
  const want = proto.evaluate();
  const ev = engine.evaluate(f);
  expect(ev.checks.map((c) => [c.name, c.short])).toEqual(
    want.checks.map((c) => [c.name, c.short]),
  );
  expect(firstDiff(ev.fails, want.fails), `${label} fails`).toBe(-1);
  expect(firstDiff(ev.only, want.only), `${label} only`).toBe(-1);
  for (let i = 0; i < engine.grid.n; i++) {
    const rc = Array.from(proto.rentColour(i));
    const gc = engine.rentColour(i, ev);
    if (rc.join() !== gc.join()) expect(gc, `${label} rent cell ${i}`).toEqual(rc);
  }
  // Full summary HTML comparison: rebuild the strings the prototype prints from core numbers.
  const html = proto.summaryHtml();
  const s = engine.summary(ev);
  expect(
    html.includes(`<b>${s.fitKm2Label}</b> fit · ${s.areaCount} district`),
    `${label} fit`,
  ).toBe(true);
  for (const a of s.topAreas)
    expect(html, `${label} top ${a.name}`).toContain(
      `<li>${a.name} <span class="hint">· ${a.km2Label} · about €${a.estRent} for ${s.size} m²</span></li>`,
    );
  expect((html.match(/<li>/g) ?? []).length).toBe(s.topAreas.length);
  const maxLim = Math.max(1, ...s.blockers.map((b) => b.cells));
  for (const b of s.blockers)
    expect(html, `${label} blocker ${b.short}`).toContain(
      `<div>${b.short} · ${b.km2Label}</div><div class="bar"><i style="width:${(100 * b.cells) / maxLim}%"></i></div>`,
    );
  expect((html.match(/class="bar"/g) ?? []).length).toBe(s.blockers.length);
  // every cell's card
  const rnd = mulberry32(label.length * 7919);
  for (let k = 0; k < 400; k++) {
    const i = Math.floor(rnd() * engine.grid.n);
    const c = engine.grid.cellCenter(i);
    const w = htmlToLines(proto.popupHtml(c.lat, c.lon));
    const g = cellInfoLines(engine.cellInfo(i, f, ev));
    if (g.join('\n') !== w.join('\n')) expect(g, `${label} card cell ${i}`).toEqual(w);
  }
}

describe.each([3, 314159, 271828, 8675309, 4242])('verifier edge parity seed %i', (seed) => {
  it('matches the prototype on every compared output', () => {
    compareAll(edgyFilters(seed), `seed ${seed}`);
  });
});

describe('verifier: async path parity', () => {
  it('evaluateAsync on a fresh engine equals the prototype (seed 555)', async () => {
    const fresh = createEngine(loadLuxData());
    const f = edgyFilters(555);
    f.people = f.people.map((p) => ({ ...p, mode: 'transit' }));
    applyToPrototype(f);
    const want = proto.evaluate();
    const ev = await fresh.evaluateAsync(f, { pause: () => Promise.resolve(), chunk: 97 });
    expect(firstDiff(ev.fails, want.fails)).toBe(-1);
    expect(firstDiff(ev.only, want.only)).toBe(-1);
    for (const p of f.people) {
      const q = { lat: p.dest!.lat, lon: p.dest!.lon, mode: p.mode };
      expect(firstDiff(await fresh.commuteAsync(q, f.arrive), proto.commute(q, f.arrive))).toBe(-1);
    }
  });
});

describe('verifier: latest() at connection-exact deadlines', () => {
  it('matches when T equals a departure time and at extreme T (seed 9001)', () => {
    const rnd = mulberry32(9001);
    const { conns, stride, stops } = engine.data.transit;
    const W = stride || 5;
    const nc = conns.length / W;
    for (let k = 0; k < 30; k++) {
      const c = Math.floor(rnd() * nc);
      const T = k < 25 ? conns[c * W]! : [0, -1, 86400 * 2, 1e9, 3600.5][k - 25]!;
      const s = stops[Math.floor(rnd() * stops.length)]!;
      const want = proto.latest(s[0], s[1], T);
      const got = engine.transit.latest(s[0], s[1], T);
      const i = firstDiff(got, want);
      expect(i, `T=${T} stop ${i}: ${got[i]} vs ${want[i]}`).toBe(-1);
    }
  });
});
