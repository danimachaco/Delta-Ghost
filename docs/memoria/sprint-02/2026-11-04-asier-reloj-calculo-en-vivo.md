## PS-45 · Conectar el reloj al cálculo en vivo

**Autor:** Asier García · **Fecha:** 04/11/2026 · **Issue:** PS-45 (historia PS-42)

### Qué se ha hecho

La pantalla del reloj (`/reloj`) ya no enseña datos de ejemplo. Muestra la carrera real que se empieza en "Elige ruta" (PS-44), siguiendo el mockup "2 · Reloj":
- el tiempo del cronómetro y los kilómetros que llevas;
- la diferencia con la sombra en segundos, con la esfera en verde si vas por delante y en rojo si vas por detrás;
- los dos puntos de la barra, que avanzan según dónde estás tú y dónde estaría tu sombra en ese mismo momento.

La carrera termina sola al llegar a la meta, o antes con el botón **Terminar**.

### Cómo se ha hecho

- **Funciones de la sombra** (`compartido/utilidades/sombra.ts`). La sombra es una lista de puntos con el segundo en que pasó por cada uno. Entre dos puntos se supone que fue a velocidad constante (interpolación lineal).
  - `distanciasAcumuladas()`: los metros desde la salida hasta cada punto, calculados con la fórmula de Haversine de la PS-31.
  - `distanciaSombraEn(segundos)`: cuántos metros llevaba la sombra en ese segundo de carrera.
  - `tiempoSombraEn(metros)`: en qué segundo pasó la sombra por esos metros. Los tramos en los que la sombra estuvo parada se saltan.
- **Servicio `Carrera` ampliado** (`core/servicios/carrera.ts`):
  - **Tu recorrido:** se suscribe a `Gps.lecturasValidas`, las lecturas que pasan el filtro de la PS-32. La salida es la posición al pulsar Empezar, en el segundo 0. Cada punto guarda los segundos del cronómetro, y el tiempo nunca va hacia atrás.
  - **Distancia y progreso:** tu distancia es la suma de tus tramos (servicio `Calculo`). Tu progreso es esa distancia entre la longitud de la ruta. El progreso de la sombra es la distancia que llevaba en el mismo tiempo de carrera.
  - **Diferencia:** es tu tiempo menos el segundo en que la sombra pasó por el punto donde estás tú. Negativa significa que vas por delante. Por ejemplo, si llevas 60 m a los 20 s y la sombra pasó por los 60 m a los 30 s, la diferencia es −10 s.
  - **Meta:** al llegar a la longitud de la ruta, la carrera se termina sola y apaga el GPS.
  - Todo son `computed`, así el reloj se actualiza solo en cuanto cambia el tiempo o llega una lectura del GPS.
- **Pantalla `RelojInicio`** (`zonas/reloj/reloj-inicio/`). Lee las *signals* del servicio y tiene tres estados:
  - **Sin carrera:** invita a "Elegir ruta".
  - **En curso:** muestra el botón **Terminar**. El enlace de salir desaparece para no abandonar la carrera sin querer.
  - **Terminada:** los datos se quedan quietos y aparecen "Correr otra vez" y "Salir".
  - Los *inputs* `progresoTu` y `progresoSombra` que había preparado el equipo se mantienen. Si se les da valor, mandan sobre los de la carrera, para que una carrera simulada (HU-40) pueda moverlos.
  - Pasada la hora, el tiempo se muestra como `h:mm:ss`.
- **Pruebas.** Se añadieron 21 pruebas nuevas, y en total pasan 158:
  - 6 de las funciones de la sombra (interpolación, paradas, límites y que las dos funciones son inversas);
  - 8 del cálculo en vivo (ir por delante, ir por detrás, quedarse parado, llegar a la meta y lecturas repetidas);
  - 7 del reloj. Para estas se usa una carrera falsa con *signals*, así cada prueba pone los datos que necesita.
- **Prueba en el navegador.** Se usó el backend en local con una ruta de 300 m que la sombra recorre en 2:00, y un GPS simulado que envía una lectura por segundo:
  - corriendo a 5 m/s durante 6 s, la diferencia fue −6 s y la esfera se puso verde;
  - al quedarse parado, la sombra adelantó al corredor y la esfera pasó a rojo (+14 s);
  - al llegar a la meta en 1:10, la carrera terminó sola con −49,7 s frente a la sombra.

### Por qué

- **Comparar por distancia y no solo por posición:** con la distancia recorrida se sabe cuánto falta para la meta y se puede comparar con la sombra en el mismo punto. Es como se cuentan los tiempos en la Fórmula 1: quién pasa antes por el mismo sitio.
- **La diferencia se calcula con el tiempo actual y no con el de la última lectura:** si el corredor se para, la sombra sigue avanzando y la diferencia debe crecer aunque no lleguen lecturas nuevas.
- **Las funciones de cálculo van fuera de la pantalla:** son funciones puras, fáciles de probar con números exactos. Las podrá reutilizar la PS-43 (diferencia con la sombra) y la de los sectores (PS-48).
- **El reloj lee los datos del servicio y no por inputs:** la carrera empieza en otra pantalla, y así el dato viene siempre del mismo sitio sin tener que pasarlo de pantalla en pantalla.

### Problemas encontrados

- Al principio el texto de la diferencia tenía `aria-live`. Como cambia varias veces por segundo, un lector de pantalla lo habría leído sin parar, así que se quitó. La barra ya tiene su descripción en `aria-label`.
- Si una sombra tuviera todos los puntos en el mismo sitio, la longitud de la ruta sería 0 y la carrera se terminaría nada más empezar. Ahora solo se termina sola si la ruta mide más de 0 m.
