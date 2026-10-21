## Carpeta de diseño para los mockups

**Autor:** Asier García · **Fecha:** 21/10/2026 · **Issue:** —

### Qué se ha hecho

Se ha creado en el repositorio la carpeta `docs/diseno/`, destinada a guardar los mockups de las pantallas de Ruta Fantasma antes de programarlas. Incluye una guía que explica cómo exportar y nombrar los diseños, y una tabla para seguir el estado de cada pantalla.

### Cómo se ha hecho

- Se creó `docs/diseno/mockups/`, donde se subirán las imágenes PNG exportadas desde Figma.
- Se añadió `docs/diseno/README.md` con el espacio para el enlace al archivo de Figma, los pasos para exportar un mockup, la regla de nombres (`zona-pantalla.png`, con las mismas zonas que el frontend: `reloj`, `app` y `web`) y una tabla con las cinco pantallas previstas para el primer diseño y su estado (Pendiente, En revisión o Validado).
- Se actualizó el árbol del repositorio y la tabla de decisiones de `CLAUDE.md`.

### Por qué

Figma guarda los diseños en la nube, por lo que no quedarían registrados en el repositorio. Subir las imágenes exportadas permite que todo el equipo y el profesor consulten los diseños directamente desde GitHub y que quede constancia de cómo evolucionan. Usar los mismos nombres de zona que el frontend facilita relacionar cada mockup con el código de su pantalla, y la columna de estado deja claro qué diseños ha validado ya el Product Owner.

### Problemas encontrados

Se descartó el nombre `diseño` para la carpeta porque las tildes en los nombres de carpetas pueden dar problemas en algunos sistemas y herramientas; se usó `diseno`.
