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
    │   └── repositorio/                    acceso a las tablas (JpaRepository)
    ├── main/resources/application.properties   conexión a MySQL (contraseñas solo en variables de entorno)
    └── test/                               pruebas (H2 en memoria)
```

## Tablas

| Tabla | Tarea | Qué guarda |
|---|---|---|
| `usuario` | PS-18 | Corredores registrados (email único, contraseña como hash BCrypt) |
