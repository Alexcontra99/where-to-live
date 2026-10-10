# Data sources

Every layer shown in the app carries its source, date and granularity. Social services (addiction, mental-health and psychosocial centres, shelters) are excluded on purpose (data ethics rule in the README).

## Madrid

| Layer | Source | Granularity | Refresh | Licence |
| --- | --- | --- | --- | --- |
| District polygons | [Geoportal Ayuntamiento de Madrid — Distritos (SHP, EPSG:25830)](https://geoportal.madrid.es/fsdescargas/IDEAM_WBGEOPORTAL/LIMITES_ADMINISTRATIVOS/Distritos/Distritos.zip) | 21 districts | Rarely | CC BY 4.0 |
| Neighbourhood polygons | [Geoportal — Barrios (SHP, EPSG:25830)](https://geoportal.madrid.es/fsdescargas/IDEAM_WBGEOPORTAL/LIMITES_ADMINISTRATIVOS/Barrios/Barrios.zip) | 131 barrios | Rarely | CC BY 4.0 |
| Population | [Padrón municipal](https://datos.madrid.es/dataset/200076-0-padron) | District, barrio | Monthly | CC BY 4.0 |
| Police interventions | [Policía Municipal — datos estadísticos](https://datos.madrid.es/dataset/212616-0-policia-estadisticas) | District, monthly | Monthly | CC BY 4.0 |
| Schools | [Comunidad de Madrid — centros educativos](https://datos.comunidad.madrid/dataset/centros_educativos) | Address (UTM 30N) | Several times a year | CC BY 4.0 |
| Health centres, hospitals | [Ayuntamiento — Centros de atención médica](https://datos.madrid.es/dataset/212769-0-atencion-medica) | Address | Continuous | CC BY 4.0 |
| Shops, parks, transport, nightlife | OpenStreetMap via Overpass API | Point | On each run | ODbL — attribution "© OpenStreetMap contributors" required in the app |
| Noise | Madrid strategic noise map | Street segment | Per round (5 years) | Pending: not loaded yet |

### What the safety number is

`headline` = Policía Municipal interventions **related to people** plus **related to property**, summed over the last 12 published months, per 1,000 residents of the district. It is not a crime rate: it counts police activity, which also reflects where police patrol. The app must say so in plain words.

`context` categories (stored, shown only as detail): weapons, drug possession, drug use, street drinking, venue complaints. They mostly measure enforcement effort, so they never feed the headline.

## POI categories

`supermarket`, `pharmacy`, `park`, `gym`, `metro_station`, `bus_stop`, `nightlife` (bar, pub, nightclub), `restaurant`, `cafe`, `school`, `health_centre`, `hospital`, `health_specialist`.
