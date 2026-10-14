## DT2 · Preparación y publicación: proyecto Angular con zonas y PWA

**Autor:** Asier García · **Fecha:** 14/10/2026 · **Issue:** DT2

### Qué se ha hecho

Se ha creado la base del frontend de Ruta Fantasma: un proyecto Angular dividido en tres zonas independientes (`/reloj`, `/app` y `/web`) y configurado como aplicación web progresiva (PWA), de modo que se puede instalar en el móvil y funciona sin conexión. Cada zona tiene ya una primera pantalla de ejemplo sobre la que el resto del equipo puede seguir trabajando.

### Cómo se ha hecho

- **Creación del proyecto.** Con Angular CLI 22 se generó el proyecto en `src/frontend`, con enrutado, CSS y sin renderizado en servidor (`ng new ruta-fantasma --routing --style=css --ssr=false`).
- **Zonas con carga diferida.** En `src/app/app.routes.ts` se definieron las tres zonas mediante `loadChildren`. Cada una vive en su propia carpeta `src/app/zonas/<zona>/` con su archivo de rutas (`reloj.routes.ts`, `app.routes.ts`, `web.routes.ts`) y un componente de inicio. La raíz `/` y cualquier dirección desconocida redirigen a `/web`.
  - **`/web`:** página pública de presentación del producto, con titular y tres tarjetas de características.
  - **`/app`:** diseño de móvil con la lista "Mis rutas" (vacía de momento) y un menú inferior.
  - **`/reloj`:** esfera redonda que simula la pantalla del reloj, con los dos puntos (corredor y sombra), el tiempo y la diferencia del sector. El borde cambia a verde o rojo según se vaya mejor o peor. Usa *signals* de Angular y datos de ejemplo hasta que se conecte el GPS.
- **Estilos comunes.** En `src/styles.css` se definieron variables CSS (colores de fondo, morado "fantasma", verde y rojo de sector) para que las tres zonas tengan una imagen coherente.
- **PWA.** Con `ng add @angular/pwa` se añadieron el *service worker* (`ngsw-config.json`), el manifiesto y los iconos. Después se personalizó el manifiesto (nombre "Ruta Fantasma", idioma español, colores del tema) y el `index.html` (idioma, título, descripción, `theme-color` e icono para iOS).
- **Pruebas.**
  - **Pruebas unitarias:** se escribieron con Vitest para comprobar que cada ruta carga su zona, que las redirecciones funcionan y que el reloj formatea bien el tiempo (`12:34`) y la diferencia (`-2,4 s`). Pasan las 10.
  - **Pruebas en el navegador:** se comprobaron las tres zonas en tamaño de escritorio y de móvil. Además, sobre la versión de producción se verificó que el *service worker* se instala, guarda la aplicación en caché y que `/reloj` se abre con el servidor apagado.

### Por qué

- **Tres zonas separadas:** cada desarrollador puede trabajar en una zona sin tocar los archivos de los demás, lo que reduce los conflictos en Git. Además, con la carga diferida el navegador solo descarga el código de la zona que se está usando. La compilación genera un fichero distinto por zona, de 1 a 3 kB cada uno.
- **PWA:** Ruta Fantasma se usa corriendo por la calle, donde la conexión puede fallar. Con el *service worker* la aplicación sigue funcionando sin red y puede instalarse como si fuera una app nativa, sin tener que publicarla en una tienda de aplicaciones.
- **Angular 22 con componentes *standalone* y *signals*:** es la forma recomendada actualmente por Angular y simplifica el código.

### Problemas encontrados

- Los tests generados por defecto fallaban porque los componentes usan `routerLink` y el test no tenía router. Se resolvió añadiendo `provideRouter` en cada test.
- En las pruebas de rutas se comprobaba mal qué componente aparecía en pantalla. Se cambió a `RouterTestingHarness.navigateByUrl(url, Componente)`, que verifica directamente que se muestra el componente esperado.
- El *service worker* no se activa con `npm start` (modo desarrollo), solo en la versión de producción (`ng build`). Es el comportamiento normal de Angular y queda anotado en `CLAUDE.md`.
