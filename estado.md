---
tipo: estado
proyecto: app_donde_vivir
fecha: 2026-10-10
estado: activo
---
# App dónde vivir — estado

## Situación
- v0 de Luxemburgo funcional, con datos validados (07/10): `prototipo/`; lógica en `prototipo/README.md`.
- v0 publicado el 10/10 en GitHub Pages y retirado al pasar el repositorio a privado. Para los usuarios de prueba hará falta una web pública (Pro o Netlify).
- Repositorio (10/10): `Alexcontra99/where-to-live`, privado, compartido con el equipo. `/cierre` hace commit y push. GitHub Pages queda inactivo mientras sea privado (cuenta gratuita).
- Dos chats en paralelo, Main (construcción) y Secundaria (datos), con sus roles en `protocolos/sesion_main.md` y `protocolos/sesion_secundaria.md`.

## Hitos
| Fecha | Hito | Estado |
|---|---|---|
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
0. Seguir `notas/playbook_lanzamiento.md` (fases, canales, métricas y puerta de decisión del 30/11).
1. Guion de prueba y formulario de feedback en `usuarios/guion_prueba.md`. No depende de Ale.
2. Hecho (10/10): v0 publicado. Siguiente: Ale lo prueba en su móvil y se pasa el enlace con el guion.
3. Opcional: un enlace que guarde los filtros, para compartir.

### Secundaria
- Convertir en script la geocodificación de la lista SEA 2021 (`sea_2021_geocoded.json`), para que cualquiera pueda regenerar los datos (auditoría del 10/10).
- Revisar el mínimo de 30 ofertas también en barrios (Hamm, Clausen y Pfaffenthal tienen L alto con 14-16 ofertas).
- Sin trabajo abierto. Espera las decisiones de Ale sobre precios (A/B) y la tarea mensual (abajo).
- Primera actualización mensual: primera semana de noviembre (`protocolos/actualizacion_datos.md`). Pasada extra tras el cambio de horarios de mediados de diciembre.
- Factor t del alquiler: hoy es 1,04, calculado a mano. Para recalcularlo con la serie trimestral del Observatoire hace falta el OK de Ale a la descarga.
- Después del v0:
  - Pisos grandes en la ciudad, que salen entre un 9 y un 13 % bajos.
  - Rodeos por valles; ascensores y funicular.
  - Frontera (FR, BE, DE).
- Médicos: en espera (Ale, 07/10).

## Pendientes de Ale
- Probar el v0 en su móvil (en local o cuando vuelva a haber web pública).
- Precios: A, oficial del Observatoire + revisión manual semestral (recomendado), o B, acuerdo con un portal.
- Tarea programada mensual para la actualización de datos: sí o no.
- OK para descargar la serie trimestral del Observatoire y recalcular el factor t del alquiler (hoy 1,04, calculado a mano): sí o no. Recomendado: sí.
- Nombre comercial.
- Dónde encontrar a los 10 usuarios de prueba (r/Luxembourg, grupos de expatriados, conocidos).
- Modelo de negocio (particulares o empresas: reubicación, RR. HH., portales): después de validar.
