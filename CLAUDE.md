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
  - Backend: Java 17 + Spring Boot 3.5 (API REST)
  - Base de datos: MySQL 8 con JPA/Hibernate (usuarios, rutas, puntos GPS, sectores y carreras)

## 2. El equipo

| Rol | Persona |
|---|---|
| Product Owner | Daniel Martín |
| Scrum Master | Aitor |
| Desarrollador | Asi (Asier García) |
| Desarrollador | Daniel Rodríguez |
| Desarrollador | Adam |

## 3. Sprint actual

- **Sprint:** 2 (las entradas de memoria van en `docs/memoria/sprint-02/`)
- **Fechas:** _(inicio — fin)_
- **Objetivo del sprint:** _(una frase)_
- **Tareas:** están en GitHub Issues y en el tablero de GitHub Projects.

## 4. Estructura del repositorio

```
CLAUDE.md                    ← este archivo (contexto común)
README.md                    ← guía rápida para el equipo
.claude/commands/            ← comandos /empezar y /terminar
.github/                     ← plantillas de issues/PR y workflow que genera el PDF
src/                         ← código de la aplicación
  frontend/                  ← Angular 22 (PWA)
    public/                    iconos, favicon y manifest
    src/app/
      core/                    lo que se usa en TODA la app (una sola instancia)
        servicios/               llamadas a la API, GPS, lógica de carrera
        modelos/                 interfaces TypeScript (Ruta, PuntoGps, Sector…)
      compartido/              piezas reutilizables entre zonas
        componentes/             botones, marcadores, mapa de puntos…
        utilidades/              funciones auxiliares (formatear tiempos…)
      zonas/                   una carpeta por zona, con carga diferida
        reloj/                   pantalla del reloj (/reloj)
        app/                     app del móvil (/app)
        web/                     web pública (/web)
  backend/                   ← Spring Boot + MySQL (ver su README)
    .env.example               variables de entorno de ejemplo
    backend-springboot/        proyecto Maven
      base-de-datos/             scripts SQL de las tablas
      src/main/java/com/rutafantasma/backend/
        modelo/                    entidades JPA (una por tabla)
        repositorio/               acceso a las tablas
        servicio/                  lógica de negocio
        controlador/               endpoints REST (/api/...)
        dto/                       JSON que entra y sale de la API
        config/                    configuración (CORS, cifrado…)
      src/test/                  pruebas (H2 en memoria, sin MySQL)
docs/diseno/                 ← diseño de las pantallas (ver su README)
  README.md                    enlace a Figma, reglas de nombres y estado de cada pantalla
  mockups/                     imágenes PNG exportadas de Figma (reloj-carrera.png…)
docs/memoria/                ← la memoria final, en Markdown
  00-portada.md                portada y datos del trabajo
  01-introduccion.md           qué es el proyecto
  02-producto.md               visión del producto y backlog
  03-equipo-y-scrum.md         roles, herramientas, cómo trabajamos
  sprint-01/                   una carpeta por sprint
    _sprint.md                 objetivo, planning y retrospectiva del sprint
    2026-10-13-asi-xxx.md      una entrada por tarea terminada
  img/                         capturas para la memoria
  99-conclusiones.md           conclusiones finales
docs/memoria.pdf             ← PDF generado AUTOMÁTICAMENTE (no tocar a mano)
scripts/                     ← script que genera el PDF
```

**Dónde va cada cosa nueva:** una pantalla → `zonas/<zona>/`; algo que usan varias zonas → `compartido/`; servicios e interfaces de datos → `core/`. En el backend todo va dentro del único proyecto `src/backend/backend-springboot/` (nunca una carpeta por tarea): un endpoint nuevo toca `controlador/` → `servicio/` → `repositorio/` → `modelo/`, sus pruebas van en `src/test/` y los scripts SQL en `base-de-datos/`.

## 5. Reglas para Claude (OBLIGATORIAS)

### Flujo de Git: ramas y Pull Requests (lo exige el enunciado, sección 5)
**Nunca se trabaja ni se hace commit en `main`.** Toda tarea de código o documentación sigue este flujo,
aunque el usuario no lo pida y aunque no haya usado `/empezar`:

1. **Antes de tocar ningún archivo**, comprueba la rama con `git branch --show-current`.
   Si estás en `main`: `git switch main`, `git pull --rebase` y crea la rama de la tarea con
   `git switch -c PS-XX-descripcion-corta` (clave de Jira + 2–4 palabras en minúsculas con guiones,
   p. ej. `PS-20-login-registro`). Si no sabes la clave de Jira, pregúntasela al usuario.
   Si la rama ya existe, cámbiate a ella y trae lo nuevo de `main` con `git fetch origin` + `git merge origin/main`.
2. **Una rama por historia o subtarea.** Si el usuario pide varias tareas, cada una va en su propia rama
   creada desde `main` actualizado, con su propia Pull Request.
3. **Commits pequeños y frecuentes**, cada uno con la clave de Jira: `PS-XX: descripción en español`
   (p. ej. `PS-21: añadir interceptor de errores`). Mejor varios commits por pasos lógicos que uno gigante.
4. **Antes de subir**, trae el trabajo de los compañeros a tu rama: `git fetch origin` + `git merge origin/main`.
   Así se ve en el historial que integramos el trabajo de los demás. Si hay conflictos, **PARA y explícaselos al usuario**.
5. **Sube la rama** (`git push -u origin <rama>`), nunca `main`.
6. **Abre la Pull Request** hacia `main`: con `gh pr create` si está instalado; si no, da al usuario el enlace
   `https://github.com/danimachaco/Delta-Ghost/compare/main...<rama>?expand=1` con el título y la descripción ya escritos
   (título `PS-XX: descripción`, cuerpo según `.github/pull_request_template.md`).
7. **No hagas tú el merge a `main`.** La PR la revisa y aprueba **otro DT** (Daniel Rodríguez o Adam, o Asier si la
   PR es de otro) y se fusiona desde GitHub con **"Create a merge commit"**, para que la rama quede visible en el historial.
8. Cuando la PR esté fusionada: `git switch main`, `git pull --rebase` y borra la rama local con `git branch -d <rama>`.

Para **revisar la PR de un compañero** usa `/revisar <rama o PS-XX>`.

### Al empezar a trabajar
- Sigue el paso 1 del flujo de Git (rama de la tarea creada desde `main` actualizado).
- Lee este archivo y mira qué hay en `docs/memoria/` del sprint actual para saber qué han hecho los demás.

### Mientras trabajas
- Escribe código claro y con comentarios en español donde ayude a entenderlo.
- No borres ni reescribas trabajo de otros compañeros sin preguntar antes.
- Si se toma una decisión importante (tecnología, estructura, diseño), anótala en la sección 7 de este archivo.

### Al terminar CADA tarea
- Crea una entrada de memoria NUEVA en `docs/memoria/sprint-XX/` (la del sprint actual) con el nombre
  `AAAA-MM-DD-nombre-tarea-corta.md` (ejemplo: `2026-10-14-asi-pantalla-inicio.md`).
  Usa la plantilla de `docs/memoria/_plantilla-entrada.md`.
  **Nunca edites la entrada de otro compañero**: cada uno crea la suya, así no hay conflictos.
- Escribe la entrada en español, en tono de memoria académica, explicando QUÉ se hizo, CÓMO y POR QUÉ.
- Si hay código del frontend, comprueba que `npx ng build` y `npx ng test --watch=false` pasan antes de subir.
- Después sigue los pasos 3 a 7 del flujo de Git (commit en la rama → merge de `main` → push de la rama → Pull Request).

### Nunca
- Nunca hagas commit ni `git push` en `main` (ni `git push origin main`): todo entra por Pull Request.
- Nunca hagas tú el merge de tu propia PR.
- Nunca edites `docs/memoria.pdf`: lo genera GitHub automáticamente.
- Nunca subas contraseñas, claves de API ni archivos `.env`.
- Nunca uses `git push --force`.

## 6. Comandos rápidos

- `/empezar PS-XX` → actualiza `main`, te cuenta en qué punto está el proyecto y crea (o retoma) la rama de la tarea.
- `/terminar` → escribe la entrada de la memoria, hace commit en la rama, integra `main`, la sube y prepara la Pull Request.
- `/revisar PS-XX` → descarga la rama de un compañero, la compila, la prueba y te da la revisión para su Pull Request.

## 7. Decisiones tomadas

| Fecha | Decisión | Motivo |
|---|---|---|
| 2026-10-13 | La memoria se escribe en Markdown y GitHub genera el PDF solo | Así nadie pierde tiempo maquetando y siempre está actualizada |
| 2026-10-14 | Stack: Angular + Node.js/Express + MongoDB | Tecnologías vistas en clase; MongoDB guarda bien rutas con puntos GPS |
| 2026-10-14 | La app será una web en Angular con diseño de reloj, no una app nativa de reloj | Mucho más sencillo de desarrollar y presentar |
| 2026-10-14 | Frontend en `src/frontend` (Angular 22) dividido en tres zonas con carga diferida: `/reloj`, `/app` y `/web` (cada una en `src/app/zonas/<zona>/` con su propio `<zona>.routes.ts`) | Cada compañero puede trabajar en una zona sin pisar a los demás, y el navegador solo descarga la zona que usa |
| 2026-10-14 | La app es una PWA (`@angular/pwa`: manifest + service worker) | Se puede instalar en el móvil y funciona sin conexión; el service worker solo se activa en la build de producción |
| 2026-10-20 | Árbol del proyecto: `src/frontend` con `core/`, `compartido/` y `zonas/`; `src/backend` por capas (`api` → `controladores` → `servicios` → `modelos`) | Cada cosa tiene un sitio fijo, así los 3 desarrolladores saben dónde poner el código sin pisarse |
| 2026-10-21 | Los mockups se diseñan en Figma y se suben exportados en PNG a `docs/diseno/mockups/`, con nombres `zona-pantalla.png` | El equipo y el profesor pueden ver los diseños desde GitHub, y el nombre indica a qué zona del frontend pertenece cada pantalla |
| 2026-10-21 | Toda llamada al backend pasa por el servicio `Api` (`core/servicios/api.ts`); la URL del servidor está en `src/environments/` y los errores los traduce `erroresInterceptor` a un `ErrorApi` con `mensaje` en español | La dirección del servidor se cambia en un solo sitio y las pantallas solo tienen que mostrar `error.mensaje` |
| 2026-10-21 | Autenticación por token: `POST /api/auth/login` y `POST /api/auth/registro` devuelven `{ token, usuario }`; el frontend guarda la sesión en el servicio `Auth` y envía `Authorization: Bearer <token>`. El `authGuard` está creado pero aún sin aplicar | El backend todavía no tiene login; este es el contrato que debe implementar (ver la entrada de memoria de PS-20). Proteger rutas antes de eso bloquearía la app |
| 2026-10-26 | Flujo de ramas: una rama `PS-XX-descripcion` por historia, commits `PS-XX: ...`, se integra `main` en la rama antes de subir y todo entra en `main` por Pull Request aprobada por otro DT (merge commit) | Lo exige el enunciado (sección 5 y Definición de Hecho); además deja constancia en GitHub de quién hizo qué y de que se integra el trabajo de los compañeros |
| 2026-10-28 | El backend pasa de MongoDB a **Spring Boot + MySQL (JPA)**, en el paquete `com.rutafantasma.backend` dentro de `src/backend/backend-springboot/`. Se elimina el esqueleto de Node/Express | Las historias de Jira (PS-18, PS-23) piden MySQL: los datos (usuarios, rutas, puntos, sectores, carreras) son relacionales y MySQL es lo visto en clase. Un solo backend evita duplicar código |
