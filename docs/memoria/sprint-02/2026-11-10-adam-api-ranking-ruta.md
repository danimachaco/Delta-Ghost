## PS-64 · API de ranking por ruta

**Autor:** Adam · **Fecha:** 10/11/2026 · **Issue:** PS-64

### Qué se ha hecho

Se ha creado el endpoint `GET /api/rutas/{id}/ranking`, que devuelve la clasificación de una ruta: la mejor marca de cada corredor que la ha corrido, de la más rápida a la más lenta, con su puesto y los segundos que le separan del primero. Para que haya varios corredores en una misma ruta, ahora los **amigos** del dueño (PS-56) también pueden verla y correrla, y **cada corredor tiene su propia mejor marca**.

### Cómo se ha hecho

- **Quién puede ver una ruta (`AccesoRutas`).** Antes solo el dueño podía ver una ruta. Ahora pueden verla también sus amigos (amistad aceptada, consulta `AmistadRepository.sonAmigos`), así que pueden:
  - abrirla (`GET /api/rutas/{id}`),
  - correrla (`POST /api/rutas/{id}/carreras`),
  - descargar su sombra,
  - ver el ranking.

  Para cualquier otro usuario la ruta sigue respondiendo `404`. La comprobación está en un solo componente que usan todos los servicios, para que la regla sea siempre la misma. `GET /api/rutas` sigue listando solo las rutas propias.
- **Mejor marca por corredor.** Antes había una sola mejor marca por ruta. Si un amigo corría más rápido, la sombra del dueño pasaba a ser la del amigo. Ahora `CarreraService` compara cada carrera solo con las del mismo corredor (`findFirstByRutaIdAndUsuarioIdAndMejorMarcaTrue`):
  - Para el dueño, la grabación de la ruta sigue siendo su primera marca, como en PS-33.
  - Para un amigo, su primera carrera siempre es su mejor marca.
  - `SombraService` devuelve la sombra de quien la pide.
- **`Marca` y `MarcasService`.** Una *marca* es un tiempo hecho en la ruta: una carrera o la grabación original del dueño. `MarcasService` reúne todas las marcas de la ruta y se queda con la mejor de cada corredor. Se ha hecho aparte porque también lo usarán los mejores sectores (PS-67) y la sombra por tipo (PS-70).
- **Ranking (`RankingService`).** Ordena por tiempo y, si hay empate, va primero quien lo consiguió antes. Los empatados comparten puesto (1, 1, 3), como en las clasificaciones deportivas. Cada puesto trae:
  - `posicion`, `usuario`, `tiempoTotalSegundos` y `fecha`;
  - `carreraId` (`null` si es la grabación de la ruta);
  - `diferenciaConPrimeroSegundos`;
  - `tuya`, para que el frontend pueda resaltar tu fila.
- **Pruebas** con `MockMvc` (6 nuevas, 50 en total):
  - ranking con solo la grabación, orden y diferencias, y empates;
  - mejor marca y sombra propias de cada corredor;
  - un amigo puede ver y correr la ruta y alguien que no es amigo no;
  - ruta inexistente y petición sin token.

  Se ha adaptado una prueba de PS-33 a la mejor marca por corredor. Se ha añadido la petición 21 a Postman y la decisión a `CLAUDE.md`.

### Por qué

- **Solo amigos y no todo el mundo:** una ruta revela por dónde corre alguien, a menudo cerca de su casa. Compartirla solo con los amigos aceptados mantiene esa información privada y aprovecha la API de amigos que ya existía.
- **Mejor marca por corredor:** la sombra de cada uno tiene que ser su propio récord. Si no, al correr un amigo más rápido, el dueño de la ruta perdería su sombra.
- **La grabación cuenta como marca del dueño:** es su primera vuelta a la ruta y así el ranking nunca está vacío, igual que la sombra (PS-36).

### Problemas encontrados

- Al permitir que otros corredores suban carreras, la consulta antigua `findFirstByRutaIdAndMejorMarcaTrue` podía devolver la marca de otra persona. Se ha sustituido por la versión por usuario en todos los sitios donde se usaba.
- El enunciado de la tarea no decía qué corredores entran en el ranking. Se ha decidido que sean el dueño y sus amigos, y la decisión está anotada en `CLAUDE.md` para que el equipo la revise.
