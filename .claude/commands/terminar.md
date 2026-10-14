---
description: Escribe la entrada de la memoria de lo que has hecho, hace commit y lo sube a GitHub
---

He terminado la tarea en la que estábamos trabajando. Haz esto en orden:

1. Mira `git status` y `git diff` para ver todo lo que ha cambiado en esta sesión.
2. Averigua qué sprint es el actual (sección 3 de `CLAUDE.md`).
3. Crea una entrada NUEVA en `docs/memoria/sprint-XX/` siguiendo la plantilla `docs/memoria/_plantilla-entrada.md`.
   - Nombre del archivo: `AAAA-MM-DD-<mi-nombre>-<tarea-corta>.md` (fecha de hoy).
   - Si no sabes mi nombre, pregúntamelo.
   - Escríbela en español, en tono de memoria académica: qué se hizo, cómo y por qué, y los problemas encontrados.
   - No toques entradas de otros compañeros.
4. Si se tomó alguna decisión importante, añádela a la tabla "Decisiones tomadas" de `CLAUDE.md`.
5. Haz `git add` de los cambios (nunca `.env` ni claves) y un commit con el formato `tipo: descripción (#issue)`.
6. Ejecuta `git pull --rebase` y después `git push`.
   - Si hay conflictos, PARA y explícame qué archivos chocan y qué propones, antes de resolver nada.
7. Al final dime en 2–3 líneas qué se ha subido y recuérdame que en unos minutos el PDF de la memoria estará actualizado en `docs/memoria.pdf`.

Notas extra del usuario: $ARGUMENTS
