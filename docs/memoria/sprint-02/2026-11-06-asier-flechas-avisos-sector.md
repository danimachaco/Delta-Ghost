## PS-59 · Añadir iconos de flecha a los avisos de sector

**Autor:** Asier García · **Fecha:** 06/11/2026 · **Issue:** PS-59 (historia PS-58)

### Qué se ha hecho

Al terminar un sector, el reloj ya no avisa solo con el color del destello (verde o rojo, PS-49). Ahora aparece también una flecha grande en la parte de arriba de la esfera: **▲ hacia arriba** si has ido mejor que tu sombra y **▼ hacia abajo** si has ido peor. Además, el aviso se anuncia con texto a los lectores de pantalla: "Sector mejor que tu sombra" o "Sector peor que tu sombra". Así lo entiende quien tiene dificultades para distinguir el verde del rojo, que es lo que pide la historia PS-58.

### Cómo se ha hecho

- **Componente `FlechaSector`** (`compartido/componentes/flecha-sector/`):
  - Dibuja un triángulo SVG con la punta hacia arriba (`mejor`) o hacia abajo (`peor`) según su *input* `resultado`.
  - Mide `1em`, así que se le da el tamaño con `font-size`.
  - Va en `compartido/` porque también lo usará la pantalla de fin de carrera (PS-62).
  - Es decorativo (`aria-hidden`): el texto lo pone quien lo usa.
- **Pantalla del reloj** (`zonas/reloj/reloj-inicio/`):
  - Mientras dura el destello se muestra la flecha encima, centrada en la parte de arriba de la esfera para no tapar el tiempo.
  - La flecha no se desvanece como el destello: está entera los 3 segundos.
  - Es **blanca con borde negro**, así contrasta igual sobre el verde que sobre el rojo.
  - Hay un párrafo oculto con `aria-live="assertive"` que anuncia el resultado en cuanto termina el sector.
- **Pruebas.** Se añadieron 5 pruebas nuevas, y en total pasan 237:
  - 3 de la flecha (punta arriba, punta abajo, decorativa);
  - 2 del reloj (aparece la flecha correcta y se anuncia el texto).
- **Prueba en el navegador:** con los botones de prueba de los avisos se comprobó que aparecen ▲ sobre el verde y ▼ sobre el rojo.

### Por qué

- **La forma además del color:** según las pautas de accesibilidad (WCAG 1.4.1, "uso del color"), el color no puede ser la única forma de dar una información. Arriba y abajo se distinguen sin ver colores, y además se entienden solos: "subo" o "bajo" respecto a la sombra.
- **Las mismas flechas que el resumen:** la pantalla de resumen de la PS-50 ya marca los sectores con ↑ y ↓, así que el corredor ve el mismo símbolo en el reloj y en el móvil.
- **Un triángulo en SVG y no un carácter de texto:** los caracteres ▲/▼ se ven distintos según el tipo de letra del dispositivo y a veces salen como emoji. El SVG se ve siempre igual y se le puede poner borde.
- **`aria-live="assertive"`:** el corredor va corriendo y el aviso dura poco, así que conviene que el lector de pantalla lo diga en el momento sin esperar.

### Problemas encontrados

La primera versión pintaba la flecha del mismo color que el destello, verde sobre verde y rojo sobre rojo, y casi no se veía. Se cambió a blanco con borde negro, que se ve bien sobre los dos.
