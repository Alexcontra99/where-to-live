#!/usr/bin/env python3
"""Descarga el GTFS oficial más reciente de Luxemburgo (data.public.lu, CC BY) en ~/.cache/nether_gtfs.

Uso: python3 prototipo/build/get_gtfs.py [--force]   (sin --force, no descarga si la copia tiene menos de 30 días)
"""
import datetime, io, json, os, sys, urllib.request, zipfile

CACHE = os.path.expanduser('~/.cache/nether_gtfs')
UA = {'User-Agent': 'where-to-live-prototype/0.1'}
API = 'https://data.public.lu/api/1/datasets/horaires-et-arrets-des-transport-publics-gtfs/'

def main(force=False):
    os.makedirs(CACHE, exist_ok=True)
    stamp = os.path.join(CACHE, 'stop_times.txt')
    if not force and os.path.exists(stamp) and datetime.datetime.now().timestamp() - os.path.getmtime(stamp) < 30 * 86400:
        print('GTFS al día en', CACHE); return
    res = json.load(urllib.request.urlopen(urllib.request.Request(API, headers=UA)))['resources']
    url = sorted(res, key=lambda r: r.get('last_modified') or '')[-1]['url']
    print('Descargando', url, file=sys.stderr)
    data = urllib.request.urlopen(urllib.request.Request(url, headers=UA)).read()
    zipfile.ZipFile(io.BytesIO(data)).extractall(CACHE)
    os.utime(stamp)
    print('GTFS en', CACHE)

if __name__ == '__main__':
    main('--force' in sys.argv)
