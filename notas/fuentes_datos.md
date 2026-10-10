---
tipo: nota
proyecto: app_donde_vivir
fecha: 2026-10-06
---
# Fuentes de datos (Luxemburgo, prototipo v0)
> Licencias leídas en data.public.lu el 2026-10-04 (campo de licencia oficial del conjunto de datos). Todas permiten uso comercial.
> CC0 = sin condiciones · CC-BY = citar la fuente · ODbL = citar "© OpenStreetMap contributors"; si se publica la base de datos derivada, con la misma licencia.

| Capa del v0 | Fuente | Licencia | Formato | Notas y límites |
|---|---|---|---|---|
| Transporte público | Horarios y paradas GTFS, Administration des transports publics (data.public.lu) | CC-BY | GTFS (zip) | Actualizado cada semana. Bus, tranvía y tren; sin funicular ni ascensores. También hay versión NeTEx (CC0). |
| Andando y bici | Red de calles y carriles bici de OpenStreetMap | ODbL | OSM | Pendientes con el modelo del terreno (abajo). |
| Pendientes | Modèle numérique de terrain 75 m (ACT); el zip incluye un modelo de 4 m de la ciudad | CC0 | ESRI ASCII / XYZ (18,7 MB) | Integrado el 2026-10-07: subida neta a pie (0,07 min/m) y en bici (0,10). El LiDAR 2019 (27 GB) no hace falta. |
| Ruido aviones | Mapas estratégicos de ruido 2021, aeropuerto (Administration de l'environnement) | CC0 | GeoPackage | Contornos Lden 55-59, 60-64, 65-69, 70-74, ≥ 75 dB y Lnight. Oficiales. |
| Ruido trenes | Mapas estratégicos de ruido 2021, ferrocarril | CC0 | GeoPackage (61 MB) | Grandes líneas y ferrocarril en la aglomeración. |
| Ruido aviones 2023 | Mapa estratégico intermedio del aeropuerto, tráfico 2023 (Administration de l'environnement; estudio de Acoustic Technologies, febrero de 2025), dentro del zip "Strategic noise maps 2023 on major airport – Documentation" | CC0 | Shapefile (Lden y Lnight) | Sustituye al de 2021 (tráfico de 2023 y método corregido). El `.prj` dice Web Mercator, pero las coordenadas son EPSG:2169. Banda en `LEVEL_1`. Ver `notas/calidad_datos.md`. |
| Ruido carreteras | Mapas estratégicos de ruido 2021, grandes carreteras y aglomeración | CC0 | GeoPackage (310 y 484 MB) | Incluye las avenidas principales de la ciudad. La aglomeración (10 municipios) cubre solo el 66 % de la zona del prototipo: ver `notas/calidad_datos.md`. |
| Ruido: zona cartografiada | Aglomeraciones de la directiva de ruido (DF1_5), AggloLux y AggloSud | CC0 | GeoPackage (118 KB) | Para marcar cada celda como cartografiada o no. |
| Alquiler | Alquileres anunciados por barrio (Ciudad) y por municipio (país), Observatoire de l'Habitat | CC0 | Excel | Últimos 12 meses, actualizado cada trimestre. Precio medio por m² sesgado al alza por estudios pequeños: usar solo como índice de ubicación (modelo en `notas/calidad_datos.md`). |
| Alquiler por tamaño | "Loyers annoncés en 2025 dans l'aire fonctionnelle du Luxembourg" (Observatoire de l'Habitat, 30/09/2026), figura 5 · Rapport d'analyse n.º 24 "Le cadastre des loyers" (05/06/2026), gráfico 10 | Publicación oficial; se usan cifras citadas (sin licencia de datos explícita) | PDF | Curva de €/m² por clase de superficie y comparación entre lo anunciado y lo pagado. Citar la fuente en la app. |
| Barrios y municipios | Quartiers de la Ville de Luxembourg (Ville de Luxembourg) · Limites administratives (ACT) | CC-BY · CC0 | GeoJSON | Para agrupar resultados por barrio. |
| Direcciones | BD-Adresses, direcciones georreferenciadas (ACT) | CC0 | CSV/GeoJSON | Para situar el trabajo, el colegio y "mis lugares" sin depender de geocodificadores externos. |
| Mapa base | Carte de base WMS/WMTS (ACT) | CC0 | WMTS | Solo Luxemburgo; para otras ciudades hará falta otro proveedor. |
| Supermercados, farmacias, gimnasios, bares, parques, colegios, guarderías, universidades | OpenStreetMap | ODbL | OSM | Recuento en la ciudad y alrededores (2026-10-04): supermercados 56, farmacias 27, gimnasios 36, bares y discotecas 173, parques 104, colegios 93, guarderías 75, universidades 4. |
| Gimnasios, guarderías, supermercados y farmacias (complemento) | Overture Maps Places (publicación mensual) | CDLA-Permissive-2.0 (Meta, Microsoft…), Apache-2.0 (Foursquare), CC0 (AllThePlaces) | GeoParquet / GeoJSON | Solo para completar OSM con la regla de fusión de `notas/calidad_datos.md`. Atribución: "Overture Maps Foundation". |
| Médicos | OpenStreetMap | ODbL | OSM | **En espera (Ale, 07/10: bastan hospitales y farmacias)**. **Incompleto**: solo 67 médicos y clínicas en la zona. No hay directorio abierto encontrado; en v0 mostrar hospitales y farmacias y avisar. |
| Vel'oh (bici pública) | Estaciones GBFS 3.0 de JCDecaux para la Ville de Luxembourg: `https://api.cyclocity.fr/contracts/luxembourg/gbfs/v3/station_information.json` (sin clave) | JCDecaux Open Licence | JSON | Integrado en v0 por decisión de Ale (2026-10-06). Atribución visible: "Vel'oh! – JCDecaux". **Antes de monetizar: contactar con JCDecaux** (developer.jcdecaux.com) para confirmar el uso comercial. |
| Colegios (contraste) y guarderías | Adresses des bâtiments scolaires 2021 (Ministère de l'Éducation): escuelas fundamentales, liceos y **SEA (crèches y maisons relais)** | CC0 | Excel | Colegios: solo contraste (OSM cubre el 100 % y el 96 %). **Guarderías: fuente principal** (la lista SEA de 704 centros, geocodificada), porque OSM solo cubre el 42 % de las crèches. Ver `notas/calidad_datos.md`. |

## Versiones en uso (actualizar en cada pasada de `protocolos/actualizacion_datos.md`)
| Fuente | Versión o fecha en uso | Próxima revisión |
|---|---|---|
| Horarios GTFS | Descargado el 2026-10-02 (conjunto del 2026-10-01); día modelado: martes 2026-10-13 | Noviembre 2026; extra tras el cambio de diciembre |
| Alquiler por barrio y municipio | Observatoire, publicado el 2026-09-24 (anuncios de julio 2025 a junio 2026) | Finales de marzo de 2027 |
| Serie nacional de alquileres (factor t) | Publicada el 2026-09-24 (hasta el 2.º trimestre de 2026); t = 1,04 | Diciembre 2026 (3.er trimestre) |
| Curva por tamaño f(S) | Informe del 2026-09-30 (anuncios de 2025); ancla de < 50 m² en 27 m² | Septiembre 2027 |
| Ruido de carreteras, trenes y aglomeración | Mapas estratégicos de 2021 (publicados el 2025-07-24) | Ronda de 2027 |
| Ruido de aviones | Mapa intermedio de 2023 (publicado el 2025-03-27) | Ronda de 2027 |
| Lugares OSM | Descarga del 2026-10-06 | Noviembre 2026 |
| Overture Places | Publicación 2026-09 (17/09) | Noviembre 2026 |
| Vel'oh | GBFS, descarga del 2026-10-07 | Noviembre 2026 |
| Guarderías SEA y colegios | Listas de 2021 (publicadas el 2023-03-28) | Octubre 2027 |
| Límites de municipios | Versión del 2023-11-23 (el conjunto se actualiza cada mes; cambios reales, con las fusiones) | Enero 2027 |
| Terreno | MNT de 75 m + 4 m de la ciudad (paquete del 2016) | Sin revisión |

## Huecos del v0 (revisado 2026-10-06)
> La sesión de datos es dueña de este archivo desde el 2026-10-06 (`CLAUDE.md`, "Reparto"). El análisis de exactitud de cada criterio va en `notas/calidad_datos.md`.

| Hueco | Qué hay | Licencia | Recomendación |
|---|---|---|---|
| Médicos | Ningún directorio abierto. Doctena, Editus, yellow.lu y medecins-generalistes.lu son privados (no copiar). En data.public.lu solo hay estadísticas agregadas y un PDF de médicos aeronáuticos | — | v0: hospitales + farmacias + médicos de OSM con aviso "incompleto". Después: pedir al Collège médical o al Ministerio de Sanidad una lista con licencia |
| Crèches y maisons relais | **Resuelto (2026-10-07)**: hay lista oficial abierta de 2021 (SEA, CC0) en el conjunto "Adresses des bâtiments scolaires 2021". Además, el directorio actual del Ministerio de Educación en accueilenfant.lu (buscador y mapa) no tiene descarga ni licencia publicadas. Lux-guide tiene una lista geolocalizada con marca de "concertado" y "chèque-service", sin fuente citada para esta parte | Desconocida | v0: OSM (`kindergarten`/`childcare`). Para usar la oficial, pedir permiso o conjunto de datos al Ministerio; no copiar la de Lux-guide |
| Alquiler por tamaño | Los conjuntos abiertos (commune, barrio, serie nacional) solo dan la media €/m², sin desglose por dormitorios ni percentiles. El **simulador de alquileres** del Observatoire de l'Habitat calcula por commune, tipo, dormitorios, m², terraza y parking (modelo hedónico sobre anuncios de Immotop), pero no publica coeficientes ni datos | CC0 (medias) · simulador sin licencia de datos | v0: media €/m² con aviso de sesgo por estudios. Después: pedir al Observatoire los coeficientes o una tabla por tamaño |
| Vel'oh (bici pública) | Conjunto "Mobilité - Veloh" en data.public.lu (Ville de Luxembourg): ~145 estaciones; GBFS v3 de JCDecaux (`api.cyclocity.fr/contracts/luxembourg/gbfs/v3`) | "JCDecaux Open Licence": acceso libre, pero JCDecaux pide contactar para uso comercial o de mucho volumen | v0 (prueba con usuarios, sin ingresos): usable con atribución. Antes de monetizar: confirmar con JCDecaux |

## Frontera (después del v0, decisión de Ale 2026-10-06)
> Candidatas, sin verificar en detalle. Cobertura y exactitud: pendiente en `notas/calidad_datos.md`.

| Capa | Francia | Bélgica | Alemania |
|---|---|---|---|
| Transporte público | Fluo Grand Est Moselle (57) y Meurthe-et-Moselle (54), GTFS en transport.data.gouv.fr, Licence Ouverte 2.0; redes urbanas (p. ej. Thionville, Metz) por separado | TEC (Valonia), GTFS, CC0. SNCB: reutilización solo con contrato, sin redistribuir datos brutos (**problema**) | gtfs.de (todo el país, a partir de DELFI), CC BY 4.0; VRT (Tréveris) también en opendata.vrn.de |
| Ya incluido en Luxemburgo | El GTFS nacional de Luxemburgo trae líneas RGTR y trenes CFL que cruzan la frontera (Lux-guide enseña "paradas fuera de Luxemburgo") → parte de la frontera ya sale sin fuentes nuevas | | |
| Ruido | Mapas estratégicos de la directiva europea: conjunto de la Agencia Europea de Medio Ambiente (EEA), ronda 2022, GeoPackage (publicado en marzo de 2026); reutilización con atribución (verificar). Fuentes nacionales más finas: pendiente | | |
| Alquiler | "Carte des loyers" 2025 (ANIL y ministerio), por commune, €/m² con cargas, **separado por estudios-T2, T3 o más y casas**, con intervalo de confianza; Licence Ouverte 2.0 | Sin fuente abierta encontrada por commune (hueco) | Censo 2022: alquiler neto en frío por rejilla de 100 m; Datenlizenz Deutschland – Namensnennung 2.0 (atribución) |
| Servicios, calles | OpenStreetMap (ODbL), igual que en Luxemburgo | | |

## Pendiente
- Para otras capitales: GTFS y OSM suelen existir; mapas de ruido por la directiva europea (ciudades > 100.000 hab.); el alquiler es lo que más cambia de un país a otro.

## Enlaces
- GTFS: https://data.public.lu/en/datasets/horaires-et-arrets-des-transport-publics-gtfs/
- Ruido: https://data.public.lu/en/datasets/environmental-noise-strategic-noise-maps/
- Alquiler por barrio: https://data.public.lu/en/datasets/loyers-annonces-des-logements-a-luxembourg-ville-par-quartier/
- Alquiler por municipio: https://data.public.lu/en/datasets/loyers-annonces-des-logements-par-commune/
- Direcciones: https://data.public.lu/en/datasets/adresses-georeferencees-bd-adresses/
- Límites: https://data.public.lu/en/datasets/limites-administratives-du-grand-duche-de-luxembourg/
- Barrios: https://data.public.lu/en/datasets/carte-topographique-quartiers-de-la-ville-de-luxembourg/
- Mapa base: https://data.public.lu/en/datasets/carte-de-base-webservices-wms-et-wmts/
- Terreno: https://data.public.lu/en/datasets/lidar-2019-modele-numerique-de-terrain-mnt/
- Colegios 2021: https://data.public.lu/en/datasets/adresses-des-batiments-scolaires-2021/
- Vel'oh: https://data.public.lu/en/datasets/mobilite-veloh/
- Simulador de alquileres: https://logement.public.lu/fr/observatoire-habitat/prix-de-location/simulateur.html
- Frontera, GTFS Moselle: https://transport.data.gouv.fr/datasets/offre-de-transport-du-reseau-fluo-grand-est-moselle-57
- Frontera, GTFS TEC: https://transportdata.be/fr/dataset/tec-gtfs
- Frontera, GTFS Alemania: https://gtfs.de/en/feeds/de_full/
- Frontera, alquiler Francia: https://www.data.gouv.fr/datasets/carte-des-loyers-indicateurs-de-loyers-dannonce-par-commune-en-2025
- Frontera, alquiler Alemania (censo 2022): https://www.zensus2022.de
- Overture Places: https://docs.overturemaps.org/guides/places/
- Ruido aviones 2023 (zip): https://download.data.public.lu/resources/environmental-noise-strategic-noise-maps/20250327-151652/strategic-noise-maps-2023-on-major-airport-documentation.zip
- Frontera, ruido UE: https://www.eea.europa.eu/en/datahub/datahubitem-view/c952f520-8d71-42c9-b74c-b7eb002f939b
