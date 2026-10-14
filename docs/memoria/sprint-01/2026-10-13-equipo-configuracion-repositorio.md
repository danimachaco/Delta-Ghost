## Configuración del repositorio y del flujo de trabajo

**Autor:** Asier García · **Fecha:** 13/10/2026 · **Issue:** —

### Qué se ha hecho

Se ha preparado el repositorio común para que los tres desarrolladores trabajen con el mismo contexto y para que la memoria se genere sola.

### Cómo se ha hecho

- Se creó el archivo `CLAUDE.md` con el contexto del proyecto y las reglas del equipo. El asistente de cada desarrollador lo lee al empezar, de modo que los tres trabajan con la misma información.
- Se añadieron dos comandos, `/empezar` y `/terminar`, que automatizan actualizar el repositorio al empezar y documentar, hacer commit y subir el trabajo al terminar.
- La memoria se escribe en Markdown dentro de `docs/memoria/`. Cada tarea terminada genera un archivo propio, lo que evita conflictos entre compañeros.
- Un flujo de GitHub Actions convierte todos esos archivos en `docs/memoria.pdf` cada vez que se sube un cambio a la rama principal.

### Por qué

Reduce el tiempo dedicado a tareas repetitivas (subir cambios, maquetar la memoria) y garantiza que la documentación esté siempre al día con el código.

### Problemas encontrados

Ninguno por ahora.
