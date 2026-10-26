---
description: Revisa la Pull Request de un compañero (descarga su rama, la compila, la prueba y redacta la revisión)
argument-hint: "<rama o PS-XX>"
---

Quiero revisar la Pull Request de un compañero, como pide el enunciado (toda PR la aprueba otro DT). Haz esto en orden:

1. Mira `git status`. Si tengo cambios sin guardar, PARA y explícame qué hacer con ellos antes de cambiar de rama.
2. `git fetch origin` y localiza la rama: es la de los argumentos de abajo, o la rama de `origin` cuyo nombre empieza por esa clave PS-XX.
   Si hay varias o ninguna, enséñame las ramas remotas (`git branch -r`) y pregúntame.
3. Enséñame qué trae respecto a `main`: `git log --oneline origin/main..origin/<rama>` y `git diff --stat origin/main...origin/<rama>`.
4. Cámbiate a la rama (`git switch <rama>`, que la crea siguiendo a la remota) y:
   - Si toca `src/frontend`, ejecuta `npx ng build` y `npx ng test --watch=false` en esa carpeta.
   - Lee el diff completo (`git diff origin/main...origin/<rama>`) buscando errores, cosas que rompan otras pantallas,
     incumplimientos de `CLAUDE.md` y de la Definición de Hecho (accesibilidad básica: contraste, teclado y etiquetas en los formularios).
5. **No modifiques ni subas nada a la rama del compañero**: es su trabajo. Si ves fallos, propónlos como comentarios.
6. Dame la revisión en español, lista para pegar en GitHub (pestaña **Files changed → Review changes**):
   - Veredicto recomendado: **Approve** o **Request changes**.
   - Qué se ha comprobado (build, tests, prueba manual) y el resultado.
   - Comentarios concretos con archivo y línea, si los hay.
7. Vuelve a `main` con `git switch main` al terminar.

Rama o tarea a revisar: $ARGUMENTS
