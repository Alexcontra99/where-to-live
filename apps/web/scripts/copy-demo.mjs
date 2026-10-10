// Copies the Luxembourg prototype into public/demo so it ships at /demo/.
// public/demo is git-ignored: prototipo/ stays the single source.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, '../../../prototipo');
const dest = resolve(here, '../public/demo');
const files = ['index.html', 'app.js', 'style.css'];

if (!existsSync(join(src, 'index.html'))) {
  console.error(`copy-demo: prototype not found at ${src}`);
  process.exit(1);
}

rmSync(dest, { recursive: true, force: true });
mkdirSync(join(dest, 'data'), { recursive: true });
for (const file of files) cpSync(join(src, file), join(dest, file));
for (const file of readdirSync(join(src, 'data')).filter((f) => f.endsWith('.js'))) {
  cpSync(join(src, 'data', file), join(dest, 'data', file));
}
console.log(`copy-demo: prototype copied to ${dest}`);
