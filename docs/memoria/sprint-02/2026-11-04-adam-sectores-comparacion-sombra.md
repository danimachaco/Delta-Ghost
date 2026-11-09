## PS-48 · Lógica de división en sectores y comparación con la sombra

**Autor:** Adam · **Fecha:** 04/11/2026 · **Issue:** PS-48

### Qué se ha hecho

Se ha creado en el frontend la lógica de los sectores de la carrera (`core/servicios/sectores.ts`). Divide la ruta en sectores y, mientras se corre, detecta cuándo el corredor termina cada uno. En ese momento compara su tiempo con el de la sombra en ese mismo sector y decide si el aviso es **verde** (más rápido) o **rojo** (más lento), como los tiempos por sector de la Fórmula 1. También se ha añadido al servicio `Rutas` la llamada para descargar la sombra (`GET /api/rutas/{id}/sombra`, PS-36) y sus modelos en `core/modelos/sombra.ts`.

### Cómo se ha hecho

- **`dividirEnSectores(numeroPuntos, pedidos = 3)`.** Reparte los puntos en tramos de tamaño parecido, de forma que el final de un sector es el inicio del siguiente (con 7 puntos salen 0→2, 2→4 y 4→6). Nunca crea más sectores que tramos. Usa exactamente la misma fórmula que el backend (`RutaService.dividirEnSectores`), así las rutas que aún no traen sectores se dividen igual que las guardadas.
- **Finales de sector en metros.** Con la fórmula de Haversine del servicio `Calculo` (PS-31) se calcula a cuántos metros de la salida termina cada sector, medidos sobre los puntos de la ruta.
- **`ComparacionSectores`** (una por carrera). El reloj le pasa cada lectura con `actualizar(metros, segundos)`. Cuando los metros recorridos superan el final del sector actual:
  - Calcula el segundo exacto en que se cruzó la línea, **interpolando** entre la lectura anterior y la actual, porque el GPS casi nunca da una lectura justo en el final.
  - Obtiene el tiempo de la sombra en ese mismo metro con `PerfilSombra.tiempoEnDistancia` (PS-43).
  - Devuelve un `ResultadoSector` con el tiempo del corredor y el de la sombra en el sector, la diferencia en el sector, la diferencia acumulada desde la salida y el color.
  - Si el GPS ha estado un rato sin señal y se han cruzado varios finales de golpe, los cierra todos en orden.
- **Servicio `Sectores`** con `dividir()`, `limites()` y `comparar(puntosRuta, sombra, sectores?)`. Si no se le pasan sectores (por ejemplo, los del backend), divide la ruta en 3.
- **Pruebas** con Vitest (11 nuevas, 141 en total): división igual que el backend, finales en metros, sectores verdes y rojos, diferencia acumulada, interpolación del cruce, varios sectores de golpe, sombra con puntos distintos de la ruta, sectores indicados desde fuera y la llamada `Rutas.sombra()`.

### Por qué

- **El color depende del tiempo del sector, no del acumulado:** igual que en la F1, se puede ir por detrás en el total y aun así hacer un sector en verde. Esto motiva al corredor en cada tramo. El acumulado también se devuelve para mostrarlo.
- **Comparar por metros recorridos** (y no buscando el punto GPS más cercano) mantiene el mismo criterio que la diferencia en directo de PS-43. Así el aviso del sector y el número de la pantalla nunca se contradicen.
- **Una clase con estado por carrera** en lugar de guardar el estado en el servicio: si se empieza otra carrera se crea una comparación nueva y no queda nada de la anterior.

### Problemas encontrados

- La sombra puede ser una carrera con puntos distintos de los de la ruta (otro número de puntos, en otros sitios). Por eso los finales de sector se miden en metros sobre la ruta y el tiempo de la sombra se busca por distancia, en lugar de usar el mismo índice de punto.
- La CLI de Angular pide Node 24.15 o superior y en el equipo había Node 24.13. La build y los tests se ejecutaron con `npx -p node@24.15.0`, sin cambiar la instalación del sistema.
