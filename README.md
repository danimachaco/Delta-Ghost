# Ruta Fantasma — Proyecto Scrum

Proyecto de Desarrollo de Interfaces (1º DAM).

## Guía rápida (léela una vez y ya)

### La primera vez (solo una vez por persona)

1. Clona el repositorio:
   ```
   git clone https://github.com/danimachaco/Delta-Ghost.git
   ```
2. Abre la carpeta `Delta-Ghost` con Claude Code (terminal, app de escritorio o web).

### Cada día que trabajes

1. Escribe **`/empezar PS-XX`** (con la clave de Jira de tu tarea) → Claude baja lo último de tus compañeros,
   te dice cómo va el proyecto y crea tu rama `PS-XX-descripcion`.
2. Trabajad juntos normalmente: todo se guarda en tu rama, nunca en `main`.
3. Cuando acabes, escribe **`/terminar`** → Claude escribe la parte de la memoria, hace los commits en tu rama,
   le añade lo último de `main`, la sube y te da el enlace de la **Pull Request**.
4. Pide a otro DT que revise tu PR. Él puede usar **`/revisar PS-XX`** y, si está bien, la aprueba y la fusiona
   en GitHub con **"Create a merge commit"**.

Cuando la PR se fusiona en `main`, el PDF de la memoria (`docs/memoria.pdf`) se actualiza solo en unos minutos.

### Reglas de oro

- **Nadie sube nada directamente a `main`**: todo entra por Pull Request aprobada por otro DT (lo exige el enunciado).
- Una rama por historia, con la clave de Jira en el nombre (`PS-20-login-registro`) y en cada commit (`PS-20: ...`).
- Empieza siempre con `/empezar` y acaba siempre con `/terminar`.
- Si Claude dice que hay un **conflicto**, no aceptes nada a ciegas: avisa al equipo.
- No edites `docs/memoria.pdf` a mano; se genera solo.
- Las tareas están en **Issues** y en el tablero de **Projects** de GitHub.

## Ver y probar la app

### Sin instalar nada

- **Vista previa de cada PR:** en cada Pull Request, el bot de Vercel deja un comentario con un enlace
  `https://delta-ghost-git-<rama>-delta-ghost.vercel.app`. Ahí está la app con los cambios de esa PR.
- **Web principal:** se actualiza sola cada vez que se fusiona una PR en `main`. La dirección está en Vercel
  (proyecto *delta-ghost* → **Domains**); pídesela a Daniel.

En las dos hay que **crear una cuenta** (Crear cuenta) la primera vez. Los datos se guardan en la base de datos
de la nube y los ve todo el equipo. Si la primera carga tarda hasta un minuto es normal: el backend gratis de
Render se "duerme" cuando nadie lo usa.

### En tu ordenador, con tus cambios (sin backend ni base de datos)

Si solo tocas pantallas (frontend), no necesitas arrancar Java ni MySQL: usa la API publicada en la nube.

```
cd src/frontend
npm install
npm run start:nube
```

Abre **http://localhost:4200**. Ves tus cambios al momento, con los mismos usuarios y rutas que la web publicada
(`proxy.nube.json` reenvía `/api` a `https://ruta-fantasma-api.onrender.com`). Ojo: lo que guardes también se
guarda en la nube, así que prueba con tu propia cuenta.

Si tocas el backend, sigue [el README del backend](src/backend/backend-springboot/README.md) y usa `npm start`.

## Dónde está cada cosa

| Qué | Dónde |
|---|---|
| Contexto común de los Claudes | `CLAUDE.md` |
| Código de la app (Angular) | `src/frontend/` |
| API y base de datos (Spring Boot + MySQL) | `src/backend/backend-springboot/` |
| Textos de la memoria | `docs/memoria/` |
| PDF final de la memoria | `docs/memoria.pdf` |
| Cómo publicar la app en Internet (Vercel + Render + TiDB Cloud) | `docs/despliegue.md` |
