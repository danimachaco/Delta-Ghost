# Diseño — Mockups de Ruta Fantasma

Aquí se guardan los diseños de las pantallas antes de programarlas. Los diseños se hacen en
**Figma** y en esta carpeta se suben **las imágenes exportadas**, para que todo el equipo (y el
profesor) pueda verlos desde GitHub sin abrir Figma.

## Enlace al archivo de Figma

_(Pega aquí el enlace de Figma cuando esté creado.)_

## Cómo subir un mockup

1. En Figma, selecciona el marco (frame) de la pantalla → **Export** → formato **PNG** a **2x**.
2. Guarda la imagen en `docs/diseno/mockups/` con un nombre que siga la regla de abajo.
3. Añade la pantalla a la tabla de esta página.
4. Si el mockup va a salir en la memoria, cópialo también a `docs/memoria/img/`.
5. Cuando el PO valide el diseño, cambia su estado a **Validado**.

## Cómo se llaman los archivos

`zona-pantalla[-variante].png`, en minúsculas, sin tildes ni espacios. La zona es `reloj`,
`app` o `web` (las mismas zonas que el frontend).

Ejemplos: `reloj-carrera.png`, `reloj-sector-verde.png`, `app-elegir-ruta.png`.

## Pantallas

| Pantalla | Archivo | Zona | Estado |
|---|---|---|---|
| Reloj durante la carrera (tú y tu sombra) | `reloj-carrera.png` | reloj | Pendiente |
| Reloj al mejorar un sector (destello verde) | `reloj-sector-verde.png` | reloj | Pendiente |
| Reloj al empeorar un sector (destello rojo) | `reloj-sector-rojo.png` | reloj | Pendiente |
| Elegir ruta y empezar la carrera | `app-elegir-ruta.png` | app | Pendiente |
| Resumen al terminar la carrera | `app-resumen.png` | app | Pendiente |

Estados: **Pendiente** → **En revisión** (enseñado al PO) → **Validado**.
