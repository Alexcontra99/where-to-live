# App dónde vivir — reglas

> Tipo: proyecto (nombre de carpeta provisional; nombre comercial pendiente)
> Rutas relativas a esta carpeta. Contexto personal y del vault: `CLAUDE.local.md` (local, fuera de git).

## Objetivo
- Meta: prototipo web de Luxemburgo probado por 10 recién llegados antes del **30/11/2026**.
- Después: decidir si se monetiza (posible startup) y extender a otras capitales.

## Concepto (de Ale, 2026-10-04)
- Ayudar a cualquiera que llega, se mueve o se va de una ciudad a saber **dónde buscar para vivir**, con una visión real.
- El usuario define lo que busca (piso, must y desired) y lo combina con: trayectos al trabajo o al colegio de los hijos, servicios (colegios, universidades, supermercados, parques…), ruido (aviones, trenes, avenidas), alquiler por barrio y distancia a lo que él elija.
- IA que acota y, si no sale nada, explica qué lo limita (x, y, z) y propone qué parámetros cambiar.
- Detalle y flujo: `notas/concepto.md`.

## Principios del producto
- **Filtros neutrales**: el usuario elige qué quiere cerca o lejos y a qué distancia. La app no etiqueta barrios ni colectivos ni trae filtros predefinidos por religión, origen o servicios sociales.
- Datos reales y verificables (horarios oficiales, mapas oficiales de ruido, alquiler publicado), con fuente visible.
- Solo lugares que existen y están reconocidos (edificios y puntos de una fuente de datos); nunca suposiciones, como dónde se vende droga — Ale, 2026-10-04.

## Reparto
> Los skills (`/app-main`, `/app-secundaria`), `_sistema/` y `.claude/launch.json` son del entorno local de Ale (vault de Obsidian + Claude Code), no de este repositorio.
- Claude: construye (código, datos, mapas), investiga (competencia, fuentes, licencias) y propone.
- Ale: decide, prueba y consigue usuarios.
- Dos chats a la vez (Ale, 2026-10-06):
  - **Main** construye y publica: `protocolos/sesion_main.md`, skill `/app-main`. Manda en el reparto.
  - **Secundaria** se ocupa de datos e investigación: `protocolos/sesion_secundaria.md`, skill `/app-secundaria`.
  - Qué archivos son de cada uno: en su protocolo.
  - Archivos compartidos (`estado.md`, `notas/concepto.md`, logs): solo cambios pequeños, releyendo justo antes. Cada chat tiene su sección en `estado.md` y su bloque en el log. Los encargos entre chats van a `estado.md` → "Encargos entre sesiones".
- Si solo hay un chat, hace los dos roles.
- Si el chat arranca sin skill ("seguimos con la app"), pregunta en una línea: ¿Main o Secundaria? Recomienda Main si `ListAgents` no muestra otro chat de la app abierto.
- Frontera (Francia, Bélgica, Alemania): después del v0 (Ale, 2026-10-06).

## Entorno
- Python: `/Library/Developer/CommandLineTools/Library/Frameworks/Python3.framework/Versions/3.9/bin/python3`. El `python3` del sistema da errores de SDK. Paquetes: shapely, pyproj, openpyxl, xlrd, overturemaps, pyshp.
- Vista previa: el servidor no puede leer el Escritorio (permisos de macOS).
  - Antes, copia: `rsync -a --delete --exclude build prototipo/ ~/.cache/nether_app/preview/`.
  - Después, `preview_start` con `app-donde-vivir` (puerto 8765).
  - La carpeta publicable se ve con `where-to-live-export` (puerto 8766). Configuración en `.claude/launch.json`, en la raíz del vault.
- Regenerar datos y caché de descargas (`~/.cache/nether_app`, `~/.cache/nether_gtfs`): `prototipo/README.md`.
- Publicar: `sh prototipo/build/export_web.sh` → `~/GitHub/where-to-live`. Pruébalo en limpio (escritorio y móvil, consola sin errores) antes de subirlo.

## Cómo trabajar
- Para gustos y decisiones de producto, dale a Ale opciones para marcar; no las elijas por él (`_sistema/memoria.md`).
- Cada fuente de datos se apunta con su licencia en `notas/fuentes_datos.md`; solo licencias que permitan uso comercial o con condiciones claras (p. ej. atribución de OpenStreetMap).
- Trayectos y tiempos: siempre calculados con datos reales, nunca de cabeza.
- Prototipo primero: lo mínimo que se pueda enseñar a un usuario.

## Repositorio compartido
- `Alexcontra99/where-to-live` (privado, compartido con el equipo). Nada personal: eso va en `CLAUDE.local.md` y `sesiones/`, que no suben.
- Antes de cada push: la comprobación de privacidad de `CLAUDE.local.md` sin resultados.

## Qué leer según la tarea
| Tarea | Lee (además de este archivo) |
|---|---|
| Cualquier sesión | `estado.md`, `aprendizajes.md` y el protocolo de tu rol (`protocolos/sesion_main.md` o `protocolos/sesion_secundaria.md`) |
| Producto, funciones, flujo | `notas/concepto.md` |
| Lógica de la app (cómo calcula) | `prototipo/README.md` |
| Fuentes y licencias | `notas/fuentes_datos.md` |
| Exactitud de un dato (validaciones y márgenes) | `notas/calidad_datos.md`, solo la sección que toque |
| Actualización mensual de datos | `protocolos/actualizacion_datos.md` |
| Competencia y mercado | `notas/competencia.md` |
| Pruebas con usuarios | `usuarios/` |

## Dónde se escribe cada cosa
| Qué | Dónde |
|---|---|
| Concepto, funciones, flujo | `notas/concepto.md` |
| Fuentes de datos y licencias | `notas/fuentes_datos.md` |
| Competencia | `notas/competencia.md` |
| Código y datos del prototipo | `prototipo/` |
| Feedback de usuarios de prueba (sin nombres ni datos personales) | `usuarios/YYYY-MM-DD_<perfil>.md` |
| Material original | `material/YYYY-MM-DD_<descripcion>.<ext>` (no se edita) |
| Log de sesiones (local, fuera de git) | `sesiones/YYYY-MM-DD.md` |
| Situación vigente y pendientes | `estado.md` |
| Qué funciona con Ale | `aprendizajes.md` |

## Cierre
- `protocolos/cierre.md`

## No hacer
- No publicar nada (web, redes, tiendas de apps) ni contactar con usuarios o empresas sin OK explícito de Ale.
- No cargar todos los logs: solo los que la tarea necesite.
- No editar `material/`.
- No cambiar este archivo sin OK de Ale.
