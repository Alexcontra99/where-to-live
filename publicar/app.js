'use strict';
// Where to Live · prototype v0. Everything runs in the browser; data comes from data/*.js (build/build_data.py).
// build/qa_data.py parses SIZE_CURVE, L_NAT, WALK_S_PER_KM, TRANSFER_S and `monoTotal(S) / S * …` from this file: keep their format.

const G = window.GRID, AREAS = window.AREAS, POIS = window.POIS, TR = window.TRANSIT;
const KX = 72.1, KY = 111.2;                 // km per degree of lon / lat here
const WALK_S_PER_KM = 1200;                  // to/from/between stops: 4.5 km/h × 1.5 over straight line (validated against mobiliteit.lu, 18 trips)
const TRANSFER_S = 180;                      // minimum time to change vehicles
const N = G.rows * G.cols;
const CELL_KM2 = (G.dlat * KY) * (G.dlon * KX);

const CATS = [
  ['supermarket', 'Supermarkets'], ['pharmacy', 'Pharmacies'], ['hospital', 'Hospitals'],
  ['school', 'Schools'], ['nursery', 'Nurseries (0–4)'], ['afterschool', 'After-school care'],
  ['university', 'Universities'], ['park', 'Parks'], ['gym', 'Gyms'], ['nightlife', 'Bars & nightlife'],
  ['bikeshare', "Vel'oh bike stations"],
];
const NOISE = [['road', 'Road traffic'], ['rail', 'Trains'], ['air', 'Aircraft']];
const NOISE_OPTS = [['0', "Don't mind"], ['70', 'Avoid extremely loud'], ['65', 'Avoid very loud'], ['60', 'Avoid loud'], ['55', 'Avoid above WHO guideline']];
// Official map bands (Lden, EU Directive 2002/49/EC). Words are ours; dB shown in small print.
const noiseWord = (band, cov) => band >= 70 ? `extremely loud (${band}+ dB)` : band === 65 ? 'very loud (65–69 dB)'
  : band === 60 ? 'loud (60–64 dB)' : band === 55 ? 'above WHO guideline (55–59 dB)'
  : cov === 2 ? 'under 55 dB' : 'not mapped';
// Rent colours
const RENT_BUDGET = [[0.85, [26, 127, 55], 'Well under budget'], [1.0, [124, 201, 106], 'Up to budget'],
  [1.15, [240, 180, 41], 'Up to 15% over'], [Infinity, [209, 73, 91], 'More than 15% over']];
const RENT_M2 = [[33, [198, 219, 239]], [35, [158, 202, 225]], [37, [107, 174, 214]], [40, [49, 130, 189]], [Infinity, [8, 81, 156]]];
// Size-adjusted asking rent (Observatoire de l'Habitat 2025 size curve; validated ±9 % against live listings)
// The "< 50 m²" class (mostly rooms and studios) is anchored at 27 m² so that a bigger flat never costs less in total
const SIZE_CURVE = [[27, 56.3], [60, 31.9], [80, 26.9], [100, 26.1], [120, 22.9], [145, 21.0]], L_NAT = 0.879;
function fSize(S) {
  if (S <= SIZE_CURVE[0][0]) return SIZE_CURVE[0][1];
  if (S >= SIZE_CURVE[SIZE_CURVE.length - 1][0]) return SIZE_CURVE[SIZE_CURVE.length - 1][1];
  for (let j = 1; j < SIZE_CURVE.length; j++) {
    const [s0, v0] = SIZE_CURVE[j - 1], [s1, v1] = SIZE_CURVE[j];
    if (S <= s1) return v0 + (Math.log(S) - Math.log(s0)) / (Math.log(s1) - Math.log(s0)) * (v1 - v0);
  }
}
// Total rent must never fall when size grows: take the running maximum of S × f(S)
function monoTotal(S) { let m = 0; for (let s = 15; s <= S; s++) m = Math.max(m, s * fSize(s)); return Math.max(m, S * fSize(S)); }
const eurM2 = (a, S) => monoTotal(S) / S * 1.04 * Math.sqrt(a.L / L_NAT);
const refSize = () => state.size || 60;
const MODES = [['transit', 'Public transport'], ['walk', 'Walk'], ['bike', 'Bike']];

// ---------- geometry ----------
const cLat = new Float64Array(N), cLon = new Float64Array(N);
for (let r = 0; r < G.rows; r++) for (let c = 0; c < G.cols; c++) {
  const i = r * G.cols + c; cLat[i] = G.lat0 + (r + 0.5) * G.dlat; cLon[i] = G.lon0 + (c + 0.5) * G.dlon;
}
const km = (a1, o1, a2, o2) => Math.hypot((a1 - a2) * KY, (o1 - o2) * KX);
const cellAt = (lat, lon) => {
  const r = Math.floor((lat - G.lat0) / G.dlat), c = Math.floor((lon - G.lon0) / G.dlon);
  return r < 0 || c < 0 || r >= G.rows || c >= G.cols ? -1 : r * G.cols + c;
};

// ---------- transit (reverse connection scan) ----------
const S = TR.stops, NS = S.length, C = TR.conns, W = TR.stride || 5, NC = C.length / W;
let NT = 0; for (let k = 4; k < C.length; k += W) if (C[k] >= NT) NT = C[k] + 1;
const hash = new Map();
const hkey = (la, lo) => Math.floor(la * 200) + ':' + Math.floor(lo * 140);
S.forEach(([la, lo], i) => { const k = hkey(la, lo); (hash.get(k) || hash.set(k, []).get(k)).push(i); });
function nearStops(la, lo, rkm) {
  const ci = Math.floor(la * 200), cj = Math.floor(lo * 140), span = Math.ceil(rkm / 0.5) + 1, out = [];
  for (let i = ci - span; i <= ci + span; i++) for (let j = cj - span; j <= cj + span; j++) {
    const b = hash.get(i + ':' + j); if (!b) continue;
    for (const s of b) { const d = km(la, lo, S[s][0], S[s][1]); if (d <= rkm) out.push([s, d]); }
  }
  return out;
}
const footpaths = S.map(([la, lo], s) => nearStops(la, lo, 0.25).filter(([o]) => o !== s));
let cellStops = null;   // per cell: nearby stops within 1.2 km (lazy)
function buildCellStops() {
  const idx = [], wsec = [], off = new Int32Array(N + 1);
  for (let i = 0; i < N; i++) {
    off[i] = idx.length;
    for (const [s, d] of nearStops(cLat[i], cLon[i], 1.2)) { idx.push(s); wsec.push(d * WALK_S_PER_KM); }
  }
  off[N] = idx.length;
  cellStops = { off, idx: Int32Array.from(idx), w: Float32Array.from(wsec) };
}
function latest(dla, dlo, T) {
  const Lf = new Float64Array(NS).fill(-1e9), Lb = new Float64Array(NS).fill(-1e9), ok = new Uint8Array(NT);
  for (const [s, d] of nearStops(dla, dlo, 1.2)) Lf[s] = T - d * WALK_S_PER_KM;
  for (let k = 0; k < NC; k++) {
    const o = k * W, dep = C[o]; if (dep > T) continue;
    const arr = C[o + 1], a = C[o + 2], b = C[o + 3], t = C[o + 4], fl = W > 5 ? C[o + 5] : 3;
    if (ok[t] || ((fl & 2) && (arr <= Lf[b] || arr <= Lb[b] - TRANSFER_S))) {
      ok[t] = 1;
      if ((fl & 1) && dep > Lb[a]) {
        Lb[a] = dep;
        for (const [q, d] of footpaths[a]) { const v = dep - d * WALK_S_PER_KM; if (v > Lb[q]) Lb[q] = v; }
      }
    }
  }
  for (let s = 0; s < NS; s++) if (Lf[s] > Lb[s]) Lb[s] = Lf[s];
  return Lb;
}
const commuteCache = new Map();
function commute(p, arriveH) {
  const key = [p.lat.toFixed(5), p.lon.toFixed(5), p.mode, arriveH].join('|');
  if (commuteCache.has(key)) return commuteCache.get(key);
  const out = new Float32Array(N);
  if (p.mode !== 'transit') {
    const f = p.mode === 'walk' ? 17.5 : 6;   // minutes per straight-line km, validated on 30 street routes each: walk ×1.3 at 4.5 km/h, bike ×1.4 at 15 km/h
    // Uphill penalty on the net climb to the destination, validated on 10 valley→plateau routes: walk 0.07, bike 0.10 min/m
    const di = cellAt(p.lat, p.lon), zD = di >= 0 && G.elev ? G.elev[di] : null, up = p.mode === 'walk' ? 0.07 : 0.10;
    for (let i = 0; i < N; i++) out[i] = km(cLat[i], cLon[i], p.lat, p.lon) * f + (zD !== null ? Math.max(0, zD - G.elev[i]) * up : 0);
  } else {
    if (!cellStops) buildCellStops();
    const T0 = arriveH * 3600, deadlines = [];
    for (let m = -30; m <= 15; m += 5) deadlines.push(T0 + m * 60);
    const direct = new Float32Array(N);
    for (let i = 0; i < N; i++) direct[i] = km(cLat[i], cLon[i], p.lat, p.lon) * WALK_S_PER_KM;
    for (const T of deadlines) {
      const L = latest(p.lat, p.lon, T);
      for (let i = 0; i < N; i++) {
        let best = direct[i];
        for (let k = cellStops.off[i]; k < cellStops.off[i + 1]; k++) {
          const v = T - (L[cellStops.idx[k]] - cellStops.w[k]);
          if (v < best) best = v;
        }
        out[i] += best / 60 / deadlines.length;
      }
    }
  }
  commuteCache.set(key, out);
  return out;
}

// ---------- state ----------
const state = {
  people: [{ label: 'Person 1', dest: null, mode: 'transit', max: 30 }],
  arrive: 8.5, budget: null, size: null,
  noise: { road: 0, rail: 0, air: 0 },
  cats: Object.fromEntries(CATS.map(([k]) => [k, { mode: 'any', m: 800 }])),
  places: [],
};

// ---------- map ----------
const map = L.map('map', { zoomControl: false }).setView([49.617, 6.13], 13);
L.control.zoom({ position: 'topright' }).addTo(map);
L.tileLayer('https://wmts1.geoportail.lu/opendata/wmts/topomap_gray/GLOBAL_WEBMERCATOR/{z}/{x}/{y}.png', {
  maxZoom: 19, attribution: 'Base map © ACT Luxembourg (CC0) · places © OpenStreetMap contributors',
}).addTo(map);
const bounds = [[G.lat0, G.lon0], [G.lat0 + G.rows * G.dlat, G.lon0 + G.cols * G.dlon]];
let overlay = null;
const markers = L.layerGroup().addTo(map), poiLayer = L.layerGroup().addTo(map);

// ---------- evaluation ----------
let lastEval = null;
function evaluate() {
  const checks = [];   // {name, fn(i) -> true if it fails}
  state.people.forEach((p, n) => {
    if (!p.dest) return;
    const t = commute({ lat: p.dest.lat, lon: p.dest.lon, mode: p.mode }, state.arrive);
    checks.push({ name: `${p.label}: commute over ${p.max} min`, short: `${p.label} commute`, fail: i => t[i] > p.max, t });
  });
  for (const [k, label] of NOISE) {
    const thr = state.noise[k]; if (!thr) continue;
    const arr = G['noise_' + k];
    const what = { 55: 'above WHO guideline (55 dB+)', 60: 'loud or worse (60 dB+)', 65: 'very loud or worse (65 dB+)', 70: 'extremely loud (70 dB+)' }[thr];
    checks.push({ name: `${label}: ${what}`, short: `${label} noise`, fail: i => arr[i] >= thr });
  }
  for (const [k, label] of CATS) {
    const c = state.cats[k]; if (c.mode === 'any') continue;
    const d = G.dist[k];
    checks.push(c.mode === 'near'
      ? { name: `${label}: none within ${c.m} m`, short: label.replace(/ \(.*\)/, ''), fail: i => d[i] * 10 > c.m }
      : { name: `${label}: one closer than ${c.m} m`, short: label.replace(/ \(.*\)/, ''), fail: i => d[i] * 10 < c.m });
  }
  state.places.forEach(pl => {
    if (!pl.loc) return;
    checks.push(pl.mode === 'near'
      ? { name: `${pl.name}: more than ${pl.m} m away`, short: pl.name, fail: i => km(cLat[i], cLon[i], pl.loc.lat, pl.loc.lon) * 1000 > pl.m }
      : { name: `${pl.name}: closer than ${pl.m} m`, short: pl.name, fail: i => km(cLat[i], cLon[i], pl.loc.lat, pl.loc.lon) * 1000 < pl.m });
  });
  const fails = new Uint8Array(N), only = new Int16Array(N).fill(-1);
  checks.forEach((ch, j) => {
    for (let i = 0; i < N; i++) if (G.area[i] >= 0 && ch.fail(i)) { fails[i]++; only[i] = j; }
  });
  lastEval = { checks, fails, only };
  return lastEval;
}

function draw() {
  const { checks, fails } = evaluate();
  const cv = document.createElement('canvas'); cv.width = G.cols; cv.height = G.rows;
  const ctx = cv.getContext('2d'), img = ctx.createImageData(G.cols, G.rows);
  for (let r = 0; r < G.rows; r++) for (let c = 0; c < G.cols; c++) {
    const i = r * G.cols + c, p = ((G.rows - 1 - r) * G.cols + c) * 4;
    if (G.area[i] < 0) continue;
    const f = fails[i];
    const col = f === 0 ? rentColour(i) : f === 1 ? [140, 140, 140, 70] : null;
    if (col) img.data.set(col, p);
  }
  ctx.putImageData(img, 0, 0);
  if (overlay) overlay.remove();
  overlay = L.imageOverlay(cv.toDataURL(), bounds, { opacity: 1, interactive: false }).addTo(map);
  drawMarkers(); summary();
}

const rentAlpha = () => (lastEval && lastEval.checks.length ? 135 : 80);   // lighter until the user sets a filter
function rentColour(i) {
  const a = AREAS[G.area[i]];
  if (!a || !a.L) return [150, 150, 150, 120];
  if (state.budget && state.size) {
    const t = state.size * eurM2(a, state.size) / state.budget;
    return [...RENT_BUDGET.find(b => t <= b[0])[1], rentAlpha()];
  }
  return [...RENT_M2.find(b => eurM2(a, refSize()) < b[0])[1], rentAlpha()];
}

function drawMarkers() {
  markers.clearLayers(); poiLayer.clearLayers();
  state.people.forEach(p => p.dest && L.circleMarker([p.dest.lat, p.dest.lon], { radius: 8, color: '#fff', weight: 2, fillColor: '#0969da', fillOpacity: 1 })
    .bindTooltip(`${p.label}: ${p.dest.label}`).addTo(markers));
  state.places.forEach(pl => pl.loc && L.circleMarker([pl.loc.lat, pl.loc.lon], { radius: 7, color: '#fff', weight: 2, fillColor: '#8250df', fillOpacity: 1 })
    .bindTooltip(pl.name).addTo(markers));
  const active = new Set(CATS.filter(([k]) => state.cats[k].mode !== 'any').map(([k]) => k));
  if (active.size) for (const [la, lo, cat, name] of POIS) if (active.has(cat))
    L.circleMarker([la, lo], { radius: 3, color: '#57606a', weight: 1, fillColor: '#ffffff', fillOpacity: 1 })
      .bindTooltip((name || cat) + ' · ' + CATS.find(c => c[0] === cat)[1]).addTo(poiLayer);
}

function summary() {
  const el = document.getElementById('summary'), { checks, fails, only } = lastEval;
  let g = 0, a = 0; const per = new Map(), lim = new Array(checks.length).fill(0);
  for (let i = 0; i < N; i++) {
    if (G.area[i] < 0) continue;
    if (fails[i] === 0) { g++; per.set(G.area[i], (per.get(G.area[i]) || 0) + 1); }
    else if (fails[i] === 1) { a++; lim[only[i]]++; }
  }
  const top = [...per.entries()].sort((x, y) => y[1] - x[1]).slice(0, 8);
  const maxLim = Math.max(1, ...lim);
  const rgb = c => `rgb(${c.join(',')})`;
  const rentLegend = state.budget && state.size
    ? RENT_BUDGET.map(([, c, l]) => `<span><i class="sw" style="background:${rgb(c)}"></i>${l}</span>`).join('')
    : `<span>€/m², ${refSize()} m²:</span>` + RENT_M2.map(([t, c], j) => `<span><i class="sw" style="background:${rgb(c)}"></i>${j === 0 ? `<${t}` : t === Infinity ? `${RENT_M2[j - 1][0]}+` : `${RENT_M2[j - 1][0]}–${t}`}</span>`).join('');
  const est = k => ` · about €${Math.round(refSize() * eurM2(AREAS[k], refSize()))} for ${refSize()} m²`;
  el.innerHTML = `
    <div class="legend">${rentLegend}<span><i class="sw" style="background:#8c8c8c"></i>One filter away</span></div>
    <div class="legend"><span><b>${fmtKm2(g)}</b> fit · ${per.size} district${per.size === 1 ? '' : 's'} or commune${per.size === 1 ? '' : 's'}</span></div>
    ${top.length ? '<b>Areas with most matching space</b><ol>' + top.map(([k, n]) => `<li>${AREAS[k].name} <span class="hint">· ${fmtKm2(n)}${est(k)}</span></li>`).join('') + '</ol>'
      : '<p class="hint">Nothing fits all filters. The grey areas show what is one filter away.</p>'}
    ${a ? '<div class="limit"><b>What blocks the grey areas</b>' + checks.map((ch, j) => lim[j] ? `<div>${ch.short} · ${fmtKm2(lim[j])}</div><div class="bar"><i style="width:${100 * lim[j] / maxLim}%"></i></div>` : '').join('') + '</div>' : ''}`;
}

// ---------- popup on click ----------
let picking = null;
map.on('click', e => {
  if (picking) { picking(e.latlng); return; }
  const i = cellAt(e.latlng.lat, e.latlng.lng); if (i < 0) return;
  const area = AREAS[G.area[i]];
  if (!area) { L.popup().setLatLng(e.latlng).setContent('Outside Luxembourg: not covered yet.').openOn(map); return; }
  const lines = [`<b>${area.name}</b> <span class="hint">(${area.kind})</span>`];
  if (area.eur_m2) {
    const S = refSize(), r = S * eurM2(area, S);
    lines.push(`<b>Estimated asking rent for ${S} m²: about €${Math.round(r)}</b> (€${Math.round(r * 0.9)}–${Math.round(r * 1.1)})`
      + '<br><span class="hint">New builds: often up to 25% more</span>');
  } else lines.push('<span class="hint">No rent data</span>');
  state.people.forEach(p => {
    if (!p.dest) return;
    const t = commute({ lat: p.dest.lat, lon: p.dest.lon, mode: p.mode }, state.arrive)[i];
    lines.push(`${p.label}: ${Math.round(t)} min (${MODES.find(m => m[0] === p.mode)[1].toLowerCase()})`);
  });
  const cov = G.noise_cov[i];
  lines.push('Noise: '
    + NOISE.map(([k, l]) => `${l.split(' ')[0].toLowerCase()} ${noiseWord(G['noise_' + k][i], cov)}`).join(' · ')
    + (G.noise_air_night && G.noise_air_night[i] >= 45 ? ` · aircraft at night ${G.noise_air_night[i]}+ dB` : ''));
  const near = CATS.map(([k, l]) => `${l.replace(/ \(.*\)/, '')} ${fmtM(G.dist[k][i] * 10)}`);
  lines.push('<span class="hint">Nearest: ' + near.join(' · ') + '</span>');
  if (lastEval && lastEval.checks.length) {
    const f = lastEval.checks.filter(ch => ch.fail(i));
    lines.push(f.length ? f.map(ch => `<span class="pop-fail">✗ ${ch.name}</span>`).join('<br>') : '<span class="pop-ok">✓ Fits all your filters</span>');
  }
  L.popup({ maxWidth: 300 }).setLatLng(e.latlng).setContent(lines.join('<br>')).openOn(map);
});
const fmtKm2 = n => { const v = n * CELL_KM2; return v < 0.1 ? '<0.1 km²' : v.toFixed(1) + ' km²'; };
const fmtM = m => m >= 6000 ? '6+ km' : m >= 1000 ? (m / 1000).toFixed(1) + ' km' : Math.round(m / 10) * 10 + ' m';

function pickOnMap(cb) {
  const hint = document.getElementById('pickHint'); hint.hidden = false;
  if (window.innerWidth < 720) document.getElementById('panel').classList.remove('open');
  picking = ll => { picking = null; hint.hidden = true; cb({ lat: ll.lat, lon: ll.lng, label: `Point ${ll.lat.toFixed(4)}, ${ll.lng.toFixed(4)}` }); };
}
document.getElementById('cancelPick').onclick = () => { picking = null; document.getElementById('pickHint').hidden = true; };

async function geocode(q) {
  const r = await fetch('https://apiv3.geoportail.lu/geocode/search?queryString=' + encodeURIComponent(q));
  const j = await r.json();
  if (!j.results || !j.results.length) throw new Error('not found');
  const [lon, lat] = j.results[0].geomlonlat.coordinates;
  return { lat, lon, label: j.results[0].name.replace(/\s+,/g, ',').replace(/^[\s,]+/, '') };
}

// ---------- form ----------
const $ = id => document.getElementById(id);
let timer = null;
function update() { clearTimeout(timer); $('busy').hidden = false; timer = setTimeout(() => { draw(); $('busy').hidden = true; }, 60); }

function locationEditor(holder, obj, key, placeholder) {
  const wrap = document.createElement('div');
  wrap.innerHTML = `<div class="dest">${obj[key] ? obj[key].label : 'No location yet'}</div>
    <div class="line"><input type="text" placeholder="${placeholder}"><button class="primary">Search</button><button class="ghost">Pick on map</button></div>`;
  const [inp, go, pick] = [wrap.querySelector('input'), ...wrap.querySelectorAll('button')];
  const set = loc => { obj[key] = loc; wrap.querySelector('.dest').textContent = loc.label; update(); };
  go.onclick = async () => {
    if (!inp.value.trim()) return;
    go.disabled = true;
    try { set(await geocode(inp.value)); } catch { wrap.querySelector('.dest').textContent = 'Address not found in Luxembourg. Try another or pick on the map.'; }
    go.disabled = false;
  };
  inp.onkeydown = e => { if (e.key === 'Enter') go.onclick(); };
  pick.onclick = () => pickOnMap(set);
  holder.appendChild(wrap);
}

function renderPeople() {
  const box = $('people'); box.innerHTML = '';
  state.people.forEach((p, n) => {
    const card = document.createElement('div'); card.className = 'card';
    card.innerHTML = `<div class="top"><b>${p.label}</b>${n ? '<button class="x" title="Remove">✕</button>' : ''}</div>`;
    locationEditor(card, p, 'dest', 'Work or study address');
    const line = document.createElement('div'); line.className = 'line';
    line.innerHTML = `<select>${MODES.map(([v, l]) => `<option value="${v}"${v === p.mode ? ' selected' : ''}>${l}</option>`).join('')}</select>
      max <input type="number" min="5" max="90" step="5" value="${p.max}"> min`;
    line.querySelector('select').onchange = e => { p.mode = e.target.value; update(); };
    line.querySelector('input').oninput = e => { p.max = +e.target.value || 30; update(); };
    card.appendChild(line);
    const x = card.querySelector('.x'); if (x) x.onclick = () => { state.people.splice(n, 1); renderPeople(); update(); };
    box.appendChild(card);
  });
  $('addPerson').hidden = state.people.length >= 2;
}
$('addPerson').onclick = () => { state.people.push({ label: 'Person 2', dest: null, mode: 'transit', max: 30 }); renderPeople(); };
$('arrive').onchange = e => { state.arrive = +e.target.value; update(); };
$('budget').oninput = e => { state.budget = +e.target.value || null; update(); };
$('size').oninput = e => { state.size = +e.target.value || null; update(); };

function renderNoise() {
  $('noise').innerHTML = NOISE.map(([k, l]) => `<label class="row">${l}<select data-k="${k}">${NOISE_OPTS.map(([v, t]) => `<option value="${v}"${+v === state.noise[k] ? ' selected' : ''}>${t}</option>`).join('')}</select></label>`).join('');
  $('noise').querySelectorAll('select').forEach(s => s.onchange = e => { state.noise[s.dataset.k] = +e.target.value; update(); });
}
function renderCats() {
  $('cats').innerHTML = CATS.map(([k, l]) => {
    const c = state.cats[k];
    return `<div class="cat" data-k="${k}"><span>${l}</span>
      <select><option value="any"${c.mode === 'any' ? ' selected' : ''}>Don't mind</option><option value="near"${c.mode === 'near' ? ' selected' : ''}>Within</option><option value="far"${c.mode === 'far' ? ' selected' : ''}>At least</option></select>
      <input type="number" min="50" step="50" value="${c.m}"${c.mode === 'any' ? ' disabled' : ''} title="metres"></div>`;
  }).join('');
  $('cats').querySelectorAll('.cat').forEach(row => {
    const c = state.cats[row.dataset.k], sel = row.querySelector('select'), inp = row.querySelector('input');
    sel.onchange = () => { c.mode = sel.value; if (c.mode === 'far' && c.m === 800) c.m = 300; inp.value = c.m; inp.disabled = c.mode === 'any'; update(); };
    inp.oninput = () => { c.m = +inp.value || 0; update(); };
  });
}
function renderPlaces() {
  const box = $('places'); box.innerHTML = '';
  state.places.forEach((pl, n) => {
    const card = document.createElement('div'); card.className = 'card';
    card.innerHTML = `<div class="top"><input type="text" value="${pl.name}" aria-label="Name"><button class="x" title="Remove">✕</button></div>`;
    card.querySelector('input').oninput = e => { pl.name = e.target.value || 'My place'; update(); };
    card.querySelector('.x').onclick = () => { state.places.splice(n, 1); renderPlaces(); update(); };
    locationEditor(card, pl, 'loc', 'Address');
    const line = document.createElement('div'); line.className = 'line';
    line.innerHTML = `<select><option value="near"${pl.mode === 'near' ? ' selected' : ''}>Within</option><option value="far"${pl.mode === 'far' ? ' selected' : ''}>At least</option></select>
      <input type="number" min="50" step="50" value="${pl.m}"> m`;
    line.querySelector('select').onchange = e => { pl.mode = e.target.value; update(); };
    line.querySelector('input').oninput = e => { pl.m = +e.target.value || 0; update(); };
    card.appendChild(line); box.appendChild(card);
  });
}
$('addPlace').onclick = () => { state.places.push({ name: 'My place', loc: null, mode: 'near', m: 1000 }); renderPlaces(); };

$('example').onclick = () => {
  state.people = [
    { label: 'Person 1', dest: { lat: 49.6261, lon: 6.1610, label: 'Kirchberg (tram stop Universitéit)' }, mode: 'transit', max: 30 },
    { label: 'Person 2', dest: { lat: 49.6109, lon: 6.1262, label: 'City centre (Hamilius)' }, mode: 'transit', max: 30 },
  ];
  Object.assign(state, { budget: 2600, size: 60 });
  state.noise = { road: 65, rail: 0, air: 55 };
  state.cats.supermarket = { mode: 'near', m: 800 }; state.cats.park = { mode: 'near', m: 500 };
  $('budget').value = 2600; $('size').value = 60;
  renderPeople(); renderNoise(); renderCats(); update();
};
$('toggle').onclick = () => $('panel').classList.toggle('open');
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => {
  document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x === b));
  $('tab-search').hidden = b.dataset.tab !== 'search'; $('tab-sources').hidden = b.dataset.tab !== 'sources';
});

renderPeople(); renderNoise(); renderCats(); renderPlaces(); draw();
// Start on the city, leaving room for the panel (left on desktop, bottom sheet on phones)
const mobile = window.innerWidth < 720, panelEl = document.getElementById('panel');
map.fitBounds([[49.585, 6.085], [49.645, 6.195]], {
  paddingTopLeft: [mobile ? 0 : panelEl.offsetWidth + 24, 0],
  paddingBottomRight: [0, mobile ? panelEl.offsetHeight : 0],
});
