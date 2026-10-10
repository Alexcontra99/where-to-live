# Where to Live

Web para elegir **dónde buscar piso** en una ciudad (empieza por Luxemburgo): combina trayectos reales al trabajo o al colegio, alquiler por barrio, ruido y servicios cercanos. Cada filtro es "me importa / no me importa" y el usuario elige la distancia. El alquiler no excluye zonas: se pinta como mapa de calor.

Estado: prototipo v0 de Luxemburgo. Meta: probado por 10 recién llegados antes del 30/11/2026. Situación y pendientes: `estado.md`.

## Abrir la app
- Abrir `prototipo/index.html` en el navegador (doble clic). Todo se calcula en el navegador; los datos van en `prototipo/data/*.js`.
- Si el navegador bloquea algo, servir la carpeta: `cd prototipo && python3 -m http.server 8765` y abrir http://127.0.0.1:8765.

## Regenerar los datos
Instrucciones completas y descargas manuales: `prototipo/README.md` → "Regenerar los datos".
```
pip install -r prototipo/build/requirements.txt   # Python 3.9+
python3 prototipo/build/get_gtfs.py
python3 prototipo/build/build_data.py
```
Dependencia versionada: `prototipo/build/sea_2021_geocoded.json` (lista oficial de guarderías geocodificada a mano; el script que la genera está pendiente).

## Qué hay en el repositorio
| Carpeta o archivo | Contenido |
|---|---|
| `prototipo/` | La web, los datos generados y los scripts (`build/`) |
| `publicar/` | La web ya exportada, lista para subir a un alojamiento (Netlify, Cloudflare Pages, GitHub Pages) |
| `notas/` | Concepto, fuentes y licencias, calidad de los datos, competencia |
| `protocolos/` | Actualización mensual de datos, roles de los chats y cierre de sesión |
| `sesiones/` | Registro de sesiones de trabajo |
| `usuarios/` | Feedback de los usuarios de prueba, sin datos personales |
| `material/` | Originales que no se editan |
| `estado.md` | Situación vigente, encargos y próximos pasos |
| `CLAUDE.md` | Reglas del proyecto para quien trabaje con Claude Code |
| `CONTRIBUTING.md` | **Cómo trabajar en el repositorio: ramas, pull requests y revisión** |

## Trabajar en el repositorio
Nada se commitea directo a `main`: rama, pull request y revisión de la otra persona. Detalle en `CONTRIBUTING.md`.

## Datos y licencias
Todo dato tiene fuente y licencia en `notas/fuentes_datos.md`. Los datos derivados de OpenStreetMap están bajo ODbL; el resto, CC0 o CC BY con atribución (también en la pestaña "Sources" de la app).
