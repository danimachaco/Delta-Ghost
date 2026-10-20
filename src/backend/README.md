# Backend — API REST de Ruta Fantasma

Node.js + Express + MongoDB. Aún sin inicializar (`npm init` pendiente).

## Estructura

```
src/backend/
├── .env.example        variables de entorno de ejemplo (copiar a .env)
├── src/
│   ├── config/         conexión a MongoDB y lectura de variables de entorno
│   ├── modelos/        esquemas de datos (Ruta, PuntoGps, Carrera…)
│   ├── api/            definición de endpoints Express (/api/rutas, /api/carreras…)
│   ├── controladores/  reciben la petición, llaman al servicio y responden
│   ├── servicios/      lógica de negocio (comparar con la sombra, calcular sectores)
│   ├── middlewares/    validaciones, gestión de errores, CORS…
│   └── utilidades/     funciones auxiliares (distancias GPS, formato de tiempos)
└── tests/              pruebas del backend
```

Flujo de una petición: `api/` → `controladores/` → `servicios/` → `modelos/` (MongoDB).
