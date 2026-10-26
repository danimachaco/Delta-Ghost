---
description: Actualiza main, resume en qué punto está el proyecto y crea (o retoma) la rama de tu tarea
argument-hint: "[PS-XX descripción de la tarea]"
---

Vamos a empezar una sesión de trabajo en el proyecto Scrum. Haz esto en orden:

1. Mira `git status` y `git branch --show-current`.
   - Si hay cambios sin guardar, PARA y explícame qué son antes de cambiar de rama (no los pierdas).
2. Actualiza `main` con el trabajo de los compañeros: `git switch main` y `git pull --rebase`.
   Si falla, explícame el motivo en palabras sencillas.
3. Lee `CLAUDE.md` (contexto y reglas del equipo, sobre todo el **flujo de Git** de la sección 5).
4. Mira `git log --oneline --graph -15`, las ramas remotas (`git branch -r`) y las entradas de `docs/memoria/` del sprint actual.
5. Dame un resumen corto en español:
   - Qué se ha hecho últimamente y quién lo hizo (incluidas las Pull Requests ya fusionadas)
   - Qué ramas de compañeros están abiertas, por si alguna espera mi revisión
   - Qué sprint estamos y cuál es su objetivo
6. Averigua la tarea de hoy: si viene en los argumentos de abajo, úsala; si no, pregúntame la **clave de Jira** (PS-XX) y qué hay que hacer.
7. Crea la rama de la tarea **desde `main` actualizado**: `git switch -c PS-XX-descripcion-corta`
   (clave + 2–4 palabras en minúsculas con guiones, sin tildes).
   - Si esa rama ya existe (en local o en `origin`), cámbiate a ella y trae lo nuevo de `main` con
     `git fetch origin` + `git merge origin/main`. Si hay conflictos, PARA y explícamelos.
   - Si me pides varias tareas, empieza por la primera; cada una tendrá su propia rama y su propia Pull Request.
8. Confírmame en una línea en qué rama estamos y empieza a trabajar.

Tarea indicada por el usuario: $ARGUMENTS
