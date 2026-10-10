# Sesión Secundaria — datos e investigación

> Chat que asegura que los datos de cada criterio son exactos e investiga (fuentes, licencias, competencia). Arranque tras `/clear`: leer este archivo (en el entorno de Ale, skill `/app-secundaria`). El otro chat: `protocolos/sesion_main.md`.
> Rutas relativas a la raíz del repositorio.

## Qué es tuyo
- Notas: `notas/fuentes_datos.md`, `notas/calidad_datos.md`, `notas/competencia.md`.
- `protocolos/actualizacion_datos.md` y los programas `prototipo/build/check_updates.py` y `prototipo/build/qa_data.py`.
- En `estado.md`: la subsección "Próximo paso → Secundaria". En el log del día: el bloque "## Secundaria".
- El resto de `prototipo/` no lo editas: pasas especificaciones a Main. Si hay desacuerdo, decide Main.

## Al empezar
1. Lee `estado.md` y `aprendizajes.md` del proyecto. El `CLAUDE.md` del proyecto se carga solo al leerlos.
2. En `estado.md`, primero "Encargos entre sesiones" abiertos para Secundaria y después "Próximo paso → Secundaria".
3. De `notas/calidad_datos.md` y `notas/fuentes_datos.md`, lee solo la sección del criterio que toque.

## Durante
- Cada dato lleva fuente primaria, licencia (`notas/fuentes_datos.md`) y validación con su margen (`notas/calidad_datos.md`).
- La entrega a Main es una especificación cerrada: qué cambiar, con qué valores y cómo comprobarlo.
  - Va en `notas/calidad_datos.md`, más una fila en "Encargos entre sesiones".
  - Si el chat de Main está abierto, avísale además; el encargo siempre queda escrito en la tabla.
- Las descargas grandes y las fuentes nuevas necesitan el OK de Ale.
- La actualización mensual sigue `protocolos/actualizacion_datos.md`.

## Al cerrar (`protocolos/cierre.md`)
- Log: bloque "## Secundaria" en `sesiones/YYYY-MM-DD.md`.
- `estado.md`: tu subsección "Próximo paso → Secundaria" y los encargos cerrados o nuevos.
- Si cambió alguna versión de una fuente: "Versiones en uso" de `notas/fuentes_datos.md`.
