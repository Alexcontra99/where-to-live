---
tipo: nota
proyecto: app_donde_vivir
fecha: 2026-10-06
---
# Calidad de los datos del v0
> Lo lleva la sesión de datos (`CLAUDE.md`, "Reparto"). Fuentes y licencias: `notas/fuentes_datos.md`.
> Por criterio: fuente, cómo la usa el prototipo, exactitud medida, huecos, alternativas, recomendación y esfuerzo.
> Zona del prototipo (REGION): 49,55-49,70 N / 6,03-6,28 E = 301 km², rejilla de 150 m.

## Estado
| Criterio | Estado |
|---|---|
| Ruido (carreteras, trenes, aviones) | **Analizado** (2026-10-06); documentación para etiquetas en palabras añadida |
| Transporte público | **Validado** (2026-10-06): 18 pares frente a mobiliteit.lu; 1 bug + 2 parámetros |
| Alquiler | **Analizado** (2026-10-06): modelo por tamaño validado con anuncios |
| POI y médicos: fuentes alternativas a OSM | **Analizado** (2026-10-07): OSM + Overture con regla de fusión. Médicos en espera (Ale, 07/10: bastan hospitales y farmacias) |
| Andar y bici | **Validado** (2026-10-07): andar a 17,5 min/km; bici bien; cuestas a pie 0,07 y en bici 0,10 min/m |
| Alquiler | Pendiente |
| Servicios de OpenStreetMap (10 categorías) | Pendiente: frente a listas oficiales |
| Barrios, municipios, geocodificador, mapa base | Pendiente |

## Ruido
**Fuente actual**: mapas estratégicos de ruido 2021 (directiva europea 2002/49), Administration de l'environnement, CC0. El prototipo usa el fichero de la aglomeración (carreteras, grandes carreteras, ferrocarril, aeropuerto dentro de la aglomeración) y el del aeropuerto. Bandas Lden: 55-59, 60-64, 65-69, 70-74, ≥ 75 dB.

**Exactitud medida**
- **La aglomeración no cubre toda la zona.** La aglomeración "AggloLux" (226,9 km², 200.667 habitantes) son 10 municipios completos: Luxemburgo, Bertrange, Hesperange, Leudelange, Mamer, Niederanven, Sandweiler, Steinsel, Strassen y Walferdange.
- Cubre el **66 %** de la zona del prototipo. El **34 % restante (103 km²)** queda fuera: Kopstal, Contern, Schuttrange, Lorentzweiler, Kehlen, Weiler-la-Tour, Dalheim, Roeser, Junglinster, Reckange-sur-Mess y Bous-Waldbredimus (en parte).
- Fuera de la aglomeración solo se cartografían las **grandes carreteras** (≥ 3 millones de vehículos al año), las **grandes vías** (≥ 30.000 trenes al año) y el aeropuerto. Las calles locales no.
- En el 34 % de fuera hay **30 km de grandes carreteras y 13 km de grandes vías**. El 19 % de esa área está a menos de 300 m de ellas y el 30 % a menos de 500 m.
- Hoy esas celdas salen como "no cartografiado" aunque estén junto a una autopista o una vía.
- **Segunda aglomeración, "AggloSud"** (200,8 km², 180.449 habitantes): Esch-sur-Alzette, Differdange, Dudelange, Sanem, Schifflange, Bettembourg, Kayl, Mondercange, Pétange, Rumelange y Käerjeng.
  - No viene en el fichero de aglomeraciones de 2021: su extensión solo alcanza AggloLux.
  - No afecta a la zona actual (0,1 %), pero sí si se amplía al sur (Belval).
- **Antigüedad**: mapas de 2021. La directiva los renueva cada 5 años: la siguiente ronda toca en 2027 y **no hay ronda 2026**. Lo publicado en 2026 son planes de acción y puntos negros, no mapas nuevos.
- **Aeropuerto**: el mapa refleja el tráfico de 2021, con los vuelos de pasajeros aún reducidos por la covid. Hay un **mapa de 2023** publicado como "documentación" (zip de 66 MB, sin revisar). Es posible que el de 2021 subestime el ruido de aviones.
- Por debajo de 55 dB no hay contorno: "< 55 dB" no equivale a "silencioso".

**Recomendación (especificación enviada a la sesión de construcción)**
1. **Máscara de cobertura**:
   - Fichero: "Noise Sources (DF1_5 submission) Agglomeration 2020", CC0, GeoPackage de 118 KB: https://download.data.public.lu/resources/environmental-noise-report-on-all-major-roads-railways-airports-and-agglomerations-df1-and-df5/20250724-134505/agglomerationsource-2020-lu.gpkg
   - Capa `AgglomerationSource`, filtro `agglomerationId_identifier = 'AG_LU_00_1'`. Polígono en EPSG:3035.
2. **Tres estados por celda**:
   - Dentro de AggloLux: "mapped (all roads, rail, airport, 2021)".
   - Fuera, dentro de un contorno grande: la banda que toque.
   - Fuera, sin contorno: "no major road/rail/airport above 55 dB; local streets not mapped".
3. **Añadir los ficheros nacionales**: sí. Grandes carreteras (`lu-majorroads-2021-strategicnoisemaps.gpkg`, 310 MB) y grandes vías (`lu-majorrailways-2021-strategicnoisemaps.gpkg`, 61 MB), CC0, mismas bandas. Usar la banda máxima entre fichero de aglomeración y nacional.
4. **Aeropuerto: cambiar al mapa de 2023** (revisado el 2026-10-07, ver abajo).

**Esfuerzo**: bajo, cambio de build sin datos nuevos de pago (descarga de 371 MB, ya CC0). **Integrado** por la sesión de construcción el 2026-10-06 (campo `noise_cov`).

### Aeropuerto: 2023 frente a 2021
- **Qué es el de 2023** (informe "Cartographie stratégique de l'aéroport de Luxembourg (ELLX) – Trafic aérien année 2023", Acoustic Technologies para la Administration de l'environnement, febrero de 2025):
  - Es un cálculo "intermedio" encargado porque el tráfico de 2021 estaba reducido por la covid.
  - Tráfico: radar de la ANA (Administration de la navigation aérienne), 82.671 trayectorias. El de 2021 tenía 72.548.
  - Mismo método oficial: CNOSSOS-EU / ECAC Doc 29, rejilla de 100 m a 4 m de altura.
- **Por qué sale más pequeño** (sección 5.4):
  - El fabricante del programa de cálculo (Wölfel) reinterpretó el método: más efecto suelo para aviones en pista.
  - Por eso los contornos de 2021 cerca de la pista eran una **sobrestimación**.
  - Personas expuestas a más de 55 dB Lden: 69.818 en 2021 frente a 64.770 en 2023. La bajada se debe "casi enteramente" a ese cambio de método, no al tráfico.
- **Superficie con 55 dB o más**: 51,7 km² en todo el país y 38,6 en AggloLux (tabla 6).
  - En la rejilla del prototipo (medición de construcción): 47,8 km² con el de 2021 frente a 40,0 con el de 2023.
  - 552 celdas bajan de banda y 20 suben. Sandweiler pasa de 55 dB a sin contorno.
- **Ficheros**: shapefile `snm_MajorAirport_2023_Lden` / `_Lngt`, dentro del zip de "documentación" del conjunto de mapas estratégicos (CC0).
  - Ojo: el `.prj` dice Web Mercator, pero las coordenadas son LUREF (EPSG:2169); comprobado por construcción con la pista.
  - Banda en el campo `LEVEL_1` (55…80; ≥ 80 se trata como ≥ 75).
  - Lnight desde 45 dB (noche 23-07 según el informe; la etiqueta del fichero dice 22-6).
- **Recomendación**: usar 2023 (tráfico más reciente y método corregido), citado como "Airport noise map 2023 (Administration de l'environnement, interim update)".
  - El oficial comunicado a la UE sigue siendo el de 2021 hasta la ronda de 2027.
  - La capa de noche permite avisar "night aircraft noise above 45 dB (WHO recommends below 40)".

### Qué significan los dB (para etiquetas en palabras)
- **Indicador Lden** (directiva 2002/49/CE, anexo I):
  - Media anual que suma día (12 h), tarde (4 h, +5 dB) y noche (8 h, +10 dB). Por defecto: 07-19, 19-23 y 23-07.
  - Castiga el ruido de tarde y noche porque molesta más.
  - Se mide a 4 m de altura en la fachada más expuesta.
- **Bandas oficiales** (anexo VI, puntos 1.5 y 2.5): Lden 55-59, 60-64, 65-69, 70-74 y > 75 dB. Lnight 50-54 … > 70 dB.
  - Por debajo de 55 dB Lden no hay obligación de cartografiar: ahí el mapa no dice nada.
- **OMS 2018** (guías de ruido ambiental para Europa), por encima de estos niveles hay efectos en la salud:
  - Carretera: 53 dB Lden / 45 dB noche.
  - Tren: 54 / 44.
  - Avión: 45 / 40.
  - Todos los umbrales están por debajo del 55 de la directiva. En aviones, incluso fuera del contorno de 55 puede superarse la recomendación de la OMS.
- **Propuesta de etiquetas** (decide Ale):
  - Sin contorno: "below the official mapping threshold".
  - 55-59: "above WHO health guideline".
  - 60-64: "loud".
  - 65-69: "very loud".
  - ≥ 70: "extremely loud".
  - Una línea de ayuda: "Yearly average at the façade, evenings and nights weigh more. WHO recommends below 53 dB (roads), 54 (trains), 45 (aircraft)."

## Transporte público
**Cómo lo calcula el prototipo** (`app.js`):
- Algoritmo: CSA inverso sobre el GTFS de un martes, de 6:00 a 10:30.
- Andar: línea recta ×1,3 a 5 km/h. Radio de 1,2 km a paradas y 250 m entre paradas. Transbordo mínimo de 60 s.
- Valor mostrado: la media para llegar entre 30 min antes y 15 min después de la hora elegida.

**Validación** (2026-10-06):
- 11 orígenes × 3 destinos (Kirchberg, Gare, Cloche d'Or) = 18 pares. Martes 13/10/2026, llegar antes de las 08:30.
- Oficial = 08:30 − última salida de mobiliteit.lu que llega a tiempo. Prototipo = su mismo algoritmo, recalculado en Python en el punto exacto.

| Medida (min; negativo = prototipo optimista) | Actual | Corregido |
|---|---|---|
| Error medio | −3,0 | −0,7 |
| Mediana | −2,3 | −0,8 |
| Error absoluto medio | 3,0 | 1,7 |
| Peor caso | −15,4 (Walferdange → Cloche d'Or) | 4,8 |

**Causas y corrección (especificación enviada a construcción)**
1. **Bug**: el build ignora las restricciones de subida y bajada del GTFS (`pickup_type`/`drop_off_type` = 1).
   - Afecta a 668 conexiones sin subida y 315 sin bajada el martes (sobre todo buses regionales dentro de la ciudad).
   - Ejemplo: el prototipo baja del bus 606 en "Gasperich, Stengege Wee", donde está prohibido bajar.
2. **Andar demasiado rápido**: 4,5 km/h × 1,5 sobre la línea recta ajusta mejor que 5 km/h × 1,3.
   - Con un enrutador peatonal sobre OSM, la red real mide entre 1,14 y 1,94 veces la recta.
3. **Transbordo**: 180 s en vez de 60.
- Rejilla probada: factor 1,3-1,6 × velocidad 4,5-5 km/h × transbordo 60-180 s, con y sin el arreglo del bug.

| Par (origen → destino) | Prototipo actual | Corregido | mobiliteit.lu |
|---|---|---|---|
| Bonnevoie (50 Rue Auguste Charles) → Kirchberg (44 Av. J.F. Kennedy) | 31,9 | 34,1 | 35 |
| Bonnevoie → Cloche d'Or (2 Bd Raiffeisen) | 24,8 | 28,7 | 31 |
| Belair (50 Av. du X Septembre) → Kirchberg | 27,9 | 30,5 | 28 |
| Limpertsberg (50 Av. Pasteur) → Gare (9 Pl. de la Gare) | 21,3 | 23,4 | 24 |
| Strassen (100 Rte d'Arlon) → Kirchberg | 30,7 | 30,8 | 33 |
| Strassen → Gare | 23,6 | 30,8 | 26 |
| Bertrange (100 Rue de Luxembourg) → Kirchberg | 50,1 | 51,3 | 54 |
| Bertrange → Cloche d'Or | 35,3 | 37,5 | 39 |
| Hesperange (400 Rte de Thionville) → Kirchberg | 41,1 | 42,4 | 42 |
| Hesperange → Gare | 19,4 | 20,6 | 21 |
| Sandweiler (50 Rue Principale) → Kirchberg | 28,8 | 29,6 | 30 |
| Sandweiler → Gare | 24,8 | 25,6 | 25 |
| Kopstal (10 Rue de Luxembourg) → Gare | 36,8 | 37,6 | 37 |
| Contern (20 Rue de Luxembourg) → Kirchberg | 33,1 | 33,7 | 34 |
| Cessange (100 Rue de Cessange) → Kirchberg | 39,5 | 39,8 | 42 |
| Cessange → Gare | 17,0 | 17,3 | 19 |
| Walferdange (5 Rue de l'Eglise) → Kirchberg | 32,3 | 34,9 | 37 |
| Walferdange → Cloche d'Or | 47,6 | 59,7 | 63 |


**Límites**:
- Muestra pequeña (18 pares) y un solo día y hora.
- La línea recta sigue fallando donde hay barreras (ríos, autopistas, valles de Pfaffenthal y Grund). Lo exacto sería andar por la red de calles de OSM (esfuerzo medio).

## Andar y bici
**Cómo lo calcula el prototipo**: línea recta × minutos por km.
- Andar: 20 min/km (4,5 km/h × 1,5, igual que el acceso al transporte).
- Bici: 6 min/km (15 km/h × 1,5).

**Validación** (2026-10-07):
- 30 pares a pie (0,3-4 km) y 30 en bici (1-9 km) entre puntos reales de la zona (tiendas, colegios…).
- Rutas por calle con el enrutador público de OSM (routing.openstreetmap.de, perfiles foot y bike).

| Modo | Red / recta (mediana, p25-p75) | Velocidad del enrutador | App frente a red | Error relativo medio |
|---|---|---|---|---|
| Andar | 1,30 (1,23-1,47; máx. 1,75) | 4,5 km/h | **+15 %** (pesimista) | 15 % |
| Bici | 1,39 (1,28-1,59; máx. 2,11) | 15,2 km/h | +8 % | 15 % (peor −29 %) |

**Recomendación**:
- Modo andar: **17,5 min/km recto** (= ×1,3 a 4,5 km/h).
- Acceso al transporte: dejar 20 min/km (ajustado frente a mobiliteit.lu; absorbe márgenes del planificador).
- Bici: dejar 6 min/km.
- Límite: ni la recta ni el enrutador tienen en cuenta las cuestas (valles de Grund, Pfaffenthal y Clausen). Vel'oh es eléctrica, así que las cuestas pesan menos.

### Penalización por cuestas (integrada y validada el 2026-10-07)
- **Datos**: "Modèle numérique de terrain 75m" (Administration du cadastre et de la topographie, CC0).
  - El zip trae una rejilla nacional de 75 m y un modelo de 4 m (`test.dem`, LUREF) que cubre la ciudad.
  - Se usa la mediana del 4 m por celda donde existe (unas 8.000 celdas) y el 75 m en el resto.
  - El 75 m aplana los valles: da Pfaffenthal a 297 m cuando el 4 m da 244 m.
- **Cálculo**: subida neta de la celda al destino (la bajada no resta), solo la ida.
- **Factores**: a pie 0,07 min/m; en bici 0,10 min/m.
- **Validación**:
  - 10 pares de valle a meseta: Grund, Pfaffenthal, Clausen, Eich, Beggen y Hollerich → Ville-Haute, Kirchberg y Gare.
  - A pie, referencia: rutas reales de BRouter con la función de Tobler sobre su perfil de alturas, ritmo llano 4,5 km/h.
  - En bici, referencia: tiempo físico de BRouter (100 W) más la pérdida de un ciclista tranquilo a 15 km/h.

| Factor (min por m de subida neta) | A pie: sesgo / error absoluto | En bici: sesgo / error absoluto |
|---|---|---|
| 0 (sin cuesta) | −5,3 / 5,3 | −9,4 / 9,4 |
| 0,05 | −1,0 / 4,0 | — |
| **0,07** | **+0,7 / 4,6** | −3,5 / 3,6 |
| **0,10** | +3,2 / 5,7 | **−0,9 / 2,5** |
| 0,12 | — | +0,7 / 3,1 |

- **Dónde cambia de verdad** (a pie, mediana por zona; destino Kirchberg / Gare / Cloche d'Or, con el factor 0,1 de la primera medición):
  - Beggen, Eich, Pfaffenthal y Clausen: +10 / +7 / +4 min.
  - Grund: +8 / +6 / +2.
  - Hollerich: +7 / +5 / +1.
  - Fuera de la ciudad: Schuttrange y Walferdange, unos +8 a Kirchberg.
  - Con 0,07, multiplicar por 0,7.
- **Límites**:
  - Los errores grandes que quedan (hasta −13 min, Beggen → Kirchberg) vienen del rodeo de la ruta en los valles (ruta 1,6 × la recta), no de la cuesta.
  - Los ascensores públicos (Pfaffenthal, Grund) y el funicular quitan la cuesta en sitios concretos: excepciones pendientes.
- **Fuente para la pestaña Sources**: "Terrain: Modèle numérique de terrain 75 m (Administration du cadastre et de la topographie, data.public.lu, CC0)". BRouter y Tobler son solo validación interna.

## Alquiler
**Fuente actual**: alquileres anunciados del Observatoire de l'Habitat (Immotop, julio 2025-junio 2026), media de €/m² por barrio y municipio. El prototipo calcula m² × €/m² medio.

**Problema (confirma la sospecha de Ale)**: el €/m² medio está dominado por pisos pequeños. Datos oficiales:
- **Curva por tamaño** ("Loyers annoncés en 2025 dans l'aire fonctionnelle du Luxembourg", Observatoire de l'Habitat, 30/09/2026, figura 5, p. 17): €/m² anunciado según superficie, Luxemburgo 2025.

| Superficie | < 50 m² | 50-69 | 70-89 | 90-109 | 110-129 | ≥ 130 |
|---|---|---|---|---|---|---|
| Media €/m² | 56,3 | 31,9 | 26,9 | 26,1 | 22,9 | 21,0 |
| Mediana €/m² | 54,3 | 30,5 | 25,1 | 25,0 | 23,2 | 19,6 |

  - El 41,8 % de la oferta mide menos de 50 m². Superficie media 59 m², mediana 56 (tabla 4).
- **Anunciado frente a pagado** (Rapport d'analyse n.º 24, "Le cadastre des loyers – Premiers résultats", 05/06/2026, gráfico 10, p. 19): en Luxemburgo ciudad, 45,4 €/m² anunciado, 30,0 en contratos firmados en 2024-2025 y 26,5 en todos los contratos.
  - El propio informe dice que los anuncios incluyen coliving y habitaciones amuebladas, a pesar de los filtros.
- Caso Bonnevoie: 54,6 €/m² medio con un alquiler medio de 1.419 € (tamaño implícito: 26 m²). El prototipo daba 3.276 € por 60 m².

**Validación**:
- Muestra: anuncios activos en immotop el 06/10/2026, pisos de 45-75 m², mediana de €/m² por barrio o municipio.
- Solo cifras agregadas; no se guarda ningún anuncio.
- Ciudad: 96 anuncios, mediana 37,9 €/m².

| Modelo | Sesgo medio (€/m²) | Error absoluto medio |
|---|---|---|
| Prototipo actual (m² × media del barrio) | +10,3 | 10,9 |
| Corrección simple (€/m² barrio × f(S) / f(tamaño implícito)) | −4,3 | 5,5 |
| **Recomendado: curva oficial × índice de ubicación suavizado** | **−1,1** | **3,4** (≈ ±9 %) |
| Un único valor para toda la ciudad | −0,1 | 3,0 (pero sin diferencias entre zonas) |

Observado frente a recomendado (€/m², n):

| Zona | Observado | Recomendado | Prototipo actual |
|---|---|---|---|
| Bonnevoie | 33,6 (13) | 34,9 | 54,6 |
| Gare | 39,0 (19) | 40,2 | 58,9 |
| Gasperich | 40,0 (13) | 34,3 | 52,8 |
| Merl | 38,3 (10) | 36,0 | 39,7 |
| Ville-Haute | 36,3 (8) | 37,5 | 48,2 |
| Belair | 35,5 (6) | 35,9 | 42,2 |
| Hollerich | 34,3 (6) | 34,8 | 52,1 |
| Neudorf | 45,7 (5) | 33,7 | 50,9 |
| Limpertsberg | 34,7 (3) | 38,3 | 43,6 |
| Kirchberg | 38,2 (2) | 40,6 | 41,1 |
| Strassen | 40,1 (10) | 35,5 | 41,2 |
| Hesperange | 37,9 (6) | 34,9 | 38,7 |
| Bertrange | 34,1 (4) | 34,0 | 48,7 |

**Modelo recomendado (especificación enviada a construcción)**:
- `€/m²(zona, S) = f(S) × 1,04 × √(L_zona / L_nacional)`.
- `f(S)`: interpolación log-lineal entre (37 m², 56,3), (60, 31,9), (80, 26,9), (100, 26,1), (120, 22,9) y (145, 21,0); plana fuera de ese rango. Los < 50 m² se sitúan en 37 m² (primer cuartil nacional): es una suposición. **En el precio se sustituye por el ancla de 27 m²** (ver la corrección de monotonía); el 37 se mantiene solo para calcular L.
- `L_zona = €/m² medio / f(alquiler medio / €/m² medio)`: índice de ubicación con la mezcla de tamaños corregida, a partir de los mismos ficheros del Observatoire. `L_nacional` = 0,879 (fila "Moyenne nationale": 1.842,6 € y 44,20 €/m²).
- La raíz cuadrada reduce el ruido de los barrios con pocas ofertas o con mezcla rara (Neudorf, Gasperich con mucha obra nueva).
- 1,04: actualización de 2025 a la ventana 2025-26 (+5,8 % interanual en el 2.º trimestre de 2026).
- Municipios sin dato (< 30 ofertas, "*"): L = L_nacional.
- Mostrar como **alquiler pedido estimado** con rango ±10 %. Ejemplo: 60 m² en Bonnevoie ≈ 2.090 € (1.880-2.300); el prototipo daba 3.276 €.

**Corrección de monotonía** (2026-10-07; fallo detectado por Ale):
- Con la curva de ancla en 37 m², el alquiler total S × f(S) **bajaba** entre 43 y 74 m²: con presupuesto fijo, más metros abrían más zonas.
- **Especificación final** (integrada por construcción y documentada en `prototipo/README.md`):
  - Curva de precio log-lineal por (27, 56,3), (60, 31,9), (80, 26,9), (100, 26,1), (120, 22,9) y (145, 21,0). Comprobado: S × f(S) crece de 15 a 200 m².
  - Máximo acumulado como red de seguridad.
  - El índice L de cada zona sigue calculándose con la curva original (ancla en 37), porque corrige la media de €/m² de los ficheros, que incluye habitaciones.
- **Ancla "oficial"**: el informe no da la superficie media de cada clase. Del reparto (< 50 m²: 41,8 %) y la media de 59 m² sale que la clase de menos de 50 m² mide ~22-23 m² de media, pero ese ancla ajusta peor (sesgo de −2,9 €/m² en 30-60 m²).
- **Validación**: anuncios activos en Luxemburgo ciudad por tramos de superficie (233 anuncios, medianas; 07/10).

| Superficie | 19 | 34,5 | 45 | 54 | 65 | 80 | 100 | 120 |
|---|---|---|---|---|---|---|---|---|
| Observado €/m² | 56,0 | 54,2 | 46,0 | 40,2 | 35,2 | 33,7 | 29,7 | 27,9 |
| Modelo final €/m² | 61,5 | 53,3 | 44,5 | 38,4 | 33,3 | 29,4 | 28,5 | 25,0 |

- Error absoluto medio 2,5 €/m² (en 30-60 m², sesgo −1,4).
- Los barrios a 60 m² no cambian (sesgo −1,1; error 3,44).
- **Límite**: en la ciudad, los pisos grandes salen bajos (80-120 m²: −9 a −13 %), porque la curva nacional para pisos grandes mezcla zonas baratas. Posible mejora futura.

**¿Hay curva por tamaño por zona?** (revisado el 2026-10-07)
- Para alquileres **anunciados**, no: el informe del 30/09/2026 solo la da a escala nacional.
- Para alquileres **pagados**, sí: Rapport d'analyse n.º 24, gráfico 7, p. 13 (encuesta 2025, mediana €/m²; leído del gráfico, ±0,3).

| Zona | < 50 | 50-69 | 70-89 | 90-109 | 110-129 | ≥ 130 |
|---|---|---|---|---|---|---|
| Luxemburgo ciudad | 35,0 | 27,5 | 22,8 | 21,4 | 22,0 | 20,4 |
| Luxembourg-Campagne | 31,2 | 25,5 | 21,4 | 19,0 | 17,5 | 17,3 |
| Periferia (Capellen, Mersch) | 28,6 | 19,5 | 18,3 | 17,4 | 13,7 | 14,9 |
| Sur | 26,5 | 20,0 | 17,9 | 16,1 | 15,4 | 12,7 |
| Total | 30,0 | 22,5 | 19,2 | 17,8 | 16,8 | 15,7 |

- Por encima de 50 m², la forma de la curva por zona se parece a la nacional de anuncios. La diferencia está en menos de 50 m²: pagado = 1,27 veces la clase 50-69; anunciado = 1,76 (habitaciones y coliving).
- Prueba: rebajar el tramo de menos de 50 m² del modelo (56,3 → 50, 45 o 42) o cambiar el suavizado **no arregla Neudorf ni Gasperich** (siguen en 34-37 frente a 40-46 observado). Empeora el resto o no mejora el error absoluto (3,37-3,42 frente a 3,44).
- Causa probable: **obra nueva**. En el mismo informe, la clase energética A se paga un 26 % por encima de la mediana nacional (25,86 frente a 20,54 €/m²). Los anuncios de esos barrios son sobre todo pisos nuevos.
- Propuesta (decide Ale): en la ficha, "new-build flats usually cost more (up to ~25 %)", o un interruptor "new build". No cambiar el modelo.

**Límites**:
- Validación con pocos anuncios por barrio y en un solo día.
- Son alquileres pedidos, no pagados.
- Los barrios de obra nueva salen por debajo (Neudorf −12, Gasperich −6).
- Mejora futura: pedir al Observatoire la curva por tamaño y barrio, o los coeficientes de su simulador.

## POI y médicos: OSM + Overture
**Opciones descartadas o aparcadas**:
- Rastrear Google Maps: no (sus condiciones lo prohíben).
- Google Places API: no; no se puede mostrar sobre un mapa que no sea de Google y no se pueden guardar los puntos.
- Foursquare con token: aparcado (la cuenta la tendría que crear Ale).
- Doctena: solo con acuerdo comercial.

**Overture Places** (publicación 2026-09, 11.999 lugares en la zona ampliada):
- Fuentes y licencias: Meta, Microsoft, PinMeTo, DAC y Krick bajo CDLA-Permissive-2.0; Foursquare bajo Apache-2.0; AllThePlaces bajo CC0. Todas compatibles con uso comercial y con atribución.
- Confianza: mediana 0,80.
- Comparación con OSM en la zona del prototipo:
  - "Coincide" = a ≤ 75 m o con el mismo nombre a ≤ 250 m.
  - "Nuevos" = puntos de Overture con confianza ≥ 0,7 que no coinciden con OSM.

| Categoría | OSM | Overture (≥ 0,7) | Coinciden | Nuevos | Lectura |
|---|---|---|---|---|---|
| Supermercados | 79 | 142 | 79 | 63 | Overture mezcla ultramarinos y tiendas especializadas; hay Lidl, Delhaize y Cactus reales que faltan en OSM |
| Farmacias | 41 | 32 | 27 | 5 | OSM casi completo; Overture añade 3-4 reales (Contern, Strassen, Gasperich…) |
| Médicos | 93 | 47 | 17 | 30 | Overture no arregla el hueco: los nuevos son sobre todo fisioterapeutas, spas y crioterapia |
| Gimnasios | 45 | 90 | 33 | 57 | Overture mucho mejor (Basic-Fit, F45, Kieser…) |
| Guarderías y crèches | 115 | 72 | 21 | 51 | Overture añade crèches privadas reales |
| Colegios | 148 | 63 | 36 | 27 | Los "nuevos" son sobre todo campus grandes de OSM con el centro lejos del punto: no añadir |

**Regla de fusión recomendada**:
1. OSM como base en todas las categorías.
2. Añadir de Overture solo lo que encaje por categoría, nombre y confianza:

| Categoría | Taxonomía Overture | Confianza | Además |
|---|---|---|---|
| Gimnasios | `gym`, `sport_or_fitness_facility`, `gymnastics_center` | ≥ 0,8 | Excluir `fitness_trainer` y `yoga_studio` (opcional) |
| Guarderías | `child_care_and_day_care`, `day_care_preschool`, `preschool` | ≥ 0,8 | Nombre con crèche, creche, kinder, nursery, maison relais, foyer, spillschoul o garderie |
| Supermercados | `grocery_store`, `organic_grocery_store`, `discount_store` | ≥ 0,8 | Solo cadenas o supermercados por nombre: Cactus, Delhaize, Lidl, Aldi, Auchan, Carrefour, Match, Colruyt, Naturata, Alnatura, Biogros, Massen, Pall Center, Proxy |
| Farmacias | `pharmacy` | ≥ 0,75 | Nombre con pharmacie, apdikt o apotheke; excluir hospitalarias y parafarmacias (Hospilux, Medi-Market) |
| Médicos y colegios | — | — | No añadir |

3. **Quitar duplicados**: descartar el punto de Overture si está a ≤ 100 m de un elemento OSM de la misma categoría (punto, o centro y contorno del área), o a ≤ 300 m con una palabra del nombre en común de 4 letras o más (sin contar pharmacie, creche, luxembourg, sàrl…).
4. Atribución: "© OpenStreetMap contributors · Overture Maps Foundation (CDLA-Permissive-2.0; incluye Meta, Microsoft, Foursquare Apache-2.0, AllThePlaces CC0)".

**Contraste con las listas oficiales de 2021** (Ministerio de Educación, CC0; geocodificadas con geoportail; 2026-10-07):

| Categoría | Oficiales en la zona | Cubiertos por OSM | Con OSM + Overture |
|---|---|---|---|
| Escuelas fundamentales | 39 | 39 (100 %) | — |
| Liceos | 24 | 23 (96 %) | — |
| Crèches (SEA de niños pequeños) | 177 | 74 (42 %) | 91 (51 %) |
| Maisons relais (SEA de escolares) | 68 | 19 (28 %) | 21 (31 %) |

- **Colegios**: OSM vale. Tiene además 37 sin equivalente oficial: privados o internacionales, que sirven, y algunos que no son para familias (música, policía).
- **Guarderías**: la base pasa a ser la lista oficial SEA 2021 (704 en el país, 245 en la zona; el 96 % geocodificado con número de portal).
  - Se completa con 25 guarderías de OSM y Overture a más de 100 m de un SEA (abiertas después de 2021 o privadas fuera de la lista).
  - Fichero para construcción: `~/.cache/nether_app/raw/sea_2021_geocoded.json` (fuera del vault).
- **Integrado** (2026-10-07): guarderías = 306 SEA (zona ampliada) + 31 de OSM y Overture a más de 100 m = 337. Colegios = 145 de OSM, sin música, policía ni autoescuelas.
- **Límite**: la lista es de 2021, así que puede haber altas y bajas.

**Otros contrastes**:
- Farmacias: el directorio de pharmacie.lu (sindicato de farmacéuticos) muestra unas 36 en los municipios de la zona; OSM tiene 41 en la zona ampliada. Cobertura buena (solo comparar, no copiar).

**Médicos**:
- Ninguna fuente abierta los resuelve.
- Recomiendo pedir el conjunto de datos al Ministerio de Sanidad (professions.medicales@ms.etat.lu), pero solo con el OK de Ale, porque es contactar con fuera.
- Mientras tanto: médicos de OSM con el aviso "incomplete".

## Fuentes de esta nota
- Directiva 2002/49/CE (anexos I y VI): https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32002L0049
- OMS, guías de ruido ambiental para Europa (2018): https://www.who.int/publications/i/item/9789289053563
- Planificador oficial: https://www.mobiliteit.lu/en/ (cdt.hafas.de)
- Loyers annoncés en 2025 dans l'aire fonctionnelle du Luxembourg (30/09/2026): https://logement.public.lu/dam-assets/documents/publications/observatoire/loyers-annonces-en-2025-dans-l-aire-fonctionnelle-du-luxembourg.pdf
- Rapport d'analyse n.º 24, cadastre des loyers (05/06/2026): https://logement.public.lu/dam-assets/documents/publications/observatoire/rapport-analyse-24.pdf
- Anuncios activos (validación agregada): https://www.immotop.lu
- Overture, licencias: https://docs.overturemaps.org/attribution/
- Foursquare OS Places: https://huggingface.co/datasets/foursquare/fsq-os-places
- Google Maps Platform, condiciones por servicio: https://cloud.google.com/maps-platform/terms/maps-service-terms
- Médicos, directorios oficiales: https://mediateursante.public.lu/fr/soins-luxembourg/prestlux/med.html
- Farmacias (contraste): https://pharmacie.lu/pharmacies
- Enrutador peatonal y ciclista (OSM): https://routing.openstreetmap.de
- BRouter (rutas con altura, validación de cuestas): https://brouter.de
- Modelo del terreno 75 m (incluye el de 4 m de la ciudad): https://data.public.lu/fr/datasets/modele-numerique-de-terrain-75m/
- Mapas estratégicos: https://data.public.lu/en/datasets/environmental-noise-strategic-noise-maps/
- Aglomeraciones, grandes carreteras y vías (DF1_5): https://data.public.lu/fr/datasets/environmental-noise-report-on-all-major-roads-railways-airports-and-agglomerations-df1-and-df5/
- Planes de acción 2026: https://data.public.lu/fr/datasets/environmental-noise-noise-action-plans/
