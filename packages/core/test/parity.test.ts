// GOLDEN parity: the original prototipo/app.js and @wtl/core must give the same per-cell results.
import { beforeAll, describe, expect, it } from 'vitest';
import { cellInfoLines, createEngine, type Engine, type Filters } from '../src';
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
  blockers: { short: string; km2: string; width: number }[];
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
  ].map((m) => ({ short: m[1]!, km2: m[2]!, width: Number(m[3]) }));
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
    s.blockers.forEach((b, j) =>
      expect(Math.abs(b.share * 100 - want.blockers[j]!.width)).toBeLessThan(1e-9),
    );
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
      for (const S of [20, 45, 60, 99, 150]) expect(eurM2(a, S)).toBe(proto.eurM2(a, S));
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
