## PS-25 · Colección de Postman

**Autor:** Adam (integrado en el repositorio por Asier García) · **Fecha:** 21/10/2026 · **Issue:** PS-25

### Qué se ha hecho

Se ha creado una colección de Postman, "Ruta Fantasma API", con las 11 peticiones necesarias para probar la API del backend: registro e inicio de sesión (PS-19) y creación y listado de rutas (PS-24). Cada petición incluye pruebas automáticas, así que con un solo clic (*Run collection*) se comprueba que toda la API funciona.

### Cómo se ha hecho

- **Dos carpetas:** *Autenticación* (5 peticiones) y *Rutas* (6 peticiones). Para cada endpoint hay un caso correcto y los casos de error principales (400, 401, 404 y 409).
- **Variables de colección:** `baseUrl`, `email`, `password`, `token` y `rutaId`. Así, si cambia la dirección del servidor, solo hay que modificarla en un sitio.
- **Encadenamiento de peticiones con scripts:**
  - El *pre-request script* del registro genera un email nuevo cada vez (`ana<marca de tiempo>@correo.com`), para poder repetir la colección sin el error "email repetido".
  - Los scripts de prueba del registro y del login guardan el `token` de la respuesta, y el de "Crear ruta" guarda el `rutaId`, que usa después "Ver una ruta".
- **Autorización heredada:** la colección tiene configurado `Bearer {{token}}`, así que todas las peticiones de rutas envían el token sin configurarlo una a una. Las de autenticación y la de "sin token" usan *No Auth*.
- **Pruebas automáticas** con `pm.test` y `pm.expect` en cada petición: código de estado, campos de la respuesta (por ejemplo, que no se devuelve la contraseña, que la ruta tiene 7 puntos y 3 sectores) y mensajes de error en español.
- Se exportó en formato **Collection v2.1** para que cualquier compañero pueda importarla en Postman o ejecutarla con Newman.

### Por qué

- **Postman** permite probar la API sin tener el frontend terminado y sirve como documentación viva de los endpoints para el resto del equipo.
- **Pruebas automáticas en la colección:** en lugar de mirar cada respuesta a mano, se ve al momento si algo se ha roto después de un cambio.
- **Variables y scripts:** evitan copiar y pegar el token a mano, que es la causa más habitual de errores al probar APIs con autenticación.

### Problemas encontrados

- Al ejecutar la colección dos veces, el registro fallaba con 409 porque el email ya existía. Se resolvió generando un email distinto en cada ejecución con un *pre-request script*.
