// Loads @wtl/data-lux JSON through the package exports (as an app would), without making tsc infer the big JSON.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import type { Area, Grid, LuxData, Poi, Transit } from '@wtl/data-lux';

const require = createRequire(import.meta.url);
const load = <T>(name: string): T =>
  JSON.parse(readFileSync(require.resolve(`@wtl/data-lux/${name}.json`), 'utf8')) as T;

let cached: LuxData | null = null;
export function loadLuxData(): LuxData {
  return (cached ??= {
    grid: load<Grid>('grid'),
    areas: load<Area[]>('areas'),
    pois: load<Poi[]>('pois'),
    transit: load<Transit>('transit'),
  });
}
