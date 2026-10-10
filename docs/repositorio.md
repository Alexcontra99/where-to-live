# Repositorio — reglas

> Monorepo pnpm (Node 22, pnpm 12, TypeScript ~6.0.3; nunca TypeScript 7). README técnico en inglés: `README.md`.

## Estructura
| Ruta | Qué |
|---|---|
| `apps/mobile` | App iOS (Expo, `@wtl/mobile`). Detalle: `apps/mobile/README.md`. |
| `apps/web` | Web de lista de espera (`@wtl/web`). Llega desde su propia rama. |
| `packages/core` | `@wtl/core`: motor de cálculo (trayectos, filtros, colores de alquiler). Port TS de `prototipo/app.js`. |
| `packages/data-lux` | `@wtl/data-lux`: datos de Luxemburgo en JSON, convertidos de `prototipo/data/`. |
| `prototipo/` | Implementación de referencia (web estática) y cadena de datos (`build/`). |
| `docs/` | Notas, fuentes, protocolos y logs. |

## Prototipo y paquetes
- `prototipo/` es la referencia: la lógica nace en `app.js` y los datos en `build/build_data.py`.
- Todo cambio de lógica en `prototipo/app.js` se copia en `packages/core`. Si no, fallan los tests golden.
- No cambiar el formato de las constantes de `app.js`: `qa_data.py` las lee con regex.
- Tras `build_data.py`, regenerar `data-lux`:
  - `python prototipo/build/build_data.py`
  - `pnpm --filter @wtl/data-lux convert`
  - `pnpm -r test`

## Git
- Una rama por tarea (`feat/…`, `fix/…`, `docs/…`, `chore/…`) y PR a `main`. Se fusiona solo con CI en verde. Sustituye a "solo main".
- Commits: Conventional Commits.
- Añadir archivos con rutas explícitas (nunca `git add -A` ni `git add .`).
- CI (`.github/workflows/ci.yml`): `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm -r test`, bundle iOS de Expo y `py_compile` de `prototipo/build/*.py`.

## Propuesta para CLAUDE.md y estado.md
Pendiente de OK de Ale. Líneas exactas:

En `CLAUDE.md` → "Entorno", añadir:
```
- Monorepo pnpm (apps/mobile, apps/web, packages/core, packages/data-lux): `docs/repositorio.md`.
- Cambio de lógica en `prototipo/app.js` → copiarlo en `packages/core` (tests golden). Tras `build_data.py` → `pnpm --filter @wtl/data-lux convert`.
- Git: una rama por tarea y PR a `main` con CI en verde (sustituye a "solo main").
```

En `CLAUDE.md` → "Qué leer según la tarea", añadir la fila:
```
| Código, monorepo, CI o git | `docs/repositorio.md` |
```

En `estado.md` → hitos, añadir:
```
- 2026-10-10: monorepo con app iOS (`apps/mobile`), `@wtl/core` y `@wtl/data-lux`; CI en GitHub Actions. Reglas: `docs/repositorio.md`.
```
