## PS-57 · Pantalla de amigos

**Autor:** Adam · **Fecha:** 06/11/2026 · **Issue:** PS-57

### Qué se ha hecho

Se ha creado la pantalla de amigos de la app móvil (`/app/amigos`), con un enlace "Amigos" en el menú inferior. Desde ella el corredor puede:

- Enviar una solicitud de amistad escribiendo el email de otro corredor.
- Aceptar las solicitudes que ha recibido.
- Ver su lista de amigos y las solicitudes que ha enviado y siguen pendientes.

Usa la API de amigos del backend (PS-56).

### Cómo se ha hecho

- **Modelos y servicio en `core/`.** `core/modelos/amigo.ts` define `Amistad` y `Solicitudes`, con los mismos campos que los DTO del backend. El servicio `Amigos` (`core/servicios/amigos.ts`) tiene `listar()`, `solicitudes()`, `enviar(email)` y `aceptar(id)`, y llama al backend siempre a través del servicio `Api`, como el resto de la app.
- **Componente `AmigosPantalla`** (`zonas/app/amigos/`), hijo del marco `AppInicio` para compartir la cabecera y el menú. La ruta lleva `authGuard`: sin sesión te manda al login y después te devuelve a la pantalla.
- **Carga:** pide amigos y solicitudes a la vez con `forkJoin`. Mientras tanto se ven tarjetas "esqueleto"; si falla, aparece el error con un botón "Reintentar", igual que en la lista de rutas.
- **Añadir amigo:** formulario reactivo con validación de email. Si la respuesta llega como `PENDIENTE`, la solicitud se añade a "Solicitudes enviadas". Si llega como `ACEPTADA` (esa persona ya te había invitado), pasa directamente a "Mis amigos". Los errores del servidor ("Ya sois amigos", "No hay ningún corredor registrado con ese email"…) se muestran tal cual, porque ya vienen en español gracias al `erroresInterceptor`.
- **Aceptar:** el botón se desactiva mientras se espera la respuesta, para evitar dobles pulsaciones. Al aceptar, la solicitud desaparece de "Recibidas" y el amigo aparece el primero de la lista, sin volver a pedir todo al servidor.
- **Diseño:** mismas tarjetas, colores y bordes que la lista de rutas. Las solicitudes recibidas tienen el borde morado porque esperan una respuesta, y cada amigo lleva un círculo con su inicial.
- **Accesibilidad:**
  - El campo de email tiene etiqueta y avisa del error con `aria-invalid` y `aria-describedby`.
  - Cada botón "Aceptar" dice a quién acepta (`aria-label="Aceptar a Eva"`).
  - Los mensajes de confirmación usan `role="status"` y los de error `role="alert"`, para que los lean los lectores de pantalla.
  - Los botones muestran el foco al usar el teclado.
  - La animación de carga se desactiva con `prefers-reduced-motion`.
- **Pruebas** con Vitest (13 nuevas, 245 en total): las 4 llamadas del servicio y, en la pantalla, la carga, la lista, la lista vacía, aceptar, enviar, la aceptación directa, el email no válido, el error del servidor y reintentar.

### Por qué

- **Actualizar las listas en el momento** con la respuesta del servidor, en lugar de recargarlo todo, hace que la pantalla responda al instante, algo importante en el móvil mientras se está fuera corriendo.
- **Primero las solicitudes recibidas:** son lo único que pide una acción al corredor, así que van arriba y solo se muestran si hay alguna.

### Problemas encontrados

- La cabecera del marco `AppInicio` muestra siempre el título "Mis rutas", también en esta pantalla. Es un componente de otro compañero y no se ha cambiado; queda propuesto que el título salga del `title` de cada ruta.
- La pantalla no se ha probado a mano contra el backend publicado, porque la API de amigos (PS-56) aún no está desplegada en Render. Se ha comprobado con las pruebas automáticas y con `ng build`.
