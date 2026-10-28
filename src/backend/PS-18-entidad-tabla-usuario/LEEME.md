# PS-18 · Crear la entidad y la tabla usuario en MySQL

## Qué hay en esta carpeta

| Carpeta / archivo | Qué es |
|---|---|
| `backend-mysql/` | Proyecto Spring Boot completo en el estado en que queda al terminar esta tarea |
| `backend-mysql/src/main/java/com/rutafantasma/backend/modelo/Usuario.java` | **La entidad** `Usuario` (se convierte en la tabla `usuario`) |
| `backend-mysql/src/main/java/com/rutafantasma/backend/repositorio/UsuarioRepository.java` | Repositorio para leer y guardar usuarios |
| `backend-mysql/src/main/resources/application.properties` | Conexión con MySQL |
| `backend-mysql/src/test/.../UsuarioRepositoryTest.java` | 3 pruebas automáticas de la tabla |
| `base-de-datos/01-usuario.sql` | Script SQL de la tabla, por si se quiere crear a mano en MySQL Workbench |
| `memoria-PS-18.md` | Entrada de la memoria del proyecto, lista para copiar en `docs/memoria/sprint-01/` |

## Tabla `usuario`

| Columna | Tipo | Restricciones |
|---|---|---|
| `id` | BIGINT | Clave primaria, autoincremental |
| `nombre` | VARCHAR(40) | Obligatorio |
| `email` | VARCHAR(100) | Obligatorio, **único** |
| `password_hash` | VARCHAR(100) | Obligatorio (hash BCrypt, nunca la contraseña en claro) |
| `fecha_registro` | DATETIME | Se rellena sola al crear el usuario |

## Cómo arrancarlo

Requisitos: **Java 17** (o superior), **Maven** y **MySQL 8** en `localhost:3306`.

1. Arranca MySQL. La base de datos `ruta_fantasma` se crea sola (`createDatabaseIfNotExist=true`).
2. Si tu usuario `root` tiene contraseña, defínela antes de arrancar:
   - PowerShell: `$env:MYSQL_PASSWORD="tu_contraseña"`
3. Dentro de `backend-mysql/`: `mvn spring-boot:run`
4. En la consola verás el `create table usuario (...)` que lanza Hibernate.

Pruebas automáticas (no necesitan MySQL, usan H2 en memoria): `mvn test` → 3 pruebas correctas.

También se puede abrir `backend-mysql` directamente con IntelliJ IDEA (Open → carpeta → se detecta como proyecto Maven).
