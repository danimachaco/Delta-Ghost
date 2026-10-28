# Equipo y forma de trabajo

## Roles

| Rol | Persona | Responsabilidad |
|---|---|---|
| Product Owner | Daniel Martín | Define y prioriza el Product Backlog |
| Scrum Master | Aitor | Facilita las ceremonias y elimina impedimentos |
| Desarrollador | Asier García Catalán | Desarrollo |
| Desarrollador | Daniel Rodríguez | Desarrollo |
| Desarrollador | Adam | Desarrollo |

## Tecnologías (stack)

| Parte | Tecnología | Motivo |
|---|---|---|
| Frontend | Angular + TypeScript | Vista en clase; permite simular la pantalla del reloj en el navegador |
| Backend | Java + Spring Boot | Visto en clase; organiza la API REST por capas (controlador, servicio, repositorio) |
| Base de datos | MySQL (con JPA/Hibernate) | Los datos son relacionales (usuarios, rutas, puntos, sectores y carreras) y MySQL es el gestor visto en clase |

## Herramientas

- **GitHub:** repositorio común del código y de esta memoria.
- **GitHub Issues y Projects:** Product Backlog y tablero del sprint (Por hacer / En curso / Hecho).
- **Claude Code:** asistente de programación que usa cada desarrollador. Todos comparten el mismo contexto mediante el archivo `CLAUDE.md` del repositorio.
- **Generación automática de la memoria:** cada avance se documenta en Markdown y GitHub Actions genera este PDF en cada subida.

## Ceremonias

- **Sprint Planning:** al inicio de cada sprint.
- **Daily:** _(frecuencia real del equipo)_.
- **Sprint Review y Retrospectiva:** al final de cada sprint; se resumen en el apartado de cada sprint.
