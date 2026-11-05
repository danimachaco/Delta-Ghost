## Probar la app en local con la API de la nube

**Autor:** Asier García · **Fecha:** 04/11/2026 · **Issue:** sin tarea de Jira (mejora para el equipo)

### Qué se ha hecho

Se ha añadido el comando `npm run start:nube`. Arranca la web en el ordenador de cada desarrollador, pero usando la API publicada en Render y la base de datos de TiDB Cloud. Así, quien solo trabaja en pantallas puede ver sus cambios al momento sin instalar Java ni MySQL. Además, el README principal explica en lenguaje sencillo cómo ver la app: en las vistas previas de cada Pull Request, en la web principal o en local.

### Cómo se ha hecho

- **`src/frontend/proxy.nube.json`.** Es igual que el proxy de desarrollo (`proxy.conf.json`), pero reenvía `/api` a `https://ruta-fantasma-api.onrender.com` en lugar de a `localhost:8080`.
- **Script `start:nube`** en `package.json`: `ng serve --proxy-config proxy.nube.json`. El código de la app no cambia, porque en desarrollo ya llama a `/api` (decisión del 03/11).
- **README principal**, nueva sección "Ver y probar la app": las vistas previas de Vercel de cada PR, la web principal, la primera carga lenta de Render y el comando nuevo. El README del backend remite a él.
- **Prueba.** Con `npm run start:nube` se abrió la web en `localhost`:
  - `GET /api/salud` devolvió `{"estado":"ok"}` desde Render;
  - `GET /api/rutas` sin sesión devolvió el 401 en español del backend;
  - un registro vacío devolvió los mensajes de validación (400), sin errores de CORS.

### Por qué

- **La base de datos no se conecta a Vercel:** Vercel solo publica la web, y la base de datos la usa el backend de Render. Para que todo el equipo trabaje con los mismos datos, basta con que la web local hable con esa API.
- **Proxy en lugar de cambiar `apiUrl`:** las llamadas salen desde `localhost` como siempre y el servidor de desarrollo las reenvía, así que no hay que tocar el código ni los *environments*, y no hay problemas de CORS.
- **No se reparten las credenciales de la base de datos:** quien usa `start:nube` no necesita la contraseña de TiDB, que sigue guardada solo en Render.

### Problemas encontrados

Ninguno. Hay que tener en cuenta que lo que se guarda con `start:nube` va a la base de datos real, así que el README recomienda probar con una cuenta propia.
