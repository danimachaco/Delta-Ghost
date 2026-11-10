## PS-67 · Calcular el mejor tiempo de cada sector entre todos los corredores

**Autor:** Adam · **Fecha:** 10/11/2026 · **Issue:** PS-67

### Qué se ha hecho

Se ha creado el endpoint `GET /api/rutas/{id}/sectores/mejores`, que calcula para cada sector de una ruta el mejor tiempo hecho por cualquier corredor (como los "sectores morados" de la Fórmula 1). Indica quién lo hizo y en qué carrera, y suma todos esos tiempos en la **vuelta ideal**: el tiempo que se conseguiría juntando los mejores sectores.

### Cómo se ha hecho

- **`TiemposSector`.** El cálculo del tiempo al final de cada sector, que estaba dentro de `SombraService` (PS-36), se ha sacado a una clase propia para reutilizarlo. Funciona igual:
  - Para el final de cada sector busca el punto GPS más cercano de la carrera, con la fórmula de Haversine.
  - Busca siempre hacia delante, para que los tiempos no vayan hacia atrás si la ruta pasa dos veces por el mismo sitio.

  Se ha añadido `duraciones()`, que resta el final del sector anterior para obtener cuánto se tardó en cada sector. `SombraService` ahora usa esta clase, y sus pruebas siguen pasando igual.
- **`MejoresSectoresService`.** Recorre **todas** las marcas de la ruta con el `MarcasService` de PS-64: cada carrera de cada corredor y la grabación original. Para cada sector se queda con la más rápida y, si dos empatan, con la que se hizo antes. Así cuentan también los buenos sectores de vueltas que en total fueron lentas.
- **Respuesta** `MejoresSectoresResponse`:
  - `rutaId`;
  - `sectores`, cada uno con `numero`, `puntoInicio`, `puntoFin`, `tiempoSegundos` del sector, `usuario`, `carreraId` (`null` si es la grabación), `fecha` y `tuyo`;
  - `tiempoIdealSegundos`.
- **Acceso:** lo pueden pedir el dueño de la ruta y sus amigos (`AccesoRutas`, PS-64); para los demás la ruta responde `404`.
- **Pruebas** con `MockMvc` (5 nuevas, 55 en total):
  - sin carreras, los mejores sectores son los de la grabación;
  - cada sector se queda con el corredor más rápido en él y se calcula la vuelta ideal;
  - cuenta un buen sector de una vuelta lenta;
  - empates;
  - alguien que no es amigo y una petición sin token.

  También se ha añadido la petición 22 a la colección de Postman.

### Por qué

- **Todas las carreras y no solo la mejor de cada uno:** el mejor sector de un corredor no tiene por qué estar en su mejor vuelta. En la F1 los sectores morados también se cuentan vuelta a vuelta.
- **Vuelta ideal:** dice al corredor cuánto podría bajar su tiempo si juntara lo mejor de todos, y le indica en qué sector tiene más margen.
- **Sacar `TiemposSector`:** la sombra (PS-36) y los mejores sectores tienen que medir los sectores exactamente igual. Si no, el aviso verde o rojo del reloj y la tabla de mejores sectores podrían no coincidir.

### Problemas encontrados

Ninguno importante. Hubo que decidir dónde empieza el primer sector de cada carrera: se toma el tiempo de su primer punto (normalmente 0), igual que el reloj empieza a contar en la salida.
