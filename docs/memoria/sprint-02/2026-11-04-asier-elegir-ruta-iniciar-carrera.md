## PS-44 · Pantalla para elegir ruta e iniciar la carrera

**Autor:** Asier García · **Fecha:** 04/11/2026 · **Issue:** PS-44 (historia PS-42)

### Qué se ha hecho

Se ha creado la pantalla **Elige ruta** del reloj (`/reloj/elegir`), siguiendo el mockup "1 · Elegir ruta". Se llega a ella desde el nuevo botón **Correr** del menú de la app. El corredor ve sus rutas en tarjetas con el nombre, el tiempo de la sombra y los kilómetros. Al tocar una ruta, la app descarga su sombra, y cuando también hay señal GPS fiable, el botón **Empezar** inicia la carrera y abre la pantalla del reloj.

### Cómo se ha hecho

- **Modelo `Sombra`** (`core/modelos/sombra.ts`). Es igual que la respuesta `SombraResponse` del backend: puntos de la mejor marca, tiempo total y sectores.
- **Método `Rutas.sombra(id)`**. Llama a `GET /api/rutas/{id}/sombra`, la API de la PS-36.
- **Servicio `Carrera`** (`core/servicios/carrera.ts`).
  - Guarda la ruta que se corre, su sombra y el estado: `sin-carrera`, `en-curso` o `terminada`.
  - `iniciar()` pone el cronómetro de la PS-38 a cero, lo arranca y deja el GPS encendido.
  - `terminar()` para el tiempo y apaga el GPS.
  - No deja empezar dos carreras a la vez ni correr contra una sombra de menos de 2 puntos.
- **Pantalla `ElegirRuta`** (`zonas/reloj/elegir-ruta/`). Tiene la misma esfera redonda que la pantalla del reloj.
  - Las rutas aparecen de la más reciente a la más antigua. Si hay muchas, la lista se desplaza dentro de la esfera.
  - La ruta elegida se marca con borde morado y `aria-pressed`, para que los lectores de pantalla sepan cuál está elegida.
  - Al descargar la sombra, la tarjeta muestra su tiempo real, que puede ser el de una carrera mejor que la grabación original.
  - Una línea de estado dice qué falta: "Toca una ruta para elegirla", "Cargando tu sombra…", "Buscando señal GPS…" o "Señal GPS lista". Los errores salen en rojo y se anuncian como alerta.
  - Si se toca otra ruta antes de que llegue la sombra, la petición anterior se cancela.
  - Con `/reloj/elegir?ruta=ID` la ruta ya aparece elegida.
  - Si no hay rutas, la pantalla propone grabar una.
- **Protegida con `authGuard`**, porque las rutas y la sombra son de la cuenta del usuario.
- **GPS.** Al salir sin empezar, se apaga para no gastar batería. Si la carrera ha empezado, sigue encendido, porque ahora lo usa la carrera.
- **Pruebas.** Se añadieron 18 pruebas nuevas: 7 del servicio `Carrera`, 10 de la pantalla y 1 de `Rutas.sombra`. Las 10 de la pantalla cubren el flujo completo, el error de la sombra, la sombra sin puntos, la cancelación, la lista vacía, el error de la lista y el GPS al salir. En total pasan 137 pruebas y `ng build` compila sin errores.

### Por qué

- **La pantalla va en la zona `/reloj`:** el mockup la dibuja en la esfera del reloj, porque se elige la ruta justo antes de correr.
- **La carrera es un servicio y no código de la pantalla:** empieza en "Elige ruta" y sigue en `/reloj`. Un servicio de toda la app conserva los datos al cambiar de pantalla, y el reloj solo tiene que leerlos (PS-45).
- **Descargar la sombra al elegir la ruta, no al pulsar Empezar:** así se ve el tiempo real de la sombra y, al pulsar Empezar, la carrera empieza al instante.
- **Esperar a tener señal GPS fiable:** igual que al grabar (PS-34). Si no, la salida de la carrera podría estar a decenas de metros de la real.

### Problemas encontrados

Ninguno importante. Al principio la lista enseñaba siempre la duración de la grabación original, que no coincide con la sombra cuando el corredor ya ha mejorado su marca. Ahora, al descargar la sombra, la tarjeta pasa a mostrar su tiempo.
