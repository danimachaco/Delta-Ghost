---
description: Escribe la entrada de la memoria, hace commit en tu rama, integra main, la sube y prepara la Pull Request
argument-hint: "[notas extra]"
---

He terminado la tarea en la que estábamos trabajando. Haz esto en orden:

1. Comprueba la rama con `git branch --show-current`.
   - Si estamos en `main`, NO hagas commit ahí: pregúntame la clave de Jira si no la sabes y crea la rama
     con `git switch -c PS-XX-descripcion-corta` (los cambios sin guardar se vienen contigo).
2. Mira `git status` y `git diff` para ver todo lo que ha cambiado en esta sesión.
3. Averigua qué sprint es el actual (sección 3 de `CLAUDE.md`).
4. Crea una entrada NUEVA en `docs/memoria/sprint-XX/` siguiendo la plantilla `docs/memoria/_plantilla-entrada.md`.
   - Nombre del archivo: `AAAA-MM-DD-<mi-nombre>-<tarea-corta>.md` (fecha de hoy).
   - Si no sabes mi nombre, pregúntamelo.
   - Escríbela en español, en tono de memoria académica: qué se hizo, cómo y por qué, y los problemas encontrados.
   - No toques entradas de otros compañeros.
5. Si se tomó alguna decisión importante, añádela a la tabla "Decisiones tomadas" de `CLAUDE.md`.
6. Si hay cambios en `src/frontend`, ejecuta `npx ng build` y `npx ng test --watch=false` dentro de esa carpeta.
   Si algo falla, arréglalo antes de seguir (o explícame por qué no se puede).
7. Haz commits **pequeños**, agrupando los cambios por pasos lógicos (por ejemplo: servicio, pantalla, tests, memoria).
   - Mensaje: `PS-XX: descripción en español`.
   - `git add` solo de lo que toca (nunca `.env` ni claves).
8. Trae el trabajo de los compañeros a la rama: `git fetch origin` y `git merge origin/main`.
   - Si hay conflictos, PARA y explícame qué archivos chocan y qué propones, antes de resolver nada.
   - Si el merge trae cambios en el frontend, vuelve a pasar el build y los tests.
9. Sube la rama: `git push -u origin <rama>`. **Nunca** hagas push a `main`.
10. Prepara la Pull Request hacia `main`:
    - Título: `PS-XX: descripción`.
    - Descripción siguiendo `.github/pull_request_template.md`, rellenada con lo que se ha hecho.
    - Si `gh` está instalado, créala con `gh pr create --base main`. Si no, dame el enlace
      `https://github.com/danimachaco/Delta-Ghost/compare/main...<rama>?expand=1` y el título y la descripción listos para pegar.
11. NO hagas el merge tú. Recuérdame que la tiene que revisar y aprobar **otro DT** y que se fusiona en GitHub con
    **"Create a merge commit"**. Cuando esté fusionada, en el siguiente `/empezar` se actualizará `main` y se borrará la rama local.
12. Al final dime en 2–3 líneas qué commits se han subido, en qué rama, y el enlace de la Pull Request.
    Recuérdame que el PDF de la memoria se actualizará cuando la PR se fusione en `main`.

Notas extra del usuario: $ARGUMENTS
