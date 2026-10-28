## PS-19 · API de registro e inicio de sesión

**Autor:** Adam (integrado en el repositorio por Asier García) · **Fecha:** 21/10/2026 · **Issue:** PS-19

### Qué se ha hecho

Se han creado en el backend los endpoints `POST /api/auth/registro` y `POST /api/auth/login`. Al registrarse se guarda el usuario en la tabla `usuario` de MySQL (PS-18) con la contraseña cifrada, y en los dos casos la API devuelve un token JWT y los datos públicos del usuario. Sigue el contrato que ya usa el frontend Angular (PS-20).

### Cómo se ha hecho

- **Arquitectura por capas:** `AuthController` recibe la petición, `AuthService` contiene la lógica y `UsuarioRepository` accede a MySQL.
- **DTO con validaciones** (`RegistroRequest`, `LoginRequest`) usando Bean Validation: nombre obligatorio de hasta 40 caracteres, email con formato válido y contraseña de 6 a 72 caracteres. Con `@Valid`, Spring devuelve un `400` con un mensaje por campo.
- **Contraseñas con BCrypt** (`spring-security-crypto`). Solo se usa el cifrador, no todo Spring Security, para mantener el proyecto sencillo. En el login se compara con `matches()`, que no necesita descifrar nada.
- **Token JWT** con la librería JJWT (`TokenService`). El token lleva el id del usuario, el email y la fecha de caducidad (24 horas), y va firmado con una clave secreta que se lee de la variable `JWT_SECRETO`.
- **Emails normalizados** (sin espacios y en minúsculas), así `Ana@Correo.com` y `ana@correo.com` son la misma cuenta.
- **Errores** centralizados en `GlobalExceptionHandler`: `409 { error }` si el email ya existe, `401 { error }` si el login falla y `400 { campo: mensaje }` en las validaciones. Es el formato que traduce el interceptor de errores del frontend.
- **CORS** actualizado para permitir la cabecera `Authorization` desde `localhost:4200`.
- **Pruebas** con `@SpringBootTest` y `MockMvc` (6 nuevas, 9 en total): registro correcto (y que en la base de datos se guarda un hash BCrypt), email repetido, validaciones, login correcto, contraseña incorrecta y email inexistente.

### Por qué

- **JWT en lugar de sesiones en el servidor:** el servidor no tiene que recordar quién ha iniciado sesión; basta con comprobar la firma del token. Encaja con una API REST y con el frontend, que ya envía `Authorization: Bearer <token>`.
- **El mismo error para email inexistente y contraseña incorrecta:** así nadie puede averiguar qué emails están registrados probando en el login.
- **BCrypt:** es lento a propósito y añade una sal aleatoria, de modo que dos contraseñas iguales generan hashes distintos.
- **Clave secreta en variable de entorno:** no se sube ninguna clave real al repositorio.

### Problemas encontrados

- JJWT exige una clave de al menos 32 bytes para firmar con HS256. Se documentó en `application.properties` y se puso un valor de desarrollo suficientemente largo.
- Al integrar la tarea en el repositorio se añadieron las clases `EmailYaRegistradoException` y `CredencialesIncorrectasException`, con los mensajes que comprueban las pruebas.
