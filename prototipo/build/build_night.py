#!/usr/bin/env python3
"""Genera prototipo/data/night.js: la capa "de noche" de safety, sobre la misma rejilla que grid.js.

- Ruido nocturno (Lnight) de carreteras y trenes: mapas estratégicos de ruido 2021 (Administration de l'environnement, CC0),
  los mismos GeoPackage que usa build_data.py para el Lden.
- Alumbrado: etiqueta `lit` de las calles en OpenStreetMap (ODbL).
- Bares y discotecas con horario publicado en OpenStreetMap (`opening_hours`, ODbL): hora de cierre más tardía de la semana.

Solo hechos con fuente; ninguna etiqueta sobre barrios ni personas (CLAUDE.md, opción B).
Uso: python prototipo/build/build_night.py  (descargas en ~/.cache/nether_app/raw, compartidas con build_data.py)
"""
import datetime, json, os, re, sys

import numpy as np
from shapely import points
from shapely.strtree import STRtree

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_data import OUT, REGION, KX, KY, gpkg_geom, grid, log, overpass, raw, to_3035  # noqa: E402

import sqlite3  # noqa: E402

# Bandas Lnight de los GeoPackage 2021 (45-49 en todas las capas salvo las grandes líneas de tren, que empiezan en 50)
NIGHT_BAND = {'Lnight4549': 45, 'Lnight5054': 50, 'Lnight5559': 55, 'Lnight6064': 60, 'Lnight6569': 65, 'LnightGreaterThan70': 70}

ROAD_LAYERS = [('agglo.gpkg', 'NoiseContours_roadsInAgglomeration_Lnight'),
               ('agglo.gpkg', 'NoiseContours_majorroadsInAgglomeration_Lnight'),
               ('majorroads.gpkg', 'NoiseContours_majorRoadsIncludingAgglomeration_Lnight')]
RAIL_LAYERS = [('agglo.gpkg', 'NoiseContours_railwaysInAgglomeration_Lnight'),
               ('agglo.gpkg', 'NoiseContours_majorrailwaysInAgglomeration_Lnight'),
               ('majorrailways.gpkg', 'NoiseContours_majorRailwaysIncludingAgglomeration_Lnight')]

# Calles por las que se vuelve a casa andando
STREETS = '^(primary|secondary|tertiary|unclassified|residential|living_street|pedestrian|service|footway|steps)$'


def night_noise(LA, LO, layers):
    x, y = to_3035.transform(LO, LA)
    pts = points(x, y)
    res = np.zeros(len(LA), dtype=np.int16)
    for name, table in layers:
        con = sqlite3.connect(raw(name))
        tables = {t for t, in con.execute("select table_name from gpkg_contents")}
        if table not in tables:
            con.close()
            sys.exit(f'{name}: falta la capa {table}; capas: {sorted(tables)}')
        feats = [(gpkg_geom(blob), NIGHT_BAND.get(cat, 0)) for blob, cat in con.execute(f'select geom, category from "{table}"')]
        con.close()
        if feats and all(b == 0 for _, b in feats):
            sys.exit(f'{table}: categorías desconocidas; revisa NIGHT_BAND')
        tree = STRtree([g for g, _ in feats])
        bands = np.array([b for _, b in feats], dtype=np.int16)
        ip, ig = tree.query(pts, predicate='intersects')
        np.maximum.at(res, ip, bands[ig])
        log('  ruido de noche', table, len(feats), 'polígonos')
    return res


def lit_share(g):
    """Por celda: % de metros de calle con lit=yes entre los que tienen la etiqueta; 255 = ninguna calle etiquetada."""
    lat0, lon0, lat1, lon1 = REGION
    q = f'[out:json][timeout:180];way["highway"~"{STREETS}"]["lit"]({lat0},{lon0},{lat1},{lon1});out tags geom;'
    ways = overpass(q, 'night_lit.json')['elements']
    rows, cols = g['rows'], g['cols']
    on = np.zeros(rows * cols)
    tagged = np.zeros(rows * cols)
    for w in ways:
        lit = w['tags'].get('lit', '')
        if lit not in ('yes', 'no', '24/7', 'automatic', 'limited', 'sunset-sunrise', 'interval'):
            continue
        is_lit = lit != 'no'
        pts = w.get('geometry') or []
        for a, b in zip(pts, pts[1:]):
            # trozos de ~15 m, cada uno a la celda de su punto medio
            dy, dx = (b['lat'] - a['lat']) * KY, (b['lon'] - a['lon']) * KX
            seg = (dx * dx + dy * dy) ** 0.5
            n = max(1, int(seg / 0.015))
            for k in range(n):
                t = (k + 0.5) / n
                la, lo = a['lat'] + (b['lat'] - a['lat']) * t, a['lon'] + (b['lon'] - a['lon']) * t
                r, c = int((la - g['lat0']) / g['dlat']), int((lo - g['lon0']) / g['dlon'])
                if 0 <= r < rows and 0 <= c < cols:
                    i = r * cols + c
                    tagged[i] += seg / n
                    if is_lit:
                        on[i] += seg / n
    share = np.full(rows * cols, 255, dtype=np.int16)
    has = tagged > 0.03   # al menos 30 m de calle etiquetada en la celda
    share[has] = np.round(100 * on[has] / tagged[has])
    log('  alumbrado:', len(ways), 'calles con `lit`;', int(has.sum()), 'celdas con dato')
    return share


TIME_RANGE = re.compile(r'(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})')


def latest_close(oh):
    """Hora de cierre más tardía de la semana en minutos desde las 0:00 del día de apertura (p. ej. 3:00 → 27 h). None si no se entiende."""
    if not oh or 'off' == oh.strip():
        return None
    best = None
    for h1, m1, h2, m2 in TIME_RANGE.findall(oh):
        start, end = int(h1) * 60 + int(m1), int(h2) * 60 + int(m2)
        if end <= start:
            end += 24 * 60
        best = end if best is None else max(best, end)
    if best is None and oh.strip() == '24/7':
        best = 48 * 60
    return best


def bars():
    lat0, lon0, lat1, lon1 = REGION
    q = f'[out:json][timeout:120];nwr["amenity"~"^(bar|pub|nightclub)$"]({lat0},{lon0},{lat1},{lon1});out tags center;'
    els = overpass(q, 'night_bars.json')['elements']
    out, with_hours = [], 0
    for e in els:
        la = e.get('lat') or e.get('center', {}).get('lat')
        lo = e.get('lon') or e.get('center', {}).get('lon')
        if la is None:
            continue
        t = e.get('tags', {})
        close = latest_close(t.get('opening_hours'))
        with_hours += close is not None
        out.append([round(la, 5), round(lo, 5), t.get('name', ''), t['amenity'], close])
    log('  bares y discotecas:', len(out), '·', with_hours, 'con horario')
    return out


def main():
    g, LA, LO = grid()
    log('ruido de noche')
    road = night_noise(LA, LO, ROAD_LAYERS)
    rail = night_noise(LA, LO, RAIL_LAYERS)
    log('alumbrado')
    lit = lit_share(g)
    log('bares')
    bar_list = bars()
    built = datetime.date.today().isoformat()
    night = dict(
        built=built,
        rows=g['rows'], cols=g['cols'],
        noise_road_night=road.tolist(), noise_rail_night=rail.tolist(),
        lit=lit.tolist(),
        bars=bar_list,   # [lat, lon, nombre, tipo, cierre en minutos o null]
        sources=dict(
            noise='Administration de l\'environnement, strategic noise maps 2021, Lnight (CC0)',
            lit='OpenStreetMap contributors, highway lit tag (ODbL)',
            bars='OpenStreetMap contributors, amenity bar/pub/nightclub and opening_hours (ODbL)',
            osm_downloaded=built,
        ),
    )
    path = os.path.join(OUT, 'night.js')
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write('window.NIGHT=' + json.dumps(night, separators=(',', ':'), ensure_ascii=False) + ';\n')
    log('escrito night.js', os.path.getsize(path) // 1024, 'KB')


if __name__ == '__main__':
    main()
