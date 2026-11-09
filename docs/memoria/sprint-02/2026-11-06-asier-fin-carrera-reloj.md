## PS-62 · Crear la pantalla de fin de carrera del reloj

**Autor:** Asier García · **Fecha:** 06/11/2026 · **Issue:** PS-62 (historia PS-61)

### Qué se ha hecho

Al acabar una carrera, el reloj abre solo la pantalla **fin de carrera** (`/reloj/fin`), siguiendo el mockup "3 · Resumen" del reloj. Muestra el resultado final con los datos reales de la carrera:
- el tiempo total en grande;
- la diferencia con la sombra ("−10,0 s vs sombra"), en verde o en rojo y con la flecha ▲/▼ de la PS-59;
- la distancia, el ritmo medio y cuántos sectores has ganado ("2/3");
- un anillo alrededor de la esfera partido en sectores, cada uno en verde (mejor que la sombra), en rojo (peor) o en gris (no llegaste).

Si has llegado a la meta, el botón **Guardar** sube la carrera al backend, que decide si es tu nueva sombra. Si lo es, la pantalla dice "¡Guardada! Es tu nueva sombra".

### Cómo se ha hecho

- **Pantalla `FinCarrera`** (`zonas/reloj/fin-carrera/`). Lee los datos del servicio `Carrera` (PS-44/45):
  - **Sectores.** Se calculan con la lógica de la PS-48 (`Sectores.comparar`): se repite tu recorrido punto a punto con la distancia acumulada y el segundo de cada punto, y se obtiene el resultado de cada sector frente a la sombra.
  - **Ritmo.** Sale del servicio `Calculo` (PS-31) y se formatea igual que en "Grabar ruta" (`6:07 /km`).
  - **Anillo.** Es un SVG con un círculo por sector. Cada trozo se coloca con `stroke-dasharray` y `stroke-dashoffset`, y se gira −90° para que el primer sector empiece arriba y siga el sentido de las agujas del reloj.
  - **Accesibilidad.** Es decorativo (`aria-hidden`); la cifra "2/3" tiene una etiqueta para lectores de pantalla: "Has mejorado a tu sombra en 2 de 3 sectores".
  - Se usaron los colores y tamaños de la PS-60: botón de 44 px, texto blanco sobre `--reloj-boton` a 5,5:1 y ningún texto por debajo de 0,8 rem.
- **Guardar la carrera.**
  - Nuevo método `Rutas.subirCarrera(rutaId, puntos)`, que llama a `POST /api/rutas/{id}/carreras` (API de la PS-33), y nuevo modelo `CarreraGuardada`.
  - El botón pasa por "Guardando…" y luego "Carrera guardada" o "¡Guardada! Es tu nueva sombra", según el campo `mejorMarca` de la respuesta.
  - Si el servidor falla, se muestra su mensaje y se puede volver a intentar.
- **Solo se guarda una carrera completa.** El servicio `Carrera` tiene ahora `completada`. Si se pulsa Terminar antes de la meta, la pantalla enseña "Carrera sin terminar" y no deja guardar, con el anillo en gris en los sectores que faltan.
- **Abrir la pantalla sola.** El reloj (`RelojInicio`) vigila con un `effect` el estado de la carrera y, cuando pasa de "en curso" a "terminada", navega a `/reloj/fin`. Si se vuelve al reloj después, tiene un enlace "Ver resultado".
- **Pruebas.** Se añadieron 13 pruebas nuevas, y en total pasan 268:
  - 8 de la pantalla: resultado completo, anillo, guardar con nueva sombra y sin ella, error del servidor, carrera sin terminar, sin carrera y meta con margen. Usan el servicio `Carrera` de verdad con un GPS simulado, en una ruta de 3 sectores donde el corredor gana el 1 y el 3 y pierde el 2.
  - 2 del margen de meta en el servicio.
  - 2 de la navegación del reloj.
  - 1 de `subirCarrera`.
- **Prueba en el navegador.** Se usó el backend en local con una ruta de 300 m y GPS simulado a 10 m/s:
  - la carrera terminó sola y se abrió el fin de carrera con 0:29, −80,8 s, 2/3 sectores y el anillo verde-rojo-verde;
  - al pulsar Guardar salió "¡Guardada! Es tu nueva sombra", y `GET /api/rutas/{id}/sombra` devolvió esa carrera (29 s) como nueva sombra.

### Por qué

- **La pantalla en el reloj y no solo en el móvil:** el corredor acaba de correr y mira la muñeca. La historia PS-61 pide ver ahí el resultado sin sacar el móvil. El resumen detallado del móvil (PS-50) sigue existiendo.
- **Los sectores reutilizan la lógica de la PS-48:** así el reloj, el aviso de sectores y el resumen calculan igual. Repetir el recorrido al final da el mismo resultado que se habría calculado en vivo.
- **No guardar carreras incompletas:** el backend toma como sombra la carrera más rápida. Una carrera de 1 km sobre una ruta de 5 km tendría un tiempo menor y pasaría a ser la sombra sin merecerlo.
- **Abrir la pantalla con un `effect` en el reloj:** la carrera puede terminar de dos formas (al llegar a la meta o con el botón), y vigilando el estado se cubren las dos con el mismo código.

### Problemas encontrados

- **La carrera no terminaba sola.** En la prueba en el navegador, al llegar a la meta la carrera seguía en marcha. La distancia del corredor se suma tramo a tramo (30 tramos de 10 m) y, por los decimales, da 299,9999 m en lugar de 300 m. En la calle pasa lo mismo, porque el GPS casi nunca da una lectura justo en la línea de meta. Se añadió un margen de meta de **10 m** (`MARGEN_META_M`), como mucho el 10 % de la ruta. Por el mismo motivo, el último sector no se daba por terminado: si la carrera está completa, el último punto cuenta como la meta exacta.
- **El texto "¡Guardada! Es tu nueva sombra" se metía en el anillo,** porque está en la parte baja de la esfera, que es más estrecha. Se limitó su ancho para que pase a dos líneas.
- **Las pruebas se quedaban colgadas 5 s.** Se usan temporizadores falsos para simular el cronómetro, y Angular los necesita para pintar. Ahora se vuelve a los temporizadores reales antes de pintar la pantalla, porque para entonces la carrera ya ha terminado y el cronómetro está parado.
