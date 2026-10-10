import type { Engine, EngineEvaluation, Filters, Summary } from '@wtl/core';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getEngine } from './engine';
import { filtersKey, toEngineFilters } from './filters';
import { buildCellLayer, cellFill, type CellFill, type CellLayer } from './mapFill';

const DEBOUNCE_MS = 300;

export interface Results {
  ev: EngineEvaluation;
  summary: Summary;
  fill: CellFill;
}

export interface EvaluationState {
  engine: Engine | null;
  layer: CellLayer | null;
  results: Results | null;
  /** True from a filter change until its evaluation is on screen. */
  computing: boolean;
  /** Message of the last failed evaluation (for logs; the UI shows a generic line). */
  error: string | null;
}

/**
 * Runs the engine on the JS thread without blocking it: filter changes are debounced, the previous run is
 * aborted, and evaluateAsync() yields between work chunks so touches and renders go through meanwhile.
 */
export function useEvaluation(filters: Filters | null): EvaluationState {
  const [engine, setEngine] = useState<Engine | null>(null);
  const [layer, setLayer] = useState<CellLayer | null>(null);
  const [results, setResults] = useState<Results | null>(null);
  const [computing, setComputing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  // Create the engine and the cell polygons after the first frame (outside render), then build the transit stop
  // index in the background. A failure here shows "Could not calculate" instead of calculating forever.
  useEffect(() => {
    const t = setTimeout(() => {
      let e: Engine;
      let l: CellLayer;
      try {
        e = getEngine();
        const t0 = Date.now();
        l = buildCellLayer(e.data.grid, e.grid);
        if (__DEV__) console.log(`[wtl] ${l.cells.length} cell polygons in ${Date.now() - t0} ms`);
      } catch (err) {
        if (__DEV__) console.warn('[wtl] engine start failed', err);
        setError(err instanceof Error ? err.message : String(err));
        setComputing(false);
        return;
      }
      setEngine(e);
      setLayer(l);
      const t0 = Date.now();
      e.precomputeAsync()
        .then(() => {
          if (__DEV__) console.log(`[wtl] stop index ready in ${Date.now() - t0} ms`);
        })
        .catch(() => {});
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const key = useMemo(() => (filters ? filtersKey(filters) : null), [filters]);

  useEffect(() => {
    if (!engine || !layer || !filters || key === null) return;
    setComputing(true);
    const timer = setTimeout(() => {
      abort.current?.abort();
      const ctrl = new AbortController();
      abort.current = ctrl;
      const f = toEngineFilters(filters);
      const t0 = Date.now();
      engine
        .evaluateAsync(f, { signal: ctrl.signal })
        .then((ev) => {
          if (ctrl.signal.aborted) return;
          const t1 = Date.now();
          const summary = engine.summary(ev);
          const fill = cellFill(engine.data.grid, engine.data.areas, layer.cells, ev);
          if (__DEV__)
            console.log(
              `[wtl] evaluate ${t1 - t0} ms, summary + fill ${Date.now() - t1} ms, ${ev.checks.length} checks`,
            );
          setResults({ ev, summary, fill });
          setError(null);
          setComputing(false);
        })
        .catch((e: unknown) => {
          if (ctrl.signal.aborted) return;
          if (__DEV__) console.warn('[wtl] evaluation failed', e);
          setError(e instanceof Error ? e.message : String(e));
          setComputing(false);
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      // The filters changed: a run still going is for old filters, so it must not land on screen.
      abort.current?.abort();
    };
    // `key` captures everything in `filters` that the engine reads, so `filters` itself is not a dependency.
  }, [engine, layer, key]);

  useEffect(() => () => abort.current?.abort(), []);

  return { engine, layer, results, computing, error };
}
