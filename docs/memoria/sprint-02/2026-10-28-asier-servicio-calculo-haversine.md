## PS-31 · Servicio de cálculo: fórmula de Haversine y distancia

**Autor:** Asier García · **Fecha:** 28/10/2026 · **Issue:** PS-31

### Qué se ha hecho

Se ha creado en el frontend el servicio `Calculo`, que reúne todos los cálculos de la carrera: la distancia entre dos puntos GPS con la fórmula de Haversine, la distancia total de un recorrido, la velocidad y el ritmo (minutos por kilómetro). A partir de ahora el filtro del GPS, la grabación de rutas y el reloj calculan con el mismo código.

### Cómo se ha hecho

- **Fórmula de Haversine** (`core/servicios/calculo.ts`, función `haversineMetros`). Calcula la distancia sobre la superficie de una esfera del radio medio de la Tierra (6 371 km) a partir de la latitud y la longitud de los dos puntos:
  - `h = sen²(Δlat/2) + cos(lat1) · cos(lat2) · sen²(Δlon/2)`
  - `d = 2 · R · arcsen(√h)`

  Se limita `√h` a 1 para evitar errores de redondeo en puntos casi opuestos del planeta.
- **Servicio `Calculo`** con el decorador `@Service()` de Angular 22:
  - `distancia(a, b)`: metros entre dos puntos.
  - `distanciaTotal(puntos)`: suma de los tramos entre puntos consecutivos.
  - `velocidad(metros, segundos)`: en m/s, devuelve 0 si el tiempo no es positivo para no dividir entre 0.
  - `ritmo(metros, segundos)`: en segundos por kilómetro, devuelve `null` si aún no hay distancia.
- **Interfaz `Coordenada`** (`{ latitud, longitud }`). Gracias al tipado estructural de TypeScript, el servicio acepta tanto los `PuntoGps` de las rutas como las `PosicionGps` que llegan del GPS en vivo.
- **Una sola fórmula en toda la app.** La utilidad `distanciaKm` de la lista de rutas (PS-26) tenía su propia copia de Haversine; ahora usa `haversineMetros`. Además se añadió `formatearRitmo`, que muestra el ritmo como en el mockup del reloj (`5:17 /km`).
- **Pruebas.**
  - **Pruebas unitarias:** se añadieron 10 nuevas con casos de resultado conocido: un grado de latitud ≈ 111,2 km, Puerta del Sol → Plaza Mayor ≈ 360 m, la distancia es simétrica, media vuelta a la Tierra = π · R, la distancia total, la velocidad sin dividir entre 0 y el ritmo de 5,2 km en 27:28 ≈ 5:17 /km. En total pasan 66.
  - **Compilación:** la build de producción se genera sin errores.

### Por qué

- **Haversine y no Pitágoras sobre las coordenadas:** un grado de longitud no mide lo mismo en Madrid que en el ecuador. Haversine tiene en cuenta la curvatura de la Tierra y para distancias de carrera el error es inferior al 0,5 %, más que suficiente frente al error del propio GPS.
- **Un servicio común:** la distancia y la velocidad aparecen en varias partes de la app (filtro del GPS, grabación, reloj, resumen). Si cada una calculara a su manera, los números podrían no coincidir entre pantallas.
- **Trabajar en metros y segundos:** son las unidades del GPS y de la API. El paso a km y al formato `m:ss` se hace solo al mostrar los datos.

### Problemas encontrados

- Había dos implementaciones de Haversine: la de la lista de rutas y la nueva. Se unificaron para que solo exista una, y se comprobó que las pruebas de la lista de rutas siguen dando los mismos resultados.
