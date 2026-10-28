## PS-18 · Entidad y tabla usuario en MySQL

**Autor:** Adam (integrado en el repositorio por Asier García) · **Fecha:** 21/10/2026 · **Issue:** PS-18

### Qué se ha hecho

Se ha creado un backend en Spring Boot conectado a MySQL y, dentro de él, la entidad `Usuario`, que Hibernate convierte en la tabla `usuario`. Esta tabla guarda a los corredores de la aplicación y es la base para el registro y el inicio de sesión (PS-19).

### Cómo se ha hecho

- **Proyecto Spring Boot 3.5 con Java 17**, con las dependencias `spring-boot-starter-data-jpa` (JPA/Hibernate) y `mysql-connector-j` (driver de MySQL).
- **Conexión** en `application.properties`. La URL, el usuario y la contraseña se leen de las variables `MYSQL_URL`, `MYSQL_USER` y `MYSQL_PASSWORD`; si no existen se usan valores de desarrollo (`localhost:3306`, `root`, sin contraseña). La opción `createDatabaseIfNotExist=true` crea la base de datos `ruta_fantasma` si no existe.
- **Entidad `Usuario`** (`modelo/Usuario.java`) con las anotaciones de JPA:
  - `@Entity` y `@Table(name = "usuario")` para indicar la tabla.
  - `@Id` y `@GeneratedValue(strategy = IDENTITY)` para que el `id` sea autoincremental en MySQL.
  - `@Column(unique = true)` en el email, para que no se repita.
  - Un método `@PrePersist` que rellena `fecha_registro` automáticamente al insertar.
- **Repositorio `UsuarioRepository`**, que hereda de `JpaRepository` y añade `findByEmailIgnoreCase` y `existsByEmailIgnoreCase`. Spring genera el SQL a partir del nombre del método.
- **Creación de la tabla:** con `spring.jpa.hibernate.ddl-auto=update` Hibernate crea la tabla al arrancar. Además se incluye el script `01-usuario.sql` para crearla a mano y como documentación.
- **Pruebas** con `@DataJpaTest` sobre una base de datos H2 en memoria en modo MySQL: se comprueba que se genera el `id` y la fecha, que la búsqueda por email no distingue mayúsculas y que no se pueden guardar dos usuarios con el mismo email. Pasan las 3.

### Por qué

- **MySQL y JPA:** son las tecnologías vistas en clase para bases de datos relacionales; con JPA se trabaja con objetos Java y no hace falta escribir SQL a mano para lo básico.
- **Guardar `password_hash` y no la contraseña:** si alguien accediera a la base de datos no podría leer las contraseñas. El cifrado (BCrypt) se añade en la tarea PS-19.
- **Email único:** el email es el dato con el que se inicia sesión, así que no puede haber dos cuentas con el mismo.
- **Credenciales en variables de entorno:** así la contraseña de MySQL nunca se sube al repositorio.
- **Pruebas con H2:** permiten comprobar la tabla sin tener MySQL instalado.

### Problemas encontrados

- Para poder probar sin MySQL se añadió H2 solo en el ámbito de pruebas (`scope test`), con su propio `application.properties` en `src/test/resources`.
- Esta tarea se subió primero como una carpeta aparte (`src/backend/PS-18-entidad-tabla-usuario/`) con un segundo proyecto Spring Boot, y se retiró. Para que exista un único backend, el código se integró en el proyecto `src/backend/backend-springboot/`, que pasa de MongoDB a MySQL. Se eliminaron el código anterior con MongoDB y el esqueleto de Node/Express, y se actualizó el stack en `CLAUDE.md`.
