## PS-65 · Crear la pantalla del ranking

**Autor:** Asier García · **Fecha:** 10/11/2026 · **Issue:** PS-65 (historia PS-63)

### Qué se ha hecho

Cada ruta tiene ahora su **ranking** (`/app/ranking/:rutaId`). Se llega desde el nuevo botón **Ranking** de cada ruta en "Mis rutas". La pantalla enseña la mejor carrera de cada corredor, del más rápido al más lento:
- el puesto, el nombre, el tiempo, la diferencia con el primero ("+0:12") y la fecha;
- arriba, una frase con tu puesto: "Vas 2.º de 3 corredores.";
- tu fila destacada con borde morado y la etiqueta **"Tú"**.

Si nadie ha corrido la ruta, invita a correrla con un botón que abre "Elige ruta" con esa ruta ya elegida.

### Cómo se ha hecho

- **Modelo y servicio.** `core/modelos/ranking.ts` (`RankingRuta`, `EntradaRanking`) y el servicio `Ranking`, con `deRuta(id)`, que llama a `GET /api/rutas/{id}/ranking`. Como siempre, pasa por el servicio `Api` y el interceptor añade el token.
- **Pantalla `RankingPantalla`** (`zonas/app/ranking/`). Va dentro del marco de la app (cabecera y menú inferior), como "Amigos":
  - Tres estados: cargando (tarjetas grises que "laten"), error con **Reintentar** y lista.
  - Las filas se ordenan por puesto aunque el servidor las mande desordenadas.
  - La diferencia se calcula respecto al primero; el primero pone "líder".
  - Tu fila se reconoce comparando el id del usuario de cada entrada con el de la sesión (servicio `Auth`).
  - Un `404` se explica en español: "Esta ruta todavía no tiene ranking."
- **Accesibilidad:**
  - La lista es una `<ol>`, así el lector de pantalla dice "1 de 3, 2 de 3…".
  - Tu fila lleva `aria-current` y el texto "Tú", así que no se distingue solo por el color.
  - El enlace de cada ruta dice "Ranking de Circuito del parque" a los lectores de pantalla.
  - Botones y enlaces de 44 px de alto; el botón usa `--reloj-boton` (texto blanco a 5,5:1, PS-60).
- **Contrato con el backend (PS-64).** El endpoint todavía no existe, así que el formato se ha dejado escrito en `CLAUDE.md` (decisiones). Del usuario solo se envían `id` y `nombre`, nunca el email de los demás corredores.
- **Pruebas.** Se añadieron 11 pruebas nuevas, y en total pasan 311:
  - 9 de la pantalla: carga, orden, diferencias, tu fila, sin estar en el ranking, ranking vacío, error con reintento, 404 y enlace de volver;
  - 1 del servicio;
  - 1 del enlace en "Mis rutas".
- **Prueba en el navegador** con el backend en local:
  - "Mis rutas" enseña el botón Ranking en cada ruta y abre `/app/ranking/1`;
  - como el servidor aún no tiene la PS-64, la pantalla dijo "Esta ruta todavía no tiene ranking." con el botón Reintentar;
  - simulando la respuesta del servidor con el formato del contrato, se vio el ranking completo: "Vas 2.º de 3 corredores.", Daniel líder con 25:00, Asier "Tú" con +0:12 y Adam con +2:41.

### Por qué

- **Ranking por ruta y no general:** cada ruta tiene distancia y desnivel distintos, así que solo tiene sentido comparar tiempos en el mismo recorrido, como en una clasificación de una etapa.
- **Una entrada por corredor (su mejor carrera):** si salieran todas las carreras, alguien que corre mucho llenaría la lista con sus propias marcas.
- **Diferencia con el primero:** es como se leen las clasificaciones en la Fórmula 1 ("+0,412"), que es la idea de todo el producto.
- **Sin email de los demás:** el ranking lo ven otros corredores, y el nombre basta para reconocer a un amigo.

### Problemas encontrados

- La PS-64 (backend) está asignada a otro compañero y no estaba hecha. Se acordó el contrato por escrito y la pantalla trata el `404` como "todavía no tiene ranking", así que funciona ya y funcionará sin cambios cuando llegue el endpoint.
- El primer botón "Ranking" de la lista medía 35 px de alto; se subió a 44 px para que se pulse bien con el dedo.
