## PS-76 · Crear la web de estadísticas con Chart.js

**Autor:** Asier García · **Fecha:** 24/11/2026 · **Issue:** PS-76

### Qué se ha hecho

La app tiene ahora una pantalla de **estadísticas** (`/app/estadisticas`), a la que se llega desde el nuevo botón **Datos** del menú. Enseña:
- **cuatro cifras** con el total de carreras, distancia, tiempo y ritmo medio;
- un **gráfico de barras** con los kilómetros de cada una de las últimas 8 semanas;
- un **gráfico de línea** con la evolución del ritmo (minutos por km) en las últimas carreras;
- la **lista de las últimas carreras**, con la ruta, la fecha, los km, el tiempo, el ritmo y una etiqueta "Mejor marca" cuando lo es.

Los gráficos se hacen con la librería **Chart.js**.

### Cómo se ha hecho

- **Chart.js 4** (`npm install chart.js`). Se registran solo las piezas que se usan (barras, líneas, ejes y tooltip), así el navegador no descarga la librería entera.
- **Componente `Grafico`** (`compartido/componentes/grafico/`). Se puede reutilizar en otras pantallas:
  - Recibe el tipo (barras o línea), las etiquetas, los valores, el nombre de la serie y una función para formatear los valores ("10,3 km", "5:17 /km").
  - Dibuja en un `<canvas>` cuando ya está en la página (`afterNextRender`) y se vuelve a dibujar solo si cambian los datos (`effect`).
  - Al salir de la pantalla se destruye el gráfico para no dejar memoria ocupada.
  - Chart.js dibuja en un canvas y no lee CSS, así que los colores se leen de las variables de `styles.css` (morado, texto suave y borde). El gráfico sigue el tema oscuro de la app.
  - Si el usuario ha pedido reducir el movimiento, el gráfico aparece sin animación.
  - La configuración se monta en una función aparte (`crearConfiguracion`) para poder probarla sin canvas.
- **Pantalla `EstadisticasPantalla`** (`zonas/app/estadisticas/`), dentro del marco de la app y protegida con `authGuard`:
  - Estados: cargando (cifras grises que "laten"), error con **Reintentar**, sin carreras (invita a correr) y datos.
  - Un `404` se explica en español: "Las estadísticas todavía no están disponibles."
- **Carga diferida.** La pantalla se carga con `loadComponent`, así que Chart.js (179 kB) solo se descarga al abrir Estadísticas. El resto de `/app` sigue pesando lo mismo que antes (248 kB). Si la pantalla se cargara junto al resto, `/app` habría pasado a 427 kB.
- **Accesibilidad.** Un lector de pantalla no puede leer un gráfico dibujado en un canvas, así que:
  - cada gráfico lleva `role="img"` y una descripción con todos sus datos ("Kilómetros por semana: semana del 9 nov, 5,0 km; …");
  - los datos de las semanas están también en una **tabla** dentro de "Ver los datos";
  - las últimas carreras se dan en texto.
- **Contrato con el backend (PS-75).** El endpoint no existe todavía, así que el formato se ha dejado escrito en `CLAUDE.md` (decisiones). Se piden las semanas con 0 carreras incluidas, para que el gráfico de barras no se salte semanas.
- **Pruebas.** Se añadieron 14 pruebas nuevas, y en total pasan 343:
  - 9 de la pantalla: carga, totales, los dos gráficos, descripciones, tabla, lista con la mejor marca, sin carreras, 404 y error con reintento. Usan un gráfico falso, porque en las pruebas no hay canvas;
  - 4 de la configuración de Chart.js;
  - 1 del servicio.
- **Prueba en el navegador,** con datos de ejemplo en el formato del contrato: se dibujaron los dos gráficos con los colores de la app y la lista de carreras, sin errores en la consola.

### Por qué

- **Chart.js:** lo pide la tarea. Además es ligera, funciona con canvas en el móvil y tiene buena documentación.
- **Barras para los km y línea para el ritmo:** los km de cada semana son cantidades que se comparan entre sí (barras). El ritmo es una evolución en el tiempo, donde importa la tendencia (línea).
- **Un componente propio alrededor de Chart.js:** la pantalla solo pasa datos y no sabe nada de Chart.js. Si mañana se cambia de librería, solo se toca el componente.
- **Los datos también en texto:** sin la tabla y las descripciones, quien usa un lector de pantalla no podría ver sus estadísticas (WCAG 1.1.1, contenido no textual).

### Problemas encontrados

- El paquete de `/app` pasaba de 248 kB a 427 kB al añadir Chart.js. Se resolvió cargando la pantalla de estadísticas de forma diferida.
- En las pruebas, el navegador simulado (jsdom) no tiene canvas y Chart.js no puede dibujar. Se sustituyó el gráfico por uno falso en las pruebas de la pantalla, y la configuración se prueba por separado.
- La PS-75 (backend) está asignada a otro compañero y no estaba hecha. Se acordó el contrato por escrito y la pantalla trata el `404` como "todavía no disponibles".
