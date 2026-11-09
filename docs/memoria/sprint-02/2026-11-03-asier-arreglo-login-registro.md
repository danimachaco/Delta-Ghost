## Arreglo: el registro y el inicio de sesión no funcionaban

**Autor:** Asier García · **Fecha:** 03/11/2026 · **Issue:** — (incidencia detectada por el equipo)

### Qué se ha hecho

El equipo avisó de que no podía registrarse ni iniciar sesión. Se investigó con el backend real y se encontró que el código del registro y del login era correcto: el problema dependía de **cómo y desde dónde** se abría la aplicación. Se cambió la configuración para que funcione en local abriendo la web en cualquier puerto, y se documentaron las causas habituales y su solución.

### Cómo se ha hecho

- **Diagnóstico.**
  - Se arrancó el backend real de Spring Boot con la base de datos H2 en memoria (en el equipo de pruebas no hay MySQL).
  - Se probaron el registro y el login con `curl` y con el navegador. Funcionaban abriendo la web en `http://localhost:4200`.
  - Desde cualquier otra dirección, el backend devolvía **`403 Invalid CORS request`**, porque solo aceptaba ese origen exacto.
  - También se encontró que la web publicada en Vercel no puede iniciar sesión, porque el backend no está publicado en Internet: la web intenta llamar a `localhost:8080` del ordenador de quien la abre.
- **Proxy de desarrollo en Angular** (`src/frontend/proxy.conf.json`, activado en `angular.json`). En desarrollo, `apiUrl` pasa a ser `/api`, una dirección relativa. El navegador llama a la propia dirección de la web y `ng serve` reenvía la petición al backend en `localhost:8080`. Al ser el mismo origen, el navegador no aplica CORS. La versión de producción no cambia.
- **CORS configurable en el backend** (`config/CorsConfig.java`). Los orígenes permitidos se leen de la propiedad `cors.origenes`, que se puede cambiar con la variable `CORS_ORIGENES`. Por defecto se permite `http://localhost:*` y `http://127.0.0.1:*`: con `allowedOriginPatterns`, el `*` admite cualquier puerto. Así se puede añadir la dirección de Vercel cuando el backend esté publicado, sin tocar el código.
- **Documentación.** El README del backend explica cómo probar la app completa en local e incluye una tabla de **problemas frecuentes** (backend sin arrancar, MySQL apagado, contraseña de MySQL, error de Java 25 en Windows, CORS y Vercel). `.env.example` incluye la nueva variable.
- **Pruebas.**
  - Se añadió `CorsTest` en el backend, con 3 pruebas: acepta localhost en varios puertos, permite la cabecera `Authorization` y rechaza direcciones desconocidas. Pasan las 33 pruebas del backend.
  - En el frontend siguen pasando las 99.
  - Se repitió el registro en el navegador con el backend real: la petición va a `http://localhost:4200/api/auth/registro` y responde `201 Created`.

### Por qué

- **Proxy en lugar de ampliar CORS para todo:** es la solución recomendada por Angular para desarrollo. Hace que el frontend funcione igual en cualquier puerto, y el backend no tiene que aceptar orígenes que no conoce.
- **Orígenes en una variable de entorno:** cada entorno (local, Vercel, otro servidor) necesita direcciones distintas, y así no hay que recompilar ni subir código para cambiarlas.
- **Documentar los fallos habituales:** casi todos los problemas encontrados eran de configuración del entorno (MySQL apagado, versión de Java, dirección de la web) y no del código. Una tabla de síntomas y soluciones ahorra tiempo a todo el equipo.

### Problemas encontrados

- **Java 25 en Windows.** Al arrancar el backend con Java 25 aparecía `Unable to establish loopback connection`, porque la carpeta temporal del usuario tiene una ruta corta (`USUARI~1`). Se resolvió indicando otra carpeta con `-Djdk.net.unixdomain.tmpdir`, y se recomienda usar Java 17 o 21 en IntelliJ.
- **Web publicada.** El problema de la versión de Vercel no se puede resolver solo con código: hay que publicar el backend y MySQL en un servidor. Se ha dejado indicado como decisión pendiente del equipo.
