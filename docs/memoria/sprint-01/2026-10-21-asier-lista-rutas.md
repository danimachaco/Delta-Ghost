## PS-26 · Pantalla con la lista de rutas

**Autor:** Asier García · **Fecha:** 21/10/2026 · **Issue:** PS-26

### Qué se ha hecho

Se ha creado la pantalla "Mis rutas" (`/app`), que muestra las carreras guardadas en el backend. De cada ruta enseña el nombre, la distancia en kilómetros, el tiempo de la "sombra" (lo que se tardó en esa carrera) y la fecha. La pantalla contempla los cuatro estados posibles: cargando, error, lista vacía y lista con datos.

### Cómo se ha hecho

- **Modelos** (`core/modelos/ruta.ts`). Las interfaces `Ruta` y `PuntoGps` copian exactamente los DTO del backend Spring Boot de Adam (`RutaResponse` y `PuntoGps`), para que los datos encajen sin conversiones.
- **Servicio `Rutas`** (`core/servicios/rutas.ts`). Usa el servicio `Api` de la tarea PS-21 para llamar a `GET /api/rutas` y `GET /api/rutas/{id}`.
- **Utilidades** (`compartido/utilidades/rutas.ts`). Son funciones puras, reutilizables por otras zonas (por ejemplo, el reloj):
  - `distanciaKm`: suma la distancia entre cada par de puntos GPS con la fórmula del semiverseno (*haversine*), que tiene en cuenta la curvatura de la Tierra.
  - `duracionSegundos`: calcula el tiempo entre el primer y el último punto.
  - Funciones de formato en español: `27:41`, `5,2 km` y `18 oct 2026`.
- **Componente `ListaRutas`** (`zonas/app/lista-rutas/`). Guarda el estado de la pantalla en *signals* y usa un `computed` que ordena las rutas de la más reciente a la más antigua y prepara los textos.
  - Mientras carga, muestra tres tarjetas "esqueleto" que laten. La animación se desactiva si el usuario tiene activada la opción de reducir el movimiento.
  - Si falla, muestra el mensaje del interceptor de errores y un botón **Reintentar**.
- **Diseño.** Las tarjetas siguen el mockup "Elegir ruta" de Daniel (`docs/diseno/mockups/`): nombre en negrita, "sombra mm:ss" debajo y los kilómetros a la derecha.
- **Estructura de la zona `/app`.** `AppInicio` pasa a ser el marco de la zona (cabecera con la sesión y menú inferior) y contiene un `router-outlet`. La lista es su ruta hija, así las próximas pantallas de la app reutilizarán ese marco sin repetirlo.
- **Pruebas.**
  - **Pruebas unitarias:** se añadieron 12 nuevas (utilidades, servicio y pantalla en sus cuatro estados, incluido el botón Reintentar). En total pasan 47.
  - **Prueba en el navegador:** se usó una API falsa con el mismo formato que el backend, a tamaño de móvil. Se comprobaron la lista con tres rutas, el error con reintento y la lista vacía, y que cada petición lleva el token `Authorization: Bearer` de la tarea PS-20.

### Por qué

- **Calcular la distancia y el tiempo en el frontend:** el backend solo guarda los puntos GPS, así que no hace falta cambiar la API para mostrar estos datos.
- **Funciones de cálculo en `compartido/`:** el reloj también necesitará calcular distancias y tiempos durante la carrera, y así no se duplica el código.
- **Mostrar siempre un estado claro:** nunca aparece una pantalla en blanco. El usuario sabe en todo momento si está cargando, si no hay datos o si ha fallado algo, y puede reintentarlo.

### Problemas encontrados

- Al principio un test no compilaba porque se pasaba un valor de tipo `unknown` a `flush()` de `HttpTestingController`. Se corrigió tipando el parámetro como `Ruta[] | null`.
- Como el backend no puede ejecutarse en este equipo (no tiene Java ni MongoDB), se usó una API falsa en Node.js que devuelve rutas con el mismo formato que `RutaResponse`.
