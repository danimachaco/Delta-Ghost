## PS-33 · API para subir una carrera con sus puntos

**Autor:** Adam · **Fecha:** 03/11/2026 · **Issue:** PS-33

### Qué se ha hecho

Se ha creado el endpoint `POST /api/rutas/{id}/carreras`, que guarda una carrera (una vez que el corredor ha corrido una de sus rutas) junto con todos los puntos GPS que ha grabado el reloj. Si la carrera es la más rápida hasta el momento, se marca como **mejor marca**: a partir de entonces es la "sombra" contra la que se compite. Corresponde a la historia *"Como corredor, quiero grabar una ruta para que se guarde como mi sombra"*.

### Cómo se ha hecho

- **Nueva tabla `punto_carrera`** (entidad `PuntoCarrera`). La tabla `punto` de PS-23 guarda los puntos de la *ruta*, pero cada carrera tiene sus propios tiempos en cada punto, así que hacía falta guardarlos aparte. Tiene la misma forma que `punto` (orden, latitud, longitud, tiempo) y cuelga de `carrera` con `ON DELETE CASCADE`. `Carrera` tiene ahora la lista `puntos` con `cascade = ALL`, de modo que un único `save()` inserta la carrera y sus puntos en la misma transacción. El script está en `base-de-datos/03-punto-carrera.sql`.
- **Capas:** `CarreraController` → `CarreraService` → `CarreraRepository`, con los DTO `CarreraRequest` (lista de puntos) y `CarreraResponse` (`id`, `rutaId`, `fecha`, `tiempoTotalSegundos`, `mejorMarca`, `puntos`). Se reutiliza `PuntoDto`, así el JSON de los puntos es el mismo que el de las rutas y el del frontend.
- **Validaciones:** al menos 2 puntos, coordenadas en rango y tiempos no negativos (anotaciones del DTO), y tiempos que no vayan hacia atrás (se reutiliza `RutaService.comprobarTiempos`).
- **Tiempo total:** como cada punto lleva los segundos desde la salida, el tiempo total es el del último punto; no hace falta que el cliente lo envíe.
- **Mejor marca:** la primera sombra es la propia grabación de la ruta. Una carrera nueva es mejor marca si baja el tiempo de la carrera que lo era hasta ahora (o el de la ruta, si todavía no había ninguna); en ese caso la anterior deja de serlo, para que siempre haya como mucho una por ruta.
- **Seguridad:** el endpoint cuelga de `/api/rutas/**`, así que el `TokenInterceptor` ya exige el token. Solo se pueden subir carreras a rutas propias; si la ruta es de otro usuario se responde `404`, igual que en PS-24.
- **Pruebas** con `MockMvc` (5 nuevas, 26 en total): subida con puntos, cálculo de la mejor marca con varias carreras, ruta ajena o inexistente, petición sin token y validaciones. También se han añadido dos peticiones a la colección de Postman.

### Por qué

- **Guardar los puntos de cada carrera** (y no solo el tiempo total) es lo que permite que la sombra se mueva por el mapa a la velocidad real de la mejor marca y comparar los sectores.
- **Calcular la mejor marca en el servidor** evita que cada cliente lo haga a su manera y deja preparado el endpoint de descargar la sombra (PS-36), que solo tiene que buscar la carrera marcada.

### Problemas encontrados

- En las pruebas hay que borrar primero las carreras, después las rutas y por último los usuarios, por las claves foráneas.
- En el equipo no estaba instalado Maven ni Java 17 (solo Java 8); las pruebas se ejecutaron con el JDK y el Maven que trae IntelliJ IDEA.
