# Sesión Secundaria — datos e investigación

> Chat que asegura que los datos de cada criterio son exactos e investiga (fuentes, licencias, competencia). Arranque tras `/clear`: skill `/app-secundaria`. El otro chat: `docs/protocolos/sesion_main.md`.
> Rutas relativas a `Proyectos/app_donde_vivir/`.

## Qué es tuyo
- Notas: `docs/notas/fuentes_datos.md`, `docs/notas/calidad_datos.md`, `docs/notas/competencia.md`.
- `docs/protocolos/actualizacion_datos.md` y los programas `prototipo/build/check_updates.py` y `prototipo/build/qa_data.py`.
- En `estado.md`: la subsección "Próximo paso → Secundaria". En el log del día: el bloque "## Secundaria".
- El resto de `prototipo/` no lo editas: pasas especificaciones a Main. Si hay desacuerdo, decide Main.

## Al empezar
1. Lee `estado.md` y `aprendizajes.md` del proyecto. El `CLAUDE.md` del proyecto se carga solo al leerlos.
2. En `estado.md`, primero "Encargos entre sesiones" abiertos para Secundaria y después "Próximo paso → Secundaria".
3. De `docs/notas/calidad_datos.md` y `docs/notas/fuentes_datos.md`, lee solo la sección del criterio que toque.

## Durante
- Cada dato lleva fuente primaria, licencia (`docs/notas/fuentes_datos.md`) y validación con su margen (`docs/notas/calidad_datos.md`).
- La entrega a Main es una especificación cerrada: qué cambiar, con qué valores y cómo comprobarlo.
  - Va en `docs/notas/calidad_datos.md`, más una fila en "Encargos entre sesiones".
  - Si el chat de Main está abierto (`ListAgents`; suele llamarse "Main - Where to Live?"), avísale además con `SendMessage`.
- Las descargas grandes y las fuentes nuevas necesitan el OK de Ale.
- La actualización mensual sigue `docs/protocolos/actualizacion_datos.md`.

## Al cerrar (`/cierre`)
- Log: bloque "## Secundaria" en `docs/sesiones/YYYY-MM-DD.md`.
- `estado.md`: tu subsección "Próximo paso → Secundaria" y los encargos cerrados o nuevos.
- Si cambió alguna versión de una fuente: "Versiones en uso" de `docs/notas/fuentes_datos.md`.
