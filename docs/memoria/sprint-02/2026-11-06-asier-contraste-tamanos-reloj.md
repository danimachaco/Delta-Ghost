## PS-60 · Revisar el contraste y los tamaños del reloj

**Autor:** Asier García · **Fecha:** 06/11/2026 · **Issue:** PS-60 (historia PS-58)

### Qué se ha hecho

Se han medido todas las combinaciones de colores de las pantallas del reloj (`/reloj` y `/reloj/elegir`) con la fórmula de contraste de las pautas WCAG 2 y se han corregido las que no llegaban al mínimo del nivel AA. También se han subido los textos más pequeños y se han agrandado los botones y enlaces para que se pulsen bien con el dedo. Por último, se ha añadido una prueba automática que comprueba el contraste de la paleta del reloj, para que no se estropee sin darse cuenta.

### Cómo se ha hecho

**1. Medición.** Se calculó el contraste de cada par texto/fondo. La WCAG AA pide 4,5:1 para texto normal y 3:1 para texto grande y elementos gráficos. Los pares que fallaban:

| Elemento | Antes | Ahora | Mínimo |
|---|---|---|---|
| Texto blanco en los botones morados | 4,35:1 | **5,51:1** (`#6a4ce8`) | 4,5 |
| Texto blanco en el botón Terminar (rojo) | 3,82:1 | **5,44:1** (`#c0392b`) | 4,5 |
| Texto gris sobre el destello verde | 1,93:1 | **6,63:1** (el destello ya no tapa el texto) | 4,5 |
| Texto gris sobre el destello rojo | 2,95:1 | **6,63:1** | 4,5 |
| Pista de la barra de progreso | 1,67:1 | **4,44:1** (`#6e7681`) | 3 |
| Borde de la esfera | 1,72:1 | **4,44:1** | 3 |

Todo lo demás ya cumplía. Por ejemplo, el texto principal está a 17,3:1, el texto gris a 6,6:1 y la diferencia en verde a 9,7:1.

**2. Colores.** En `styles.css` hay tres variables nuevas solo para el reloj: `--reloj-boton`, `--reloj-boton-terminar` y `--reloj-linea`. No se tocaron los colores comunes (`--color-primario`, `--color-peor`), porque los usa toda la app y en otros sitios sí cumplen: el morado como texto sobre negro está a 4,8:1 y el rojo de la diferencia, que es texto grande, a 5,3:1.

**3. El destello de sector (PS-49) pasa a ser un anillo.** Antes coloreaba toda la esfera al 55 %, y encima el texto gris bajaba a 1,9:1. Ahora es un anillo grueso en el borde, dibujado con `box-shadow: inset`, con el color al 100 %. El centro sigue negro, así que el tiempo y los textos se leen igual durante el aviso, y el aviso se ve todavía más.

**4. Tamaños.**
- Ningún texto del reloj baja de 0,8 rem (12,8 px). La etiqueta, los kilómetros, el aviso de pantalla y los detalles de las tarjetas de "Elige ruta" se han subido.
- Todos los botones y tarjetas miden al menos **44 px de alto**, y los enlaces "Salir", "Correr otra vez" y "Volver al reloj" tienen relleno para llegar también a 44 px. Es el tamaño mínimo de pulsación que recomiendan la WCAG (2.5.5) y Apple.
- Se siguen usando `rem`, así que todo crece si el usuario aumenta el tamaño de letra del navegador.

**5. Prueba automática.** `compartido/utilidades/contraste.ts` calcula el contraste con la fórmula de la WCAG (luminancia relativa). `contraste.spec.ts` la prueba con valores conocidos y comprueba los 14 pares de colores del reloj. Si alguien cambia un color y deja de cumplir, la prueba falla. En total pasan 255 pruebas.

**6. Prueba en el navegador.** Se comprobó que el anillo verde y la flecha de la PS-59 se ven bien, que el texto del centro se lee durante el aviso y que los botones miden 44 px.

### Por qué

- **WCAG nivel AA:** es el nivel que se exige normalmente en webs públicas, y en la historia PS-58 el usuario tiene problemas de visión de los colores. En un reloj, además, se mira la pantalla corriendo, a pleno sol y de reojo, así que el contraste importa todavía más.
- **Variables propias del reloj en lugar de cambiar las comunes:** cambiar `--color-primario` habría cambiado el aspecto de toda la app y habría empeorado los enlaces morados sobre negro. Así el arreglo solo afecta a donde hacía falta.
- **Anillo en lugar de bajar la opacidad del destello:** para que el texto gris llegara a 4,5:1 sobre un relleno verde, la opacidad tendría que bajar al 25 %, y el aviso casi no se vería. El anillo al 100 % se ve mucho más y no tapa nada.
- **Prueba automática:** el contraste se rompe fácilmente al cambiar un color "a ojo". Con la prueba, el error aparece en `ng test` antes de subir.

### Problemas encontrados

- La primera idea era que la prueba leyera los colores directamente de `styles.css` (importándolo como texto con `?raw`), pero el compilador de pruebas de Angular no lo permite. Por eso la prueba tiene su propia tabla de colores, con un aviso de que hay que cambiarla si se cambia `styles.css`.
- Al formatear con Prettier se reformatearon también archivos de compañeros, como el panel del simulador. Esos cambios se deshicieron para no tocar su trabajo.
- Los botones temporales de prueba de los avisos de la PS-49 no se han tocado, porque se van a quitar.
