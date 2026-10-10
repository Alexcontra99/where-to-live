#!/usr/bin/env python3
"""Controles de calidad de los datos del prototipo, mes a mes (docs/protocolos/actualizacion_datos.md).

Antes de regenerar:  cp prototipo/data/manifest.json prototipo/data/manifest.prev.json
Después:            $PY prototipo/build/qa_data.py [--todos] [--oficial "O1-D1=07:55,O4-D2=08:04"]

  --todos    calcula los 18 pares de trayectos de referencia (por defecto, 5 que rotan cada mes)
  --oficial  últimas salidas de mobiliteit.lu (llegar a las 08:30) para comparar con la app

Sale con 1 si algún control falla (no publicar) y con 0 si no.
Umbrales y validación de origen: docs/notas/calidad_datos.md.
"""
import datetime, json, math, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
PROTO = os.path.normpath(os.path.join(HERE, '..'))
DATA = os.path.join(PROTO, 'data')
TODAY = datetime.date.today()
KX, KY = 72.1, 111.2

# Pares de referencia (validación del 2026-10-06: 18 pares; minutos oficiales para llegar a las 08:30 del martes 13/10/2026)
O = {'O1': ('Luxembourg, Rue Auguste Charles 50', 49.59852, 6.14088), 'O2': ('Luxembourg, Avenue du X Septembre 50', 49.60880, 6.11600),
     'O3': ('Luxembourg, Avenue Pasteur 50', 49.62007, 6.11987), 'O4': ("Strassen, Route d'Arlon 100", 49.61916, 6.08098),
     'O5': ('Bertrange, Rue de Luxembourg 100', 49.61017, 6.06268), 'O6': ('Hesperange, Route de Thionville 400', 49.57469, 6.15328),
     'O7': ('Sandweiler, Rue Principale 50', 49.61420, 6.22478), 'O8': ('Kopstal, Rue de Luxembourg 10', 49.66239, 6.07298),
     'O9': ('Contern, Rue de Luxembourg 20', 49.58579, 6.22494), 'O10': ('Luxembourg, Rue de Cessange 100', 49.59421, 6.10897),
     'O11': ("Walferdange, Rue de l'Eglise 5", 49.65773, 6.13269)}
D = {'D1': ('Luxembourg, Avenue John F. Kennedy 44', 49.63178, 6.17156), 'D2': ('Luxembourg, Place de la Gare 9', 49.60085, 6.13453),
     'D3': ('Luxembourg, Boulevard F.W. Raiffeisen 2', 49.58604, 6.11662)}
PAIRS = {('O1', 'D1'): 35, ('O1', 'D3'): 31, ('O2', 'D1'): 28, ('O3', 'D2'): 24, ('O4', 'D1'): 33, ('O4', 'D2'): 26, ('O5', 'D1'): 54,
         ('O5', 'D3'): 39, ('O6', 'D1'): 42, ('O6', 'D2'): 21, ('O7', 'D1'): 30, ('O7', 'D2'): 25, ('O8', 'D2'): 37, ('O9', 'D1'): 34,
         ('O10', 'D1'): 42, ('O10', 'D2'): 19, ('O11', 'D1'): 37, ('O11', 'D3'): 63}

results = []


def check(name, state, detail):
    results.append((name, state, detail))


def load_js(name):
    t = open(os.path.join(DATA, name)).read()
    return json.loads(t[t.index('=') + 1:].rstrip().rstrip(';'))


def app_params():
    js = open(os.path.join(PROTO, 'app.js')).read()
    curve = json.loads(re.search(r'SIZE_CURVE\s*=\s*(\[\[.*?\]\])', js).group(1))
    lnat = float(re.search(r'L_NAT\s*=\s*([0-9.]+)', js).group(1))
    t = float(re.search(r'monoTotal\(S\)\s*/\s*S\s*\*\s*([0-9.]+)', js).group(1))
    walk = float(re.search(r'WALK_S_PER_KM\s*=\s*([0-9.]+)', js).group(1))
    transfer = float(re.search(r'TRANSFER_S\s*=\s*([0-9.]+)', js).group(1))
    return curve, lnat, t, walk, transfer


def f_size(curve, s):   # misma interpolación log-lineal que app.js, plana fuera de los extremos
    if s <= curve[0][0]:
        return curve[0][1]
    if s >= curve[-1][0]:
        return curve[-1][1]
    for (s0, v0), (s1, v1) in zip(curve, curve[1:]):
        if s0 <= s <= s1:
            return v0 + (v1 - v0) * (math.log(s) - math.log(s0)) / (math.log(s1) - math.log(s0))


def rel(a, b):
    return (a - b) / b if b else float('inf')


# ---------- transporte: mismo algoritmo que app.js (CSA inverso, con restricciones de subida y bajada) ----------
class Transit:
    def __init__(self, walk, transfer):
        tr = load_js('transit.js')
        self.day = tr['day']
        self.S, self.C, self.W = tr['stops'], tr['conns'], tr.get('stride', 5)
        self.NC = len(self.C) // self.W
        self.NT = max(self.C[4::self.W]) + 1
        self.walk, self.transfer = walk, transfer
        self.h = {}
        for i, (la, lo) in enumerate(self.S):
            self.h.setdefault((math.floor(la * 200), math.floor(lo * 140)), []).append(i)
        self.foot = [[x for x in self.near(la, lo, 0.25) if x[0] != s] for s, (la, lo) in enumerate(self.S)]

    def near(self, la, lo, r):
        ci, cj, sp, out = math.floor(la * 200), math.floor(lo * 140), math.ceil(r / 0.5) + 1, []
        for i in range(ci - sp, ci + sp + 1):
            for j in range(cj - sp, cj + sp + 1):
                for s in self.h.get((i, j), []):
                    dd = math.hypot((la - self.S[s][0]) * KY, (lo - self.S[s][1]) * KX)
                    if dd <= r:
                        out.append((s, dd))
        return out

    def latest(self, dla, dlo, T):
        NS, C, W = len(self.S), self.C, self.W
        Lf, Lb, ok = [-1e9] * NS, [-1e9] * NS, bytearray(self.NT)
        for s, dd in self.near(dla, dlo, 1.2):
            Lf[s] = T - dd * self.walk
        for k in range(self.NC):
            o = k * W
            dep = C[o]
            if dep > T:
                continue
            arr, a, b, t = C[o + 1], C[o + 2], C[o + 3], C[o + 4]
            fl = C[o + 5] if W > 5 else 3
            if ok[t] or ((fl & 2) and (arr <= Lf[b] or arr <= Lb[b] - self.transfer)):
                ok[t] = 1
                if (fl & 1) and dep > Lb[a]:
                    Lb[a] = dep
                    for q, dd in self.foot[a]:
                        v = dep - dd * self.walk
                        if v > Lb[q]:
                            Lb[q] = v
        return [max(x, y) for x, y in zip(Lf, Lb)]

    def minutes(self, o, d, T=8.5 * 3600):
        L = self.latest(d[1], d[2], T)
        best = math.hypot((o[1] - d[1]) * KY, (o[2] - d[2]) * KX) * self.walk
        for s, dd in self.near(o[1], o[2], 1.2):
            best = min(best, T - (L[s] - dd * self.walk))
        return best / 60


def hafas_link(o, d, day):
    from urllib.parse import quote
    dd = datetime.date.fromisoformat(day).strftime('%d.%m.%Y')
    return f'https://cdt.hafas.de/?language=en&S={quote(o[0])}&Z={quote(d[0])}&date={dd}&time=08%3A30&timeSel=arrive&start=1'


def main():
    args = sys.argv[1:]
    cur = json.load(open(os.path.join(DATA, 'manifest.json')))
    prev_p = os.path.join(DATA, 'manifest.prev.json')
    prev = json.load(open(prev_p)) if os.path.exists(prev_p) else None
    curve, lnat, t, walk, transfer = app_params()

    # 1. Alquiler: la curva de precio no puede bajar el alquiler total
    tot = [(s, s * f_size(curve, s)) for s in range(15, 201)]
    bad = [s for (s, v), (_, w) in zip(tot[1:], tot) if v < w - 0.5]
    check('alquiler: monotonía S×f(S)', 'FALLA' if bad else 'ok', f'baja entre {bad[0]} y {bad[-1]} m²' if bad else 'crece de 15 a 200 m²')

    # 2. Lugares: recuento por categoría
    if prev:
        for cat, n in cur.get('poi_counts', {}).items():
            p = prev.get('poi_counts', {}).get(cat)
            if p is None:
                check(f'lugares: {cat}', 'aviso', f'categoría nueva ({n})')
            elif abs(n - p) > 3 and abs(rel(n, p)) > 0.10:
                check(f'lugares: {cat}', 'FALLA', f'{p} → {n} ({rel(n, p):+.0%})')
        for cat in set(prev.get('poi_counts', {})) - set(cur.get('poi_counts', {})):
            check(f'lugares: {cat}', 'FALLA', 'la categoría ha desaparecido')
        if all(r[0] != 'lugares' and not r[0].startswith('lugares:') for r in results):
            check('lugares', 'ok', 'cambios dentro de ±10 % (o ≤ 3)')

    # 3. Alquiler: índice L por zona
    if prev:
        Lc, Lp = cur.get('areas', {}).get('L', {}), prev.get('areas', {}).get('L', {})
        moved = [(a, Lp[a], Lc[a]) for a in Lc if a in Lp and abs(rel(Lc[a], Lp[a])) > 0.10]
        check('alquiler: índice L por zona', 'FALLA' if moved else 'ok',
              ('; '.join(f'{a} {p:.3f}→{c:.3f}' for a, p, c in moved[:8])) if moved else f'{len(Lc)} zonas dentro de ±10 %')
        gone, new = set(Lp) - set(Lc), set(Lc) - set(Lp)
        if gone or new:
            check('alquiler: zonas', 'aviso', f'desaparecen {sorted(gone)[:5]}; nuevas {sorted(new)[:5]}')

    # 4. Alquiler: factor de tiempo (se recalcula a mano con la serie nacional; ver protocolo)
    check('alquiler: factor de tiempo t', 'info', f't = {t} en app.js (recalcular con la serie nacional cuando haya trimestre nuevo; ver protocolo)')

    # 5. Horarios
    g = cur.get('sources', {}).get('gtfs', {})
    vt = str(g.get('valid_to', ''))
    if len(vt) == 8:
        vt_d = datetime.date(int(vt[:4]), int(vt[4:6]), int(vt[6:8]))
        md = datetime.date.fromisoformat(g.get('modelled_day'))
        if vt_d < md:
            check('horarios: validez', 'FALLA', f'el día modelado {md} cae fuera de la validez (hasta {vt_d})')
        elif (vt_d - TODAY).days < 30:
            check('horarios: validez', 'aviso', f'el GTFS caduca el {vt_d}: regenerar con el nuevo')
        else:
            check('horarios: validez', 'ok', f'día modelado {md}; válido hasta {vt_d}')
    if prev:
        pg = prev.get('sources', {}).get('gtfs', {})
        for k in ('stops', 'connections'):
            if pg.get(k) and g.get(k) and abs(rel(g[k], pg[k])) > 0.15:
                check(f'horarios: {k}', 'FALLA', f'{pg[k]} → {g[k]} ({rel(g[k], pg[k]):+.0%})')
        po, co = prev.get('sources', {}).get('overture_places', {}), cur.get('sources', {}).get('overture_places', {})
        if po.get('features') and co.get('features') and abs(rel(co['features'], po['features'])) > 0.15:
            check('overture: lugares', 'aviso', f'{po["features"]} → {co["features"]}')

    # 6. Trayectos de referencia frente a mobiliteit.lu
    tr = Transit(walk, transfer)
    keys = list(PAIRS)
    if '--todos' in args:
        sel = keys
    else:
        k0 = (TODAY.month * 5) % len(keys)
        sel = [keys[(k0 + i) % len(keys)] for i in range(5)]
    oficial = {}
    if '--oficial' in args:
        for part in args[args.index('--oficial') + 1].split(','):
            k, hm = part.split('=')
            o_, d_ = k.strip().split('-')
            h, mi = hm.strip().split(':')
            oficial[(o_, d_)] = 510 - (int(h) * 60 + int(mi))
    errs = []
    print(f'\nTrayectos de referencia (llegar a las 08:30, {tr.day}); abre cada enlace y apunta la última salida que llega a tiempo:')
    for k in sel:
        o, d = O[k[0]], D[k[1]]
        app = tr.minutes(o, d)
        line = f'  {k[0]}-{k[1]}: app {app:.1f} min | oficial 10/2026: {PAIRS[k]} min'
        if k in oficial:
            e = app - oficial[k]
            errs.append(e)
            line += f' | oficial hoy {oficial[k]} min → error {e:+.1f}'
        print(line + f'\n      {hafas_link(o, d, tr.day)}')
    if errs:
        mae = sum(abs(e) for e in errs) / len(errs)
        worst = max(errs, key=abs)
        bad = mae > 3 or abs(worst) > 10
        check('trayectos frente a mobiliteit.lu', 'FALLA' if bad else 'ok', f'error absoluto medio {mae:.1f} min; peor {worst:+.1f} ({len(errs)} pares)')
    else:
        check('trayectos frente a mobiliteit.lu', 'pendiente', 'comparar a mano con los enlaces y volver a ejecutar con --oficial')

    # Resumen
    print(f'\nControles de calidad — {TODAY} (manifiesto {cur.get("built")}; anterior: {prev.get("built") if prev else "ninguno: primera pasada, solo línea base"})')
    w = max(len(r[0]) for r in results)
    for n, st, det in results:
        print(f'  {n:<{w}}  {st:<9}  {det}')
    fails = [r for r in results if r[1] == 'FALLA']
    print(f'\n{len(fails)} control(es) en rojo: NO publicar hasta revisarlo.' if fails else '\nTodo en verde (salvo lo pendiente o informativo).')
    sys.exit(1 if fails else 0)


if __name__ == '__main__':
    main()
