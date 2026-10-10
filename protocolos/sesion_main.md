# Sesión Main — construcción

> Chat que construye y publica. Arranque tras `/clear`: leer este archivo (en el entorno de Ale, skill `/app-main`). El otro chat: `protocolos/sesion_secundaria.md`.
> Rutas relativas a la raíz del repositorio.

## Qué es tuyo
- `prototipo/` (web, `build/build_data.py`, `build/export_web.sh`), salvo `build/check_updates.py` y `build/qa_data.py`, que son de Secundaria.
- Publicar: la carpeta `publicar/` (web exportada, versionada) y el alojamiento.
- En `estado.md`: la subsección "Próximo paso → Main". En el log del día: el bloque "## Main".
- Mandas en el reparto. Si un encargo no está claro, decides tú (Ale, 2026-10-07).

## Al empezar
1. Lee `estado.md` y `aprendizajes.md` del proyecto. El `CLAUDE.md` del proyecto se carga solo al leerlos.
2. En `estado.md`, primero "Encargos entre sesiones" abiertos para Main y después "Próximo paso → Main".
3. Solo si la tarea lo pide:
   - producto → `notas/concepto.md`;
   - lógica de la app → `prototipo/README.md`;
   - datos → la sección que toque de `notas/calidad_datos.md` (es largo: no lo leas entero).

## Durante
- Comprueba en el navegador cada cambio visible antes de darlo por hecho (entorno y comandos en `CLAUDE.md` → "Entorno").
- Números (trayectos, alquiler, distancias): siempre calculados con datos, nunca de cabeza.
- Para cambiar datos o parámetros validados, necesitas una especificación de Secundaria en `notas/calidad_datos.md`.
- Para encargar algo a Secundaria, añade una fila en "Encargos entre sesiones". Si su chat está abierto, avísale además; el encargo siempre queda escrito en la tabla.

## Al cerrar (`protocolos/cierre.md`)
- Log: bloque "## Main" en `sesiones/YYYY-MM-DD.md`.
- `estado.md`: tu subsección "Próximo paso → Main", los encargos cerrados o nuevos y los hitos.
- Si cambió la lógica de la app: `prototipo/README.md`.
