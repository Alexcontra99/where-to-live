// Converts the prototype's data/*.js ("window.X=<json>;") into plain JSON for the apps.
// Run from anywhere: `pnpm --filter @wtl/data-lux convert`. No dependencies.
import { readFileSync, writeFileSync, statSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '..', '..', '..', 'prototipo', 'data');
const out = join(here, '..', 'data');
mkdirSync(out, { recursive: true });

const FILES = { grid: 'GRID', areas: 'AREAS', pois: 'POIS', transit: 'TRANSIT' };
const meta = { generated_from: 'prototipo/data', files: {} };

for (const [name, global] of Object.entries(FILES)) {
  const path = join(src, `${name}.js`);
  const text = readFileSync(path, 'utf8').trim();
  const prefix = `window.${global}=`;
  if (!text.startsWith(prefix)) throw new Error(`${path}: expected to start with "${prefix}"`);
  const json = text.slice(prefix.length).replace(/;$/, '');
  JSON.parse(json); // validate
  writeFileSync(join(out, `${name}.json`), json);
  meta.files[name] = {
    source: `prototipo/data/${name}.js`,
    source_bytes: statSync(path).size,
    json_bytes: Buffer.byteLength(json),
  };
  console.log(`${name}.json  ${(Buffer.byteLength(json) / 1024).toFixed(0)} KiB`);
}

const manifestPath = join(src, 'manifest.json');
if (existsSync(manifestPath)) {
  const m = JSON.parse(readFileSync(manifestPath, 'utf8'));
  meta.built = m.built ?? null;
  meta.region = m.region ?? null;
  meta.step_km = m.step_km ?? null;
  meta.sources = Object.fromEntries(
    Object.entries(m.sources ?? {}).map(([k, v]) => [
      k,
      { url: v.url, last_modified: v.last_modified ?? null, downloaded: v.downloaded ?? null },
    ]),
  );
}
meta.transit_day = JSON.parse(readFileSync(join(out, 'transit.json'), 'utf8')).day ?? null;
writeFileSync(join(out, 'meta.json'), JSON.stringify(meta, null, 1) + '\n');
console.log('meta.json');
