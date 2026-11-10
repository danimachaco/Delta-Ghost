## PS-70 · Endpoint de sombra por tipo

**Autor:** Adam · **Fecha:** 10/11/2026 · **Issue:** PS-70

### Qué se ha hecho

Se ha creado el endpoint `GET /api/rutas/{id}/sombra/{tipo}`, que permite elegir contra quién correr:

- **`propia`**: tu mejor marca en la ruta (lo que ya devolvía `GET /api/rutas/{id}/sombra`).
- **`record`**: la mejor marca de todos los corredores de la ruta, es decir, el primero del ranking (PS-64).
- **`amigo`**: la mejor marca de un amigo concreto, indicado con `?amigoId=`.

La respuesta es la misma sombra que ya descarga el reloj (puntos y tiempo de la sombra en cada sector), con dos campos nuevos: `tipo` y `usuario` (de quién es la sombra).

### Cómo se ha hecho

- **`TipoSombra`**, un `enum` con `PROPIA`, `RECORD` y `AMIGO`. Convierte el texto de la URL sin importar mayúsculas o minúsculas. Si el tipo no existe, responde `400` con un mensaje que dice cuáles hay.
- **`SombraService`** elige la marca según el tipo, usando las marcas de `MarcasService` (PS-64):
  - *propia*: tu mejor marca. Si todavía no tienes ninguna (eres un amigo que aún no la ha corrido), corres contra la grabación de la ruta.
  - *record*: la más rápida de todos.
  - *amigo*: tiene que ser tu amigo (`AmistadRepository.sonAmigos`) y haber corrido ya la ruta. Si no, responde `404` con el motivo; si falta `amigoId`, responde `400`.

  Después calcula los tiempos por sector con `TiemposSector` (PS-67), igual que antes.
- **El endpoint de siempre sigue funcionando:** `GET /api/rutas/{id}/sombra` devuelve ahora la sombra `propia`. Los dos campos nuevos no rompen el frontend, que ignora lo que no conoce.
- **El parámetro se llama `amigoId`** y no `usuarioId`, para no confundirlo con el usuario que hace la petición, que el `TokenInterceptor` deja en el atributo `usuarioId`.
- **Pruebas** con `MockMvc` (7 nuevas, 62 en total):
  - el récord, antes y después de que alguien lo bata;
  - la sombra propia aunque otro sea más rápido, y la de quien aún no ha corrido la ruta;
  - la sombra de un amigo en los dos sentidos;
  - los errores de `amigo` (sin `amigoId`, alguien que no es amigo, un amigo que no ha corrido la ruta);
  - un tipo que no existe y en mayúsculas;
  - una ruta que no puedes ver y una petición sin token.

  Se han añadido las peticiones 23 y 24 a la colección de Postman.

### Por qué

- **Elegir contra quién correr** hace la app más motivadora: puedes intentar batirte a ti mismo, al récord de la ruta o a un amigo concreto.
- **Un solo endpoint con el tipo en la URL** en vez de tres distintos: el reloj descarga siempre la misma forma de sombra y solo cambia la dirección, así que pantallas y servicios no tienen que duplicarse.
- **La sombra de un amigo solo si es amigo:** igual que las rutas (PS-64), las carreras de alguien solo las ven sus amigos.

### Problemas encontrados

- La tarea no explicaba qué "tipos" de sombra había. Se han elegido los tres más útiles con lo que ya existía (tu marca, el récord y la de un amigo). Si el equipo quiere otro, como la última carrera, basta con añadirlo a `TipoSombra`.
- Las tres tareas (PS-64, PS-67 y PS-70) dependen unas de otras, así que cada rama sale de la anterior y las PR se tienen que fusionar en ese orden.
