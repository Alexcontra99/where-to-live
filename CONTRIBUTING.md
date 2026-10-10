# Cómo trabajar en este repositorio

Repositorio privado compartido por dos personas: el **autor** de un cambio y el **revisor** (el otro). Cada cambio llega a `main` solo por pull request (PR) revisado.

## Reglas
- Nunca commit ni push directo a `main`. Nunca `push --force` sin acordarlo con la otra persona.
- Un PR, un tema. Commits pequeños y lógicos.
- Nada personal ni sensible (ver "Antes de subir").
- Se fusiona con **squash** y solo con la aprobación del revisor.

## Flujo
1. Actualiza `main`: `git switch main && git pull`.
2. Crea una rama por tema: `git switch -c tema/descripcion` (ejemplos: `datos/alquiler-barrios`, `docs/readme`, `fix/ruido-aviones`).
3. Haz los cambios. Añade por archivos (`git add <archivo>`) o con `git add -p`, no `git add -A` a ciegas.
4. Antes de commitear: `git status --short` y `git diff --check`.
5. Commit: asunto de unos 50 caracteres o menos, en imperativo; línea en blanco; el porqué en el cuerpo si hace falta.
6. Antes de subir: la comprobación de abajo, sin resultados sin explicar.
7. Sube la rama y abre el PR: `git push -u origin tema/descripcion` y `gh pr create` (o desde la web).
   - Descripción: **qué** cambia, **por qué** y **qué riesgo** tiene (qué podría romper).
   - Si cambia datos o parámetros validados, enlaza la validación (`notas/calidad_datos.md`).
8. Revisión por la otra persona en GitHub: comentarios y aprobación. Si pide cambios, nuevos commits en la misma rama.
9. Fusión con squash (`gh pr merge --squash --delete-branch` o el botón de la web) cuando el revisor ha aprobado y el autor da el OK.
10. Vuelve a `main`: `git switch main && git pull`.

## Qué mira el revisor
- ¿Hace una sola cosa y se entiende por qué?
- ¿Los datos nuevos tienen fuente y licencia (`notas/fuentes_datos.md`)? ¿Se validaron con datos reales y no de memoria?
- ¿La app sigue abriendo sin errores en la consola (escritorio y móvil)?
- ¿Hay algo que no debería estar en el repositorio?

## Antes de subir
Revisa cada resultado de este comando (solo lo que sube la rama):
```
git grep -n -I -i -E "/Users/|ghp_|gho_|sk-|password|secret|api[_-]?key|@[a-z0-9.-]+\.[a-z]{2,}" -- . ':!prototipo/data'
```
- Salen cosas legítimas conocidas: el buzón público del Ministerio de Sanidad en `notas/calidad_datos.md` y "token" en una nota. Cualquier otro resultado se explica o se quita.
- No subas: credenciales, rutas de tu equipo, datos de terceros, información de tu empleador ni de tu vida personal, descargas grandes (`~/.cache/...`) ni archivos de más de unos pocos MB sin hablarlo.
- Si se cuela un secreto: **revócalo primero**; limpiar el historial es secundario.

## Datos regenerables
- `prototipo/data/*.js` se genera con `prototipo/build/`. Si el cambio toca el generador, sube también los datos regenerados y di en el PR contra qué fuentes se generaron (`prototipo/data/manifest.json`).
- `prototipo/data/manifest.prev.json` es local (línea base de `qa_data.py`); no se sube.

## Límites actuales
- `main` no tiene protección técnica (GitHub la exige en Pro o repositorios públicos): el flujo es un acuerdo. Si alguien commitea directo a `main`, se nota en el historial.
- No hay CI ni tests automáticos. La comprobación de datos es `prototipo/build/qa_data.py` (ver `protocolos/actualizacion_datos.md`).
