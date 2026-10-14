import { Routes } from '@angular/router';
import { RelojInicio } from './reloj-inicio/reloj-inicio';

/** Rutas de la zona /reloj. Las nuevas pantallas del reloj se añaden aquí. */
export const RELOJ_ROUTES: Routes = [
  { path: '', component: RelojInicio, title: 'Ruta Fantasma · Reloj' },
];
