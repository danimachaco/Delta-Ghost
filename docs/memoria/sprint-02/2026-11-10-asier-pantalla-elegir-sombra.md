## PS-71 · Crear la pantalla previa para elegir la sombra

**Autor:** Asier García · **Fecha:** 10/11/2026 · **Issue:** PS-71 (historia PS-69)

### Qué se ha hecho

Antes de empezar una carrera, el reloj tiene ahora una pantalla nueva, **Elige sombra** (`/reloj/sombra?ruta=ID`), para decidir contra qué sombra se corre:
- **Mejor marca:** tu carrera más rápida en esa ruta (contra la que se corría siempre hasta ahora).
- **Última carrera:** la última vez que corriste la ruta, aunque no fuera la mejor.
- **Grabación original:** el recorrido con el que se creó la ruta.

Cada opción enseña el tiempo de esa sombra. El flujo queda así: **Elige ruta → Siguiente → Elige sombra → Empezar → Reloj**.

### Cómo se ha hecho

- **Modelo y servicio.** Nuevo tipo `TipoSombra` (`MEJOR`, `ULTIMA`, `ORIGINAL`) y campo opcional `tipo` en `Sombra`. `Rutas.sombra(id, tipo)` llama a `GET /api/rutas/{id}/sombra?tipo=…`; para la mejor marca no envía el parámetro, así que sigue funcionando igual que antes.
- **Pantalla `ElegirSombra`** (`zonas/reloj/elegir-sombra/`), con la misma esfera del reloj:
  - Descarga la ruta y las **tres sombras a la vez**, cada una por separado: si una falla, las otras siguen sirviendo.
  - Cada tarjeta enseña el nombre y el tiempo ("25:00"), o "…" mientras carga.
  - Empieza con la mejor marca elegida. La elegida lleva borde morado y `aria-pressed`.
  - Una sombra que no se puede usar sale **desactivada con borde discontinuo** y dice por qué: "sin carreras todavía" (el servidor responde 404), "sin puntos suficientes" o "no disponible".
  - Espera a la señal GPS fiable y **Empezar** inicia la carrera con la sombra elegida (servicio `Carrera`), igual que antes hacía "Elige ruta".
  - Al salir sin empezar se cancelan las peticiones y se apaga el GPS.
  - Sigue las reglas de la PS-60: tarjetas y botones de 44 px y textos de 0,8 rem como mínimo.
- **Pantalla "Elige ruta" simplificada.** Ya solo elige la ruta: no descarga la sombra ni usa el GPS. El botón pasa a ser **Siguiente** y lleva a `/reloj/sombra?ruta=ID`. La tarjeta dice "grabada en 27:41" en lugar de "sombra 27:41", porque la sombra se elige después.
- **Contrato con el backend (PS-70).** El endpoint por tipo todavía no existe, así que se ha acordado por escrito en `CLAUDE.md` (decisiones): mismo `SombraResponse` más el campo `tipo`, y `404` si no hay sombra de ese tipo.
- **Pruebas.** En total pasan 300:
  - 10 de la pantalla nueva: las tres sombras, cambiar de sombra, empezar con la elegida, servidor sin PS-70, 404, fallo de la mejor marca, sombra sin puntos, sin `?ruta=`, ruta que no existe y salir sin empezar;
  - 6 de "Elige ruta" (reescritas para el flujo nuevo);
  - 1 de `Rutas.sombra` con tipo.
- **Prueba en el navegador,** con el backend en local (que aún no tiene la PS-70): Elige ruta → Siguiente → Elige sombra enseñó "Mejor marca 27:41" y las otras dos como "no disponible"; con señal GPS, Empezar abrió el reloj con la carrera en marcha. Se midió que todo el contenido queda dentro de la esfera.

### Por qué

- **Una pantalla aparte y no más botones en "Elige ruta":** en la esfera del reloj no caben la lista de rutas y las sombras a la vez. Dos pasos cortos se leen mejor de un vistazo.
- **Descargar las tres sombras al entrar:** así se comparan los tiempos antes de elegir, y al pulsar Empezar la carrera arranca al instante.
- **Comprobar el campo `tipo` de la respuesta:** un servidor sin la PS-70 ignora `?tipo=` y devuelve siempre la mejor marca. Enseñarla como "última carrera" sería engañar al corredor, así que esas opciones quedan desactivadas hasta que el servidor confirme el tipo. La pantalla funciona hoy y funcionará sin cambios cuando llegue el endpoint.
- **La mejor marca por defecto:** es lo que pide el producto ("correr contra tu mejor marca") y evita un toque a quien no quiere cambiar nada.

### Problemas encontrados

- Con tres tarjetas de 44 px, el contenido no cabía en la esfera de 340 px de "Elige ruta". La de "Elige sombra" mide 360 px y se ajustaron los rellenos; en el navegador se comprobó con medidas que ningún elemento se sale del círculo.
- La PS-70 (backend) está asignada a otro compañero y no estaba hecha. Se resolvió definiendo el contrato y haciendo que la pantalla se adapte a un servidor que todavía no lo cumple.
