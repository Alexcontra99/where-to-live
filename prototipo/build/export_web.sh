#!/bin/sh
# Copia la web publicable (sin build ni notas internas) a publicar/, dentro del repositorio.
# Uso: sh prototipo/build/export_web.sh [destino]   (por defecto <raíz del repositorio>/publicar)
# Hay que volver a ejecutarlo y subir publicar/ cada vez que cambie la app o los datos.
set -e
SRC="$(cd "$(dirname "$0")/.." && pwd)"
ROOT="$(cd "$SRC/.." && pwd)"
DST="${1:-$ROOT/publicar}"
mkdir -p "$DST/data"
cp "$SRC/index.html" "$SRC/app.js" "$SRC/style.css" "$DST/"
cp "$SRC"/data/*.js "$DST/data/"
touch "$DST/.nojekyll"
cat > "$DST/README.md" <<'MD'
# Where to Live · Luxembourg (prototype)

Find the parts of Luxembourg City and nearby communes that fit your commute, rent, noise and everyday needs.

**Use it:** open the published page, or download this repository and open `index.html` in any modern browser. Everything runs in your browser; nothing is stored.

Data sources and licences: see the "Sources" tab in the app and `DATA-LICENSES.md`.
MD
cat > "$DST/DATA-LICENSES.md" <<'MD'
# Data licences

Files in `data/` are derived from:

- Public transport timetables (GTFS) — Administration des transports publics, CC BY 4.0
- Advertised rents — Observatoire de l'Habitat, CC0
- Strategic noise maps 2021 (roads, rail) and airport noise map 2023 — Administration de l'environnement, CC0
- Districts — Ville de Luxembourg, CC BY 4.0
- Communes, terrain model and base map — Administration du cadastre et de la topographie (ACT), CC0
- Childcare facilities 2021 — Ministère de l'Éducation nationale, CC0
- Places — © OpenStreetMap contributors, ODbL 1.0. The place data in `data/pois.js` and the distances in `data/grid.js` are a derivative database made available under the Open Database License (https://opendatacommons.org/licenses/odbl/).
- Places — Overture Maps Foundation, CDLA-Permissive-2.0 (includes Meta, Microsoft, Foursquare Apache-2.0, AllThePlaces CC0)
- Bike stations — Vel'oh! – JCDecaux
MD
echo "Exportado a $DST"; du -sh "$DST"; ls -la "$DST" "$DST/data"
