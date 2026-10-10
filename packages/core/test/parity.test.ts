// GOLDEN parity: the original prototipo/app.js and @wtl/core must give the same per-cell results.
import { beforeAll, describe, expect, it } from 'vitest';
import {
  areaRentColour,
  cellInfoLines,
  createEngine,
  defaultFilters,
  eurM2,
  RENT_M2,
  type Engine,
  type Filters,
} from '../src';
import { loadLuxData } from './data';
import { htmlToLines, loadPrototype, type Prototype } from './prototype';
import { SCENARIOS } from './scenarios';

let proto: Prototype;
let engine: Engine;

beforeAll(() => {
  proto = loadPrototype();
  engine = createEngine(loadLuxData());
});

/** Copy the filters into the prototype's `state` (objects created in this realm are fine for app.js). */
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

/** First index where two numeric arrays differ (Object.is), or -1. */
function firstDiff(a: ArrayLike<number>, b: ArrayLike<number>): number {
  if (a.length !== b.length) return 0;
  for (let i = 0; i < a.length; i++) if (!Object.is(a[i], b[i])) return i;
  return -1;
}

interface ParsedSummary {
  fit: string;
  areaCount: number;
  top: { name: string; km2: string; est: number; size: number }[];
  blockers: { short: string; km2: string; width: string }[];
  nothingFits: boolean;
}

function parseSummary(html: string): ParsedSummary {
  const fit = /<b>(.*?)<\/b> fit · (\d+) district/.exec(html);
  const top = [
    ...html.matchAll(
      /<li>(.*?) <span class="hint">· (.*?) · about €(-?\d+) for (\d+) m²<\/span><\/li>/g,
    ),
  ].map((m) => ({ name: m[1]!, km2: m[2]!, est: Number(m[3]), size: Number(m[4]) }));
  const blockers = [
    ...html.matchAll(
      /<div>([^<]*?) · (.*?)<\/div><div class="bar"><i style="width:([^%]*)%"><\/i><\/div>/g,
    ),
  ].map((m) => ({ short: m[1]!, km2: m[2]!, width: m[3]! }));
  return {
    fit: fit?.[1] ?? '',
    areaCount: Number(fit?.[2] ?? -1),
    top,
    blockers,
    nothingFits: html.includes('Nothing fits all filters.'),
  };
}

describe.each(Object.entries(SCENARIOS))('parity: %s', (_name, filters) => {
  it('commute minutes per cell are bit-identical', () => {
    applyToPrototype(filters);
    for (const p of filters.people) {
      if (!p.dest) continue;
      const q = { lat: p.dest.lat, lon: p.dest.lon, mode: p.mode };
      const want = proto.commute(q, filters.arrive);
      const got = engine.commute(q, filters.arrive);
      const i = firstDiff(got, want);
      expect(i, `cell ${i}: core ${got[i]} vs prototype ${want[i]}`).toBe(-1);
    }
  });

  it('checks, fails and "only" per cell are identical', () => {
    applyToPrototype(filters);
    const want = proto.evaluate();
    const got = engine.evaluate(filters);
    expect(got.checks.map((c) => [c.name, c.short])).toEqual(
      want.checks.map((c) => [c.name, c.short]),
    );
    expect(firstDiff(got.fails, want.fails)).toBe(-1);
    expect(firstDiff(got.only, want.only)).toBe(-1);
  });

  it('rent colour per cell is identical', () => {
    applyToPrototype(filters);
    proto.evaluate(); // rent alpha depends on the last evaluation
    const ev = engine.evaluate(filters);
    for (let i = 0; i < engine.grid.n; i++) {
      const want = Array.from(proto.rentColour(i));
      const got = engine.rentColour(i, ev);
      if (got.join() !== want.join()) expect(got, `cell ${i}`).toEqual(want);
    }
  });

  it('summary (km² fit, areas, top areas with rent, blockers) is identical', () => {
    applyToPrototype(filters);
    proto.evaluate();
    const html = proto.summaryHtml();
    const want = parseSummary(html);
    const s = engine.summary(engine.evaluate(filters));
    expect(s.fitKm2Label).toBe(want.fit);
    expect(s.areaCount).toBe(want.areaCount);
    expect(s.topAreas.length === 0).toBe(want.nothingFits);
    expect(
      s.topAreas.map((a) => ({ name: a.name, km2: a.km2Label, est: a.estRent, size: s.size })),
    ).toEqual(want.top);
    expect(s.blockers.length > 0).toBe(html.includes('What blocks the grey areas'));
    expect(s.blockers.map((b) => b.short)).toEqual(want.blockers.map((b) => b.short));
    expect(s.blockers.map((b) => b.km2Label)).toEqual(want.blockers.map((b) => b.km2));
    // Bar width exactly as app.js prints it (100 * cells / max), and share as its ratio.
    const maxLim = Math.max(1, ...s.blockers.map((b) => b.cells));
    expect(s.blockers.map((b) => String((100 * b.cells) / maxLim))).toEqual(
      want.blockers.map((b) => b.width),
    );
    s.blockers.forEach((b) => expect(b.share).toBe(b.cells / maxLim));
    if (s.topBlocker) {
      const maxCells = Math.max(...s.blockers.map((b) => b.cells));
      expect(s.topBlocker.cells).toBe(maxCells);
      expect(s.topBlocker.share).toBe(1);
    }
  });

  it('cell card text matches the prototype popup', () => {
    applyToPrototype(filters);
    proto.evaluate();
    const ev = engine.evaluate(filters);
    const { grid } = engine;
    for (let i = 0; i < grid.n; i += 37) {
      const c = grid.cellCenter(i);
      const want = htmlToLines(proto.popupHtml(c.lat, c.lon));
      const got = cellInfoLines(engine.cellInfo(i, filters, ev));
      if (got.join('\n') !== want.join('\n')) expect(got, `cell ${i}`).toEqual(want);
    }
  });
});

describe('parity: helpers', () => {
  it('fSize, monoTotal, eurM2 match for 10..200 m²', async () => {
    const { fSize, monoTotal, eurM2 } = await import('../src');
    const areas = engine.data.areas;
    for (let S = 10; S <= 200; S += 0.5) {
      expect(fSize(S)).toBe(proto.fSize(S));
      expect(monoTotal(S)).toBe(proto.monoTotal(S));
    }
    for (const a of areas)
      for (let S = 10; S <= 200; S += 0.5) {
        const got = eurM2(a, S);
        const want = proto.eurM2(a, S);
        if (!Object.is(got, want)) expect(got, `${a.name} ${S} m²`).toBe(want);
      }
  });

  it('rent colour by €/m² matches at the exact band edges (synthetic areas)', () => {
    // Real areas never land exactly on 33 / 35 / 37 / 40 €/m², so the `<` in RENT_M2.find is untested by them.
    // Search price levels L whose eurM2 equals an edge bit for bit, and check both sides of the comparison.
    const ties: { L: number; S: number; edge: number }[] = [];
    for (const [edge] of RENT_M2.slice(0, -1))
      for (const S of [27, 45, 60, 99.5, 150]) {
        const base = eurM2({ L: 0.879 }, S);
        const L0 = 0.879 * (edge / base) ** 2;
        const f64 = new Float64Array(1);
        const u64 = new BigUint64Array(f64.buffer);
        f64[0] = L0;
        const bits = u64[0]!;
        for (let d = -64n; d <= 64n; d++) {
          u64[0] = bits + d;
          const L = f64[0]!;
          if (eurM2({ L }, S) === edge) {
            ties.push({ L, S, edge });
            break;
          }
        }
      }
    expect(ties.length).toBeGreaterThanOrEqual(4);
    const k = proto.AREAS.length;
    const cell = proto.G.area.findIndex((a) => a >= 0);
    const saved = proto.G.area[cell]!;
    try {
      for (const { L, S, edge } of ties) {
        const area = {
          name: 'Synthetic',
          kind: 'district',
          eur_m2: edge,
          offers: null,
          avg_rent: null,
          estimated: false,
          L,
          L_default: false,
        };
        proto.AREAS.push(area);
        proto.G.area[cell] = k;
        applyToPrototype({ ...defaultFilters(), size: S, budget: null });
        const filtered = proto.evaluate().checks.length > 0;
        const want = Array.from(proto.rentColour(cell));
        const got = areaRentColour(area, { budget: null, size: S }, filtered);
        expect(got, `L=${L} S=${S} €/m²=${edge}`).toEqual(want);
        // At the edge the cell belongs to the next band up.
        const j = RENT_M2.findIndex(([t]) => t === edge);
        expect(got.slice(0, 3)).toEqual([...RENT_M2[j + 1]![1]]);
        proto.AREAS.pop();
      }
    } finally {
      proto.G.area[cell] = saved;
      while (proto.AREAS.length > k) proto.AREAS.pop();
    }
  });

  it('cellAt and latest() match on real data', () => {
    for (const [lat, lon] of [
      [49.6, 6.1],
      [49.55, 6.03],
      [49.7, 6.28],
      [49.0, 6.0],
    ] as const)
      expect(engine.grid.cellAt(lat, lon)).toBe(proto.cellAt(lat, lon));
    const want = proto.latest(49.6261, 6.161, 8.5 * 3600);
    const got = engine.transit.latest(49.6261, 6.161, 8.5 * 3600);
    expect(firstDiff(got, want)).toBe(-1);
  });
});
