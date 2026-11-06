## PS-56 · API de amigos (enviar, aceptar y listar)

**Autor:** Adam · **Fecha:** 06/11/2026 · **Issue:** PS-56

### Qué se ha hecho

Se ha creado en el backend la API de amigos. Un corredor puede enviar una solicitud de amistad a otro escribiendo su email, ver las solicitudes que ha recibido y enviado, aceptar las que le llegan y consultar su lista de amigos. Es la base para que, más adelante, se pueda competir contra la sombra de un amigo.

### Cómo se ha hecho

- **Nueva tabla `amistad`** (entidad `Amistad`, script `base-de-datos/04-amistad.sql`). Guarda quién envía la solicitud (`solicitante`), quién la recibe (`destinatario`), el estado (`PENDIENTE` o `ACEPTADA`, guardado como texto con `@Enumerated(EnumType.STRING)` para que se entienda al mirar la tabla) y las fechas de solicitud y de aceptación. Una restricción `UNIQUE (solicitante_id, destinatario_id)` impide duplicar solicitudes, y `ON DELETE CASCADE` borra las amistades de un usuario si se borra su cuenta.
- **Endpoints** en `AmigoController` (`/api/amigos`), protegidos con el `TokenInterceptor` (se ha añadido la ruta en `WebConfig`):
  - `POST /api/amigos/solicitudes` con `{ email }`: envía la solicitud.
  - `GET /api/amigos/solicitudes`: devuelve `{ recibidas, enviadas }`, las pendientes en cada sentido.
  - `POST /api/amigos/solicitudes/{id}/aceptar`: acepta una solicitud recibida.
  - `GET /api/amigos`: lista de amigos.
- **Respuesta `AmistadResponse`** (`id`, `usuario`, `estado`, `fecha`). El campo `usuario` es siempre *la otra persona*, vista desde quien llama. Así el frontend no tiene que averiguar si fue él quien envió la solicitud. Se reutiliza `UsuarioResponse`, que nunca incluye la contraseña.
- **Reglas en `AmistadService`:**
  - No puedes enviarte una solicitud a ti mismo (`400`).
  - El email tiene que ser de un usuario registrado (`404`).
  - No se puede repetir una solicitud ni pedir amistad a quien ya es tu amigo (`409`).
  - Solo el destinatario puede aceptar, y solo mientras sigue pendiente (`404` en otro caso, igual que con las rutas ajenas, para no revelar nada).
  - Si le envías una solicitud a alguien que ya te había enviado una, se acepta la suya directamente en lugar de crear otra.
- **Amistad mutua:** la consulta `amigosDe` (JPQL con `@Query`) busca las amistades aceptadas en las que el usuario es solicitante *o* destinatario.
- **Pruebas** con `MockMvc` (8 nuevas, 44 en total): enviar, ver recibidas y enviadas, aceptar y que los dos se vean como amigos, quién puede aceptar, aceptación automática de solicitudes cruzadas, duplicados, emails incorrectos o desconocidos, la propia cuenta y peticiones sin token. También se han añadido 6 peticiones a la colección de Postman (de la 15 a la 20), que crean un segundo usuario para probar el flujo completo.

### Por qué

- **Una sola tabla con estado**, en lugar de una tabla de solicitudes y otra de amigos: una amistad es la misma relación antes y después de aceptarla, y así aceptar es solo cambiar el estado.
- **Buscar por email:** es un dato que el corredor conoce de su amigo, y ya es único en la tabla `usuario`.
- **Aceptar automáticamente las solicitudes cruzadas:** si los dos se piden amistad a la vez, está claro que los dos quieren ser amigos. Así no queda una solicitud pendiente sin sentido.

### Problemas encontrados

- La validación `@Email` rechaza los emails con espacios al principio o al final, igual que en el registro. Una de las pruebas los enviaba así y se corrigió la prueba; el servicio pasa además el email a minúsculas, como en el login.
- Responder `404` cuando el email no existe permite saber si un email tiene cuenta. Se ha aceptado porque para añadir a un amigo hace falta poder buscarlo; si en el futuro preocupa, se podría responder siempre `201`.
