// Runs the ORIGINAL prototipo/app.js (unmodified) in a node:vm context with stubbed window/document/Leaflet,
// so tests can drive its `state` and compare its results with @wtl/core.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));
export const PROTO_DIR = join(here, '..', '..', '..', 'prototipo');

/** A do-nothing object: any property is another stub, calls return a stub, writes are recorded. */
function stub(record: Record<PropertyKey, unknown> = {}): unknown {
  const target = function () {} as unknown as Record<PropertyKey, unknown>;
  const p: unknown = new Proxy(target, {
    get(_t, k) {
      if (k in record) return record[k];
      if (k === Symbol.toPrimitive) return () => 0;
      if (k === Symbol.iterator)
        return function* () {
          yield stub();
          yield stub();
          yield stub();
        };
      if (k === 'then') return undefined;
      return stub();
    },
    set(_t, k, v) {
      record[k] = v;
      return true;
    },
    apply() {
      return stub();
    },
  });
  return p;
}

export interface ProtoState {
  people: {
    label: string;
    dest: { lat: number; lon: number; label?: string } | null;
    mode: string;
    max: number;
  }[];
  arrive: number;
  budget: number | null;
  size: number | null;
  noise: Record<string, number>;
  cats: Record<string, { mode: string; m: number }>;
  places: {
    name: string;
    loc: { lat: number; lon: number; label?: string } | null;
    mode: string;
    m: number;
  }[];
}

export interface ProtoCheck {
  name: string;
  short: string;
  fail(i: number): boolean;
}

export interface Prototype {
  state: ProtoState;
  N: number;
  CELL_KM2: number;
  evaluate(): { checks: ProtoCheck[]; fails: Uint8Array; only: Int16Array };
  commute(p: { lat: number; lon: number; mode: string }, arriveH: number): Float32Array;
  rentColour(i: number): number[];
  fSize(S: number): number;
  monoTotal(S: number): number;
  eurM2(a: { L: number | null }, S: number): number;
  km(a1: number, o1: number, a2: number, o2: number): number;
  cellAt(lat: number, lon: number): number;
  latest(dla: number, dlo: number, T: number): Float64Array;
  /** Runs app.js summary() and returns the HTML it wrote into #summary. */
  summaryHtml(): string;
  /** Simulates a map click on a cell centre and returns the popup HTML. */
  popupHtml(lat: number, lon: number): string;
  /** Runs app.js draw() (evaluate + canvas fill) and returns the RGBA bytes it passed to putImageData. */
  drawImage(): Uint8ClampedArray;
  /** The prototype's own grid and areas (mutable: tests may add synthetic areas). */
  G: { area: number[]; rows: number; cols: number };
  AREAS: { L: number | null; name: string; kind: string; eur_m2: number | null }[];
}

export function loadPrototype(): Prototype {
  const elements = new Map<string, Record<PropertyKey, unknown>>();
  const el = (id: string) => {
    let r = elements.get(id);
    if (!r) elements.set(id, (r = {}));
    return stub(r);
  };
  // A canvas whose 2D context hands out real ImageData buffers and records what draw() puts back.
  let painted: Uint8ClampedArray | null = null;
  const canvas = () => {
    const ctx = stub({
      createImageData: (w: number, h: number) => ({
        width: w,
        height: h,
        data: new Uint8ClampedArray(w * h * 4),
      }),
      putImageData: (img: { data: Uint8ClampedArray }) => {
        painted = img.data;
      },
    });
    return stub({ getContext: () => ctx, toDataURL: () => 'data:,' });
  };
  const document = stub({
    getElementById: el,
    createElement: (tag: string) => (tag === 'canvas' ? canvas() : stub()),
    querySelectorAll: () => [],
  });
  let clickHandler: ((e: unknown) => void) | null = null;
  let popupContent = '';
  const mapRecord: Record<PropertyKey, unknown> = {
    on: (ev: string, fn: (e: unknown) => void) => {
      if (ev === 'click') clickHandler = fn;
    },
  };
  const popup = () => {
    const r: Record<PropertyKey, unknown> = {};
    const p = stub(r);
    r.setLatLng = () => p;
    r.setContent = (html: string) => {
      popupContent = html;
      return p;
    };
    r.openOn = () => p;
    return p;
  };
  const mapStub = stub(mapRecord);
  mapRecord.setView = () => mapStub; // app.js keeps L.map(...).setView(...) as `map`
  const L = stub({ map: () => mapStub, popup });
  const window = stub({ innerWidth: 1280 }) as Record<string, unknown>;
  const ctx = vm.createContext({ window, document, L, console, setTimeout, clearTimeout });
  for (const name of ['grid', 'areas', 'pois', 'transit'])
    vm.runInContext(readFileSync(join(PROTO_DIR, 'data', `${name}.js`), 'utf8'), ctx, {
      filename: `${name}.js`,
    });
  // data/*.js assign window.X; app.js reads window.X, which the stub returns from its record.
  vm.runInContext(readFileSync(join(PROTO_DIR, 'app.js'), 'utf8'), ctx, { filename: 'app.js' });
  // Top-level const/let/function of app.js live in the context's global lexical scope: expose them.
  const api = vm.runInContext(
    `({ state, N, CELL_KM2, evaluate, commute, rentColour, fSize, monoTotal, eurM2, km, cellAt, latest, summary, draw, G, AREAS })`,
    ctx,
  ) as Omit<Prototype, 'summaryHtml' | 'popupHtml' | 'drawImage'> & {
    summary(): void;
    draw(): void;
  };
  return {
    ...api,
    summaryHtml() {
      api.summary();
      return String(elements.get('summary')?.innerHTML ?? '');
    },
    drawImage() {
      painted = null;
      api.draw();
      if (!painted) throw new Error('app.js draw() did not call putImageData');
      return painted;
    },
    popupHtml(lat, lon) {
      popupContent = '';
      clickHandler!({ latlng: { lat, lng: lon } });
      return popupContent;
    },
  };
}

/** Popup HTML → plain lines (same shape as cellInfoLines). */
export const htmlToLines = (html: string): string[] =>
  html
    .split('<br>')
    .map((s) => s.replace(/<[^>]+>/g, '').trim())
    .filter(Boolean);
