## PS-70 · Endpoint de sombra por tipo

**Autor:** Adam · **Fecha:** 10/11/2026 · **Issue:** PS-70

### Qué se ha hecho

El endpoint de la sombra acepta ahora un parámetro `tipo` para elegir contra qué sombra correr: `GET /api/rutas/{id}/sombra?tipo=…`. Sigue el contrato acordado con la pantalla "Elige sombra" del reloj (PS-71, de Asier), que ya estaba anotado en `CLAUDE.md`:

- **`MEJOR`**: tu mejor marca en la ruta. Es el tipo por defecto, así que `GET /api/rutas/{id}/sombra` sin parámetros responde igual que antes.
- **`ULTIMA`**: tu última carrera en la ruta, aunque no sea la mejor.
- **`ORIGINAL`**: la grabación con la que se creó la ruta.

Además se han añadido dos tipos para competir con otros corredores, aprovechando el ranking (PS-64):

- **`RECORD`**: la mejor marca de todos los corredores de la ruta.
- **`AMIGO`**: la mejor marca de un amigo concreto, indicado con `&amigoId=`.

La respuesta es la sombra de siempre (puntos y tiempo de la sombra en cada sector) con dos campos nuevos: `tipo` (el tipo devuelto) y `usuario` (de quién es la sombra, solo con `id` y `nombre`).

### Cómo se ha hecho

- **`TipoSombra`**, un `enum` con los cinco tipos. Convierte el parámetro sin importar mayúsculas o minúsculas; sin parámetro es `MEJOR`. Si el tipo no existe responde `400` con un mensaje que dice cuáles hay.
- **`SombraService`** elige la marca según el tipo, con las marcas de `MarcasService` (PS-64):
  - `MEJOR`: tu mejor marca. Si todavía no tienes ninguna (eres un amigo que aún no la ha corrido), la grabación de la ruta, como antes.
  - `ULTIMA`: la carrera más reciente del corredor en esa ruta (`findFirstByRutaIdAndUsuarioIdOrderByFechaDescIdDesc`; el id desempata si dos tienen la misma fecha). Si no ha corrido nunca la ruta responde `404`, tal y como pide el contrato.
  - `ORIGINAL`: siempre la grabación de la ruta.
  - `RECORD`: el primero del ranking.
  - `AMIGO`: tiene que ser tu amigo (`AmistadRepository.sonAmigos`) y haber corrido ya la ruta; si no, `404` con el motivo. Si falta `amigoId`, `400`.

  Después se calculan los tiempos por sector con `TiemposSector` (PS-67), igual que antes.
- **El parámetro del amigo se llama `amigoId`** y no `usuarioId`, para no confundirlo con el usuario que hace la petición, que el `TokenInterceptor` deja en el atributo `usuarioId`.
- **Pruebas** con `MockMvc` (10 nuevas, 65 en total):
  - sin tipo y con `MEJOR`, también para un amigo que aún no ha corrido la ruta;
  - `ULTIMA`, con y sin carreras;
  - `ORIGINAL`, `RECORD` y `AMIGO`, con sus errores;
  - un tipo que no existe;
  - una ruta que no puedes ver y una petición sin token.

  Se han añadido las peticiones 23 y 24 a la colección de Postman.

### Por qué

- **Seguir el contrato que ya usaba el frontend:** la pantalla "Elige sombra" se hizo antes que este endpoint. Mientras el servidor no enviaba `tipo`, desactivaba las opciones `ULTIMA` y `ORIGINAL`. Con este endpoint funcionan sin cambiar nada en el frontend.
- **Un parámetro en la misma dirección**, en lugar de endpoints nuevos: el reloj descarga siempre la misma forma de sombra y quien no envía `tipo` (por ejemplo, una versión anterior de la app) sigue recibiendo la mejor marca.
- **`RECORD` y `AMIGO` como extra:** no rompen el contrato y permiten correr contra el récord de la ruta o contra un amigo concreto, lo que hace la app más motivadora.

### Problemas encontrados

- Al principio el endpoint se hizo como `/sombra/{tipo}` con los tipos `propia`, `record` y `amigo`, porque la tarea no explicaba qué tipos había. Al subir la rama se vio que Asier ya había dejado el contrato en su rama de la PS-71 (`?tipo=MEJOR|ULTIMA|ORIGINAL`). Se rehízo para seguirlo y se mantuvieron `RECORD` y `AMIGO` como tipos adicionales. La lección para el equipo: mirar las ramas abiertas de los compañeros antes de definir un endpoint que otros van a usar.
- Las tres tareas (PS-64, PS-67 y PS-70) dependen unas de otras, así que cada rama sale de la anterior y las PR se tienen que fusionar en ese orden.
