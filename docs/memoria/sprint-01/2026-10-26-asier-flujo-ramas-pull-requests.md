## Flujo de trabajo con ramas y Pull Requests

**Autor:** Asier García · **Fecha:** 26/10/2026 · **Issue:** —

### Qué se ha hecho

Se ha definido y documentado el flujo de trabajo en GitHub que exige el enunciado del proyecto (sección 5). Cada historia se desarrolla en su propia rama, nadie sube cambios directamente a `main`, y todo se integra mediante una Pull Request que revisa y aprueba otro desarrollador. Este cambio es el primero que se ha subido siguiendo el nuevo flujo.

### Cómo se ha hecho

- **Reglas comunes en `CLAUDE.md`.** Se añadió una sección "Flujo de Git" que el asistente de cada desarrollador lee al abrir el proyecto, de modo que los tres trabajan igual sin necesidad de recordarlo cada vez:
  - **Ramas:** una por historia, con el nombre `PS-XX-descripcion-corta` (clave de Jira y 2–4 palabras), creada siempre desde `main` actualizado.
  - **Commits:** pequeños y frecuentes, con la clave de Jira en el mensaje (`PS-XX: descripción`).
  - **Integración:** antes de subir, se integra en la rama lo último de `main` (`git fetch` + `git merge origin/main`), de forma que el historial muestra que se incorpora el trabajo de los compañeros.
  - **Pull Request:** se sube solo la rama y se abre la Pull Request hacia `main`. Nunca se hace el merge de la PR propia: la aprueba otro DT y se fusiona en GitHub con *merge commit*, para que la rama quede visible en el historial.
- **Comandos del equipo.**
  - `/empezar PS-XX`: actualiza `main`, resume el estado del proyecto, avisa de las ramas abiertas de los compañeros y crea (o retoma) la rama de la tarea.
  - `/terminar`: escribe la entrada de memoria, ejecuta el build y los tests, hace commits por pasos, integra `main`, sube la rama y prepara la Pull Request.
  - `/revisar PS-XX` (nuevo): descarga la rama de un compañero, la compila, la prueba y redacta una revisión lista para pegar en GitHub, sin modificar su trabajo.
- **Plantilla de Pull Request** (`.github/pull_request_template.md`). Incluye la clave de Jira, cómo probar el cambio y la Definición de Hecho del enunciado, incluida la accesibilidad básica.
- **README.** La guía diaria del equipo explica ahora el ciclo completo: `/empezar` → trabajo en la rama → `/terminar` → revisión de otro DT → fusión.

### Por qué

- **Lo exige el enunciado:** "nadie sube cambios directamente a `main`", "cada historia se desarrolla en su propia rama" y cada DT debe tener commits y Pull Requests propios en todos los sprints. Además, la Definición de Hecho exige que el código esté integrado en `main` mediante una Pull Request revisada.
- **Deja constancia del trabajo:** las ramas y las Pull Requests muestran quién ha hecho cada historia, quién la ha revisado y cuándo se ha integrado, lo que se usará en el apartado "Trabajo en GitHub" de la memoria final.
- **Revisión entre compañeros:** las revisiones permiten detectar errores antes de que lleguen a `main` y que todo el equipo conozca el código de los demás. Esto también lo pide el enunciado para el código generado con IA.

### Problemas encontrados

- Las tareas DT2, PS-20, PS-21 y PS-26 se subieron directamente a `main` antes de conocer esta norma. No se ha reescrito ese historial, porque exigiría `git push --force` sobre la rama común. A partir de este cambio, todo entra por Pull Request.
- Para que GitHub impida de verdad subir a `main` sin revisión, el propietario del repositorio debe activar una regla de protección de la rama (*Require a pull request before merging*, con una aprobación).
