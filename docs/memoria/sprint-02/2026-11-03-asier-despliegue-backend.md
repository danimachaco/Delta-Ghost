## Publicación del backend en Internet (Render + TiDB Cloud)

**Autor:** Asier García · **Fecha:** 03/11/2026 · **Issue:** — (incidencia detectada por el equipo)

### Qué se ha hecho

Al abrir la web publicada en Vercel no se podía registrar ni iniciar sesión. El motivo era que en Vercel solo estaba publicada la web: la API (Spring Boot) y la base de datos (MySQL) no estaban en Internet, y la web intentaba llamar a `localhost:8080` del ordenador de quien la abría. Se ha preparado todo lo necesario para publicar la API en **Render** y la base de datos en **TiDB Cloud** (compatible con MySQL), dos servicios gratuitos que no piden tarjeta, y para que la web de Vercel llame a esa API.

### Cómo se ha hecho

- **Dockerfile** del backend (`src/backend/backend-springboot/Dockerfile`), en dos etapas: la primera compila con Maven y la segunda solo contiene Java 17 para ejecutar, así que la imagen final es más pequeña. Se limita la memoria de Java al 75 % del contenedor, porque el plan gratis tiene poca.
- **Configuración por variables de entorno** en `application.properties`:
  - el puerto se lee de `PORT`, porque Render lo asigna;
  - el SQL de la consola se apaga con `MOSTRAR_SQL=false`;
  - la conexión a MySQL, la clave del token y los orígenes CORS siguen leyéndose de `MYSQL_*`, `JWT_SECRETO` y `CORS_ORIGENES`.
- **Endpoint de salud** `GET /api/salud` → `{"estado":"ok"}`. Render lo usa para saber si el servicio ha arrancado, y sirve para comprobar a mano que la API publicada responde.
- **Blueprint de Render** (`render.yaml` en la raíz del repositorio). Describe el servicio para que Render lo cree solo:
  - servicio Docker gratis en Frankfurt, que se vuelve a publicar al cambiar el backend en `main`;
  - `JWT_SECRETO` la genera Render automáticamente, así que nadie la escribe ni se guarda en el repositorio;
  - las credenciales de MySQL se rellenan a mano en Render;
  - `CORS_ORIGENES` permite las webs `https://*.vercel.app`.
- **Frontend:** en producción `apiUrl` apunta a `https://ruta-fantasma-api.onrender.com/api`. Se añadió `src/frontend/vercel.json` para que, al recargar una página como `/app/login`, Vercel devuelva la aplicación en lugar de un error 404.
- **Guía paso a paso** en `docs/despliegue.md`: crear la base de datos en TiDB Cloud, crear el servicio en Render desde el *blueprint*, comprobar `/api/salud` y revisar la configuración de Vercel.
- **Pruebas.**
  - Backend: se añadieron 3 pruebas (`/api/salud` sin token, y que el CORS de producción acepta webs de Vercel con `https` y rechaza las demás). En total pasan 36.
  - Se arrancó el backend con las mismas variables que usará Render: el puerto salió de `PORT`, `/api/salud` respondió y un registro hecho desde un origen de Vercel devolvió `201` con la cabecera CORS correcta.
  - Frontend: la versión de producción contiene la dirección de Render y siguen pasando las 99 pruebas.

### Por qué

- **Render y TiDB Cloud:** tienen plan gratuito sin tarjeta y admiten Docker y MySQL (lo que pide el proyecto). TiDB Cloud Starter se eligió porque el registro en Aiven dio error; es compatible con MySQL, así que el backend no cambia y se configuran desde GitHub, así que cada cambio fusionado en `main` se publica solo.
- **Docker:** Render no tiene Java "de serie"; con Docker la API se ejecuta igual que en local, con la versión de Java que elegimos.
- **Credenciales fuera del repositorio:** la contraseña de MySQL y la clave del token solo existen en Render. El enunciado y las normas del equipo prohíben subir secretos.
- **`/api/salud`:** el plan gratis de Render "duerme" la API tras 15 minutos sin uso. Abrir esa dirección antes de una demo la despierta.

### Problemas encontrados

- No se tiene acceso al proyecto de Vercel (está en el equipo de Daniel), así que no se pudo ver su dirección exacta. Por eso CORS permite cualquier web `https://*.vercel.app`; cuando se conozca la dirección, se puede dejar solo esa.
- Las cuentas de Render y TiDB Cloud las tiene que crear una persona del equipo, y la contraseña de MySQL hay que pegarla a mano en Render. Está explicado en la guía.
- La base de datos `ruta-fantasma` se creó en TiDB Cloud con el plan **Starter** y límite de gasto de 0 $, para que nunca se pueda cobrar nada. Al crearla, la consola proponía por defecto el plan *Essential* (de pago), por lo que hubo que cambiarlo a mano.
