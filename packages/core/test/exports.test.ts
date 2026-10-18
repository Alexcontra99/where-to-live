// The JSON subpath exports resolve (as Metro / bundlers will import them) and are typed by @wtl/data-lux.
import { expect, it } from 'vitest';
import areas from '@wtl/data-lux/areas.json';
import grid from '@wtl/data-lux/grid.json';
import meta from '@wtl/data-lux/meta.json';
import transit from '@wtl/data-lux/transit.json';
import { createEngine } from '../src';

it('imports the dataset through package exports', () => {
  expect(grid.area.length).toBe(grid.rows * grid.cols);
  expect(areas.length).toBeGreaterThan(0);
  expect(meta.transit_day).toBe(transit.day);
  const engine = createEngine({ grid, areas, transit });
  expect(engine.grid.cellAt(49.6116, 6.1319)).toBeGreaterThanOrEqual(0);
});
