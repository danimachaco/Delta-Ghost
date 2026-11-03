## PS-36 · API para obtener la sombra de una ruta

**Autor:** Adam · **Fecha:** 03/11/2026 · **Issue:** PS-36

### Qué se ha hecho

Se ha creado el endpoint `GET /api/rutas/{id}/sombra`, que devuelve la "sombra" de una ruta: los puntos GPS y los tiempos de la mejor marca, junto con el tiempo en que la sombra termina cada sector. Es lo que el reloj descarga antes de salir para dibujar el segundo punto en pantalla y avisar en verde o en rojo al final de cada sector. Corresponde a la historia *"Como corredor, quiero descargar la sombra…"*.

### Cómo se ha hecho

- **Capas:** `SombraController` → `SombraService`, que usa `RutaRepository` y `CarreraRepository`. La respuesta es `SombraResponse` (`rutaId`, `carreraId`, `tiempoTotalSegundos`, `puntos`, `sectores`), y cada sector es un `SectorSombraDto` con `numero`, `puntoInicio`, `puntoFin` y `tiempoSegundos`.
- **Qué es la sombra:** la carrera marcada como mejor marca en PS-33. Si todavía ninguna carrera ha batido la grabación original, la sombra es la propia ruta y `carreraId` va a `null`. Así el reloj siempre tiene algo contra lo que correr, incluso la primera vez.
- **Tiempo por sector:** los sectores se definen con los puntos de la ruta, pero la carrera de la sombra tiene sus propios puntos GPS (puede tener más o menos y no caen exactamente en el mismo sitio). Para cada final de sector se busca el punto de la sombra más cercano con la fórmula de Haversine (la misma que usa el servicio `Calculo` del frontend, PS-31) y se toma su tiempo. La búsqueda avanza siempre hacia delante desde el sector anterior, para que en rutas que pasan dos veces por el mismo sitio los tiempos no vayan hacia atrás.
- **Seguridad:** como cuelga de `/api/rutas/**`, el `TokenInterceptor` exige el token; si la ruta es de otro usuario se responde `404`, igual que en el resto de endpoints de rutas.
- **Pruebas** con `MockMvc` (4 nuevas, 30 en total): sombra sin carreras, sombra con la carrera más rápida (con menos puntos que la ruta), ruta ajena o inexistente y petición sin token. Se ha añadido la petición a la colección de Postman.

### Por qué

- **Un endpoint propio para la sombra** en lugar de reutilizar `GET /api/rutas/{id}`: el reloj solo necesita los puntos y tiempos de la mejor marca, y así no tiene que saber cuál es ni hacer cálculos.
- **Calcular los tiempos por sector en el servidor** deja al reloj solo la comparación con su propio tiempo, que es lo que tiene que hacer en directo mientras se corre.

### Problemas encontrados

- Depende de la tabla `punto_carrera` y de la mejor marca de PS-33, así que la rama se creó a partir de la de PS-33. Hasta que esa PR se fusione, la PR de PS-36 muestra también sus commits.
