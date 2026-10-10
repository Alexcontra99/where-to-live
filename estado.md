---
tipo: estado
proyecto: app_donde_vivir
fecha: 2026-10-10
estado: activo
---
# App dónde vivir — estado

## Situación
- v0 de Luxemburgo funcional, con datos validados (07/10): `prototipo/`; lógica en `prototipo/README.md`.
- Carpeta publicable probada en limpio, escritorio y móvil: `~/GitHub/where-to-live`. Falta publicarla, con tu OK.
- GitHub conectado (10/10): repositorio privado `Alexcontra99/donde-vivir` con este proyecto, salvo `prototipo/` (ver Pendientes de Ale). La base de git está en `~/GitHub/donde-vivir.git`. `/cierre` hace commit y push.
- `Alexcontra99/where-to-live`: público y vacío, para la web.
- Dos chats en paralelo, Main (construcción) y Secundaria (datos), con sus roles en `protocolos/sesion_main.md` y `protocolos/sesion_secundaria.md`.

## Hitos
| Fecha | Hito | Estado |
|---|---|---|
| 07/10 | Ale revisa la política de actividades externas de su empleador | hecho: se puede si no interfiere ni compite |
| 04/10 | Alcance del prototipo v0 (`notas/concepto.md`) | hecho |
| 04/10 | Fuentes de datos de Luxemburgo con licencias comprobadas (`notas/fuentes_datos.md`) | hecho |
| 15/11 | Prototipo web v0 de Luxemburgo | funcional en local y datos validados (07/10); falta publicarlo y el guion de prueba |
| 30/11 | 10 recién llegados lo han probado y hay feedback | pendiente |

## Encargos entre sesiones
> Una fila por encargo. Quien lo recibe lo marca `hecho` al cerrar; las filas hechas se borran en la consolidación mensual.

| Fecha | De → para | Qué | Estado |
|---|---|---|---|
| 10/10 | Main → Secundaria | Revisar y corregir "Próximo paso → Secundaria" (borrador de Main a partir del log del 07/10) | hecho |

## Próximo paso
### Main
1. Guion de prueba y formulario de feedback en `usuarios/guion_prueba.md`. No depende de Ale.
2. Publicar el v0, con OK explícito de Ale justo antes.
   - GitHub ya está conectado: `_sistema/protocolo_github.md` → "Web de la app" (GitHub Pages en `where-to-live`).
   - Si no: Ale sube `~/GitHub/where-to-live` a Netlify Drop o a Cloudflare Pages.
   - Después, probar la URL publicada en escritorio y móvil. La prueba de Ale en su móvil necesita esa URL.
3. Opcional: un enlace que guarde los filtros, para compartir.

### Secundaria
- Sin trabajo abierto. Espera las decisiones de Ale sobre precios (A/B) y la tarea mensual (abajo).
- Primera actualización mensual: primera semana de noviembre (`protocolos/actualizacion_datos.md`). Pasada extra tras el cambio de horarios de mediados de diciembre.
- Factor t del alquiler: hoy es 1,04, calculado a mano. Para recalcularlo con la serie trimestral del Observatoire hace falta el OK de Ale a la descarga.
- Después del v0:
  - Pisos grandes en la ciudad, que salen entre un 9 y un 13 % bajos.
  - Rodeos por valles; ascensores y funicular.
  - Frontera (FR, BE, DE).
- Médicos: en espera (Ale, 07/10).

## Pendientes de Ale
- Probar el v0 en su móvil.
- `prototipo/.git` (el git que creaste a las 12:32: solo el README, sin subir). ¿Lo borro? Recomendado: sí. No se pierde nada, el README se queda, y así el prototipo entra en `donde-vivir`.
- Precios: A, oficial del Observatoire + revisión manual semestral (recomendado), o B, acuerdo con un portal.
- Tarea programada mensual para la actualización de datos: sí o no.
- OK para descargar la serie trimestral del Observatoire y recalcular el factor t del alquiler (hoy 1,04, calculado a mano): sí o no. Recomendado: sí.
- Nombre comercial.
- Dónde encontrar a los 10 usuarios de prueba (r/Luxembourg, grupos de expatriados, conocidos). ¿Compañeros de trabajo? Decide Ale.
- Modelo de negocio (particulares o empresas: reubicación, RR. HH., portales): después de validar.
