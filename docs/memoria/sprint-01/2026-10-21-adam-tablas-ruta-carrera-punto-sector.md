## PS-23 · Tablas ruta, carrera, punto y sector

**Autor:** Adam (integrado en el repositorio por Asier García) · **Fecha:** 21/10/2026 · **Issue:** PS-23

### Qué se ha hecho

Se han creado en MySQL las tablas que guardan los datos de las carreras: `ruta` (el recorrido), `punto` (sus puntos GPS), `sector` (los tramos en los que se divide, como en la Fórmula 1) y `carrera` (cada vez que alguien corre una ruta). Junto con la tabla `usuario` de PS-18 forman el modelo de datos completo de la aplicación.

### Cómo se ha hecho

- **Una entidad JPA por tabla** (`Ruta`, `Punto`, `Sector`, `Carrera`) en el paquete `modelo`.
- **Relaciones:**
  - Un usuario tiene muchas rutas y muchas carreras (`@ManyToOne` hacia `Usuario`).
  - Una ruta tiene muchos puntos, muchos sectores y muchas carreras. En `Ruta`, los puntos y sectores son `@OneToMany` con `cascade = ALL` y `orphanRemoval = true`, así que se guardan y se borran junto con la ruta. Con `@OrderBy` siempre se leen en orden.
  - Los métodos `anadirPunto` y `anadirSector` de `Ruta` mantienen sincronizados los dos lados de la relación y numeran los puntos automáticamente.
- **Integridad de los datos:**
  - Claves foráneas con nombre (`fk_punto_ruta`, `fk_carrera_usuario`…).
  - Restricciones únicas: no puede haber dos puntos con el mismo `orden` ni dos sectores con el mismo `numero` en una ruta.
  - `ON DELETE CASCADE` (con `@OnDelete` de Hibernate): si se borra una ruta directamente en MySQL, también se borran sus puntos, sectores y carreras.
- **Carga diferida (`FetchType.LAZY`)** en todas las relaciones `@ManyToOne`, para no traer datos de la base de datos que no se van a usar.
- **Repositorios** `RutaRepository` (rutas de un usuario, de la más nueva a la más antigua) y `CarreraRepository` (carreras de una ruta y la más rápida, que es la "sombra").
- **Scripts SQL** (`01-usuario.sql` y `02-ruta-punto-sector-carrera.sql`) equivalentes a lo que genera Hibernate, para crear las tablas a mano y como documentación.
- **Pruebas** con `@DataJpaTest` (5 nuevas, 14 en total): guardado en cascada y en orden, borrado en cascada, cálculo de la sombra, rutas por usuario y la restricción de orden único.

### Por qué

- **Tablas separadas para puntos y sectores** en lugar de guardarlos como texto dentro de la ruta: en una base de datos relacional cada dato va en su sitio (primera forma normal) y así se pueden consultar y validar.
- **El sector guarda el orden de los puntos de inicio y fin** en lugar de coordenadas: los puntos ya existen en la tabla `punto` y así no se repiten datos.
- **Tabla `carrera`** separada de la ruta: una misma ruta se corre muchas veces y hay que comparar cada intento con el mejor (la sombra), que es la idea central de Ruta Fantasma.
- **El tiempo en segundos (`BIGINT`)**: es fácil de sumar y comparar, y el frontend ya trabaja con `tiempoSegundos`.

### Problemas encontrados

- Por defecto, Hibernate crea las claves foráneas sin `ON DELETE CASCADE`. Se añadió `@OnDelete(action = CASCADE)` para que la tabla generada sea igual que la del script SQL.
- Al integrar la tarea en el repositorio se añadió `CarreraRepository` con los dos métodos que usan las pruebas (`findFirstByRutaIdOrderByTiempoTotalSegundosAsc` para la sombra y `findByRutaIdOrderByFechaDesc` para el historial).
