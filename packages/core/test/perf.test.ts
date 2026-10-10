// Reports timings only; never fails on speed. Target: < 1 s in Node.
import { expect, it } from 'vitest';
import { createEngine, exampleFilters } from '../src';
import { loadLuxData } from './data';

const ms = (t0: number): string => `${(performance.now() - t0).toFixed(0)} ms`;

it('perf: engine setup, transit commute, evaluate (example)', () => {
  const data = loadLuxData();
  let t = performance.now();
  const engine = createEngine(data);
  const setup = ms(t);

  const f = exampleFilters();
  const p1 = f.people[0]!.dest!;
  t = performance.now();
  engine.commute({ lat: p1.lat, lon: p1.lon, mode: 'transit' }, f.arrive);
  const firstCommute = ms(t); // includes lazy buildCellStops + footpaths

  const p2 = f.people[1]!.dest!;
  t = performance.now();
  engine.commute({ lat: p2.lat, lon: p2.lon, mode: 'transit' }, f.arrive);
  const warmCommute = ms(t);

  const fresh = createEngine(data);
  t = performance.now();
  const ev = fresh.evaluate(f);
  const coldEvaluate = ms(t);

  t = performance.now();
  fresh.evaluate(f);
  const cachedEvaluate = ms(t);

  t = performance.now();
  const s = fresh.summary(ev);
  fresh.paint(ev);
  const summaryPaint = ms(t);

  console.log(
    [
      `[perf] createEngine: ${setup}`,
      `[perf] commute PT, first (incl. stop index): ${firstCommute}`,
      `[perf] commute PT, warm index: ${warmCommute}`,
      `[perf] evaluate(example), cold (2 PT commutes): ${coldEvaluate}`,
      `[perf] evaluate(example), cached commutes: ${cachedEvaluate}`,
      `[perf] summary + paint: ${summaryPaint}`,
      `[perf] example fits ${s.fitKm2Label} in ${s.areaCount} areas`,
    ].join('\n'),
  );
  expect(ev.fails.length).toBe(fresh.grid.n);
});
