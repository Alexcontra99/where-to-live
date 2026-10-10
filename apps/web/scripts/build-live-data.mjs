// Builds public/live/luxembourg.json, the data behind the live map on the landing.
// It runs the prototype's own code (prototipo/app.js) in a sandbox, so commute times and rent
// estimates come from exactly the same algorithm and data as the demo; nothing is re-implemented here.
// public/live is git-ignored: prototipo/ stays the single source.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, '../../../prototipo');
const out = resolve(here, '../public/live/luxembourg.json');

// The prototype's example: two people commuting by public transport, arriving around 8:30.
const PEOPLE = [
  { id: 'kirchberg', lat: 49.6261, lon: 6.161 },
  { id: 'centre', lat: 49.6109, lon: 6.1262 },
];
const ARRIVE = 8.5;
const SIZES = [40, 60, 90];
const CATS = ['supermarket', 'park', 'school', 'nursery', 'pharmacy', 'nightlife'];

// A do-nothing stand-in for the DOM and Leaflet: every property is itself, every call returns itself,
// and iterating it (querySelectorAll) yields a few more of it.
const stub = new Proxy(function () {}, {
  get: (_t, key) =>
    key === Symbol.toPrimitive ? () => 0
    : key === Symbol.iterator ? function* () { yield stub; yield stub; yield stub; }
    : key === 'then' ? undefined
    : stub,
  set: () => true,
  apply: () => stub,
  construct: () => stub,
});

const ctx = vm.createContext({ document: stub, L: stub, innerWidth: 1280, setTimeout, clearTimeout, console });
ctx.window = ctx;
for (const file of ['data/grid.js', 'data/areas.js', 'data/pois.js', 'data/transit.js', 'app.js']) {
  vm.runInContext(readFileSync(join(src, file), 'utf8'), ctx, { filename: file });
}
const run = (code) => vm.runInContext(code, ctx);

const G = run('GRID');
const N = G.rows * G.cols;
const u8 = (arr, scale = 1) => {
  const b = new Uint8Array(N);
  for (let i = 0; i < N; i++) b[i] = Math.max(0, Math.min(255, Math.round(arr[i] * scale)));
  return Buffer.from(b).toString('base64');
};

const commute = {};
for (const p of PEOPLE) {
  const t = run(`commute({ lat: ${p.lat}, lon: ${p.lon}, mode: 'transit' }, ${ARRIVE})`);
  if (!t || t.length !== N) throw new Error(`build-live-data: commute for ${p.id} failed`);
  commute[p.id] = u8(t);
}

const areas = run(`AREAS.map((a) => ({
  name: a.name,
  kind: a.kind,
  rent: a.L ? [${SIZES}].map((s) => Math.round(s * eurM2(a, s))) : null,
}))`);

const pois = {};
for (const [lat, lon, cat] of run('POIS')) {
  if (!CATS.includes(cat)) continue;
  (pois[cat] ||= []).push([+lat.toFixed(5), +lon.toFixed(5)]);
}

const data = {
  built: G.built,
  grid: { lat0: G.lat0, lon0: G.lon0, dlat: G.dlat, dlon: G.dlon, rows: G.rows, cols: G.cols },
  // area index + 1 so that 0 means "outside the covered map"
  area: u8(Array.from(G.area, (a) => a + 1)),
  areas,
  sizes: SIZES,
  people: PEOPLE,
  arrive: ARRIVE,
  commute,
  noise: { road: u8(G.noise_road), rail: u8(G.noise_rail), air: u8(G.noise_air), airNight: u8(G.noise_air_night), cov: u8(G.noise_cov) },
  // distance to the nearest place of each kind, in tens of metres as in the prototype, capped at 255 (2.55 km)
  dist: Object.fromEntries(CATS.map((c) => [c, u8(G.dist[c])])),
  pois,
};

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(data));
console.log(`build-live-data: wrote ${out} (${Math.round(JSON.stringify(data).length / 1024)} KB)`);
