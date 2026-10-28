## PS-32 · Filtro de GPS: precisión y saltos imposibles

**Autor:** Asier García · **Fecha:** 28/10/2026 · **Issue:** PS-32

### Qué se ha hecho

Se ha añadido un filtro que descarta las lecturas del GPS que no sirven para medir una carrera: las que tienen mala precisión, las que implicarían un salto imposible y las repetidas. El servicio `Gps` (PS-28) ofrece ahora, además de la posición en bruto, la última **posición válida**, que es la que usarán la grabación de rutas y la carrera. La pantalla GPS muestra cuántas lecturas se han descartado y por qué.

### Cómo se ha hecho

- **Servicio `FiltroGps`** (`core/servicios/filtro-gps.ts`). Cada lectura pasa por tres comprobaciones, en este orden:
  1. **Precisión:** si el GPS indica un margen de error mayor de **20 m**, se descarta. Es el mismo umbral que la pantalla GPS de la PS-28 ya marcaba en verde.
  2. **Lectura repetida:** si llega con la misma hora que la última buena, o con una anterior, se descarta. El navegador a veces repite una posición guardada.
  3. **Salto imposible:** con el servicio `Calculo` de la PS-31 se calcula la distancia (Haversine) desde la última lectura aceptada y la velocidad necesaria para recorrerla. Si supera los **12 m/s (43 km/h)**, se descarta. Ni el récord del mundo de 100 m llega a esa velocidad media.
- **Referencia siempre a la última lectura buena.** Así, si se cuela una lectura mala, el filtro se corrige solo: el tiempo transcurrido desde ella va creciendo y las lecturas buenas siguientes vuelven a ser creíbles.
- **Integración en `Gps`** sin cambiar lo que ya existía:
  - Se añadieron las señales `posicionValida`, `descartadas` y `ultimoDescarte`. La señal `posicion` (en bruto) sigue igual, así que la pantalla y las pruebas de la PS-28 no cambian.
  - Se usa la hora real de la lectura (`GeolocationPosition.timestamp`) y, si el navegador no la da, la hora actual.
  - Cada vez que se inicia el GPS, el filtro se reinicia.
- **Pantalla GPS:** muestra "Lecturas descartadas: N (la última por …)" en una zona `aria-live`, para que los lectores de pantalla también lo anuncien.
- **Pruebas.**
  - **Pruebas unitarias:** se añadieron 14 nuevas: 9 del filtro (precisión, límite exacto de 20 m, valores no numéricos, movimiento normal, salto, comparación con la última buena, lecturas repetidas, recuperación tras una lectura mala y reinicio), 4 de la integración en `Gps` y 1 de la pantalla. En total pasan 80.
  - **Prueba en el navegador:** se simuló el GPS con 6 lecturas. Las 2 malas (precisión de 45 m y un salto de 1,1 km en un segundo) se descartaron, mientras la pantalla seguía mostrando la lectura en bruto.

### Por qué

- **El GPS de un móvil comete errores:** al salir de un portal, bajo los árboles o entre edificios puede dar posiciones a decenas de metros o "saltar" de golpe. Si esas lecturas se usaran, la distancia de la carrera y la comparación con la sombra serían falsas, y se avisaría en rojo sin motivo.
- **Filtrar en el frontend y no en el servidor:** las lecturas llegan al dispositivo varias veces por segundo durante la carrera. Hay que descartarlas en ese momento, antes de calcular distancias o avisar al corredor.
- **Mantener también la posición en bruto:** sirve para depurar y para que la pantalla GPS siga mostrando lo que ve el dispositivo.

### Problemas encontrados

- La pantalla GPS y su servicio son de Daniel (PS-28). Para no modificar su trabajo, el filtro se añadió como señales nuevas y sus pruebas originales siguen pasando sin cambios.
- En el navegador el número de descartes aparecía pegado al motivo ("2(la última…)"), porque Angular elimina los espacios entre elementos. Se arregló con un margen en el CSS.
