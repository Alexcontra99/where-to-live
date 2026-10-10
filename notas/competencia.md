---
tipo: nota
proyecto: app_donde_vivir
fecha: 2026-10-06
---
# Competencia
> Investigación de Claude, 2026-10-06 (web; no se han probado las herramientas por dentro). Sustituye a la primera lista del 2026-10-03.

## Conclusión
- **Clon exacto: no encontrado**, ni en Luxemburgo ni fuera. Nadie junta trayectos de 2 personas con horarios reales + ruido oficial por tipo + alquiler por barrio + servicios a la distancia que elija el usuario + IA que explica el limitante.
- **La idea general está muy copiada fuera de Luxemburgo**: más de 20 herramientas de "dónde vivir según tus criterios" (Francia, Alemania, Austria, Suiza, Reino Unido, EE. UU.). Muchas son de 2025-2026 y de una sola persona (hechas con Lovable, Vercel, GitHub Pages): la tecnología no protege.
- **En Luxemburgo hay piezas sueltas, no el producto**: el portal Immotop busca por trayecto, TravelTime hace solapes de trayecto gratis con transporte público y **Lux-guide** (el más cercano, ver abajo) tiene trayectos sin transbordo, comparador de direcciones y communes con frontera, pero ninguno recomienda zonas según tus criterios.
- La ventaja estaría en los datos locales bien hechos (barrio, no commune; ruido oficial; horarios reales), en el inglés para expatriados y en la distribución (conseguir usuarios y socios), no en la idea.

## Pruebas por dentro (2026-10-06)
> Probadas en el navegador con datos de ejemplo (lugares públicos, sin cuentas). Ejes de Ale: filtros, transporte, ruido, alquiler, servicios públicos, asistente de IA.

| Herramienta | Filtros | Transporte | Ruido | Alquiler | Servicios | Asistente IA |
|---|---|---|---|---|---|---|
| **wohnwahn** (AT) | Cada característica con 1 toque = "sería bonito" (ordena) y 2 toques = "imprescindible" (filtra); prioridades (tranquilo, trayecto corto, barato, vida urbana); contador de resultados en vivo | 1 destino (atajos + dirección propia); transporte público, bici, a pie, coche; 15-60 min; "solo dentro" o "los más lejos quedan abajo" | Mapa oficial por dirección, "tranquilo" < 60 dB; **"donde no hay mapa, no afirmamos nada"** | Por anuncio, "un X % más barato que comparables" | Sol, calor, verde, internet; fuente indicada en cada filtro | **Sí**: una frase (o voz) se convierte en filtros editables (chips con ✕). Falló en la prueba: pedí Viena y salieron pisos de Graz |
| **Chacun Son Lieu** (FR) | Cuestionario de 22 preguntas en 5 pasos; incluye filtros demográficos (ingresos, diplomas, propietarios o inquilinos, tipo de vecinos) | Hasta 3 trayectos; coche, transporte público, bici; tiempo máximo | Solo "calmado o animado" | Presupuesto mensual | Comercios, transporte, colegios, salud, deportes, ocio, cultura | No. **Resultado bloqueado tras registro** (nombre, correo, contraseña) con casilla de ofertas de socios: ganan dinero con los contactos |
| **AptHunt** (NYC) | 9 factores, peso de 0 a 5 | Fijo a Midtown (no eliges destino) | Puntuación "tranquilo" | Alquiler típico | Parques, restaurantes, ocio | No. Cada barrio despliega "por qué este puesto": valor real por factor + **"dato no disponible"** + "basado en 7 de 9 factores" |
| **ZIPsuche** (CH) | Solo trayecto (+ impuestos y seguro opcionales) | **2 personas** en 2 tarjetas; dirección, modo y tiempo máximo cada una | — | — | — | No. Resultado: tabla de communes con el tiempo de cada uno ("P1 5' · P2 32'") y deslizadores por persona para afinar después. Lleva espacios de publicidad |
| **Wohnortatlas** (DE) | Preferencias (ordenan) frente a exclusiones (ocultan); ponderación por defecto "calidad de vida equilibrada" | 1 destino o "por sector de empleo"; preferencia por modo (nada, si hace falta, me gusta); r5py + GTFS | Mapas UE de carreteras, trenes y aviones | Censo 2022 ajustado | Ocio, naturaleza, internet, clima, inundaciones | No. **Código abierto (licencia MIT)**: web estática con MapLibre + Deck.gl, misma arquitectura que nuestro v0 |
| **TravelTime** (app) | — | Hasta 3 orígenes, solape; transporte público en Luxemburgo funciona (isócrona desde Kirchberg); hora de salida | — | — | Lista de lugares alcanzables, **vacía en Luxemburgo** | No |
| **Lux-guide** (LU) | — | Destino → todas las paradas **sin transbordo** coloreadas por tiempo, con frecuencia de 6:30 a 9:30 y opción de mostrar paradas fuera de Luxemburgo (GTFS nacional, martes de referencia) | — | Communes (48 indicadores, 1.006 communes con frontera) | Comparador de hasta 4 direcciones: colegios, maisons relais, crèches, liceos, transporte, comercios, salud en 500 m-2 km (a vuelo de pájaro) | Sí, pero solo busca en su guía: a "dos personas, Kirchberg y Belval, 2.000 €, tranquilo" contestó con la ficha de vivir en la frontera. No calcula zonas |
| **Locco** (LU) | 3 puntuaciones de 0 a 10 por commune (vida urbana, familias, naturaleza) | — | — | €/m² compra y alquiler | — | No. 34 communes; sin metodología visible |

### Qué aprender para el v0
- **Imprescindible frente a deseable** (wohnwahn, Wohnortatlas): lo imprescindible filtra, lo deseable ordena. Es el estándar de los mejores.
- **Una tarjeta por persona** con su trayecto y, en el resultado, el tiempo de cada una por zona (ZIPsuche).
- **Desglose por zona** con valor real, si cumple y "sin datos" (AptHunt); nunca rellenar huecos (wohnwahn).
- **Fuente visible en cada filtro** (wohnwahn): encaja con el principio de datos verificables.
- **Contador en vivo** de zonas que cumplen mientras se tocan filtros (wohnwahn).
- **Sin registro para ver el resultado**: Chacun Son Lieu lo bloquea, y es fricción.
- **Sin filtros demográficos**: Chacun Son Lieu filtra por ingresos y diplomas de los vecinos; nuestro principio de filtros neutrales nos diferencia.
- **IA de frase a filtros**: siempre enseñar lo entendido como chips editables, porque falla (wohnwahn confundió la ciudad). La IA que explica qué limita y cuantifica alternativas sigue sin existir en ninguna.

## Lo más parecido, por cercanía a la idea
| Herramienta | País | Qué hace | Qué le falta frente a la nuestra |
|---|---|---|---|
| [Chacun Son Lieu](https://www.chacunsonlieu.fr/) | FR | Hasta 3 trayectos (coche, transporte público, bici), criterios de imprescindible a opcional, distancia a servicios, nivel ciudad, barrio y dirección, más de 100 indicadores oficiales | Solo Francia. Gratis con opciones de pago y socios |
| [wohnwahn](https://wohnwahn.at/) | AT | Portal de anuncios que puntúa cada piso por trayecto real, ruido, verde, sol y calor (datos oficiales + OSM); atlas de barrios en 9 ciudades | Solo Austria; empieza por el piso. Gratis y sin comisiones |
| [Mavilà](https://mavila.fr/) | FR (Lyon) | 502 barrios, mapa de rojo a verde según encaje; gris si no cumple presupuesto o trayecto; datos oficiales | Una ciudad, un trayecto. **Fuera de servicio** al consultarlo |
| [ZIPsuche](https://zipsuche.lovable.app/suche) | CH | Pareja: trabajo de cada uno y tiempo máximo → communes ordenadas, con impuestos y seguro médico | Solo trayecto + costes; sin alquiler, ruido ni servicios. Hecho con Lovable |
| [Deutscher Wohnortatlas](https://wohnortatlas.de/) | DE | Puntúa cada lugar según tus criterios: alquiler, conexión, vida diaria, naturaleza, tranquilidad | Solo Alemania; no se ha podido ver si deja meter destinos propios |
| [CloseMove](https://closemove.com/) | UK (Londres) | 1-6 personas: trabajo, presupuesto y trayecto máximo de cada una → anuncios reales que les sirven a todas | Solo trayecto + anuncios; sin ruido ni servicios. Gratis con límite diario |
| [Crystal Roof](https://crystalroof.co.uk/) | UK | Informe por código postal: ruido, colegios, transporte, servicios, aire, inundaciones, delincuencia | Informe de una zona, no recomendador |
| [Mapumental](https://en.wikipedia.org/wiki/Mapumental) | UK | Mapa de trayecto en transporte público con varios destinos (hogares de 2 o más) | Solo trayecto; proyecto antiguo de mySociety |
| [AptHunt](https://nyc.apthunt.org/explore/match) | US (NYC) | Pesos de 0 a 5 a alquiler, trayecto, tranquilidad, ocio, parques…; 220 barrios; enseña qué factores pesan y cuáles no tienen datos | Solo Nueva York |
| [SettleSavvy](https://settlesavvy.ai/) | US | Puntúa barrios según tus prioridades (seguridad, colegios, trayecto, coste); gratis | Gana dinero derivando a agentes inmobiliarios |
| [BestNeighborhood](https://bestneighborhood.org/), [WouldYouLiveThere](https://www.wouldyoulivethere.com/find), [AreaVibes](https://www.areavibes.com/), Niche | US | Puntúan barrios con pesos ajustables (precio, colegios, ruido, trayecto en coche…) | EE. UU.; puntuación genérica |
| [Map AI](https://map-ai.co/) | US | Más de 100 indicadores + chat de IA sobre cualquier zona | De pago (79 $/mes); sin recomendador de dónde vivir |
| [Localize](https://www.brickunderground.com/rent/how-does-localize-new-apartment-search-compare-to-streeteasy-nyc) | US (NYC) | Anuncios + ruido, sol por fachada, obras; filtros como calles tranquilas | Solo Nueva York |
| [Gentry](https://www.gentry.fr/outils/ou-habiter), [Choisir sa ville](https://choisirsaville.fr/), [ou-habiter.app](https://ou-habiter.app/), [Ville Idéale](https://my-ideal-city.vercel.app/) | FR | Comparan communes francesas por presupuesto, trayecto, colegios, servicios | Nivel commune, no barrio |

## Herramientas genéricas que ya cubren Luxemburgo
| Herramienta | Qué hace en Luxemburgo | Qué le falta |
|---|---|---|
| [TravelTime](https://app.traveltime.com/) (app gratis) | Hasta 3 puntos de partida, solape de zonas alcanzables; transporte público en Luxemburgo [cubierto](https://docs.traveltime.com/api/overview/supported-countries) | Solo trayecto. Es el mismo motor que usan Rightmove y Zoopla |
| [Funda](https://content.funda.nl/zoekbetervindmeer/zoekenopreistijd/), [Pararius](https://scanmovers.com/nl/blog/smartmap-pararius), [Leefbaarometer](https://www.leefbaarometer.nl/) | No cubren Luxemburgo (Países Bajos), pero son el modelo de "trayecto + mapa de habitabilidad oficial" | — |
| [Nomads](https://nomads.com/neighborhoods/luxembourg) | Mapa de barrios con opiniones de usuarios | Subjetivo, sin criterios propios |

## Luxemburgo
| Quién | Qué hace | Relación con la idea |
|---|---|---|
| [Immotop](https://www.corporatenews.lu/en/archives-shortcut/archives/article/2022/05/the-real-estate-advertising-site-immotop-lu-unveils-its-new-platform-and-becomes-the-first-portal-to-offer-search-by-travel-time-in-luxembourg?author=Immotop.lu) | Desde 2022 busca anuncios por trayecto en coche, bici o a pie (la nota de lanzamiento no menciona transporte público) y por zona dibujada | El competidor más probable si añade capas. También un posible socio |
| atHome.lu | Portal nº 1; no se ha encontrado búsqueda por trayecto | Posible socio o comprador |
| [Lux-guide](https://lux-guide.github.io/) | Guía para recién llegados (francés, verificada en agosto de 2026): trámites, simulador de sueldo, asistente que busca en la guía y "Où habiter" con 3 herramientas: paradas sin transbordo hacia tu destino, comparador de hasta 4 direcciones (colegios, crèches, maisons relais, transporte, comercios, salud) y communes con 48 indicadores y frontera | **El competidor más cercano en Luxemburgo** y el mismo público. Le falta: zonas que cumplen criterios, 2 personas, trayectos con transbordo, ruido, IA que razone. Todo en el navegador. Autor desconocido |
| [Locco](https://locco.lu/en) | Portal nuevo "para expatriados y locales": guías de barrio, alquiler por barrio y tamaño, "puntuación de calidad de vida" por commune | Va hacia el mismo público; sin trayectos ni recomendador personalizado |
| [LuxInsights](https://data.public.lu/en/reuses/6a4e151de33e7a6e5c884ce9/) | Paneles de alquiler y venta por barrio de la capital (anuncios de Immotop) | Solo precio |
| Wortimmo | Portal con mapa de servicios cerca de cada anuncio | Empieza por el piso |
| Guías (Just Arrived, Switchr, Luxflat, Expatica) | Artículos de "mejores barrios" | Contenido genérico; servirían como canal para llegar a usuarios |

## Cómo ganan dinero los demás
- Gratis + derivar a agentes inmobiliarios: SettleSavvy.
- Gratis con opciones de pago y socios: Chacun Son Lieu.
- Freemium con límite diario: CloseMove.
- Suscripción: Map AI (79 $/mes).
- Portal de anuncios gratis para anunciantes: wohnwahn.
- B2B (reubicación): Teleport (comparaba ciudades), comprado por MOVE Guides (hoy Topia) en 2017 y cerrado en silencio en 2024 ([fuente](https://cityparity.com/blog/teleport-cities-shut-down/)).
- Ninguno de los pequeños muestra ingresos; Mavilà ya está caído. Señal: atraer usuarios es fácil de prometer y difícil de sostener.

## Huecos que nadie cubre (lo que diferencia la idea)
1. Luxemburgo a nivel de barrio con trayectos en transporte público con horarios reales (GTFS) para 2 personas.
2. Ruido oficial separado por aviones, trenes y carreteras: solo lo hacen wohnwahn (AT) y Crystal Roof (UK).
3. Distancia elegida por el usuario, cerca o lejos, a cada tipo de servicio: solo Chacun Son Lieu se acerca.
4. IA que dice qué limita y cuantifica alternativas ("con +5 min entran X barrios"): **no encontrado en ninguno**. Los que tienen IA (Map AI, Realtor.com) solo contestan preguntas sobre una zona.
5. Mostrar qué factores no tienen datos (como AptHunt): buena idea para copiar, encaja con "datos verificables con fuente visible".

## Para copiar o vigilar
- UX: el gris de Mavilà para "no cumple lo imprescindible"; las tarjetas de AptHunt con factores y datos que faltan; los niveles de imprescindible a opcional de Chacun Son Lieu.
- Vigilar Immotop y Locco: tienen el público y los anuncios.
