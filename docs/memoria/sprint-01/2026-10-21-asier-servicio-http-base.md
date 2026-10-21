## PS-21 · Servicio HTTP base de Angular

**Autor:** Asier García · **Fecha:** 21/10/2026 · **Issue:** PS-21

### Qué se ha hecho

Se ha creado la capa que comunica el frontend con el backend: un servicio HTTP base (`Api`) que usarán todos los demás servicios, un interceptor que traduce los errores del servidor a mensajes en español y la configuración de la dirección de la API por entornos.

### Cómo se ha hecho

- **Entornos.** Con `ng generate environments` se crearon `src/environments/environment.ts` (producción) y `environment.development.ts` (desarrollo). Ambos guardan `apiUrl`, que de momento apunta al backend Spring Boot local (`http://localhost:8080/api`). Angular sustituye un archivo por otro automáticamente según el tipo de compilación.
- **Servicio `Api`** (`core/servicios/api.ts`). Envuelve el `HttpClient` de Angular con cuatro métodos genéricos (`get`, `post`, `put` y `delete`). Recibe solo la ruta relativa (por ejemplo `'rutas'`) y construye la URL completa. Se usa el nuevo decorador `@Service()` de Angular 22, que registra el servicio automáticamente en la inyección de dependencias.
- **Interceptor de errores** (`core/interceptores/errores-interceptor.ts`). Es un interceptor funcional que se ejecuta en todas las peticiones. Cuando una falla, convierte el `HttpErrorResponse` en un objeto `ErrorApi` (`core/modelos/error-api.ts`) con el código, un mensaje en español y, si los hay, los errores de validación por campo. Está adaptado a las respuestas reales del backend de Adam: `{ error: '...' }` en los errores generales y `{ campo: 'mensaje' }` en las validaciones (400).
- **Registro.** En `app.config.ts` se añadió `provideHttpClient(withFetch(), withInterceptors([erroresInterceptor]))`.
- **Pruebas.** Con `HttpTestingController` se simulan las respuestas del servidor sin necesidad de tener el backend arrancado. Se comprueba que se construyen bien las URL y los parámetros, que cada método usa el verbo HTTP correcto y que los errores 0 (sin conexión), 400, 404 y 500 se traducen correctamente. Se añadieron 6 pruebas y todas pasan.

### Por qué

- **Un único punto de acceso al backend:** si cambia la dirección del servidor, se cambia en un solo archivo, y ningún componente necesita conocer `HttpClient`.
- **Errores centralizados:** las pantallas solo tienen que mostrar `error.mensaje`, sin repetir en cada una la lógica para interpretar los códigos HTTP. El usuario recibe siempre mensajes comprensibles en español.
- **`withFetch()`:** hace que Angular use la API `fetch` del navegador, que es la opción recomendada actualmente.

### Problemas encontrados

- Angular 22 genera los servicios con el decorador `@Service()` en lugar del clásico `@Injectable({ providedIn: 'root' })`. Se consultó su definición para confirmar que el servicio se registra automáticamente en toda la aplicación.
- El backend no puede arrancarse en este equipo porque no tiene Java ni MongoDB. Por eso las pruebas simulan el servidor con `HttpTestingController`.
