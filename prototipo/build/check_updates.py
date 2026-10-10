#!/usr/bin/env python3
"""Detecta fuentes con versión nueva frente a prototipo/data/manifest.json. Solo informa: no descarga nada.

Uso:  $PY prototipo/build/check_updates.py
Sale con 0 si no hay nada que actualizar y con 2 si hay novedades.
Protocolo: protocolos/actualizacion_datos.md (sesión de datos).
"""
import datetime, glob, json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.normpath(os.path.join(HERE, '..', 'data'))
RAW = os.path.expanduser('~/.cache/nether_app/raw')
TODAY = datetime.date.today()

# Conjuntos que no están en el manifiesto pero se vigilan (protocolo: factor t, listas de colegios y SEA).
WATCH = {
    'serie nacional de alquileres (factor t)': 'loyers-annonces-des-logements',
}
SEARCH = {   # conjuntos que podrían salir con otro nombre (p. ej. otro año)
    'colegios y SEA (versión nueva)': 'adresses des batiments scolaires',
}
SLUG_FIX = {}   # carpeta de recurso → slug del conjunto, si alguna vez no coinciden


def get(url):
    r = subprocess.run(['curl', '-s', '-m', '40', '-A', 'nether-app-check/1.0', url], capture_output=True, text=True)
    return r.stdout


def dataset(slug):
    try:
        return json.loads(get(f'https://data.public.lu/api/1/datasets/{slug}/'))
    except Exception:
        return None


def d(s):
    return (s or '')[:10]


def words(s):
    return {w for w in re.findall(r'[a-zà-ÿ]+', (s or '').lower()) if len(w) > 2}


def similar(a, b):
    """Mismo título salvo años y números (p. ej. una ronda nueva del mismo mapa o un periodo nuevo)."""
    A, B = words(a), words(b)
    return bool(A and B) and len(A & B) / len(A | B) >= 0.95


def main():
    m = json.load(open(os.path.join(DATA, 'manifest.json')))
    used_urls = {s.get('url') for s in m.get('sources', {}).values()}
    rows, updates = [], 0

    def add(name, state, detail):
        nonlocal updates
        if state == 'ACTUALIZAR':
            updates += 1
        rows.append((name, state, detail))

    for name, s in m.get('sources', {}).items():
        url = s.get('url', '') or ''
        if name == 'gtfs':
            ds = dataset('horaires-et-arrets-des-transport-publics-gtfs')
            newest = max((r.get('last_modified') or '' for r in (ds or {}).get('resources', [])), default='')
            dl = d(s.get('downloaded'))
            vt = str(s.get('valid_to', ''))
            vt_date = datetime.date(int(vt[:4]), int(vt[4:6]), int(vt[6:8])) if len(vt) == 8 else None
            msg = f'descargado {dl}; publicado {d(newest)}; válido hasta {vt}'
            if vt_date and (vt_date - TODAY).days < 30:
                add('gtfs', 'ACTUALIZAR', msg + ' (caduca en < 30 días)')
            elif d(newest) > dl:
                add('gtfs', 'ACTUALIZAR', msg)
            else:
                add('gtfs', 'ok', msg)
            continue
        if name == 'overture_places':
            listing = get('https://overturemaps-us-west-2.s3.amazonaws.com/?list-type=2&prefix=release/&delimiter=/')
            rels = sorted(re.findall(r'<Prefix>release/(\d{4}-\d{2}-\d{2}\.\d+)/</Prefix>', listing))
            latest = rels[-1] if rels else '?'
            dl = d(s.get('downloaded'))
            state = 'ACTUALIZAR' if latest != '?' and latest[:10] > dl else 'ok'
            add(name, state, f'última publicación {latest}; descargado {dl}')
            continue
        mm = re.match(r'https://download\.data\.public\.lu/resources/([^/]+)/(\d{8}-\d{6})/', url)
        if not mm:
            age = (TODAY - datetime.date.fromisoformat(d(s['downloaded']))).days if s.get('downloaded') and d(s['downloaded']) > '2000' else None
            if name == 'veloh' or age is None:
                add(name, 'refrescar', 'sin fecha de publicación: se vuelve a descargar cada mes')
            else:
                add(name, 'ACTUALIZAR' if age > 365 else 'ok', f'sin fecha de publicación; descargado hace {age} días (revisión anual)')
            continue
        slug = SLUG_FIX.get(mm.group(1), mm.group(1))
        ds = dataset(slug)
        if not ds or 'resources' not in ds:
            add(name, '¿?', f'no se pudo consultar el conjunto {slug}')
            continue
        used = s.get('last_modified') or ''
        same = [r for r in ds['resources'] if r.get('url') == url]
        ref = same[0]['title'] if same else url.rsplit('/', 1)[-1]
        newer = [r for r in ds['resources']
                 if d(r.get('last_modified')) > d(used) and r.get('url') not in used_urls and similar(r.get('title', ''), ref)]
        if same and (same[0].get('last_modified') or '') > used:
            add(name, 'ACTUALIZAR', f'el mismo fichero cambió: {d(same[0]["last_modified"])} (en uso {d(used)})')
        elif newer:
            names = '; '.join(f'{r["title"][:60]} ({d(r.get("last_modified"))})' for r in newer[:3])
            # Límites: el conjunto se republica cada mes; solo cuenta en la revisión anual (enero).
            state = 'info' if 'limites-administratives' in slug and TODAY.month != 1 else 'ACTUALIZAR'
            add(name, state, f'recursos más nuevos que el usado ({d(used)}): {names}')
        else:
            add(name, 'ok', f'en uso {d(used)}; sin versión más nueva')

    # OSM: antigüedad de las descargas
    osm = glob.glob(os.path.join(RAW, 'osm_*.json'))
    if osm:
        age = (TODAY - datetime.date.fromtimestamp(min(os.path.getmtime(p) for p in osm))).days
        add('osm (lugares)', 'ACTUALIZAR' if age > 25 else 'ok', f'descarga más antigua hace {age} días (se refresca cada mes)')

    for label, slug in WATCH.items():
        ds = dataset(slug)
        last = d((ds or {}).get('last_modified'))
        known = '2026-09-24'   # versión usada para t = 1,04 (ver notas/fuentes_datos.md, "Versiones en uso")
        add(label, 'ACTUALIZAR' if last > known else 'ok', f'última publicación {last} (en uso {known})')

    for label, q in SEARCH.items():
        try:
            res = json.loads(get('https://data.public.lu/api/1/datasets/?page_size=10&q=' + q.replace(' ', '+')))['data']
        except Exception:
            res = []
        other = [x for x in res if x['slug'] != 'adresses-des-batiments-scolaires-2021' and 'scolaire' in x['slug']]
        add(label, 'ACTUALIZAR' if other else 'ok', ('conjuntos nuevos: ' + ', '.join(x['slug'] for x in other)) if other else 'solo existe la versión de 2021')

    w = max(len(r[0]) for r in rows)
    print(f'Comprobación de fuentes — {TODAY} (manifiesto del {m.get("built")})')
    for n, st, det in rows:
        print(f'  {n:<{w}}  {st:<10}  {det}')
    print(f'\n{updates} fuente(s) con versión nueva.' if updates else '\nNada nuevo que actualizar.')
    sys.exit(2 if updates else 0)


if __name__ == '__main__':
    main()
