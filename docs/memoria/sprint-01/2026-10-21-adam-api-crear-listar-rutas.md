## PS-24 · API para crear y listar rutas

**Autor:** Adam (integrado en el repositorio por Asier García) · **Fecha:** 21/10/2026 · **Issue:** PS-24

### Qué se ha hecho

Se han creado los endpoints `POST /api/rutas` (crear una ruta), `GET /api/rutas` (listar las rutas del usuario) y `GET /api/rutas/{id}` (ver una ruta). Al crear una ruta se guardan sus puntos GPS en MySQL y se divide automáticamente en sectores. Solo pueden usarlos usuarios que hayan iniciado sesión, y cada uno ve únicamente sus rutas.

### Cómo se ha hecho

- **Protección con el token de PS-19.** Un `HandlerInterceptor` (`TokenInterceptor`) se ejecuta antes del controlador en `/api/rutas/**`: lee la cabecera `Authorization: Bearer <token>`, comprueba la firma y la caducidad con `TokenService` y guarda el id del usuario en la petición. Si falta o no es válido responde `401 { error }`. El controlador recibe el id con `@RequestAttribute`.
- **DTO separados de las entidades** (`RutaRequest`, `RutaResponse`, `PuntoDto`, `SectorDto`), para no exponer la estructura interna de la base de datos y controlar exactamente el JSON. La respuesta usa los mismos nombres de campo que el modelo `Ruta` del frontend.
- **Validaciones:** nombre obligatorio (máximo 60 caracteres), al menos 2 puntos, latitud entre -90 y 90, longitud entre -180 y 180, tiempo no negativo y entre 1 y 10 sectores. Se usa `@Valid` dentro de la lista para validar cada punto. Además, el servicio comprueba que los tiempos de los puntos no vayan hacia atrás.
- **División en sectores.** Si no se indica `numeroSectores` se usan 3, como en la Fórmula 1. Los puntos se reparten en tramos de tamaño parecido (con 7 puntos: 0→2, 2→4 y 4→6) y nunca se crean más sectores que tramos.
- **Guardado en cascada.** Se construye la `Ruta` con sus `Punto` y `Sector` y un solo `save()` lo inserta todo dentro de una transacción (`@Transactional`).
- **Privacidad:** si un usuario pide una ruta de otro, recibe `404`, igual que si no existiera.
- **Pruebas** con `MockMvc` (7 nuevas, 21 en total): creación con sectores, límite de sectores, listado por usuario, ruta de otro usuario, peticiones sin token o con token falso, validaciones y tiempos incorrectos.

### Por qué

- **Interceptor en lugar de Spring Security completo:** para dos endpoints es mucho más sencillo de entender y explicar, y cumple la misma función.
- **Cada usuario solo ve sus rutas:** son sus carreras personales; además así se protege su ubicación.
- **Calcular los sectores en el servidor:** el frontend no tiene que preocuparse de ello y todas las rutas se dividen igual.
- **IDs como texto en el JSON:** el frontend ya trabaja con `id: string`, y así no hay que cambiarlo.

### Problemas encontrados

- Las pruebas de rutas y las de autenticación comparten la misma base de datos en memoria. Al borrar usuarios con rutas fallaba la clave foránea, así que las pruebas de rutas borran primero las rutas y limpian también al terminar (`@AfterEach`).
- Al integrar la tarea en el repositorio se añadieron `RutaNoEncontradaException` (404) y `DatosRutaIncorrectosException` (400) y sus manejadores en `GlobalExceptionHandler`, según lo que comprueban las pruebas.
