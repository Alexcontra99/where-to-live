// The Luxembourg dataset and the engine, created once on first use.
import { createEngine, type Engine } from '@wtl/core';
import type { LuxData } from '@wtl/data-lux';
import areas from '@wtl/data-lux/areas.json';
import grid from '@wtl/data-lux/grid.json';
import meta from '@wtl/data-lux/meta.json';
import pois from '@wtl/data-lux/pois.json';
import transit from '@wtl/data-lux/transit.json';

export const data: LuxData = { grid, areas, pois, transit };
export { meta };

let engine: Engine | null = null;
export function getEngine(): Engine {
  if (!engine) {
    const t0 = Date.now();
    engine = createEngine(data);
    if (__DEV__) console.log(`[wtl] engine created in ${Date.now() - t0} ms`);
  }
  return engine;
}
