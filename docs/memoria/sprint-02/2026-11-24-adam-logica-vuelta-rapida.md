## PS-78 · Lógica del modo vuelta rápida

**Autor:** Adam · **Fecha:** 24/11/2026 · **Issue:** PS-78 (historia PS-77)

### Qué se ha hecho

Se ha creado en el frontend la lógica del **modo vuelta rápida**, pensado para correr en pista o en cualquier circuito cerrado. El corredor da vueltas a un recorrido que empieza y acaba en la misma línea, y la app:

- detecta sola cada vuelta al pasar por la línea;
- mide su tiempo;
- la compara con la mejor vuelta y con la anterior y decide el aviso, como en la Fórmula 1:
  - **morado**: nueva vuelta rápida;
  - **verde**: más rápida que la vuelta anterior;
  - **rojo**: más lenta que la anterior;
- calcula en directo, durante la vuelta, cuántos segundos llevas de ventaja o de retraso respecto a tu mejor vuelta en ese mismo punto de la pista.

La pantalla del reloj que lo muestra es otra tarea (PS-79, de Asier).

### Cómo se ha hecho

- **Modelo `Vuelta`** (`core/modelos/vuelta.ts`): número, tiempo, inicio y fin, distancia, puntos GPS, diferencias con la mejor vuelta y con la anterior, si es la mejor y el `resultado` del aviso. El resultado usa el mismo tipo `ResultadoAviso` (`morado`, `mejor`, `peor`) que los sectores (PS-49 y PS-68), así el reloj puede reutilizar sus destellos y vibraciones.
- **Clase `ModoVueltaRapida`** (`core/servicios/vuelta-rapida.ts`), sin Angular, para poder probarla sola. Con cada lectura del GPS:
  1. Suma los metros de la vuelta con la fórmula de Haversine (PS-31).
  2. Cuando la vuelta ya tiene al menos 100 m y el corredor está a menos de 20 m de la salida, considera que está pasando por la línea. Va guardando la lectura más cercana hasta que la siguiente ya no se acerca.
  3. Calcula el **momento exacto del cruce** repartiendo el tiempo entre esas dos lecturas según lo lejos que estaba cada una de la línea. Si una estaba 10 m antes y la otra 10 m después, cruzó justo a mitad de tiempo.
  4. Cierra la vuelta y empieza la siguiente desde ese punto, con las lecturas que ya habían llegado después.
- **Botón de vuelta:** `marcarVuelta()` cierra la vuelta a mano, como el botón "lap" de los relojes deportivos. Sirve para pistas cubiertas o cuando el GPS es malo.
- **Diferencia en vivo:** la mejor vuelta funciona como una sombra. Se reutilizan `distanciasAcumuladas` y `tiempoSombraEn` (PS-45) para saber cuánto se tardó en la mejor vuelta en recorrer los metros que llevas.
- **Servicio `VueltaRapida`.** Envuelve la clase con signals (`estado`, `vueltas`, `ultimaVuelta`, `mejorVuelta`, `numeroVuelta`, `diferencia`, `metrosVuelta`) para que la pantalla del reloj solo tenga que leerlas. El reloj le pasa cada lectura del GPS con los segundos del cronómetro. Cómo usarlo está explicado en el propio servicio y en `CLAUDE.md`.
- **Pruebas** con Vitest (11 nuevas, 340 en total). Simulan una pista circular de 400 m con una lectura cada 10 m y comprueban:
  - el cierre de vueltas y que solo se cierra cuando ya se aleja de la línea;
  - el cruce calculado cuando falta la lectura en la línea;
  - que el ruido del GPS en la salida no cierra vueltas falsas;
  - los avisos morado, verde y rojo, y la diferencia en vivo;
  - el botón manual y las opciones;
  - los signals del servicio.

### Por qué

- **Detectar las vueltas por distancia a la salida y no por la ruta:** en una pista no hay ruta guardada. Basta con pulsar "Empezar" en la línea, y así funciona en cualquier circuito.
- **Distancia mínima y radio:** sin la distancia mínima, el ruido del GPS al arrancar (el corredor sigue cerca de la línea) cerraría vueltas falsas. Con 100 m y 20 m funciona en una pista de 400 m, y se pueden cambiar con las opciones.
- **Calcular el cruce entre dos lecturas:** el GPS da una lectura por segundo, así que la lectura más cercana puede estar a varios metros de la línea. Sin repartir el tiempo, cada vuelta tendría un error de hasta un segundo, mucho en vueltas de poco más de un minuto.
- **Morado para la vuelta rápida:** es el color de la vuelta rápida en la F1 y ya existe en el reloj (PS-68).

### Problemas encontrados

- La primera versión cerraba la vuelta en la lectura más cercana a la línea. Una prueba con una lectura perdida justo en la línea mostró que entonces la vuelta medía 97,5 s en lugar de 100 s. Por eso se añadió el cálculo del momento del cruce entre las dos lecturas.
- `Array.findLast` no está disponible con la configuración de TypeScript del proyecto. Se usó `[...lista].reverse().find(...)`.
- Para compilar y pasar las pruebas hubo que reinstalar las dependencias (`npm ci`), porque un compañero había añadido Leaflet para el mapa.
