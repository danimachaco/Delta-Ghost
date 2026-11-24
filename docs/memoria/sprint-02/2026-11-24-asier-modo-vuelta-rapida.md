## PS-79 · Crear el modo vuelta rápida en el reloj

**Autor:** Asier García · **Fecha:** 24/11/2026 · **Issue:** PS-79 (historia PS-77)

### Qué se ha hecho

El reloj tiene un **modo vuelta rápida** (`/reloj/vueltas`) para correr en pista, donde **cada vuelta es un sector**. Se entra desde el enlace "¿Corres en pista? Modo vuelta rápida" de la pantalla "Elige ruta". El funcionamiento:
1. El corredor se pone en la línea de salida, espera a la señal GPS y pulsa **Empezar**.
2. Mientras corre, el reloj enseña el **número de vuelta**, el **tiempo de la vuelta actual** con décimas, su **mejor vuelta** y **cómo fue la última** comparada con la anterior ("-2,7 s").
3. Cada vez que vuelve a pasar por la salida se cierra la vuelta y salta el destello de la F1:
   - **morado con estrella** si es su vuelta más rápida;
   - **verde con ▲** si mejora la anterior;
   - **rojo con ▼** si va peor.
4. Al pulsar **Terminar**, ve la lista de todas las vueltas con la mejor marcada y el tiempo total.

### Cómo se ha hecho

- **Servicio `VueltaRapida`** (`core/servicios/vuelta-rapida.ts`) con toda la lógica:
  - La **salida** es la posición GPS fiable al pulsar Empezar.
  - Con cada lectura filtrada del GPS (`Gps.lecturasValidas`, PS-32) se calcula la distancia a la salida (Haversine, servicio `Calculo`, PS-31).
  - Una vuelta se cierra cuando el corredor **se ha alejado al menos 50 m** y **vuelve a estar a menos de 15 m**, y además la vuelta dura **al menos 20 s**. Así el GPS, que "baila" unos metros estando parado, no cierra vueltas falsas.
  - Cada vuelta se compara con las anteriores y se lanza el aviso con el servicio `AvisoSector` (PS-49/68), que hace el destello y la vibración. La primera vuelta no se compara con nada.
  - La vuelta siguiente empieza justo en el momento en que se cierra la anterior.
  - Usa su propio reloj (`Date.now`) y no el `Cronometro` de la carrera, para no mezclarse con una carrera contra la sombra. Si hay una carrera en marcha, no deja empezar.
  - Mantiene la pantalla encendida mientras se corre (Wake Lock, PS-46).
- **Pantalla `VueltaRapidaPantalla`** (`zonas/reloj/vuelta-rapida/`), con la esfera del reloj y las reglas de la PS-60 (anillo de destello, botones de 44 px y contrastes AA):
  - El destello lleva encima la forma de la PS-59/68: flecha ▲/▼ o estrella. Además se anuncia a los lectores de pantalla: "Vuelta 4: 1:33,9. ¡Tu vuelta más rápida!".
  - En la lista final, la mejor vuelta tiene borde morado y la palabra "Mejor".
  - Unos textos ocultos separan las columnas para el lector de pantalla ("Vuelta 2, 1:32,5, Mejor vuelta").
  - Al salir de la pantalla se termina el modo y se apaga el GPS.
- **Formato de tiempos** (`compartido/utilidades/formato-vuelta.ts`): las vueltas se ven con décimas ("1:32,4") y las diferencias con signo ("-1,2 s"), porque en pista las vueltas se ganan por décimas.
- **Decisión anotada en `CLAUDE.md`**: dónde está la lógica y cómo detecta las vueltas, para que la PS-78 (lógica del modo, de otro compañero) la reutilice en lugar de crear otro archivo con el mismo nombre.
- **Pruebas.** Se añadieron 23 pruebas nuevas, y en total pasan 366:
  - 12 del servicio: cerrar vuelta, el GPS que baila, vuelta demasiado corta, los tres colores, inicio de la vuelta siguiente, lecturas del GPS, tiempo en marcha, terminar y reiniciar;
  - 8 de la pantalla;
  - 2 del formato;
  - 1 del enlace desde "Elige ruta".
- **Prueba en el navegador,** con un GPS simulado y adelantando el reloj, se corrieron 4 vueltas (1:35,6, 1:38,3, 1:36,6 y 1:33,9):
  - la segunda dio rojo, la tercera verde y la cuarta morado con estrella;
  - la lista final marcó la 4 como "Mejor", con un total de 6:24,3;
  - se midió que todo el contenido queda dentro de la esfera.

### Por qué

- **Detectar las vueltas por distancia a la salida:** en pista no hay una ruta grabada con la que comparar, y la salida siempre está en el mismo sitio. Exigir alejarse 50 m y una vuelta de al menos 20 s evita los falsos positivos sin molestar: una vuelta a una pista de 400 m dura más de un minuto.
- **Comparar con la vuelta anterior y con la mejor:** es como se leen los tiempos en la F1. El verde dice "vas mejorando" y el morado "es tu mejor vuelta", que es lo que motiva en un entrenamiento por series.
- **Reutilizar el destello, la flecha y el anillo del reloj:** el corredor ya conoce esos avisos de la carrera contra la sombra, así que no tiene que aprender nada nuevo.
- **Sin backend:** el modo funciona sin conexión, algo útil en una pista de atletismo. Guardar las vueltas queda para la PS-78 si el equipo lo decide.

### Problemas encontrados

- En la primera versión, el número y el tiempo de cada vuelta iban en dos columnas pegadas. Se veían bien, pero un lector de pantalla leía "11:35,0" en lugar de "Vuelta 1, 1:35,0". La prueba lo detectó y se añadieron textos ocultos para separarlos.
- La PS-78 (lógica del modo) está asignada a otro compañero y no estaba hecha. Para no bloquear la pantalla, la lógica se hizo en el frontend y se dejó escrito en `CLAUDE.md`, así no se repite el problema de dos archivos con el mismo nombre que rompió `main` en las PS-48/54.
