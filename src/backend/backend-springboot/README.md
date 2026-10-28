# Backend Spring Boot — Ruta Fantasma

API REST de Ruta Fantasma con **Spring Boot 3.5 + MySQL**.

## Requisitos

- Java 17 o superior y Maven (o IntelliJ IDEA, que trae los dos).
- MySQL 8 en `localhost:3306`. La base de datos `ruta_fantasma` y las tablas se crean solas al arrancar.
- Si el usuario `root` de MySQL tiene contraseña, defínela antes de arrancar (PowerShell): `$env:MYSQL_PASSWORD="tu_contraseña"`

## Arrancar y probar

```
mvn spring-boot:run
```

Pruebas automáticas (no necesitan MySQL, usan H2 en memoria):

```
mvn test
```

También se puede abrir esta carpeta con IntelliJ IDEA (Open → carpeta → se detecta como proyecto Maven).

## Estructura

```
backend-springboot/
├── pom.xml
├── base-de-datos/                  scripts SQL de las tablas (para MySQL Workbench / documentación)
└── src/
    ├── main/java/com/rutafantasma/backend/
    │   ├── RutaFantasmaApplication.java   punto de entrada
    │   ├── modelo/                         entidades JPA (una por tabla)
    │   ├── repositorio/                    acceso a las tablas (JpaRepository)
    │   ├── servicio/                       lógica (registro, login, token JWT…)
    │   ├── controlador/                    endpoints REST (/api/...)
    │   ├── dto/                            JSON que entra y sale de la API, con validaciones
    │   ├── excepcion/                      errores → respuestas HTTP con mensaje en español
    │   └── config/                         CORS y cifrador de contraseñas (BCrypt)
    ├── main/resources/application.properties   conexión a MySQL (contraseñas solo en variables de entorno)
    └── test/                               pruebas (H2 en memoria)
```

## Endpoints

| Método | Ruta | Token | Tarea |
|---|---|---|---|
| POST | `/api/auth/registro` → `201 { token, usuario }` | No | PS-19 |
| POST | `/api/auth/login` → `200 { token, usuario }` | No | PS-19 |

Errores: `400 { campo: mensaje }` en validaciones, `401 { error }` login incorrecto, `409 { error }` email repetido.
El token es un JWT; la clave se define con la variable `JWT_SECRETO` (mínimo 32 caracteres).

## Tablas

| Tabla | Tarea | Qué guarda |
|---|---|---|
| `usuario` | PS-18 | Corredores registrados (email único, contraseña como hash BCrypt) |
