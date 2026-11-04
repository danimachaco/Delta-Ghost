# Despliegue: la app funcionando en Internet

La aplicación tiene tres piezas y cada una se publica en un servicio gratuito distinto:

| Pieza | Dónde se publica | Dirección |
|---|---|---|
| **Web** (Angular, `src/frontend`) | Vercel | `https://<proyecto>.vercel.app` |
| **API** (Spring Boot, `src/backend/backend-springboot`) | Render | `https://ruta-fantasma-api.onrender.com` |
| **Base de datos** (compatible con MySQL) | TiDB Cloud Starter | `gateway01.eu-central-1.prod.aws.tidbcloud.com:4000` |

```
Navegador ──▶ Vercel (web) ──llama a──▶ Render (API) ──▶ TiDB Cloud (MySQL)
```

Hasta que la API y la base de datos no están publicadas, la web de Vercel **no puede registrar ni iniciar sesión**:
intentaría llamar a `localhost:8080` del ordenador de quien la abre.

## 1. Base de datos en TiDB Cloud (gratis, sin tarjeta) ✅ ya creada

TiDB Cloud es compatible con MySQL: el backend se conecta con el mismo driver y las mismas tablas.
**Ya está creada** la instancia `ruta-fantasma` (plan **Starter**, AWS Fráncfort, límite de gasto 0 $):

| Dato | Valor |
|---|---|
| Host | `gateway01.eu-central-1.prod.aws.tidbcloud.com` |
| Puerto | `4000` |
| Usuario | `24NEj247Vt93Mwa.root` |
| Contraseña | la genera quien administra la cuenta: TiDB Cloud → `ruta-fantasma` → **Connect** → **Generate Password** (se muestra una sola vez: cópiala directamente en Render) |

URL para Render (`MYSQL_URL`). TiDB exige conexión cifrada, por eso lleva `sslMode=VERIFY_IDENTITY`:

```
jdbc:mysql://gateway01.eu-central-1.prod.aws.tidbcloud.com:4000/ruta_fantasma?createDatabaseIfNotExist=true&sslMode=VERIFY_IDENTITY&enabledTLSProtocols=TLSv1.2,TLSv1.3&serverTimezone=Europe/Madrid
```

En **Networking** la regla `Allow_all_public_connections` deja conectar desde cualquier IP (Render cambia de IP);
la base de datos queda protegida por el usuario y la contraseña.

> La contraseña **nunca** se sube al repositorio: solo se pega en Render.

<details><summary>Alternativa: MySQL en Aiven</summary>

Aiven también tiene MySQL gratis (<https://console.aiven.io/signup>). Su URL sería
`jdbc:mysql://HOST:PUERTO/ruta_fantasma?createDatabaseIfNotExist=true&sslMode=REQUIRED&serverTimezone=Europe/Madrid`
con el usuario `avnadmin`.
</details>

## 2. API en Render (gratis, sin tarjeta)

1. Entra en <https://dashboard.render.com/register> y crea la cuenta **con GitHub**.
   Dale acceso al repositorio `danimachaco/Delta-Ghost` (si el repositorio es de Daniel, puede hacerlo él o darte permiso).
2. **New** → **Blueprint** → elige el repositorio. Render lee el archivo [`render.yaml`](../render.yaml) y
   prepara el servicio `ruta-fantasma-api` con Docker.
3. Te pedirá tres valores (los del paso 1):
   - `MYSQL_URL` → la URL de arriba
   - `MYSQL_USER` → `24NEj247Vt93Mwa.root`
   - `MYSQL_PASSWORD` → la contraseña generada en TiDB Cloud
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
