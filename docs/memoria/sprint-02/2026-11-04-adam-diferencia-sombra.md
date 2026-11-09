## PS-43 · Función que calcula la diferencia con la sombra

**Autor:** Adam · **Fecha:** 04/11/2026 · **Issue:** PS-43

### Qué se ha hecho

Se ha creado en el frontend el servicio `DiferenciaSombra` (`core/servicios/diferencia-sombra.ts`), que calcula en cada momento de la carrera cuántos segundos y cuántos metros le saca el corredor a su sombra (o cuántos le faltan), y en qué punto de la ruta va la sombra. Es el dato que el reloj enseña en grande ("−2,4 s" en verde o "+1,0 s" en rojo) y lo que mueve el punto de la sombra en la barra de progreso.

### Cómo se ha hecho

- **Comparación por distancia recorrida.** Cuando el corredor lleva X metros en T segundos, se busca cuánto tardó la sombra en recorrer esos mismos X metros: `diferencia = T − tiempoSombra(X)`. Si sale negativo, vas por delante. No se comparan posiciones GPS directamente porque los puntos de las dos carreras nunca caen exactamente en el mismo sitio.
- **`PerfilSombra`.** Al recibir la sombra se calcula una sola vez la distancia acumulada hasta cada punto con la fórmula de Haversine del servicio `Calculo` (PS-31). Después, cada consulta solo busca el tramo en el que cae y reparte proporcionalmente entre sus dos puntos (**interpolación lineal**):
  - `tiempoEnDistancia(metros)`: segundos que tardó la sombra en llegar a esa distancia.
  - `distanciaEnTiempo(segundos)`: metros que llevaba la sombra en ese instante.
- **`calcular(sombra, metros, segundos)`** devuelve `{ segundos, metros, progresoSombra }`: la diferencia en tiempo, la diferencia en metros y el progreso de la sombra de 0 a 1, en el mismo formato que ya usa la pantalla del reloj para dibujar los puntos.
- **Casos límite:** antes de la salida o pasada la meta los valores se limitan al recorrido; si la sombra se paró en un sitio (tramo de 0 m) se usa el primer momento en que llegó; si la sombra tiene menos de 2 puntos devuelve `null`. El último perfil se guarda para no recalcular las distancias en cada lectura del GPS.
- **Pruebas** con Vitest (11 nuevas): distancias acumuladas, interpolación de tiempo y distancia, límites, diferencia positiva, negativa y cero, progreso de la sombra, paradas, reutilización del perfil y sombras sin puntos suficientes.

### Por qué

- **Por distancia y no por tiempo:** al corredor le interesa saber cuánto tiempo pierde o gana en el sitio en el que está, como los tiempos de la F1, que se comparan en el mismo punto del circuito.
- **Interpolación lineal:** el GPS da un punto cada pocos segundos; sin interpolar, la diferencia saltaría a golpes entre punto y punto.
- **Servicio en `core/`:** lo usarán la pantalla del reloj y la comparación por sectores (PS-48), y así calculan todas igual.

### Problemas encontrados

Ninguno importante. Hubo que decidir qué hacer cuando la sombra se queda parada (varios puntos en el mismo sitio): se toma el primer momento en que llegó, que es el tiempo justo con el que comparar.
