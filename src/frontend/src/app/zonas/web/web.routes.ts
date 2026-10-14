import { Routes } from '@angular/router';
import { WebInicio } from './web-inicio/web-inicio';

/** Rutas de la zona /web. Las nuevas páginas de la web pública se añaden aquí. */
export const WEB_ROUTES: Routes = [
  { path: '', component: WebInicio, title: 'Ruta Fantasma' },
];
