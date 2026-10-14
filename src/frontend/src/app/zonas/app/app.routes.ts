import { Routes } from '@angular/router';
import { AppInicio } from './app-inicio/app-inicio';

/** Rutas de la zona /app. Las nuevas pantallas de la app móvil se añaden aquí. */
export const APP_ROUTES: Routes = [
  { path: '', component: AppInicio, title: 'Ruta Fantasma · App' },
];
