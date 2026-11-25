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
| 2026-11-03 | En desarrollo el frontend llama a `/api` (relativo) y `ng serve` lo reenvía al backend con `src/frontend/proxy.conf.json`. El backend permite CORS desde `localhost` en cualquier puerto y otras direcciones con `CORS_ORIGENES` | El registro y el login fallaban según desde dónde se abría la web. Con el proxy no hay CORS en local y los problemas frecuentes están en el README del backend |
| 2026-11-03 | Publicación: web en **Vercel**, API en **Render** (Docker, `render.yaml`, plan gratis) y la base de datos en **TiDB Cloud** (compatible con MySQL, gratis). En producción el frontend llama a `https://ruta-fantasma-api.onrender.com/api`; las credenciales solo se guardan en Render | La web de Vercel no podía iniciar sesión porque el backend no estaba en Internet. Son servicios gratuitos y sin tarjeta; guía en `docs/despliegue.md` |
| 2026-11-10 | Una ruta la pueden ver y correr su dueño **y los amigos del dueño** (`AccesoRutas`); la mejor marca es **de cada corredor** en cada ruta (la del dueño parte de la grabación) | El ranking por ruta (PS-64), los mejores sectores (PS-67) y la sombra por tipo (PS-70) necesitan varios corredores en la misma ruta. Limitarlo a amigos mantiene privada la ubicación de las rutas |
| 2026-11-10 | Contrato de la **sombra por tipo** (PS-70, lo usa la pantalla "Elige sombra" de la PS-71): `GET /api/rutas/{id}/sombra?tipo=MEJOR\|ULTIMA\|ORIGINAL` (sin `tipo` = `MEJOR`). Responde el `SombraResponse` de siempre **más el campo `tipo`** con el tipo devuelto. Si no hay sombra de ese tipo (p. ej. `ULTIMA` sin carreras) responde `404 { error }` | El frontend se hizo antes que el endpoint. Mientras el backend no envíe `tipo`, la pantalla solo deja correr contra la mejor marca y desactiva las otras dos opciones, así no enseña una sombra que no es |
| 2026-11-10 | Contrato del **ranking por ruta** (PS-64, lo usa la pantalla de ranking de la PS-65): `GET /api/rutas/{id}/ranking` (con token) → `{ rutaId, rutaNombre, entradas: [{ posicion, usuario: { id, nombre }, tiempoTotalSegundos, fecha }] }`, una entrada por corredor con su mejor carrera, de la más rápida a la más lenta. Del usuario solo se envían `id` y `nombre`. Si la ruta no existe, `404 { error }` | El frontend se hizo antes que el endpoint. Sin el email se protege la privacidad de los demás corredores. Mientras el endpoint no exista, la pantalla responde "Esta ruta todavía no tiene ranking." |
| 2026-11-24 | **Modo vuelta rápida** (PS-78, lo usa el reloj en la PS-79): servicio `VueltaRapida` (`core/servicios/vuelta-rapida.ts`). Se empieza con `iniciar(posicionActual, segundosCronometro)` (esa posición es la línea de salida y meta) y se le pasa cada lectura válida del GPS con `registrar({ ...posicion, tiempoSegundos: cronometro.segundos() })`; `marcarVuelta(segundos)` cierra la vuelta a mano. Se leen los signals `vueltas`, `ultimaVuelta` (su `resultado` es `morado` = nueva vuelta rápida, `mejor` = mejor que la anterior, `peor`, o `null` en la primera), `mejorVuelta`, `numeroVuelta`, `diferencia` (segundos con la mejor vuelta en el mismo punto; negativo = vas mejor) y `metrosVuelta` | La vuelta se detecta sola al volver a menos de 20 m de la salida tras al menos 100 m, sin necesidad de una ruta guardada; el resultado usa los mismos colores que los avisos de sector, así el reloj reutiliza sus destellos |
| 2026-11-24 | Contrato de las **estadísticas** (PS-75, para la web con Chart.js de la PS-76): `GET /api/estadisticas?semanas=12` (con token) → `{ resumen: { carreras, rutasCorridas, distanciaTotalMetros, tiempoTotalSegundos, ritmoMedioSegundosKm, mejorRitmoSegundosKm, carreraMasLargaMetros }, semanas: [{ inicio, carreras, distanciaMetros, tiempoSegundos }], rutas: [{ rutaId, nombre, carreras, primerTiempoSegundos, mejorTiempoSegundos, ultimoTiempoSegundos, mejoraSegundos }], evolucion: [{ carreraId, rutaId, rutaNombre, fecha, tiempoTotalSegundos, distanciaMetros, ritmoSegundosKm }] }`. Metros, segundos y segundos/km; los ritmos son `null` sin distancia. `semanas` trae también las semanas vacías (de 1 a 52, de la más antigua a la actual, `inicio` = lunes) y `evolucion` las últimas 50 en orden de fecha. Cuentan tus carreras y la grabación de tus rutas | Cada lista es una serie lista para un gráfico de Chart.js, así la web no tiene que hacer cálculos. Mismo criterio de "carrera" que el ranking (PS-64) |
| 2026-11-24 | Contrato de las **estadísticas** (PS-75, lo usa la web de estadísticas de la PS-76): `GET /api/estadisticas` (con token, del usuario de la sesión) → `{ totales: { carreras, distanciaMetros, tiempoSegundos, rutas }, semanas: [{ inicio, carreras, distanciaMetros, tiempoSegundos }], carreras: [{ fecha, rutaId, rutaNombre, distanciaMetros, tiempoSegundos, mejorMarca }] }`. `semanas`: las últimas 8, de lunes a domingo (`inicio` = lunes en ISO), de la más antigua a la más reciente e incluyendo las que tienen 0 carreras. `carreras`: las últimas 20, de la más antigua a la más reciente | El frontend se hizo antes que el endpoint. Con las semanas vacías incluidas el gráfico de barras no se salta semanas. Mientras el endpoint no exista, la pantalla responde "Las estadísticas todavía no están disponibles." |
| 2026-11-24 | **Pantalla del modo vuelta rápida** (PS-79, historia PS-77): usa su propio servicio `VueltaRapidaGps` (`core/servicios/vuelta-rapida-gps.ts`), que escucha el GPS, lanza los destellos y mantiene la pantalla encendida. Se separó del `VueltaRapida` de la PS-78 porque al fusionar las dos en `main` quedaron pegadas en el mismo archivo y rompieron la build de Vercel. La salida es la posición al pulsar Empezar; una vuelta se cierra al volver a menos de 15 m de ella tras alejarse al menos 50 m, y si dura al menos 20 s. Cada vuelta se compara con las anteriores: morado si es la más rápida, verde si mejora la anterior, rojo si no. No usa rutas ni el backend | En pista no hay una ruta grabada contra la que comparar. **Regla:** dos tareas nunca crean un archivo con la misma ruta; si una necesita la lógica de otra, la importa de su archivo. Unificar las dos detecciones de vueltas queda pendiente |
