import type { Area, Grid } from '@wtl/data-lux';
import { CATS, MODES, NOISE, shortLabel, type CatKey, type Mode, type NoiseKey } from './constants';
import type { CommuteFn, Evaluation } from './evaluate';
import type { Filters } from './filters';
import { fmtM, noiseWord } from './format';
import { estRent, refSize } from './rent';

export interface CellInfo {
  cell: number;
  /** null = outside the covered area ("Outside Luxembourg: not covered yet."). */
  area: { index: number; name: string; kind: string } | null;
  /** Estimated asking rent for `size` m² with a ±10 % range; null when the area has no published rent. */
  rent: { size: number; eur: number; low: number; high: number } | null;
  /** Minutes per person with a destination, rounded. */
  commutes: { label: string; mode: Mode; modeLabel: string; minutes: number }[];
  noise: { key: NoiseKey; label: string; db: number; words: string }[];
  /** Aircraft Lnight band when ≥ 45 dB, else null. */
  airNight: number | null;
  /** Nearest place per category, in metres (from the 10 m grid distances). */
  nearest: { key: CatKey; label: string; metres: number; text: string }[];
  /** null when no filter is active; otherwise the failing checks (empty = fits all). */
  checks: { fits: boolean; failed: { check: number; name: string }[] } | null;
}

/** Data for the tap card on a cell (app.js map click popup). */
export function cellInfo(
  G: Grid,
  areas: Area[],
  i: number,
  f: Filters,
  ev: Evaluation | null,
  commute: CommuteFn,
): CellInfo {
  const ai = G.area[i]!;
  const area = areas[ai];
  const empty: CellInfo = {
    cell: i,
    area: null,
    rent: null,
    commutes: [],
    noise: [],
    airNight: null,
    nearest: [],
    checks: null,
  };
  if (!area) return empty;
  let rent: CellInfo['rent'] = null;
  if (area.eur_m2) {
    const S = refSize(f.size);
    const r = estRent(area, S);
    rent = { size: S, eur: Math.round(r), low: Math.round(r * 0.9), high: Math.round(r * 1.1) };
  }
  const commutes: CellInfo['commutes'] = [];
  f.people.forEach((p, n) => {
    if (!p.dest) return;
    const t = commute({ lat: p.dest.lat, lon: p.dest.lon, mode: p.mode }, f.arrive);
    commutes.push({
      label: p.label ?? `Person ${n + 1}`,
      mode: p.mode,
      modeLabel: MODES.find((m) => m[0] === p.mode)![1],
      minutes: Math.round(t[i]!),
    });
  });
  const cov = G.noise_cov[i]!;
  const noise = NOISE.map(([k, label]) => {
    const db = G[`noise_${k}` as const][i]!;
    return { key: k, label, db, words: noiseWord(db, cov) };
  });
  const night = G.noise_air_night?.[i];
  const nearest = CATS.map(([k, label]) => {
    const metres = G.dist[k][i]! * 10;
    return { key: k, label: shortLabel(label), metres, text: fmtM(metres) };
  });
  let checks: CellInfo['checks'] = null;
  if (ev && ev.checks.length) {
    const failed = ev.checks
      .map((ch, j) => ({ check: j, name: ch.name, fails: ch.fail(i) }))
      .filter((c) => c.fails)
      .map(({ check, name }) => ({ check, name }));
    checks = { fits: failed.length === 0, failed };
  }
  return {
    cell: i,
    area: { index: ai, name: area.name, kind: area.kind },
    rent,
    commutes,
    noise,
    airNight: night !== undefined && night >= 45 ? night : null,
    nearest,
    checks,
  };
}

/** Plain-text lines of the cell card, same wording as the prototype popup (no HTML). */
export function cellInfoLines(c: CellInfo): string[] {
  if (!c.area) return ['Outside Luxembourg: not covered yet.'];
  const lines = [`${c.area.name} (${c.area.kind})`];
  if (c.rent)
    lines.push(
      `Estimated asking rent for ${c.rent.size} m²: about €${c.rent.eur} (€${c.rent.low}–${c.rent.high})`,
      'New builds: often up to 25% more',
    );
  else lines.push('No rent data');
  for (const p of c.commutes)
    lines.push(`${p.label}: ${p.minutes} min (${p.modeLabel.toLowerCase()})`);
  lines.push(
    'Noise: ' +
      c.noise.map((z) => `${z.label.split(' ')[0]!.toLowerCase()} ${z.words}`).join(' · ') +
      (c.airNight !== null ? ` · aircraft at night ${c.airNight}+ dB` : ''),
  );
  lines.push('Nearest: ' + c.nearest.map((z) => `${z.label} ${z.text}`).join(' · '));
  if (c.checks)
    lines.push(
      ...(c.checks.fits ? ['✓ Fits all your filters'] : c.checks.failed.map((x) => `✗ ${x.name}`)),
    );
  return lines;
}
