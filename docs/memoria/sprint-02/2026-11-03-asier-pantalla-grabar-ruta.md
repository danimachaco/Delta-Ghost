## PS-34 · Pantalla para grabar una ruta

**Autor:** Asier García · **Fecha:** 03/11/2026 · **Issue:** PS-34

### Qué se ha hecho

Se ha creado la pantalla **Grabar ruta** (`/app/grabar`), accesible desde el nuevo botón **Grabar** del menú de la app. El corredor espera a tener señal GPS fiable, pulsa **Empezar** y la app va guardando su recorrido mientras muestra el tiempo, la distancia, el ritmo y los puntos grabados. Al pulsar **Terminar** ve un resumen, pone un nombre a la ruta y la guarda en su cuenta. La ruta aparece después en "Mis rutas".

### Cómo se ha hecho

- **Servicio `Grabacion`** (`core/servicios/grabacion.ts`). Contiene toda la lógica de la grabación, separada de la pantalla para que el reloj pueda reutilizarla en la carrera:
  - **Estados:** `parada` → `grabando` → `terminada`, guardados en *signals*.
  - **Puntos:** al empezar se guarda la posición actual como punto inicial (segundo 0). Después se añade cada lectura que pasa el filtro de GPS de la PS-32, con los segundos transcurridos desde el inicio. El tiempo de un punto nunca puede ser menor que el del anterior, porque el backend rechazaría la ruta.
  - **Cronómetro:** se actualiza cada segundo con `setInterval` y se detiene al terminar o al descartar.
  - **Distancia y ritmo:** se calculan con `computed` a partir de los puntos, usando el servicio `Calculo` de la PS-31.
- **Avisos del GPS lectura a lectura.** El servicio `Gps` incluye ahora `lecturasValidas`, un `Observable` (un `Subject` de RxJS) que avisa de cada lectura que pasa el filtro. La grabación se suscribe a él con `takeUntilDestroyed`.
- **Pantalla `GrabarRuta`** (`zonas/app/grabar/`), con tres fases:
  1. **Preparado:** muestra el estado de la señal ("Buscando señal GPS fiable…" o "Señal GPS lista · precisión 5 m"). El botón **Empezar** está desactivado hasta tener una posición válida.
  2. **Grabando:** cronómetro grande y tarjetas con distancia, ritmo y puntos. El menú inferior se oculta para no salir sin querer, y un punto rojo parpadea; la animación se desactiva si el usuario ha pedido reducir el movimiento.
  3. **Resumen:** tiempo, distancia y ritmo, y un formulario reactivo con el nombre. Se propone "Ruta del 3 nov 2026" y se valida que no esté vacío ni pase de 60 caracteres. Si hay menos de 2 puntos se avisa de que la ruta es demasiado corta.
- **Guardado** con el nuevo método `Rutas.crear()`, que llama a `POST /api/rutas` (la API de la PS-24). Si el servidor falla, se muestra su mensaje en español y se puede volver a intentar.
- **Protección con `authGuard`.** La API pide sesión iniciada, así que se aplicó por primera vez el guard de la PS-20: sin sesión, `/app/grabar` lleva al login y, después de entrar, vuelve a la grabación.
- **Al salir de la pantalla** se cancela la grabación y se apaga el GPS para no gastar batería.
- **Pruebas.**
  - **Pruebas unitarias:** se añadieron 19 nuevas: 8 del servicio de grabación, 8 de la pantalla (flujo completo, nombre vacío, error del servidor, ruta corta, descartar y salir), 1 de `Rutas.crear`, 1 del aviso de lecturas del GPS y 1 de la ruta protegida. En total pasan 99.
  - **Prueba en el navegador:** con una API falsa y el GPS simulado se hizo el recorrido completo: iniciar sesión, esperar señal, grabar 6 lecturas (se descartaron un salto de 900 m y una de 40 m de precisión), terminar, guardar con nombre y ver la ruta nueva al principio de "Mis rutas".

### Por qué

- **Guardar la ruta con `POST /api/rutas`:** grabar una ruta nueva es justo crear una ruta con sus puntos, y esa API ya existía y estaba probada (PS-24). Subir carreras sobre una ruta existente es otra tarea (PS-33).
- **La lógica en un servicio y no en el componente:** la pantalla solo muestra datos; el servicio se puede probar sin interfaz y reutilizar en el reloj.
- **Usar solo lecturas filtradas:** así la distancia y el ritmo no se disparan por errores del GPS, y la ruta guardada, que será la "sombra" de las siguientes carreras, es fiable.
- **Botón Empezar bloqueado hasta tener señal:** si se empezara sin señal, el primer punto (la salida) podría estar a decenas de metros de la realidad.

### Problemas encontrados

- En la prueba en el navegador se grabaron 3 puntos en lugar de 5. La grabación vigilaba la *signal* `posicionValida` con un `effect`, y cuando llegaban dos lecturas casi a la vez solo veía la última, porque una *signal* guarda el último valor y no cada cambio. Se resolvió añadiendo al servicio `Gps` el `Observable` `lecturasValidas`, que avisa de cada lectura una a una. Se añadió una prueba que envía dos lecturas seguidas para que no vuelva a pasar.
- En el texto "Señal GPS lista · precisión 5 m" aparecían dos espacios, por usar un bloque `@if` en medio de la frase. Se sustituyó por una sola interpolación.
