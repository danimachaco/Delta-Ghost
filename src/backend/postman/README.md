# Colección de Postman — Ruta Fantasma API (PS-25)

`Ruta-Fantasma-API.postman_collection.json` es una colección de Postman (formato v2.1) con 11 peticiones
y sus pruebas automáticas, para probar toda la API del backend (`../backend-springboot`).

## Peticiones

| # | Carpeta | Petición | Resultado esperado |
|---|---|---|---|
| 1 | Autenticación | `POST /api/auth/registro` | 201, guarda `{{token}}` |
| 2 | Autenticación | Registro con email repetido | 409 |
| 3 | Autenticación | Registro con datos incorrectos | 400 con un error por campo |
| 4 | Autenticación | `POST /api/auth/login` | 200, guarda `{{token}}` |
| 5 | Autenticación | Login con contraseña incorrecta | 401 |
| 6 | Rutas | `POST /api/rutas` (7 puntos) | 201, 3 sectores, guarda `{{rutaId}}` |
| 7 | Rutas | `GET /api/rutas` | 200, incluye la ruta creada |
| 8 | Rutas | `GET /api/rutas/{{rutaId}}` | 200 |
| 9 | Rutas | Crear ruta con datos incorrectos | 400 |
| 10 | Rutas | Ver ruta que no existe | 404 |
| 11 | Rutas | Listar rutas sin token | 401 |

## Cómo usarla

1. Arranca MySQL y el backend (`mvn spring-boot:run` en `src/backend/backend-springboot`).
2. En Postman: **Import** → arrastra `Ruta-Fantasma-API.postman_collection.json`.
3. Clic derecho en la colección → **Run collection** → **Run Ruta Fantasma API**. Deben salir todas las pruebas en verde.
4. Para lanzar peticiones sueltas, hazlo en orden (primero la 1 o la 4, que guardan el token).

Variables de la colección (pestaña *Variables*): `baseUrl` (por defecto `http://localhost:8080`), `email`, `password`,
`token` y `rutaId`. No hace falta tocarlas: el registro genera un email nuevo cada vez, así que la colección se puede
ejecutar todas las veces que quieras. Son datos de prueba: no pongas aquí contraseñas reales.

Desde la terminal también se puede ejecutar con Newman: `npx newman run Ruta-Fantasma-API.postman_collection.json`
