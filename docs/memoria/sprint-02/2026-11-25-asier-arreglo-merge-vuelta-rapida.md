## PS-79 · Arreglar la fusión del modo vuelta rápida con la PS-78

**Autor:** Asier García · **Fecha:** 25/11/2026 · **Issue:** PS-79 (historia PS-77)

### Qué se ha hecho

Después de fusionar en `main` la PS-78 (lógica del modo vuelta rápida, de Adam) y la PS-79 (pantalla del modo, mía), la web de Vercel dejó de publicarse: la build fallaba con errores como `Property 'reiniciar' does not exist on type 'VueltaRapida'`. Se arregló separando los dos servicios, y `main` vuelve a compilar.

### Cómo se ha hecho

- Se comprobó qué había pasado. Las dos tareas, hechas a la vez, habían creado un archivo con la **misma ruta**: `core/servicios/vuelta-rapida.ts`, y su prueba. Al fusionarlas, git juntó los dos archivos en uno solo, con dos clases `VueltaRapida` y trozos de una metidos dentro de la otra.
- `vuelta-rapida.ts` y su prueba se recuperaron **tal cual** del último commit de Adam (`bc0381f`), sin tocar ni una línea de su trabajo.
- Mi servicio pasó a su propio archivo, `core/servicios/vuelta-rapida-gps.ts`. Se renombró a `VueltaRapidaGps`, con `VueltaGps` y `EstadoVueltaRapidaGps`, para que no haya dos clases con el mismo nombre. Se recuperó de mi último commit (`8d29020`) y la pantalla del reloj ahora lo importa de ahí.
- En `CLAUDE.md` se actualizó la decisión del modo y se añadió una **regla**: dos tareas nunca crean un archivo con la misma ruta; si una necesita la lógica de otra, la importa de su archivo.
- **Pruebas:** pasan las 377 (las de Adam y las mías) y `npx ng build` termina sin errores ni avisos.

### Por qué

- **Separar en lugar de reescribir:** las normas del equipo dicen que no se reescribe el trabajo de otro sin preguntar. Separar los archivos arregla `main` enseguida sin cambiar cómo funciona ninguna de las dos partes.
- **Nombres distintos:** con dos clases `VueltaRapida` en archivos distintos, compilaría, pero sería fácil importar la que no es.

### Problemas encontrados

- Es el mismo fallo que el de las PS-48/54. En la PS-79 se había dejado escrito en `CLAUDE.md` que la PS-78 reutilizara el servicio, pero las dos ramas se hicieron el mismo día y no dio tiempo a verlo. Por eso ahora la regla se aplica a cualquier archivo.
- **Queda pendiente** unificar las dos detecciones de vueltas: la de Adam mide la distancia recorrida y calcula el cruce exacto de la línea; la mía mide la distancia a la salida. Hay que decidirlo en equipo.
