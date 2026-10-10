# Prototipo v0 — Where to Live · Luxembourg

Web estática (opción A, 2026-10-06): todo se calcula en el navegador; no hay servidor ni se envía nada salvo las búsquedas de direcciones al geocodificador oficial (geoportail.lu).

## Abrir
- Abrir `index.html` en el navegador (funciona con doble clic; los datos van en `data/*.js`).

## Publicar
- `sh build/export_web.sh` copia la web publicable (sin build ni notas internas, con README en inglés, DATA-LICENSES.md y .nojekyll) a `~/GitHub/where-to-live`. Comprobado el 2026-10-07 sirviendo esa carpeta en limpio (escritorio y móvil, sin errores).

## Actualización mensual
- Protocolo y comandos: `../protocolos/actualizacion_datos.md` (sesión de datos). `build/check_updates.py` dice qué fuentes tienen versión nueva; `build/qa_data.py` compara con `data/manifest.prev.json` y falla si algo se sale de rango. qa_data.py lee constantes de `app.js`: no cambiar su formato sin avisar.

## Regenerar los datos
```
pip install -r build/requirements.txt          # Python 3.9+; en el Mac de Ale se usa el de CommandLineTools (ver CLAUDE.md, "Entorno")
python3 build/get_gtfs.py                       # 1. horarios GTFS → ~/.cache/nether_gtfs
python3 build/build_data.py                     # 2. descarga lo automático a ~/.cache/nether_app/raw y genera data/*.js
```
- La mayoría de fuentes las descarga `build_data.py` solo (barrios, municipios, alquiler, ruido 2021, OSM, Vel'oh). Las manuales, a `~/.cache/nether_app/raw/`:
  - `overture_places.geojson`: `overturemaps download --bbox=6.00,49.52,6.33,49.73 -f geojson --type=place -o overture_places.geojson`.
  - `airport2023/`: descomprimir el zip de documentación del mapa del aeropuerto 2023 (URL en `../notas/fuentes_datos.md`, "Enlaces"). El `.prj` dice Web Mercator, pero los datos están en LUREF (EPSG:2169).
  - `mnt75/`: modelo numérico del terreno de 75 m de la ACT, https://download.data.public.lu/resources/modele-numerique-de-terreno-75m/20160405-133110/mnt_75.zip. El zip debe dejar `luxaltblh50` y `test.dem` dentro de `mnt75/`.
  - `sea_2021_geocoded.json`: lista oficial SEA 2021 ("Colegios 2021" en `../notas/fuentes_datos.md`) geocodificada con el buscador de geoportail.lu. Campos que espera `build_data.py`: `lat`, `lon`, `name`, `young_children` y `school_children`. Se generó a mano el 2026-10-07 (método en `../notas/calidad_datos.md`, "Contraste con las listas oficiales de 2021"); falta convertirlo en script (pendiente en `../estado.md`).
- Fuentes y licencias: `../notas/fuentes_datos.md`.

## Qué hay
| Archivo | Qué es |
|---|---|
| `index.html`, `style.css`, `app.js` | La web (inglés, pensada para móvil) |
| `data/grid.js` | Rejilla de 150 m: barrio o municipio, ruido Lden (carreteras, tren, aviones) y cobertura del mapa de ruido, distancia a 12 categorías (OpenStreetMap, Overture, lista oficial SEA y estaciones Vel'oh; médicos incluidos en los datos pero ocultos en la app) |
| `data/areas.js` | Barrios de la ciudad y municipios: alquiler medio €/m², anuncio medio y nivel de precio `L` (para el modelo por tamaño) |
| `data/pois.js` | Puntos de OpenStreetMap (+ Overture Places para gimnasios, guarderías, cadenas de supermercados y farmacias) y estaciones Vel'oh |
| `data/transit.js` | Paradas y conexiones de un martes, 6:00-10:30 |
| `build/build_data.py` | Genera todo lo anterior |

## Textos de la app (Ale, 2026-10-07)
- Mínimos. Nada de explicar la lógica en la app: la lógica vive aquí y en `../notas/calidad_datos.md`.
- Fuentes solo en la pestaña "Sources", en una línea cada una (y la atribución obligatoria del mapa base).
- Ficha de zona: alquiler estimado con rango, "New builds: often up to 25% more", minutos por persona, ruido en palabras, distancias y ✓/✗.

## Cómo decide los colores
- El alquiler no excluye (decisión de Ale, 2026-10-06): las celdas que cumplen todos los filtros se colorean por alquiler estimado (respecto al presupuesto si lo hay; si no, por €/m² de un piso del tamaño elegido o de 60 m²). Gris: falla un filtro (el resumen dice cuál bloquea más superficie). Sin color: falla dos o más.
- Filtros: "Don't mind" no afecta; cualquier otra opción filtra (sin Must/Nice, decisión de Ale).
- Ruido en palabras: above WHO guideline (55), loud (60), very loud (65), extremely loud (70+) dB Lden; bandas de la directiva 2002/49/CE y umbrales OMS 2018. Fuera de la aglomeración AggloLux solo hay grandes ejes y aeropuerto. Aviones: mapa 2023 (actualización intermedia; el de 2021 sobrestimaba cerca de la pista), Lden y noche.
- Alquiler estimado = curva oficial €/m² por tamaño (Observatoire 2025) × 1,04 × √(L zona / L nacional); ±9 % frente a anuncios reales (`notas/calidad_datos.md`).
  - Corrección del 2026-10-07 (bug de Ale: más m² con el mismo dinero habilitaba zonas): en la app, la clase < 50 m² se ancla a 27 m² y el total S × f(S) es no decreciente (máximo acumulado). L en el build sigue con la curva original (ancla 37). Validado por la sesión de datos con 233 anuncios por tramos de superficie: error absoluto 2,5 €/m² en 30-60 m²; monótono de 15 a 200 m². Límite conocido: pisos grandes en la ciudad salen un 9-13 % bajos.
- Andar (modo a pie): 17,5 min/km recto (×1,3 a 4,5 km/h); bici 6 min/km; ambos + subida neta al destino (0,07 min/m a pie, 0,10 min/m en bici; validado en 10 rutas de valle a meseta con BRouter y Tobler) con el MNT de la ACT (4 m en la ciudad, 75 m fuera). Validado en 30 rutas por calle.
- Guarderías (0-4, "Nurseries") y maisons relais ("After-school care"), separadas por decisión de Ale (07/10): base = lista oficial SEA 2021 (campos young_children / school_children) (Ministerio de Educación, CC0, geocodificada por la sesión de datos con geoportail.lu) + OSM/Overture a más de 100 m de un SEA. Colegios: OSM (cubre el 100 % de las escuelas fundamentales oficiales y el 96 % de los liceos), sin escuelas de música, policía ni autoescuelas.
- Médicos: fuera del v0 (en espera, decisión de Ale del 2026-10-07); quedan hospitales y farmacias.
- Trayecto en transporte público: media de llegadas entre 30 min antes y 15 min después de la hora elegida, con andar (4,5 km/h × 1,5 sobre la línea recta), esperas, transbordos de 3 min como mínimo y paradas sin subida o bajada; validado frente a mobiliteit.lu (error medio −0,7 min).
- Fuera de Luxemburgo no hay datos todavía (frontera: después del v0).
