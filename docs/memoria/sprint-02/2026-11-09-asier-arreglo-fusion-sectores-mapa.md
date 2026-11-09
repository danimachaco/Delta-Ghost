## Arreglo de la fusión de PS-53/PS-54 (mapa) con la lógica de sectores de la PS-48

**Autor:** Asier García · **Fecha:** 09/11/2026 · **Issue:** sin tarea de Jira (arreglo de `main`)

### Qué se ha hecho

Después de fusionar las PR del mapa del resumen (PS-53 y PS-54), `main` dejó de compilar: había 16 errores y Vercel no podía publicar la web. Se han separado bien los cambios para que `main` vuelva a compilar sin perder nada. Siguen funcionando el mapa con los sectores coloreados de Daniel (PS-53/54) y la lógica de sectores de Adam (PS-48), que usan el reloj y la pantalla de fin de carrera (PS-62).

### Cómo se ha hecho

- **El problema.** Es el mismo caso que el arreglo del 05/11. La PS-54 creó un archivo `core/servicios/sectores.ts` con funciones para cortar el recorrido en tramos de 500 m y pintarlos en el mapa (`calcularSectores`, `sectoresDesdeCarrera`). Pero ese archivo ya existía: era la lógica de sectores de la PS-48 (`Sectores`, `ComparacionSectores`). Al fusionar se dejaron las dos versiones una detrás de otra en el mismo archivo, y lo mismo pasó con sus pruebas. Además, a la prueba de Daniel se le perdieron las dos últimas líneas.
- **Separación.**
  - La lógica de la PS-48 se queda en `sectores.ts`.
  - La del mapa pasa a **`core/servicios/sectores-mapa.ts`**, con sus pruebas en `sectores-mapa.spec.ts`. Se recuperaron completas desde el commit original de la PS-54, y su código no cambia.
  - Se comprobó línea a línea que cada mitad era igual que el original de su autor.
  - Solo se cambió el `import` en `resumen.ts` y en la prueba del mapa.
- **`resumen.ts`.** La PS-53 se hizo sobre una versión antigua y todavía importaba `CarreraService` desde `carrera.ts`. Desde el arreglo del 05/11 está en `carreras.ts`, así que la fusión había dejado los dos `import`. Se quitó el antiguo.
- **Aviso de Leaflet.** `ng build` avisaba de que la librería del mapa (Leaflet) no es un módulo ES. Es normal en Leaflet y no afecta al funcionamiento, así que se declaró en `angular.json` con `allowedCommonJsDependencies`, como recomienda Angular. Ahora el build no da ni errores ni avisos.
- **Pruebas.** `ng build` compila sin avisos y pasan las 293 pruebas. En el navegador se comprobó que el resumen pinta el mapa con los 5 sectores y que la pantalla de fin de carrera del reloj funciona, sin errores en la consola.

### Por qué

- **Un archivo por cada lógica:** las dos versiones de "sectores" hacen cosas distintas. La de la PS-48 compara la carrera con la sombra para los avisos del reloj; la del mapa corta el recorrido en tramos para dibujarlos. Juntas en un archivo no compilan, y además se confunden.
- **Recuperar el original de Daniel:** a su prueba le faltaban las dos últimas líneas. Copiarla desde su commit asegura que se mantiene tal y como la escribió.

### Problemas encontrados

Es la segunda vez que pasa lo mismo, así que para el equipo:
1. Antes de crear un archivo, mira si ya existe uno con ese nombre (por ejemplo, `sectores.ts`). Si existe, usa otro nombre.
2. Al resolver un conflicto, **no aceptes las dos partes ("Accept both")** sin mirar.
3. Antes de fusionar una PR, comprueba que el check de **Vercel sale en verde**: si dice "Deployment has failed", la PR rompe `main`.
