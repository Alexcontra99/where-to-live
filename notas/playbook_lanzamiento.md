---
tipo: nota
proyecto: where-to-live
fecha: 2026-10-10
---
# Playbook de lanzamiento (v0 → 10 usuarios → ~100)

> Salió de un análisis de lanzamientos recientes (Cursor, Lovable, Superhuman, Granola, Cluely, Airbnb y Stripe, y apps de expatriados). Las fuentes y su fiabilidad están al final. Meta del proyecto: 10 recién llegados lo han probado antes del **30/11/2026**.

## Estrategia en una frase
**Estrecho primero, valor sin fricción, atención manual a los primeros usuarios, un resultado que se comparta solo y un número honesto de encaje antes de abrir el grifo.**

## Qué tienen en común los casos
| Patrón | Casos | Qué significa para nosotros |
|---|---|---|
| Promesa y público muy concretos | Superhuman (usuarios que más lo querían), Facebook (un campus), Granola, Cluely (una promesa provocadora) | Una ciudad (Luxemburgo) y un público: recién llegados con plazo para encontrar piso |
| Valor en el primer minuto, sin registro | Lovable (genera en la portada), Cursor (gratis útil), Stripe (instalado en el portátil del cliente) | Ya cumplido: sin cuenta y sin guardar nada. Lo que falta es una web pública |
| Los primeros usuarios, a mano | Airbnb (puerta a puerta), Stripe, Superhuman, Granola (~150 a mano) | 10 usuarios elegidos, mirarlos usar la app, llamadas de 30 min |
| El producto o su resultado se reparte solo | Notion (plantillas), Midjourney (Discord compartido), Cursor (comunidad), Cluely (clips de demo) | Enlace que guarda los filtros: "estas son las zonas que me valen" |
| Un número y no una impresión | Superhuman (40 % "muy decepcionado"), Paul Graham (crecimiento semanal) | Pregunta de encaje y crecimiento semanal desde el primer día |
| Ir donde el público ya está | Expats (grupos de Facebook, kits de bienvenida), Lovable (Product Hunt, Discord) | Grupos de expatriados y r/Luxembourg, con sus reglas |
| Credibilidad de los números | Cluely admitió en marzo de 2026 que una cifra de ingresos pública era falsa | Nuestra ventaja son datos comprobables: nunca exagerar |

## Qué evitar (aprendido de los fallos)
- **Atención sin retención.** Cluely creció con polémica y creadores, pero tuvo que cambiar de promesa y su fundador reconoció que "quizá lanzó demasiado pronto". La atención no es encaje.
- **Escasez inventada** (Clubhouse). Una lista de espera solo vale si hay un límite real.
- **Lanzamiento ruidoso y alianzas pronto** (Paul Graham): cuestan más de lo que devuelven.
- **Cifras infladas o sin fuente.** En este proyecto cada número lleva fuente y validación (`notas/calidad_datos.md`).

## Fases
Hoy es 10/10/2026. Ale dispone de unas 5 h/semana; Claude prepara y Ale decide, prueba y consigue usuarios.

### Fase 0 — Preparar (hasta el 18/10)
| Tarea | Quién | Hecho cuando |
|---|---|---|
| Web pública: exportar la web (`prototipo/build/export_web.sh`) y arrastrar la carpeta a Netlify o Cloudflare Pages | Ale (cuenta) + Claude (prueba) | URL probada en escritorio y móvil |
| Enlace que guarda los filtros | Claude | Abrir el enlace restaura filtros y destino |
| Guion de prueba y formulario de feedback (`usuarios/guion_prueba.md`) | Claude | Texto cerrado, formulario creado por Ale |
| Pregunta de encaje y 3 preguntas abiertas (abajo) | Claude | En el formulario |
| Lista de 10 candidatos reales (recién llegados) | Ale | 10 nombres o contactos, no en el repo |

### Fase 1 — Diez usuarios a mano (19/10 – 02/11)
- Cada usuario: llamada de 30 min compartiendo pantalla. Él usa la app con un caso real; nosotros callamos y miramos.
- Anotar en `usuarios/YYYY-MM-DD_<perfil>.md`, **sin nombres ni datos personales**: qué buscaba, dónde se atascó, qué dijo que le faltaba, si compartió el enlace.
- Arreglar lo que bloquee a 2 o más usuarios antes de la siguiente llamada. Un cambio por PR.

### Fase 2 — Beta estrecha (03/11 – 30/11)
- Objetivo: **40 respuestas** a la pregunta de encaje (con 10 solo es una señal) y hasta ~100 usuarios.
- Canales, en este orden:
  1. Conocidos de los primeros 10 (el enlace compartible es el motor).
  2. Grupos de Facebook de expatriados en Luxemburgo.
  3. r/Luxembourg: leer las reglas del subreddit antes de publicar; participar antes de enlazar; decir que es un proyecto propio; responder dudas en vez de dejar el enlace y marcharse.
  4. Empresas de relocation o RR. HH.: solo con OK explícito de Ale.
- Un mensaje, sin exagerar: *"Find where to live in Luxembourg: compare commute, rent, noise and services on one map. Free, no sign-up."*

### Puerta de decisión (30/11)
| Señal | Umbral | Si se cumple | Si no |
|---|---|---|---|
| "Muy decepcionado" si no pudieran usarla | ≥ 40 % con ≥ 40 respuestas | Abrir más: Product Hunt, prensa local, empresas | Segmentar: ¿quién sí la quiere? Rehacer sobre ese grupo |
| Usuarios que vuelven o comparten el enlace | ≥ 1 de cada 3 | Seguir con el enlace como motor | Mejorar el resultado compartible |
| Crecimiento semanal | ~10 % sostenido (Paul Graham) | Mantener | Cambiar de canal antes que de producto |

## Métricas (una hoja, cada semana)
Usuarios nuevos · usuarios que vuelven · enlaces compartidos · respuestas a la pregunta de encaje y % "muy decepcionado" · bloqueos más repetidos.

## Preguntas del formulario
1. *¿Cómo te sentirías si ya no pudieras usar esta herramienta?* Muy decepcionado / algo / nada.
2. ¿Qué tipo de persona crees que más se beneficiaría?
3. ¿Qué es lo principal que te aporta?
4. ¿Qué mejorarías para que fuera imprescindible?

## Reglas
- Ninguna cifra pública sin fuente. Los datos tienen límites conocidos (`notas/calidad_datos.md`); se dicen.
- Nada de datos de usuarios con nombre en el repositorio.
- Contactar con personas o empresas, y publicar en cualquier canal, requiere el OK de Ale.
- **Dar la cara como fundador** (el motor de Cluely y de otros) queda como decisión personal de Ale; este playbook no la necesita.
- Todo cambio de esta guía va por rama y pull request: rama por tema, revisión de la otra persona y fusión con squash.

## Competencia a tener presente
Explorador de barrios de Topia Go y Luxembourg Expats (dice tener más de 100 000 usuarios, cifra de su ficha de la tienda). Nuestra diferencia: horarios oficiales, ruido de mapas oficiales y mapa de calor del alquiler, con fuente visible. Más en `notas/competencia.md`.

## Fuentes y fiabilidad
- Alta: [Superhuman, First Round](https://review.firstround.com/how-superhuman-built-an-engine-to-find-product-market-fit/); [Paul Graham, Do Things that Don't Scale](https://paulgraham.com/ds.html); [TechCrunch sobre Cluely, marzo 2026](https://techcrunch.com/2026/03/05/cluely-ceo-roy-lee-admits-to-publicly-lying-about-revenue-numbers-last-year/); [TechCrunch sobre Lovable](https://techcrunch.com/2025/11/19/as-lovable-hits-200m-arr-its-ceo-credits-staying-in-europe-for-its-success/) (solo se leyó el resumen de la búsqueda).
- Media: [Cursor](https://www.productgrowth.blog/p/how-cursor-ai-hacked-growth), [Lovable, tácticas](https://www.productmarketfit.tech/p/the-11-tactics-behind-lovables-insane), [Cluely, creadores](https://houseofmarketers.com/cluely-ai-ugc-influencer-strategy/), [Cluely en Wikipedia](https://en.wikipedia.org/wiki/Cluely). Blogs; las cifras difieren entre fuentes.
- Baja: [Granola](https://www.thevccorner.com/p/granola-growth-playbook-unicorn-2026?r=1krivi) (una sola fuente), apps de expatriados ([Hoplr](https://blog.hoplr.com/en/is-your-municipality-attracting-a-lot-of-expats-heres-what-you-need-to-know-to-make-sure-they-can-easily-connect-to-their-neighbourhood/), [Enquire](https://technical.ly/uncategorized/enquire-2-lessons-early-stage-apps-french-expat-team.md)): cifras de sus propios fundadores.
- Reglas de Reddit: guías de blogs, no de Reddit. Comprobar las reglas de cada subreddit.
