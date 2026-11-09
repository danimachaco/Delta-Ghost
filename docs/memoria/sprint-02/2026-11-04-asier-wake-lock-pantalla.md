## PS-46 · Activar Wake Lock para que no se apague la pantalla

**Autor:** Asier García · **Fecha:** 04/11/2026 · **Issue:** PS-46 (historia PS-42)

### Qué se ha hecho

Mientras se corre contra la sombra, la pantalla del móvil o del reloj ya no se apaga sola. Así el corredor puede mirar en cualquier momento el tiempo, la diferencia y los dos puntos sin tener que desbloquear el dispositivo. Al terminar la carrera, la pantalla vuelve a apagarse como siempre. Si el navegador no permite mantenerla encendida, el reloj lo avisa con un mensaje discreto.

### Cómo se ha hecho

- **Servicio `PantallaEncendida`** (`core/servicios/pantalla-encendida.ts`). Usa la **Screen Wake Lock API** del navegador, `navigator.wakeLock.request('screen')`:
  - `activar()` pide el bloqueo y `desactivar()` lo suelta.
  - El estado está en una *signal*: `apagado`, `activo` o `no-disponible`.
  - **Volver a la pestaña:** el navegador suelta el bloqueo él solo cuando la pestaña se oculta, por ejemplo al cambiar de app o al bloquear el móvil. Por eso, mientras la carrera siga, el servicio escucha `visibilitychange` y lo vuelve a pedir al volver.
  - **Sin soporte o petición rechazada** (el navegador no tiene la API, o la rechaza por batería baja o modo ahorro): no hay ningún error, el estado pasa a `no-disponible`.
  - Si se desactiva mientras el navegador todavía está respondiendo, el bloqueo que llega tarde se suelta enseguida.
- **Conexión con la carrera.** El servicio `Carrera` llama a `activar()` al empezar. Llama a `desactivar()` al terminar, al llegar a la meta y al descartar la carrera.
- **Aviso en el reloj.** Si se está corriendo y el estado es `no-disponible`, debajo de la esfera aparece: "Este navegador no puede mantener la pantalla encendida. Si se apaga, el tiempo sigue contando." Al terminar la carrera el aviso desaparece.
- **Pruebas.** Se añadieron 16 pruebas nuevas, y en total pasan 174:
  - 9 del servicio, con una API de Wake Lock falsa: pedir, no repetir la petición, soltar, volver a pedir al volver a la pestaña, no volver a pedir después de desactivar, navegador sin API, petición rechazada y desactivar a mitad de la petición;
  - 5 de la carrera (activar al empezar y desactivar al terminar, al llegar a la meta y al descartar);
  - 2 del aviso del reloj.

### Por qué

- **Wake Lock en lugar de trucos:** antes de esta API se reproducía un vídeo invisible en bucle para que la pantalla no se apagara. La API estándar es más limpia, gasta menos batería y el navegador la suelta solo cuando hace falta. Funciona en Chrome y Edge para Android y escritorio, y en Safari desde iOS 16.4.
- **Pedirla solo durante la carrera:** mantener la pantalla encendida gasta batería, así que se pide al pulsar Empezar y se suelta en cuanto la carrera termina.
- **No depende de que la pantalla siga encendida para medir el tiempo:** el cronómetro de la PS-38 calcula el tiempo con la hora real, así que si la pantalla se apaga igualmente, el tiempo no se pierde. Por eso el aviso solo informa y no bloquea la carrera.
- **Va en un servicio aparte de la carrera:** se puede probar solo y reutilizar en otras pantallas, como la de grabar una ruta.

### Problemas encontrados

- El navegador integrado de la herramienta de desarrollo rechaza el permiso de Wake Lock (`NotAllowedError`) aunque tiene la API. En la prueba en el navegador se vio que el reloj mostraba el aviso correctamente y que la carrera seguía funcionando. El caso en que el navegador sí concede el bloqueo se comprueba con las pruebas unitarias, porque necesita un móvil real.
- Al soltar el bloqueo, el navegador lanza el evento `release` también cuando lo pide la propia app. Para no marcar la pantalla como `no-disponible` al terminar la carrera, el servicio comprueba si todavía se quería tener la pantalla encendida.
