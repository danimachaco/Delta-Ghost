# Backend — API REST de Ruta Fantasma

Spring Boot + MySQL. El proyecto está en [`backend-springboot/`](backend-springboot/README.md):
ahí se explica cómo arrancarlo, cómo pasar las pruebas y cómo está organizado.

```
src/backend/
├── .env.example          variables de entorno de ejemplo (el .env real NUNCA se sube)
└── backend-springboot/   proyecto Spring Boot (Maven)
```

Flujo de una petición: `controlador/` → `servicio/` → `repositorio/` → `modelo/` (MySQL).
