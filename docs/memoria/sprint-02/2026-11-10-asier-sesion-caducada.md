## Cerrar la sesión caducada y volver al login

**Autor:** Asier García · **Fecha:** 10/11/2026 · **Issue:** sin tarea de Jira (arreglo)

### Qué se ha hecho

El token de sesión caduca a las 24 horas (`jwt.horas-validez=24` en el backend). Al volver a la app un día después, la cabecera seguía diciendo "Hola, Asier", pero todas las pantallas fallaban con "Tienes que iniciar sesión para hacer esto". Lo único que funcionaba era pulsar "Salir" y volver a entrar, y el usuario no tenía forma de saberlo. Ahora la app se da cuenta de que la sesión ya no vale y lleva al usuario al login, con un aviso que explica lo que ha pasado. Al volver a entrar, lo devuelve a la pantalla en la que estaba.

### Cómo se ha hecho

- **Al abrir la app** (`core/servicios/auth.ts`):
  - La función `tokenCaducado()` lee la fecha de caducidad que lleva el propio token JWT (campo `exp`).
  - Si la sesión guardada en el navegador ya ha caducado, no se carga y se borra.
  - Solo se lee la fecha, no se comprueba la firma, porque eso lo hace siempre el servidor. Si el token no se puede leer, se da por bueno y decide el servidor.
- **Si el servidor rechaza el token** (`core/interceptores/auth-interceptor.ts`):
  - El interceptor que ya añadía el token vigila ahora las respuestas: si una petición **que llevaba token** recibe un **401**, cierra la sesión y navega a `/app/login?volver=<pantalla actual>&caducada=1`.
  - Se comprueba que el token sigue siendo el mismo, así que si fallan varias peticiones a la vez solo se lleva al login una vez.
  - Un 401 sin token, como un email o contraseña incorrectos en el login, no hace nada especial.
  - El error sigue llegando a la pantalla igual que antes.
- **Pantalla de login.** Con `?caducada=1` muestra "Tu sesión ha caducado. Vuelve a entrar para seguir." en un recuadro informativo (`role="status"`, no es un error). Después de entrar, `?volver=` lo devuelve a donde estaba; eso ya lo hacía el login desde la PS-20.
- **Pruebas.** Se añadieron 12 pruebas nuevas, y en total pasan 305:
  - 6 del interceptor: pone el token, no lo envía a otros servidores, cierra la sesión con un 401, ignora un 401 sin sesión y otros errores, y solo navega una vez;
  - 4 de `Auth` (leer la caducidad y descartar la sesión caducada al abrir la app);
  - 2 del login (el aviso).
- **Prueba en el navegador**, con `npm run start:nube` contra el servidor real de Render:
  - con un token que el servidor no acepta, al entrar en "Mis rutas" la app se fue sola al login con el aviso y borró la sesión;
  - con un token caducado, la cabecera ya no dice "Hola, Asier" sino "Entrar".

### Por qué

- **Dos comprobaciones y no una:**
  - Mirar la fecha del token al abrir la app evita enseñar una sesión que ya no vale.
  - El 401 cubre lo que la fecha no puede saber: que el servidor haya cambiado su clave secreta (al publicar en Render se genera una), que el reloj del dispositivo vaya mal o que el token sea de otro servidor.
- **En el interceptor y no en cada pantalla:** todas las llamadas al backend pasan por ahí (decisión del 21/10), así que el arreglo vale para las pantallas actuales y las futuras (rutas, amigos, carreras…) sin tocarlas.
- **Volver a la pantalla anterior:** si la sesión caduca a mitad de algo, al volver a entrar se sigue donde se estaba.

### Problemas encontrados

Ninguno. Se detectó al abrir la app desplegada un día después de haber entrado: la sesión guardada del día anterior ya no era válida.
