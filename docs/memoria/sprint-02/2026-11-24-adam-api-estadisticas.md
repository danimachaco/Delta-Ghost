## PS-75 · API de estadísticas

**Autor:** Adam · **Fecha:** 24/11/2026 · **Issue:** PS-75 (historia PS-74)

### Qué se ha hecho

Se ha creado el endpoint `GET /api/estadisticas`, que devuelve las estadísticas del corredor que ha iniciado sesión, preparadas para la web de estadísticas con Chart.js (PS-76):

- **Resumen:** número de carreras, rutas corridas, distancia y tiempo totales, ritmo medio, mejor ritmo y carrera más larga.
- **Semanas:** carreras, distancia y tiempo de cada una de las últimas semanas (12 por defecto, se puede pedir de 1 a 52 con `?semanas=`).
- **Rutas:** en cada ruta, cuántas veces se ha corrido, el primer tiempo, el mejor, el último y cuánto se ha mejorado.
- **Evolución:** las últimas 50 carreras en orden de fecha, con su tiempo, distancia y ritmo.

### Cómo se ha hecho

- **Qué cuenta como carrera.** Cada vez que el corredor ha corrido: sus carreras (en rutas suyas o de amigos) y la grabación de sus propias rutas, que es su primera vuelta. Es el mismo criterio que el ranking (PS-64), con la clase `Marca`.
- **Distancia.** Las carreras no guardan su distancia, así que se calcula sumando los tramos entre sus puntos GPS con la fórmula de Haversine. Esa fórmula estaba repetida dentro de `TiemposSector` (PS-67). Se ha sacado a una clase `Geo` que ahora usan los dos.
- **`EstadisticasService`** reúne todas las carreras del corredor, las ordena por fecha y calcula cada serie:
  - El ritmo es `segundos / (metros / 1000)`, en segundos por km. Es `null` si no hay distancia, para no dividir entre 0.
  - Las semanas van de lunes a domingo e incluyen también las semanas sin carreras (con ceros). Así el gráfico de barras no se salta semanas.
  - Las rutas se ordenan de la más corrida a la menos corrida.
  - El número de semanas se limita entre 1 y 52 en lugar de dar error, para que un valor raro en la URL no rompa la web.
- **El día de hoy se pasa como parámetro** al servicio. Así una prueba puede pedir las estadísticas "dentro de dos semanas" y comprobar que cada carrera cae en su semana sin depender del día en que se ejecuta.
- **Respuesta** `EstadisticasResponse`, con un `record` para cada parte (`Resumen`, `Semana`, `PorRuta`, `Evolucion`). El contrato está anotado en `CLAUDE.md` para que Daniel pueda hacer la web (PS-76) sin esperar.
- **Seguridad:** necesita el token (se ha añadido `/api/estadisticas` en `WebConfig`) y cada corredor solo ve las suyas.
- **Pruebas** con `MockMvc` (8 nuevas, 73 en total):
  - el resumen con distancias y ritmos reales;
  - el progreso en una ruta y el orden de la evolución;
  - las semanas, incluidas las vacías y el límite de 1 a 52;
  - que cada carrera cae en su semana;
  - que la carrera en la ruta de un amigo cuenta para quien la corre;
  - un corredor sin carreras y una petición sin token.

  Se ha añadido la petición 25 a la colección de Postman.

### Por qué

- **Series listas para dibujar:** Chart.js necesita una lista de etiquetas y una de valores por gráfico. Si el backend ya las da ordenadas y completas, la web solo tiene que pasarlas al gráfico, y los cálculos (distancias con Haversine, semanas…) se hacen una vez y en un solo sitio.
- **Contar también la grabación de la ruta:** al grabar una ruta el corredor también ha corrido. Si no se contara, alguien que solo ha grabado rutas vería sus estadísticas a cero.
- **Unidades base (metros, segundos):** cada pantalla decide cómo mostrarlas (km con una decimal, minutos:segundos…) con las utilidades de formato que ya existen en el frontend.

### Problemas encontrados

- Dos pruebas fallaban aunque los valores eran correctos: el JSON devuelve 667 como número entero y el comparador `closeTo` esperaba un decimal. Se cambiaron por los valores exactos.
