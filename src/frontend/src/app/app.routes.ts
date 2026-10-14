import { Routes } from '@angular/router';

/**
 * Rutas principales de Ruta Fantasma.
 *
 * La aplicación se divide en tres zonas independientes. Cada una se carga
 * de forma diferida (lazy loading), así el navegador solo descarga el código
 * de la zona que se está usando:
 *  - /reloj → pantalla del reloj que simula la carrera contra la sombra.
 *  - /app   → aplicación del móvil (historial de rutas, marcas, ajustes).
 *  - /web   → web pública de presentación del producto.
 */
export const routes: Routes = [
  {
    path: 'reloj',
    loadChildren: () => import('./zonas/reloj/reloj.routes').then((m) => m.RELOJ_ROUTES),
  },
  {
    path: 'app',
    loadChildren: () => import('./zonas/app/app.routes').then((m) => m.APP_ROUTES),
  },
  {
    path: 'web',
    loadChildren: () => import('./zonas/web/web.routes').then((m) => m.WEB_ROUTES),
  },
  // La raíz y cualquier ruta desconocida llevan a la web pública
  { path: '', redirectTo: 'web', pathMatch: 'full' },
  { path: '**', redirectTo: 'web' },
];
