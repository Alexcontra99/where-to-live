// One engine and one example evaluation shared by the tests (the transit commutes take a few seconds).
import { createEngine, exampleFilters, type Engine, type EngineEvaluation } from '@wtl/core';
import type { LuxData } from '@wtl/data-lux';
import areas from '@wtl/data-lux/areas.json';
import grid from '@wtl/data-lux/grid.json';
import transit from '@wtl/data-lux/transit.json';
import { toEngineFilters } from '../src/lib/filters';

const data: LuxData = { grid, areas, transit };

let engine: Engine | null = null;
export const getTestEngine = (): Engine => (engine ??= createEngine(data));

let example: EngineEvaluation | null = null;
/** The "Load an example" filters, through the UI adapter, evaluated by the engine. */
export const exampleEvaluation = (): EngineEvaluation =>
  (example ??= getTestEngine().evaluate(toEngineFilters(exampleFilters())));
