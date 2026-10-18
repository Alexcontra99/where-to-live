// The live map on the landing: the Luxembourg demo's data (built by scripts/build-live-data.mjs from
// prototipo/), drawn with Leaflet. Scrolling through the layer steps switches what the map shows;
// the controls in each step change it. Colours and rules follow prototipo/app.js.
import type * as Leaflet from 'leaflet';
import type { Dict } from '../i18n/en';

type Strings = Dict['live'];
export type LayerId = 'overview' | 'commute' | 'rent' | 'noise' | 'near' | 'safety';
type Rgba = [number, number, number, number];

interface LiveData {
  grid: { lat0: number; lon0: number; dlat: number; dlon: number; rows: number; cols: number };
  area: string;
  areas: { name: string; kind: string; rent: number[] | null }[];
  sizes: number[];
  people: { id: string; lat: number; lon: number }[];
  commute: Record<string, string>;
  noise: Record<'road' | 'rail' | 'air' | 'airNight' | 'cov', string>;
  dist: Record<string, string>;
  pois: Record<string, [number, number][]>;
  night: {
    road: string;
    rail: string;
    lit: string;
    nearLate: string;
    bars: [number, number, string, number | null][];
  };
}

const KX = 72.1;
const KY = 111.2;
const NOISE_KINDS = ['road', 'rail', 'air'] as const;
// prototipo/app.js RENT_BUDGET: ratio of estimated rent to budget
const RENT_BUDGET: [number, [number, number, number]][] = [
  [0.85, [26, 127, 55]],
  [1.0, [124, 201, 106]],
  [1.15, [240, 180, 41]],
  [Infinity, [209, 73, 91]],
];
const NOISE_BANDS: Record<number, [number, number, number]> = {
  55: [240, 200, 90],
  60: [240, 150, 60],
  65: [226, 96, 72],
  70: [196, 54, 84],
};
const FIT: [number, number, number] = [87, 194, 107];
const NIGHTLIFE: [number, number, number] = [240, 180, 41];
const NIGHT_NOISE: [number, number, number] = [150, 140, 235];
const UNLIT: [number, number, number] = [200, 210, 230];
const LATE = 25 * 60; // a bar "open late" closes at 1:00 or later
const clock = (m: number) =>
  m >= 48 * 60 ? '24/7' : `${Math.floor(m / 60) % 24}:${String(m % 60).padStart(2, '0')}`;

const bytes = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
const fill = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''));
const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
const rgb = (c: number[]) => `rgb(${c.slice(0, 3).join(' ')})`;

export async function mountLiveMap(root: HTMLElement, s: Strings, onLayer: (id: LayerId) => void) {
  const el = root.querySelector<HTMLElement>('[data-map]')!;
  const [{ default: L }, data] = await Promise.all([
    import('leaflet'),
    fetch('/live/luxembourg.json').then((r) => {
      if (!r.ok) throw new Error(`live data ${r.status}`);
      return r.json() as Promise<LiveData>;
    }),
    import('leaflet/dist/leaflet.css'),
  ]);

  const g = data.grid;
  const N = g.rows * g.cols;
  const cellKm2 = g.dlat * KY * (g.dlon * KX);
  const area = bytes(data.area);
  const commute = Object.fromEntries(Object.entries(data.commute).map(([k, v]) => [k, bytes(v)]));
  const noise = Object.fromEntries(
    Object.entries(data.noise).map(([k, v]) => [k, bytes(v)]),
  ) as Record<keyof LiveData['noise'], Uint8Array>;
  const dist = Object.fromEntries(Object.entries(data.dist).map(([k, v]) => [k, bytes(v)]));
  const night = {
    road: bytes(data.night.road),
    rail: bytes(data.night.rail),
    lit: bytes(data.night.lit),
    nearLate: bytes(data.night.nearLate),
  };
  const bars = data.night.bars;
  const withHours = bars.filter((b) => b[3] !== null);
  const lateCount = withHours.filter((b) => b[3]! >= LATE).length;

  // Defaults follow the demo's example (two commuters, a supermarket and a park nearby, 60 m²);
  // the budget is 2,000 € rather than 2,600 € so the rent layer shows contrast in the city.
  const state = {
    persons: new Set(['kirchberg', 'centre']),
    max: 30,
    size: 60,
    budget: 2000,
    sources: new Set<string>(NOISE_KINDS),
    level: 65,
    cats: new Set(['supermarket', 'park']),
    within: 800,
    night: new Set(['late', 'loud', 'dark']),
  };
  let layer: LayerId = 'overview';

  // ---------- rules ----------
  const sizeIdx = () => Math.max(0, data.sizes.indexOf(state.size));
  const rentAt = (i: number) => {
    const a = data.areas[area[i]! - 1];
    return a?.rent ? a.rent[sizeIdx()]! : null;
  };
  const tripAt = (i: number) => {
    let t = 0;
    for (const p of state.persons) t = Math.max(t, commute[p]![i]!);
    return t;
  };
  const noiseAt = (i: number) => {
    let b = 0;
    for (const k of state.sources) b = Math.max(b, noise[k as 'road']![i]!);
    return b;
  };
  const nearOk = (i: number) => {
    for (const c of state.cats) if (dist[c]![i]! * 10 > state.within) return false;
    return true;
  };
  const nightAt = (i: number) => Math.max(night.road[i]!, night.rail[i]!, noise.airNight[i]!);
  const unlit = (i: number) => night.lit[i]! !== 255 && night.lit[i]! < 50;
  const failsAt = (i: number) =>
    (state.persons.size && tripAt(i) > state.max ? 1 : 0) +
    (state.sources.size && noiseAt(i) >= state.level ? 1 : 0) +
    (state.cats.size && !nearOk(i) ? 1 : 0);
  const rentColour = (i: number, alpha: number): Rgba | null => {
    const r = rentAt(i);
    if (r === null) return [150, 150, 150, 90];
    return [...RENT_BUDGET.find(([t]) => r / state.budget <= t)![1], alpha];
  };

  const paint: Record<LayerId, (i: number) => Rgba | null> = {
    overview: (i) => {
      const f = failsAt(i);
      return f === 0 ? rentColour(i, 175) : f === 1 ? [150, 156, 166, 70] : null;
    },
    commute: (i) => {
      if (!state.persons.size) return null;
      const t = tripAt(i);
      return t <= state.max ? [...FIT, Math.round(70 + 150 * (1 - t / state.max))] : null;
    },
    rent: (i) => rentColour(i, 160),
    noise: (i) => {
      const b = noiseAt(i);
      return state.sources.size && b >= state.level
        ? [...NOISE_BANDS[Math.min(70, b)]!, 140]
        : null;
    },
    near: (i) => (state.cats.size && nearOk(i) ? [...FIT, 165] : null),
    safety: (i) => {
      const d = night.nearLate[i]!;
      if (state.night.has('late') && d <= 15)
        return [...NIGHTLIFE, Math.round(90 + 110 * (1 - d / 15))];
      const n = nightAt(i);
      if (state.night.has('loud') && n >= 45)
        return [...NIGHT_NOISE, [30, 70, 110, 145][Math.min(3, (n - 45) / 5)]!];
      if (state.night.has('dark') && unlit(i)) return [...UNLIT, 95];
      return null;
    },
  };

  // ---------- readouts ----------
  const km2 = (n: number) => {
    const v = n * cellKm2;
    return v < 0.1 ? '<0.1 km²' : `${v.toFixed(1)} km²`;
  };
  const count = (test: (i: number) => boolean) => {
    let n = 0;
    for (let i = 0; i < N; i++) if (area[i] && test(i)) n++;
    return n;
  };
  const topAreas = (test: (i: number) => boolean, k = 3) => {
    const per = new Map<number, number>();
    for (let i = 0; i < N; i++)
      if (area[i] && test(i)) per.set(area[i]!, (per.get(area[i]!) ?? 0) + 1);
    return [...per.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, k)
      .map(([a]) => data.areas[a - 1]!.name);
  };
  const list = (names: string[]) =>
    new Intl.ListFormat(document.documentElement.lang || 'en', { type: 'conjunction' }).format(
      names,
    );

  const readouts: Record<LayerId, () => string> = {
    overview: () => {
      const fit = (i: number) => failsAt(i) === 0;
      const n = count(fit);
      return n
        ? fill(s.overview.readout, { area: km2(n), top: list(topAreas(fit)) })
        : s.overview.none;
    },
    commute: () =>
      fill(s.commute.readout, {
        area: km2(state.persons.size ? count((i) => tripAt(i) <= state.max) : 0),
        n: state.max,
      }),
    rent: () =>
      fill(s.rent.readout, {
        area: km2(count((i) => (rentAt(i) ?? Infinity) <= state.budget)),
        size: state.size,
      }),
    noise: () =>
      fill(s.noise.readout, {
        area: km2(state.sources.size ? count((i) => noiseAt(i) >= state.level) : 0),
        db: state.level,
      }),
    near: () =>
      state.cats.size
        ? fill(s.near.readout, { area: km2(count(nearOk)), n: state.within })
        : s.near.empty,
    safety: () =>
      fill(s.safety.readout, {
        a: km2(count((i) => night.nearLate[i]! <= 15)),
        b: km2(count((i) => nightAt(i) >= 45)),
        c: km2(count(unlit)),
      }),
  };

  const legends: Record<LayerId, () => [string, string][]> = {
    overview: () => [
      [rgb(RENT_BUDGET[1]![1]), s.overview.fit],
      ['rgb(150 156 166 / 0.6)', s.overview.near],
    ],
    commute: () => [
      [rgb(FIT), s.commute.legend[0]!],
      ['rgb(87 194 107 / 0.35)', s.commute.legend[1]!],
    ],
    rent: () => RENT_BUDGET.map(([, c], j) => [rgb(c), s.rent.legend[j]!]),
    noise: () =>
      [55, 60, 65, 70]
        .filter((b) => b >= state.level)
        .map((b) => [rgb(NOISE_BANDS[b]!), s.noise.legend[(b - 55) / 5]!]),
    near: () => [[rgb(FIT), s.near.legend[0]!]],
    safety: () => [
      [rgb(NIGHTLIFE), s.safety.legend[0]!],
      [rgb(NIGHT_NOISE), s.safety.legend[1]!],
      [rgb(UNLIT), s.safety.legend[2]!],
    ],
  };

  // ---------- map ----------
  const coarse = matchMedia('(pointer: coarse)').matches;
  const map = L.map(el, {
    zoomControl: false,
    scrollWheelZoom: false,
    dragging: !coarse,
    touchZoom: !coarse,
    attributionControl: false,
    zoomSnap: 0.25,
  });
  L.control.zoom({ position: 'topright' }).addTo(map);
  L.control
    .attribution({ position: 'bottomright', prefix: false })
    .addAttribution('© ACT Luxembourg · © OpenStreetMap contributors')
    .addTo(map);
  L.tileLayer(
    'https://wmts1.geoportail.lu/opendata/wmts/topomap_gray/GLOBAL_WEBMERCATOR/{z}/{x}/{y}.png',
    {
      maxZoom: 18,
      minZoom: 11,
      className: 'live-tiles',
    },
  ).addTo(map);
  const bounds: Leaflet.LatLngBoundsExpression = [
    [g.lat0, g.lon0],
    [g.lat0 + g.rows * g.dlat, g.lon0 + g.cols * g.dlon],
  ];
  map.setMaxBounds(L.latLngBounds(bounds).pad(0.3));

  const frame = () => {
    const card = root.querySelector<HTMLElement>('.step .card');
    const wide = innerWidth >= 900;
    map.fitBounds(
      [
        [49.588, 6.09],
        [49.642, 6.19],
      ],
      {
        paddingTopLeft: [wide && card ? card.offsetWidth + 40 : 0, wide ? 0 : 60],
        paddingBottomRight: [0, wide ? 56 : 0],
      },
    );
  };
  frame();

  const canvas = document.createElement('canvas');
  canvas.width = g.cols;
  canvas.height = g.rows;
  const ctx = canvas.getContext('2d')!;
  const overlay = L.imageOverlay(canvas.toDataURL(), bounds, {
    interactive: false,
    className: 'live-overlay',
  }).addTo(map);
  const pins = L.layerGroup().addTo(map);
  const dots = L.layerGroup().addTo(map);

  const drawGrid = () => {
    const img = ctx.createImageData(g.cols, g.rows);
    const fn = paint[layer];
    for (let r = 0; r < g.rows; r++)
      for (let c = 0; c < g.cols; c++) {
        const i = r * g.cols + c;
        if (!area[i]) continue;
        const col = fn(i);
        if (col) img.data.set(col, ((g.rows - 1 - r) * g.cols + c) * 4);
      }
    ctx.putImageData(img, 0, 0);
    overlay.setUrl(canvas.toDataURL());
  };

  const drawMarks = () => {
    pins.clearLayers();
    dots.clearLayers();
    if (layer === 'overview' || layer === 'commute')
      for (const p of data.people)
        if (state.persons.has(p.id))
          L.circleMarker([p.lat, p.lon], {
            radius: 7,
            color: '#fff',
            weight: 2,
            fillColor: '#4493f8',
            fillOpacity: 1,
          })
            .bindTooltip(s.commute.people[p.id as 'kirchberg'])
            .addTo(pins);
    const cats = layer === 'near' ? [...state.cats] : [];
    for (const c of cats)
      for (const [la, lo] of data.pois[c] ?? [])
        L.circleMarker([la, lo], {
          radius: 2.5,
          color: '#0a0d12',
          weight: 1,
          fillColor: '#e6edf3',
          fillOpacity: 1,
          interactive: false,
        }).addTo(dots);
    if (layer === 'safety' && state.night.has('late'))
      for (const [la, lo, name, close] of bars) {
        const late = close !== null && close >= LATE;
        const label =
          close === null ? s.popup.noHours : fill(s.popup.until, { time: clock(close) });
        L.circleMarker([la, lo], {
          radius: late ? 4 : 2.5,
          color: '#0a0d12',
          weight: 1,
          fillColor: late ? rgb(NIGHTLIFE) : '#9198a1',
          fillOpacity: 1,
        })
          .bindTooltip(`${esc(name || s.popup.bar)} · ${esc(label)}`)
          .addTo(dots);
      }
  };

  const legendEl = root.querySelector<HTMLElement>('[data-legend]')!;
  const drawLegend = () => {
    legendEl.innerHTML = legends[layer]()
      .map(([c, label]) => `<span><i style="background:${c}"></i>${esc(label)}</span>`)
      .join('');
  };

  const barsEl = root.querySelector<HTMLElement>('[data-bars]');
  if (barsEl)
    barsEl.textContent = fill(s.safety.bars, {
      late: lateCount,
      hours: withHours.length,
      none: bars.length - withHours.length,
    });

  const readoutEls = root.querySelectorAll<HTMLElement>('[data-readout]');
  const drawReadouts = () => {
    for (const r of readoutEls) r.textContent = readouts[r.dataset.readout as LayerId]();
  };

  let queued = 0;
  const redraw = () => {
    cancelAnimationFrame(queued);
    queued = requestAnimationFrame(() => {
      drawGrid();
      drawMarks();
      drawLegend();
      drawReadouts();
    });
  };

  // ---------- popup ----------
  const noiseWord = (b: number, cov: number) =>
    b >= 70 ? '70+ dB' : b >= 55 ? `${b} dB` : cov === 2 ? s.popup.quiet : s.popup.unmapped;
  const fmtM = (d: number) =>
    d >= 255 ? '2.5+ km' : d >= 100 ? `${(d / 100).toFixed(1)} km` : `${d * 10} m`;
  map.on('click', (e: Leaflet.LeafletMouseEvent) => {
    const r = Math.floor((e.latlng.lat - g.lat0) / g.dlat);
    const c = Math.floor((e.latlng.lng - g.lon0) / g.dlon);
    const i = r * g.cols + c;
    const a = r < 0 || c < 0 || r >= g.rows || c >= g.cols ? undefined : data.areas[area[i]! - 1];
    if (!a) {
      L.popup().setLatLng(e.latlng).setContent(esc(s.popup.outside)).openOn(map);
      return;
    }
    const rent = rentAt(i);
    const lines = [
      `<b>${esc(a.name)}</b>`,
      rent === null
        ? esc(s.popup.noRent)
        : esc(fill(s.popup.rent, { rent: `€${rent.toLocaleString('en')}`, size: state.size })),
      ...data.people.map(
        (p) => `${esc(s.commute.people[p.id as 'kirchberg'])}: ${commute[p.id]![i]} min`,
      ),
      `${esc(s.popup.night)}: ${(['road', 'rail'] as const).map((k) => `${esc(s.noise.kinds[k].toLowerCase())} ${night[k][i]! >= 45 ? `${night[k][i]} dB` : s.popup.under45}`).join(' · ')} · ${esc(s.noise.kinds.air.toLowerCase())} ${noise.airNight[i]! >= 45 ? `${noise.airNight[i]} dB` : s.popup.under45}`,
      night.lit[i] === 255 ? esc(s.popup.litUnknown) : esc(fill(s.popup.lit, { n: night.lit[i]! })),
      `${esc(s.popup.noise)}: ${NOISE_KINDS.map((k) => `${esc(s.noise.kinds[k].toLowerCase())} ${noiseWord(noise[k][i]!, noise.cov[i]!)}`).join(' · ')}`,
      `<span class="muted">${esc(s.popup.nearest)}: ${Object.entries(s.near.cats)
        .map(([k, l]) => `${esc(l.toLowerCase())} ${fmtM(dist[k]![i]!)}`)
        .join(' · ')}</span>`,
    ];
    L.popup({ maxWidth: 280 }).setLatLng(e.latlng).setContent(lines.join('<br>')).openOn(map);
  });

  // ---------- controls ----------
  for (const b of root.querySelectorAll<HTMLButtonElement>('[data-k]')) {
    if (b.tagName !== 'BUTTON') continue;
    b.addEventListener('click', () => {
      const k = b.dataset.k as keyof typeof state;
      const v = b.dataset.v!;
      const cur = state[k];
      if (cur instanceof Set) {
        if (cur.has(v)) cur.delete(v);
        else cur.add(v);
        b.setAttribute('aria-pressed', String(cur.has(v)));
      } else {
        (state as Record<string, unknown>)[k] = Number(v);
        for (const o of root.querySelectorAll<HTMLButtonElement>(`button[data-k="${k}"]`))
          o.setAttribute('aria-pressed', String(o === b));
      }
      redraw();
    });
  }
  for (const input of root.querySelectorAll<HTMLInputElement>('input[data-k]')) {
    const out = input.parentElement?.querySelector('output');
    const sync = () => {
      (state as Record<string, unknown>)[input.dataset.k!] = Number(input.value);
      if (out)
        out.textContent = fill(input.dataset.fmt ?? '{n}', {
          n: Number(input.value).toLocaleString('en'),
        });
    };
    sync();
    input.addEventListener('input', () => {
      sync();
      redraw();
    });
  }

  // Touch: the map does not take one-finger swipes, so the page keeps scrolling; a button hands them over.
  const move = root.querySelector<HTMLButtonElement>('[data-move]');
  if (move && coarse) {
    move.hidden = false;
    move.addEventListener('click', () => {
      const on = move.getAttribute('aria-pressed') !== 'true';
      move.setAttribute('aria-pressed', String(on));
      move.textContent = on ? s.done : s.move;
      if (on) {
        map.dragging.enable();
        map.touchZoom.enable();
      } else {
        map.dragging.disable();
        map.touchZoom.disable();
      }
    });
  }

  addEventListener('resize', () => map.invalidateSize());

  const setLayer = (id: LayerId) => {
    if (id === layer) return;
    layer = id;
    root.dataset.layer = id;
    onLayer(id);
    redraw();
  };
  root.dataset.layer = layer;
  redraw();
  return { setLayer };
}
