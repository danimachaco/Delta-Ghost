# CLAUDE.md — Contexto común del equipo

> Este archivo lo lee Claude automáticamente cada vez que alguien abre el proyecto.
> Es la "memoria compartida" de los 3 Claudes. Si cambia algo importante del proyecto
> (stack, reparto, decisiones), **se actualiza aquí** y se sube al repo.

## 1. El proyecto

- **Asignatura:** Desarrollo de Interfaces (1º DAM)
- **Metodología:** Scrum
- **Producto:** Ruta Fantasma — app de reloj para correr contra tu mejor marca: dos puntos en pantalla (tú y tu "sombra") y avisos por sectores en verde/rojo, como en la Fórmula 1.
  _(Si el equipo cambia de idea, actualizad esta línea.)_
- **Stack:**
  - Frontend: Angular + TypeScript (web con diseño de pantalla de reloj que simula la carrera)
  - Backend: Node.js + Express (API REST)
  - Base de datos: MongoDB (rutas como listas de puntos GPS con tiempos)

## 2. El equipo

| Rol | Persona |
|---|---|
| Product Owner | Daniel Martín |
| Scrum Master | Aitor |
| Desarrollador | Asi (Asier García) |
| Desarrollador | Daniel Rodríguez |
| Desarrollador | Adam |

## 3. Sprint actual

- **Sprint:** 1
- **Fechas:** _(inicio — fin)_
- **Objetivo del sprint:** _(una frase)_
- **Tareas:** están en GitHub Issues y en el tablero de GitHub Projects.

## 4. Estructura del repositorio

```
CLAUDE.md                ← este archivo (contexto común)
README.md                ← guía rápida para el equipo
src/                     ← código de la aplicación
docs/memoria/            ← la memoria final, en Markdown
  00-portada.md            portada y datos del trabajo
  01-introduccion.md       qué es el proyecto
  02-producto.md           visión del producto y backlog
  03-equipo-y-scrum.md     roles, herramientas, cómo trabajamos
  sprint-01/               una carpeta por sprint
    _sprint.md             objetivo, planning y retrospectiva del sprint
    2026-10-13-asi-xxx.md  una entrada por tarea terminada
  99-conclusiones.md       conclusiones finales
docs/memoria.pdf         ← PDF generado AUTOMÁTICAMENTE (no tocar a mano)
scripts/                 ← script que genera el PDF
```

## 5. Reglas para Claude (OBLIGATORIAS)

### Al empezar a trabajar
1. Ejecuta `git pull --rebase` antes de tocar nada.
2. Lee este archivo y mira qué hay en `docs/memoria/` del sprint actual para saber qué han hecho los demás.

### Mientras trabajas
3. Escribe código claro y con comentarios en español donde ayude a entenderlo.
4. No borres ni reescribas trabajo de otros compañeros sin preguntar antes.
5. Si se toma una decisión importante (tecnología, estructura, diseño), anótala en la sección 7 de este archivo.

### Al terminar CADA tarea
6. Crea una entrada de memoria NUEVA en `docs/memoria/sprint-XX/` (la del sprint actual) con el nombre
   `AAAA-MM-DD-nombre-tarea-corta.md` (ejemplo: `2026-10-14-asi-pantalla-inicio.md`).
   Usa la plantilla de `docs/memoria/_plantilla-entrada.md`.
   **Nunca edites la entrada de otro compañero**: cada uno crea la suya, así no hay conflictos.
7. Escribe la entrada en español, en tono de memoria académica, explicando QUÉ se hizo, CÓMO y POR QUÉ.
8. Haz commit con un mensaje claro en español, siguiendo este formato:
   `tipo: descripción corta (#número-de-issue)`
   Tipos: `feat` (nueva función), `fix` (arreglo), `docs` (memoria/documentación), `style` (diseño/CSS), `refactor`, `test`.
9. Ejecuta `git pull --rebase` y luego `git push`.
10. Si al hacer pull hay conflictos, **para y explícale al usuario qué pasa** antes de resolver nada.

### Nunca
- Nunca edites `docs/memoria.pdf`: lo genera GitHub automáticamente.
- Nunca subas contraseñas, claves de API ni archivos `.env`.
- Nunca uses `git push --force`.

## 6. Comandos rápidos

- `/empezar` → actualiza el repo y te cuenta en qué punto está el proyecto.
- `/terminar` → escribe la entrada de la memoria, hace commit y lo sube.

## 7. Decisiones tomadas

| Fecha | Decisión | Motivo |
|---|---|---|
| 2026-10-13 | La memoria se escribe en Markdown y GitHub genera el PDF solo | Así nadie pierde tiempo maquetando y siempre está actualizada |
| 2026-10-14 | Stack: Angular + Node.js/Express + MongoDB | Tecnologías vistas en clase; MongoDB guarda bien rutas con puntos GPS |
| 2026-10-14 | La app será una web en Angular con diseño de reloj, no una app nativa de reloj | Mucho más sencillo de desarrollar y presentar |
| 2026-10-14 | Frontend en `src/frontend` (Angular 22) dividido en tres zonas con carga diferida: `/reloj`, `/app` y `/web` (cada una en `src/app/zonas/<zona>/` con su propio `<zona>.routes.ts`) | Cada compañero puede trabajar en una zona sin pisar a los demás, y el navegador solo descarga la zona que usa |
| 2026-10-14 | La app es una PWA (`@angular/pwa`: manifest + service worker) | Se puede instalar en el móvil y funciona sin conexión; el service worker solo se activa en la build de producción |
