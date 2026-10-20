## Organización del árbol del proyecto

**Autor:** Asier García · **Fecha:** 20/10/2026 · **Issue:** —

### Qué se ha hecho

Se ha definido la estructura de carpetas completa del repositorio, tanto del frontend como del backend, para que cada parte del código tenga un lugar fijo antes de empezar a desarrollar las historias de usuario.

### Cómo se ha hecho

- En el frontend (`src/frontend/src/app/`) se añadieron, junto a las `zonas/` ya existentes, dos carpetas nuevas: `core/` (servicios y modelos de datos que se usan en toda la aplicación) y `compartido/` (componentes y utilidades reutilizables entre zonas).
- Se creó el esqueleto del backend en `src/backend/`, organizado por capas: `api/` (endpoints), `controladores/`, `servicios/` (lógica de negocio), `modelos/` (MongoDB), además de `config/`, `middlewares/`, `utilidades/` y `tests/`.
- Se añadió un `.env.example` con las variables necesarias y un `README.md` del backend explicando cada carpeta.
- Se actualizó el árbol de `CLAUDE.md` para que los asistentes de todo el equipo conozcan la nueva estructura.

### Por qué

Con una estructura acordada desde el principio, los desarrolladores saben dónde colocar cada archivo y se reducen los conflictos al trabajar en paralelo. La separación por capas del backend facilita además probar y modificar cada parte por separado.

### Problemas encontrados

Ninguno.
