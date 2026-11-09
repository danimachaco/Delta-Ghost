## Arreglo de la fusión de PS-44/45/46 con PS-48, PS-49 y PS-50

**Autor:** Asier García · **Fecha:** 05/11/2026 · **Issue:** sin tarea de Jira (arreglo de `main`)

### Qué se ha hecho

`main` había dejado de compilar, así que Vercel no podía publicar la web. Desde la fusión de PS-48 los despliegues fallaban, y la web seguía mostrando una versión antigua. Se han combinado bien los cambios de todos para que `main` vuelva a compilar sin perder el trabajo de nadie: la pantalla para elegir ruta, el reloj en vivo y el Wake Lock (PS-44/45/46), los sectores (PS-48), los destellos (PS-49) y el resumen (PS-50).

### Cómo se ha hecho

- **El problema.** PS-48 y PS-44 crearon a la vez el modelo `Sombra` y el método `Rutas.sombra()`, y PS-50 creó su servicio `CarreraService` en el mismo archivo `carrera.ts` que el servicio `Carrera` de la PS-44. Al resolver los conflictos de las fusiones se dejaron **las dos versiones pegadas una detrás de otra** en lugar de elegir o combinar. El resultado eran declaraciones duplicadas y un archivo con dos clases y dos bloques de `import`. Con el reloj pasó lo mismo: se mezclaron dos versiones de la pantalla. En total había 41 errores de compilación en 5 archivos.
- **`core/modelos/sombra.ts` y `core/servicios/rutas.ts`.** Se dejó la versión de la PS-48, que tiene los mismos campos que la de la PS-44 y además los sectores. También se quitó la prueba duplicada de `Rutas.sombra()`.
- **`core/servicios/carrera.ts`.** Se separaron los dos servicios. `Carrera` (la carrera en vivo de la PS-44/45/46) se queda en `carrera.ts`, y el `CarreraService` de la PS-50 (la última carrera terminada, para el resumen) pasa a su propio archivo, `carreras.ts`, con sus pruebas en `carreras.spec.ts`. No se ha cambiado su código, solo el `import` en la pantalla de resumen.
- **Pantalla del reloj (`zonas/reloj/reloj-inicio/`).** Se unieron las dos versiones:
  - de la PS-45/46 se mantienen los datos en vivo, la barra con los dos puntos del mockup, Terminar y el aviso de pantalla;
  - de la PS-49 se añaden el destello verde o rojo (`AvisoSector`) y los botones temporales de prueba;
  - de la PS-50 se añade el botón **Ver resumen**, que abre `/app/resumen`. Aparece cuando no se está corriendo, para no salir de la carrera sin querer.
  - Las pruebas de las dos versiones se juntaron en un solo archivo.
- **Pruebas.** `ng build` compila sin errores y pasan las 232 pruebas. En el navegador se comprobó que el reloj sin carrera invita a elegir ruta, que "Sector mejor" lanza el destello verde y que "Ver resumen" abre el resumen.

### Por qué

- **Combinar y no elegir una sola versión:** cada parte era trabajo de un compañero distinto y todas funcionaban por separado.
- **Un archivo por servicio:** dos clases en el mismo archivo con imports repetidos no compilan, y además se confunden. El nombre `carreras.ts` indica que guarda carreras terminadas, mientras que `carrera.ts` es la carrera que se está corriendo.
- **Se mantiene la barra de la PS-39/45 y no la pista circular de la PS-49:** la barra es la del mockup y ya se mueve con los datos reales. La pista circular tenía los puntos en posiciones fijas de ejemplo.

### Problemas encontrados

- **Queda pendiente (no es de este arreglo):** el resumen todavía muestra la carrera de ejemplo (`CARRERA_EJEMPLO`). Hay que conectar los sectores de la PS-48 con la carrera en vivo para enviar la carrera real; está marcado con un `TODO` en `reloj-inicio.ts`.
- **Para evitar que vuelva a pasar:** al resolver un conflicto no hay que aceptar las dos partes a la vez sin mirar. Antes de fusionar una PR, hay que comprobar que `npx ng build` y `npx ng test --watch=false` pasan con `main` integrado. El fallo de Vercel en la PR también avisa de esto.
