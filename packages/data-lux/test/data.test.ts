// The JSON in data/ must stay a byte-for-byte copy of the prototype's data/*.js payloads (scripts/convert.mjs),
// and the transit connections must keep the order the reverse connection scan relies on.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { Grid, Meta, Transit } from '../src';

const here = dirname(fileURLToPath(import.meta.url));
const proto = join(here, '..', '..', '..', 'prototipo', 'data');
const data = join(here, '..', 'data');
const FILES = { grid: 'GRID', areas: 'AREAS', pois: 'POIS', transit: 'TRANSIT' } as const;

const payload = (name: string, global: string): string => {
  const text = readFileSync(join(proto, `${name}.js`), 'utf8').trim();
  const prefix = `window.${global}=`;
  expect(text.startsWith(prefix), `${name}.js starts with ${prefix}`).toBe(true);
  return text.slice(prefix.length).replace(/;$/, '');
};
const json = (name: string): string => readFileSync(join(data, `${name}.json`), 'utf8');

describe('data-lux is in sync with prototipo/data', () => {
  it.each(Object.entries(FILES))('%s.json equals the payload of %s', (name, global) => {
    const want = payload(name, global);
    const got = json(name);
    expect(got.length).toBe(want.length);
    expect(got === want, `${name}.json differs: run pnpm --filter @wtl/data-lux convert`).toBe(
      true,
    );
  });

  it('meta.json records the converted sizes', () => {
    const meta = JSON.parse(json('meta')) as Meta;
    for (const name of Object.keys(FILES))
      expect(meta.files[name]!.json_bytes).toBe(Buffer.byteLength(json(name)));
    expect(meta.transit_day).toBe((JSON.parse(json('transit')) as Transit).day);
  });
});

describe('transit.json shape', () => {
  const tr = JSON.parse(json('transit')) as Transit;
  const W = tr.stride || 5;

  it('has whole connections that reference real stops', () => {
    expect(tr.conns.length % W).toBe(0);
    const NS = tr.stops.length;
    for (let o = 0; o < tr.conns.length; o += W) {
      const [dep, arr, a, b] = tr.conns.slice(o, o + 4) as [number, number, number, number];
      if (!(arr >= dep && a >= 0 && a < NS && b >= 0 && b < NS))
        expect({ k: o / W, dep, arr, a, b }).toBe('a valid connection');
    }
  });

  it('is sorted by departure, latest first', () => {
    for (let o = W; o < tr.conns.length; o += W)
      if (tr.conns[o]! > tr.conns[o - W]!)
        expect(`connection ${o / W} departs ${tr.conns[o]} after ${tr.conns[o - W]}`).toBe('');
  });
});

describe('grid.json shape', () => {
  it('has one value per cell in every per-cell layer', () => {
    const G = JSON.parse(json('grid')) as Grid;
    const N = G.rows * G.cols;
    for (const k of ['area', 'noise_road', 'noise_rail', 'noise_air', 'noise_cov'] as const)
      expect(G[k].length, k).toBe(N);
    for (const [k, v] of Object.entries(G.dist)) expect(v.length, `dist.${k}`).toBe(N);
  });
});
