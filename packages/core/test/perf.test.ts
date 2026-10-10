// Reports timings; fails only on a loose budget (10x the Node targets) so a big regression breaks CI.
// Node has a JIT and Hermes does not: on a device expect several times these numbers, which is why the
// async API exists. The "longest slice" is the longest stretch the async path holds the thread.
import { expect, it } from 'vitest';
import { createEngine, exampleFilters } from '../src';
import { loadLuxData } from './data';

const ms = (t0: number): string => `${(performance.now() - t0).toFixed(0)} ms`;

it('perf: engine setup, transit commute, evaluate (example)', () => {
  const t0All = performance.now();
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
  expect(performance.now() - t0All).toBeLessThan(15_000);
});

it('perf: async evaluate keeps every blocking slice short', async () => {
  const data = loadLuxData();
  const engine = createEngine(data);
  let last = performance.now();
  let longest = 0;
  let slices = 0;
  const pause = async (): Promise<void> => {
    const now = performance.now();
    longest = Math.max(longest, now - last);
    slices++;
    await Promise.resolve();
    last = performance.now();
  };
  const t = performance.now();
  await engine.evaluateAsync(exampleFilters(), { pause, chunk: 500 });
  longest = Math.max(longest, performance.now() - last);
  console.log(
    `[perf] evaluateAsync(example), cold: ${ms(t)} in ${slices + 1} slices, longest slice ${longest.toFixed(0)} ms`,
  );
  // One reverse connection scan (~3 ms in Node) or 500 cells of the stop index per slice.
  expect(longest).toBeLessThan(500);
});
