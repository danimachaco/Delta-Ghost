# Backend Spring Boot — Ruta Fantasma (desarrollador1)

Requisitos: Java 17, Maven y MongoDB en `localhost:27017`.

```
mvn spring-boot:run
```

API: `GET/POST /api/rutas`, `GET/PUT/DELETE /api/rutas/{id}`

Ejemplo:
```
curl -X POST localhost:8080/api/rutas -H "Content-Type: application/json" \
  -d '{"nombre":"Parque","puntos":[{"latitud":40.41,"longitud":-3.70,"tiempoSegundos":0}]}'
```
