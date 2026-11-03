# Despliegue: la app funcionando en Internet

La aplicación tiene tres piezas y cada una se publica en un servicio gratuito distinto:

| Pieza | Dónde se publica | Dirección |
|---|---|---|
| **Web** (Angular, `src/frontend`) | Vercel | `https://<proyecto>.vercel.app` |
| **API** (Spring Boot, `src/backend/backend-springboot`) | Render | `https://ruta-fantasma-api.onrender.com` |
| **Base de datos** (MySQL) | Aiven | la da Aiven al crearla |

```
Navegador ──▶ Vercel (web) ──llama a──▶ Render (API) ──▶ Aiven (MySQL)
```

Hasta que la API y la base de datos no están publicadas, la web de Vercel **no puede registrar ni iniciar sesión**:
intentaría llamar a `localhost:8080` del ordenador de quien la abre.

## 1. Base de datos MySQL en Aiven (gratis, sin tarjeta)

1. Entra en <https://console.aiven.io/signup> y crea una cuenta (se puede con GitHub o Google).
2. **Create service** → **MySQL** → plan **Free** → región de Europa → **Create service**.
3. Espera a que el estado sea **Running** (unos minutos).
4. En la pestaña **Overview** → **Connection information** copia: **Host**, **Port**, **User** (`avnadmin`) y **Password**.

Con esos datos, la URL para Render es (cambia `HOST` y `PUERTO`):

```
jdbc:mysql://HOST:PUERTO/ruta_fantasma?createDatabaseIfNotExist=true&sslMode=REQUIRED&serverTimezone=Europe/Madrid
```

> La contraseña **nunca** se sube al repositorio: solo se pega en Render.

## 2. API en Render (gratis, sin tarjeta)

1. Entra en <https://dashboard.render.com/register> y crea la cuenta **con GitHub**.
   Dale acceso al repositorio `danimachaco/Delta-Ghost` (si el repositorio es de Daniel, puede hacerlo él o darte permiso).
2. **New** → **Blueprint** → elige el repositorio. Render lee el archivo [`render.yaml`](../render.yaml) y
   prepara el servicio `ruta-fantasma-api` con Docker.
3. Te pedirá tres valores (los del paso 1):
   - `MYSQL_URL` → la URL de arriba
   - `MYSQL_USER` → `avnadmin`
   - `MYSQL_PASSWORD` → la contraseña de Aiven
4. **Apply**. La primera vez tarda unos 5–10 minutos (descarga Maven y compila).
5. Comprueba que funciona abriendo <https://ruta-fantasma-api.onrender.com/api/salud> → debe salir `{"estado":"ok"}`.

`JWT_SECRETO` la genera Render sola y `CORS_ORIGENES` ya viene puesta para Vercel: no hay que tocarlas.

> Si Render no te deja usar el nombre `ruta-fantasma-api` (ya está cogido) y te da otra dirección,
> cámbiala en `src/frontend/src/environments/environment.ts` y sube el cambio.

## 3. Web en Vercel

El proyecto de Vercel ya existe (lo creó Daniel). Hay que comprobar en **Settings → General**:

- **Root Directory**: `src/frontend`
- **Framework Preset**: Angular (Vercel lo detecta solo)

Al fusionar en `main`, Vercel vuelve a publicar la web con la dirección de la API de Render
(`src/frontend/src/environments/environment.ts`). El archivo [`src/frontend/vercel.json`](../src/frontend/vercel.json)
hace que al recargar páginas como `/app/login` no salga un 404.

## Cosas a tener en cuenta

- **El plan gratis de Render duerme** la API tras 15 minutos sin uso. La primera petición después tarda
  hasta un minuto (la web se queda esperando). Antes de una demo, abre `/api/salud` para despertarla.
- **CORS:** `render.yaml` permite cualquier web `https://*.vercel.app`. Cuando sepáis la dirección exacta de
  la web, se puede dejar solo esa en `CORS_ORIGENES` (Render → servicio → Environment).
- **En local todo sigue igual:** MySQL + `mvn spring-boot:run` + `npm start` y abrir `http://localhost:4200`
  (ver el README del backend).
