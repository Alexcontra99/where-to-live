# Where to Live — reglas

> Reglas para quien trabaje en este repositorio con Claude Code. Cómo se trabaja con git: `CONTRIBUTING.md`. Visión general: `README.md`.
> Rutas relativas a la raíz del repositorio. Nombre comercial pendiente.

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
- Claude: construye (código, datos, mapas), investiga (competencia, fuentes, licencias) y propone.
- Las personas: deciden, prueban y consiguen usuarios.
- Dos chats a la vez (acordado el 2026-10-06):
  - **Main** construye y publica: `protocolos/sesion_main.md`. Manda en el reparto.
  - **Secundaria** se ocupa de datos e investigación: `protocolos/sesion_secundaria.md`.
  - Qué archivos son de cada uno: en su protocolo.
  - Archivos compartidos (`estado.md`, `notas/concepto.md`, logs): solo cambios pequeños, releyendo justo antes. Cada chat tiene su subsección en `estado.md` y su bloque en el log. Los encargos entre chats van a `estado.md` → "Encargos entre sesiones".
- Si solo hay un chat, hace los dos roles. Si no sabes cuál te toca, pregunta en una línea: ¿Main o Secundaria? (Main, si no hay otro chat abierto).
- Los atajos de arranque (`/app-main`, `/app-secundaria`, `/cierre`) existen solo en el entorno de Ale; sin ellos, lee el protocolo de tu rol.
- Frontera (Francia, Bélgica, Alemania): después del v0.

## Entorno
- Python 3.9 o superior con `prototipo/build/requirements.txt`. En macOS, el `python3` del sistema puede dar errores de SDK: usa uno instalado aparte.
- Vista previa: servir `prototipo/` con `python3 -m http.server`. Si la carpeta está en el Escritorio o en iCloud, macOS puede impedir que el servidor la lea: sirve una copia (`rsync -a --exclude build prototipo/ <carpeta temporal>/`).
- Regenerar datos y descargas (`~/.cache/nether_app`, `~/.cache/nether_gtfs`): `prototipo/README.md`.
- Exportar la web publicable: `sh prototipo/build/export_web.sh [destino]` (por defecto `publicar/`, dentro del repositorio y versionada; hay que regenerarla y subirla cuando cambie la app). Pruébala en limpio (escritorio y móvil, consola sin errores) antes de subirla.

## Cómo trabajar
- Para gustos y decisiones de producto, da opciones para marcar; no las elijas por él.
- Cada fuente de datos se apunta con su licencia en `notas/fuentes_datos.md`; solo licencias que permitan uso comercial o con condiciones claras (p. ej. atribución de OpenStreetMap).
- Trayectos y tiempos: siempre calculados con datos reales, nunca de cabeza.
- Prototipo primero: lo mínimo que se pueda enseñar a un usuario.

## Repositorio compartido
- `Alexcontra99/where-to-live` (privado). Todo cambio entra por rama y pull request revisado; nunca commit directo a `main` (`CONTRIBUTING.md`).
- Antes de subir: la comprobación de `CONTRIBUTING.md`. Nada personal, de terceros ni de ningún empleador.

## Qué leer según la tarea
| Tarea | Lee (además de este archivo) |
|---|---|
| Cualquier sesión | `estado.md`, `aprendizajes.md` y el protocolo de tu rol (`protocolos/sesion_main.md` o `protocolos/sesion_secundaria.md`) |
| Subir cambios | `CONTRIBUTING.md` |
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
| Log de sesiones | `sesiones/YYYY-MM-DD.md` (sin datos personales: se sube) |
| Situación vigente y pendientes | `estado.md` |
| Qué funciona con el equipo | `aprendizajes.md` |

## Cierre
- `protocolos/cierre.md`

## No hacer
- No publicar nada (web, redes, tiendas de apps) ni contactar con usuarios o empresas sin OK explícito de Ale.
- No commitear ni hacer push a `main`; no `push --force`.
- No cargar todos los logs: solo los que la tarea necesite.
- No editar `material/`.
- No cambiar este archivo sin OK de Ale (por PR).
