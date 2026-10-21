## PS-20 · Pantallas de registro e inicio de sesión

**Autor:** Asier García · **Fecha:** 21/10/2026 · **Issue:** PS-20

### Qué se ha hecho

Se han creado las pantallas de inicio de sesión (`/app/login`) y de registro (`/app/registro`) en la zona de la app móvil, junto con el servicio que gestiona la sesión del usuario. La cabecera de la app muestra ahora "Hola, <nombre>" y un botón **Salir** cuando hay sesión iniciada, o un enlace **Entrar** cuando no la hay.

### Cómo se ha hecho

- **Formularios reactivos** (`ReactiveFormsModule`) con validaciones en el propio navegador:
  - **Login:** email obligatorio y con formato válido, y contraseña obligatoria.
  - **Registro:** nombre obligatorio (máximo 40 caracteres), email válido, contraseña de al menos 6 caracteres y confirmación. Un validador propio, `passwordsIguales`, comprueba que las dos contraseñas coinciden.
  - Los mensajes de error aparecen debajo de cada campo cuando el usuario ya lo ha tocado. Si se pulsa el botón con errores, se marcan todos los campos.
- **Servicio `Auth`** (`core/servicios/auth.ts`). Usa el servicio `Api` de la tarea PS-21 para llamar a `POST /api/auth/login` y `POST /api/auth/registro`. Guarda la sesión (token y usuario) en *signals* y en `localStorage`, para que siga abierta al recargar la página. Si `localStorage` está bloqueado o contiene datos corruptos, la aplicación sigue funcionando.
- **Interceptor `authInterceptor`.** Añade la cabecera `Authorization: Bearer <token>` a las peticiones que van a nuestra API, y solo a esas, para no enviar el token a otros servidores.
- **Guard `authGuard`** (`core/guardias/`). Queda preparado para proteger pantallas: si no hay sesión, redirige a `/app/login?volver=<página>` y, al entrar, el login devuelve al usuario a esa página.
- **Estados de la pantalla.** Mientras se espera al servidor, el botón se desactiva y cambia su texto ("Entrando…"). Los errores del servidor (credenciales incorrectas, email ya registrado, sin conexión) se muestran en un recuadro rojo con el mensaje en español que proporciona el interceptor de errores.
- **Estilos compartidos.** Como las dos pantallas comparten diseño, sus estilos están en `compartido/estilos/formulario.css` y cada componente los incluye con `styleUrls`.
- **Pruebas.**
  - **Pruebas unitarias:** se añadieron 19, que cubren el servicio, el interceptor, el guard y las dos pantallas: validaciones, envío correcto, que la confirmación no se envía al servidor y la gestión de errores 401 y 409. En total pasan 35.
  - **Prueba en el navegador:** se usó una API falsa que imita el backend. Se probó el formulario vacío, la contraseña incorrecta, el login correcto, contraseñas que no coinciden en el registro y el registro correcto.

### Contrato con el backend

El backend todavía no tiene autenticación. El frontend espera estos dos endpoints, que habrá que implementar en Spring Boot:

| Método y ruta | Cuerpo | Respuesta correcta | Errores |
|---|---|---|---|
| `POST /api/auth/login` | `{ email, password }` | `200 { token, usuario: { id, nombre, email } }` | `401` si los datos no son correctos |
| `POST /api/auth/registro` | `{ nombre, email, password }` | `201 { token, usuario: { id, nombre, email } }` | `409 { error }` si el email ya existe; `400` en las validaciones |

Además, la configuración CORS del backend debe permitir la cabecera `Authorization`.

### Por qué

- **Sesión guardada en el servicio, con *signals*:** cualquier pantalla puede saber al momento quién ha entrado, y la cabecera se actualiza sola al entrar o salir.
- **Validar en el navegador antes de enviar:** el usuario recibe respuesta inmediata y se evitan peticiones inútiles al servidor. El backend seguirá validando igualmente por seguridad.
- **El guard no se ha aplicado todavía a ninguna ruta.** Mientras el backend no tenga login, proteger la app impediría usarla. Cuando exista, basta con añadir `canActivate: [authGuard]` a las rutas privadas.

### Problemas encontrados

- No se puede arrancar el backend en este equipo (no tiene Java ni MongoDB), y además todavía no tiene endpoints de autenticación. Se resolvió con pruebas que simulan el servidor (`HttpTestingController`) y, para las pruebas en el navegador, con una API falsa que sigue el contrato descrito arriba.
- Al añadir el servicio `Auth` a la pantalla principal de la app, sus pruebas necesitaban `HttpClient`. Se añadieron `provideHttpClient()` y `provideHttpClientTesting()` a esas pruebas.
