# Actualización mensual de datos — Where to Live

> Lo ejecuta la sesión de datos (o una sola sesión si solo hay una). Construcción regenera y publica.
> Objetivo: que precios, trayectos y lugares sigan siendo exactos sin rehacer el trabajo de validación.
> Qué es cada fuente y su licencia: `notas/fuentes_datos.md`. Cómo se validó y con qué márgenes: `notas/calidad_datos.md`.

## Cuándo
- **Cada mes**, en la primera semana.
- **Extra**: después de un cambio grande de horarios (inicio de curso a mediados de septiembre y cambio anual a mediados de diciembre) y cuando el Observatoire publique alquileres nuevos (finales de marzo y de septiembre).

## Calendario por fuente
| Fuente | Cada cuánto cambia (oficial) | Qué hacer | Cada cuánto |
|---|---|---|---|
| Horarios GTFS | Semanal | Regenerar `transit.js` para el próximo martes | Mensual (+ extra) |
| Alquiler por barrio y municipio (Observatoire) | Semestral (marzo y septiembre) | Recalcular el índice L de cada zona | Cuando haya versión nueva |
| Serie nacional de alquileres (Observatoire) | Trimestral | Recalcular el factor de tiempo t (ver abajo) | Cuando haya trimestre nuevo |
| Informe "Loyers annoncés en AAAA" (curva por tamaño) | Anual (septiembre) | Revisar la curva f(S) manteniendo la monotonía | Anual |
| Lugares OSM (10 categorías) | Continuo | Volver a descargar | Mensual |
| Overture Places | Mensual | Volver a descargar y aplicar la regla de fusión | Mensual |
| Vel'oh (GBFS) | Continuo | Volver a descargar las estaciones | Mensual |
| Guarderías SEA y colegios (Ministerio de Educación) | Sin calendario (versión de 2021) | Comprobar si hay versión nueva | Anual |
| Ruido (mapas estratégicos) | Quinquenal (la próxima ronda, en 2027) | Comprobar si hay versión nueva | Anual |
| Límites de municipios y barrios | Mensual (cambios reales: fusiones de municipios el 1 de enero) | Comprobar | Anual |
| Terreno (cuestas) | No cambia | — | — |

## Pasos
```
PY=python3   # Python 3.9+ con prototipo/build/requirements.txt
$PY prototipo/build/check_updates.py                                   # 1. sale con 0 si no hay nada nuevo y con 2 si hay novedades
cp prototipo/data/manifest.json prototipo/data/manifest.prev.json      # 2. guardar la línea base
$PY prototipo/build/build_data.py                                      # 3. regenerar (construcción)
$PY prototipo/build/qa_data.py                                         # 4. controles; sale con 1 si hay algo en rojo
$PY prototipo/build/qa_data.py --oficial "O1-D1=07:55,O4-D2=08:04"     #    tras mirar los enlaces de mobiliteit.lu que imprime
```
1. **Detectar novedades** (`check_updates.py`):
   - Compara `prototipo/data/manifest.json` con data.public.lu (API), las publicaciones de Overture y la antigüedad de las descargas de OSM.
   - Vigila además la serie nacional de alquileres y si sale una lista de colegios y SEA más nueva que la de 2021.
   - No descarga nada.
2. **Guardar la línea base**: copiar el manifiesto a `manifest.prev.json` antes de regenerar.
3. **Regenerar**: construcción ejecuta `build_data.py`, que vuelve a escribir `manifest.json`.
4. **Controles de calidad** (`qa_data.py`, ver abajo). Si alguno sale en rojo, no publicar hasta revisarlo.
   - Para los trayectos, el programa imprime 5 pares (rotan cada mes; `--todos` saca los 18) con su enlace a mobiliteit.lu.
   - Se mira la última salida que llega a las 08:30 y se vuelve a ejecutar con `--oficial`.
5. **Publicar**: construcción despliega la nueva versión (`export_web.sh`; el manifiesto no se publica).
6. **Registrar**:
   - Actualizar "Versiones en uso" en `notas/fuentes_datos.md`.
   - Bloque en `sesiones/AAAA-MM-DD.md`: qué cambió, controles y decisiones.
   - Si algo afecta a la exactitud, una nota en `notas/calidad_datos.md`.

## Controles de calidad
| Control | Cómo | Salta si |
|---|---|---|
| Lugares | Recuento por categoría frente al mes anterior | Cambia más de un ±10 % |
| Trayectos | 5 de los 18 pares de referencia (los 18 cada seis meses) frente a mobiliteit.lu, llegada a las 8:30 de un martes | Error medio de más de 3 min, o un par con más de 10 min |
| Alquiler: índice L | Nuevo L frente al anterior por zona | Una zona cambia más de un ±10 % |
| Alquiler: monotonía | El alquiler total S × f(S) crece de 15 a 200 m² | Baja en algún tramo |
| Alquiler: nivel | Estimación a 60 m² en la ciudad frente al alquiler medio por m² del último trimestre (serie nacional × factor de la ciudad) | Diferencia de más de un ±10 % |
| Ruido y terreno | Sin cambios (salvo versión nueva) | — |

## Factor de tiempo del alquiler (t)
- De momento se calcula a mano: `qa_data.py` solo recuerda el valor en uso.
- `t` = media de €/m² anunciados de los últimos 4 trimestres publicados ÷ media de 2025 (año de la curva f).
- Fuente: "Loyers annoncés des logements" (serie retrospectiva trimestral en euros corrientes, CC0).
- Hoy se usa 1,04.

## Anuncios (immotop, atHome…)
- **No automatizar la extracción de anuncios**. Sus condiciones protegen la base de datos ("databases… may not reproduce… distribute… make available") y la UE protege además la extracción sistemática de bases de datos. Un rastreo mensual para un producto es un riesgo legal.
- La fuente de precios es el Observatoire, que trabaja con todos los anuncios de immotop; para nuestra escala basta su ritmo semestral y trimestral.
- **Comprobación manual opcional** (cada seis meses): buscar a mano como un usuario, apuntar solo medianas agregadas y no guardar anuncios.
- Si hace falta más frescura: acuerdo de datos con un portal. Contactar solo con el OK de Ale.

## Qué no hacer
- No cambiar parámetros validados (factores de andar, bici y cuestas, curva de alquiler) sin una validación nueva documentada en `notas/calidad_datos.md`.
- No publicar con un control en rojo.
