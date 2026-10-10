---
tipo: nota
proyecto: app_donde_vivir
fecha: 2026-10-04
---
# Concepto

## Para quién
- Quien llega a una ciudad, quien se muda dentro de ella y quien se va a otra. La gente se muda cada pocos años, pero siempre hay gente llegando y saliendo.

## Qué hace (palabras de Ale, 2026-10-04)
- "Como definir el piso a buscar", pero combinado con: trayecto al trabajo o al colegio más cercano para los niños, supermercados, ruido de aviones, trenes y avenidas principales, alquiler por barrio.
- Tantas variables que acote mucho y dé una visión real de dónde vivir.
- El usuario filtra por lo que quiera y por la distancia a lo que quiera. Se añaden colegios, universidades, parques y todo lo que tenga valor para un cliente.
- Con IA que va acotando o cambiando parámetros: si no se encuentra nada, dice que el limitante es x, y, z.
- "No es el próximo Facebook, pero ayudaría mucho a la gente."

## Flujo (borrador de Claude, a validar)
1. Perfil: quiénes viven (adultos, niños), presupuesto, tamaño, must y desired del piso.
2. Destinos: trabajo(s), colegio, universidad; medio de transporte y tiempo máximo de cada persona.
3. Capas: ruido (aviones, trenes, carreteras), alquiler por barrio, servicios y lugares que el usuario quiere cerca o lejos, con distancia.
4. Resultado: mapa de zonas (verde, ámbar, rojo) con el porqué de cada una.
5. IA: si no hay zonas, dice qué lo limita y cuantifica alternativas ("con +5 min de trayecto entran X barrios; con +200 € entra Y").
6. Más adelante: conectar con anuncios reales para pasar de la zona al piso.

## Alcance del prototipo v0 (decidido por Ale el 2026-10-04)
- **Formato**: web que funcione en el móvil, en inglés.
- **Entra en v0:**
  - Hasta 2 personas, cada una con su destino y su tiempo máximo.
  - Niños: colegio más cercano.
  - Presupuesto y m² → alquiler estimado por barrio (m² × precio medio por m² del barrio).
  - Trayectos en transporte público (horarios reales), en bici y andando.
  - Ruido de aviones, trenes y carreteras principales.
  - Distancia (cerca o lejos, la elige el usuario) a supermercados, colegios y guarderías, universidades, parques, farmacias y médicos, gimnasios, bares y vida nocturna, y "mis lugares" (puntos propios).
  - Mapa de zonas verde, ámbar y rojo con el porqué de cada una.
- **Después:** coche en hora punta · IA que explica el limitante y cuantifica alternativas · definir criterios conversando con la IA · enlaces a anuncios.
- **Frontera (Francia, Bélgica, Alemania):** entra en la app, después del v0 (Ale, 2026-10-06). Fuentes candidatas en `notas/fuentes_datos.md`.
- **Regla de Ale:** solo lugares que existen y están reconocidos (edificios y puntos de fuentes de datos). Nada supuesto, como "zonas donde se vende droga".
- **Decisiones de Ale (2026-10-06), tras probar el prototipo:**
  - Cada filtro es "me importa / no me importa"; si importa, se elige la distancia. Sin niveles Must/Nice.
  - El precio no elimina zonas: es un mapa de calor del alquiler sobre lo que cumple el resto de filtros.
  - Vel'oh entra ya (aún no es comercial).
  - Ruido en palabras que entienda cualquiera, no en dB.
- **Decisiones de Ale (2026-10-07):**
  - Médicos en espera hasta la próxima revisión; hospitales y farmacias bastan (además, no sirve cualquier médico).
  - Obra nueva: aviso corto en la ficha ("New builds: often up to 25% more"), sin interruptor.
  - Textos mínimos en la app: fuentes en una pestaña aparte; nada de explicar la lógica (eso va en los archivos internos).

## Lo que ya existe (prueba de concepto)
- Un mapa de zonas previo (fuera de este repositorio): zonas por trayecto, corredor de ruido de Findel y alquiler por barrio.
- Un script de trayectos puerta a puerta con horarios oficiales (GTFS), base del cálculo de `prototipo/`.
