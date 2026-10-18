# Where to Live

Helps people who arrive in, move within or leave a city see **where to look for a home**. You set what
you need (commute to work or school for one or two people, rent, noise, what you want near or far) and
the map shows which areas fit, coloured by estimated rent. Every number is computed from real, published
data, and every source is shown in the app.

First city: **Luxembourg**.

## Repository layout

| Path                | What                                                                                                                                                                   |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/mobile`       | iOS app (Expo / React Native, `@wtl/mobile`). See [`apps/mobile/README.md`](apps/mobile/README.md).                                                                    |
| `apps/web`          | Waitlist website (`@wtl/web`). Developed on its own branch; present once merged.                                                                                       |
| `packages/core`     | `@wtl/core`: computation engine (commutes, filters, rent colours). TypeScript port of `prototipo/app.js`, checked against it by golden tests.                          |
| `packages/data-lux` | `@wtl/data-lux`: Luxembourg dataset (grid, areas, POIs, transit) as JSON, converted from `prototipo/data/`.                                                            |
| `prototipo/`        | Reference implementation: static web prototype (`index.html`, `app.js`, `style.css`, `data/*.js`) and the Python data pipeline (`build/`). See `prototipo/README.md`. |
| `docs/`             | Product notes, data sources and licences, protocols, session logs (mostly Spanish).                                                                                  |

## Prerequisites

- Node 22 (`.nvmrc`) and pnpm 12 (version pinned in `package.json` → `packageManager`; `corepack enable`
  picks it up).
- Python 3.12 with `prototipo/build/requirements.txt`, only to regenerate data.
- iOS builds: Expo account and Apple Developer Program (details in `apps/mobile/README.md`).

## Commands

```sh
pnpm install                 # install all workspaces
pnpm lint                    # ESLint
pnpm format:check            # Prettier (pnpm format to fix)
pnpm typecheck               # tsc in every workspace
pnpm -r test                 # Vitest in every workspace
```

Open the prototype: open `prototipo/index.html` in a browser (no server needed; data is in
`prototipo/data/*.js`).

Run the mobile app (development build on an iPhone):

```sh
pnpm --filter @wtl/mobile start
```

Regenerate the data:

```sh
python -m pip install -r prototipo/build/requirements.txt
python prototipo/build/build_data.py       # rebuilds prototipo/data/*.js (downloads and caches listed in prototipo/README.md)
pnpm --filter @wtl/data-lux convert        # rebuilds packages/data-lux/data/*.json from prototipo/data
pnpm -r test                               # golden tests check that core still matches the prototype
```

Any logic change in `prototipo/app.js` must be mirrored in `packages/core`, otherwise the golden tests
fail.

## Branch workflow

- One feature branch per task (`feat/…`, `fix/…`, `docs/…`, `chore/…`), Conventional Commits.
- Open a pull request to `main`; merge only with CI green.
- CI (`.github/workflows/ci.yml`): install with the frozen lockfile, lint, format check, typecheck, tests,
  an Expo iOS JavaScript bundle, and a Python compile check of the data pipeline.

## Licences

- Data sources and their licences: [`docs/notas/fuentes_datos.md`](docs/notas/fuentes_datos.md); in the
  apps, the "Sources" screen/tab (including the required map and OpenStreetMap attributions).
- Only sources whose licence allows commercial use, or has clear conditions such as attribution, are used.
- The code has no open-source licence file.
