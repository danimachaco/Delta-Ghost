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

## Probar la app completa en local (registro e inicio de sesión)

1. Arranca **MySQL** y después este backend (`mvn spring-boot:run`). Espera a ver `Started RutaFantasmaApplication`.
2. En otra terminal, en `src/frontend`: `npm start`.
3. Abre **http://localhost:4200**. El frontend llama a `/api/...` en su propia dirección y `ng serve`
   la reenvía al backend (`src/frontend/proxy.conf.json`), así que no hay problemas de CORS.

## Problemas frecuentes

| Lo que pasa | Causa | Solución |
|---|---|---|
| Al registrarse o entrar sale **"No se puede conectar con el servidor"** | El backend no está arrancado, o no arrancó por un error | Mira la consola del backend: tiene que poner `Started RutaFantasmaApplication` |
| El backend no arranca: `Communications link failure` / `Connection refused` | MySQL no está encendido | Arranca el servicio de MySQL (Windows: Servicios → MySQL80 → Iniciar) |
| El backend no arranca: `Access denied for user 'root'` | La contraseña de MySQL no coincide | Define `MYSQL_PASSWORD` antes de arrancar (ver Requisitos) |
| El backend no arranca: `Unable to establish loopback connection` | Fallo de Java 25 en Windows cuando la carpeta temporal tiene una ruta corta (`C:\Users\USUARI~1\...`) | Usa **Java 17 o 21** en IntelliJ (File → Project Structure → SDK), o añade en *VM options*: `-Djdk.net.unixdomain.tmpdir=C:\tmp` (crea antes la carpeta) |
| En el navegador sale un error de **CORS** | La web se abrió desde una dirección no permitida | Por defecto se permite `localhost` en cualquier puerto. Para otras direcciones, define `CORS_ORIGENES` (ver `.env.example`) |
| La web publicada en Vercel no deja registrarse | El backend no está publicado en Internet: la web de Vercel intenta llamar a `localhost:8080` del ordenador de quien la abre | Para la demo, usad la app en local. Para que funcione en Vercel hay que publicar antes el backend y MySQL, y poner su dirección en `src/frontend/src/environments/environment.ts` y en `CORS_ORIGENES` |

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
    │   ├── config/                         CORS, cifrador BCrypt y qué rutas necesitan token
    │   └── seguridad/                      TokenInterceptor: comprueba el token JWT
    ├── main/resources/application.properties   conexión a MySQL (contraseñas solo en variables de entorno)
    └── test/                               pruebas (H2 en memoria)
```

## Endpoints

| Método | Ruta | Token | Tarea |
|---|---|---|---|
| POST | `/api/auth/registro` → `201 { token, usuario }` | No | PS-19 |
| POST | `/api/auth/login` → `200 { token, usuario }` | No | PS-19 |
| POST | `/api/rutas` → `201` ruta creada (se divide en 3 sectores si no se indica `numeroSectores`) | Sí | PS-24 |
| GET | `/api/rutas` → `200` rutas del usuario, la más nueva primero | Sí | PS-24 |
| GET | `/api/rutas/{id}` → `200` la ruta (`404` si no existe o es de otro usuario) | Sí | PS-24 |
| POST | `/api/rutas/{id}/carreras` → `201` carrera guardada con sus puntos y `mejorMarca` (`404` si la ruta no es tuya) | Sí | PS-33 |
| GET | `/api/rutas/{id}/sombra` → `200` puntos de la mejor marca y tiempo de la sombra en cada sector (`404` si la ruta no es tuya) | Sí | PS-36 |

Los endpoints con token necesitan la cabecera `Authorization: Bearer <token>` (la comprueba `seguridad/TokenInterceptor`).
Errores: `400 { campo: mensaje }` en validaciones, `401 { error }` sin sesión o login incorrecto, `404 { error }`, `409 { error }` email repetido.
El token es un JWT; la clave se define con la variable `JWT_SECRETO` (mínimo 32 caracteres).

## Tablas

| Tabla | Tarea | Qué guarda |
|---|---|---|
| `usuario` | PS-18 | Corredores registrados (email único, contraseña como hash BCrypt) |
| `ruta` | PS-23 | Recorrido guardado por un usuario |
| `punto` | PS-23 | Puntos GPS de la ruta en orden, con el tiempo de la sombra en cada uno |
| `sector` | PS-23 | Tramos de la ruta (como en la F1), del punto `punto_inicio` al `punto_fin` |
| `carrera` | PS-23 | Cada vez que se corre una ruta; la más rápida es la sombra |
| `punto_carrera` | PS-33 | Puntos GPS grabados en cada carrera, con los tiempos de esa carrera |

Al borrar una ruta se borran sus puntos, sectores y carreras, y al borrar una carrera sus puntos (`ON DELETE CASCADE`).
Los scripts de `base-de-datos/` se ejecutan en orden: `01-usuario.sql`, `02-ruta-punto-sector-carrera.sql` y `03-punto-carrera.sql`.
