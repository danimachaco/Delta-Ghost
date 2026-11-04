import { Routes } from '@angular/router';
import { authGuard } from '../../core/guardias/auth-guard';
import { ElegirRuta } from './elegir-ruta/elegir-ruta';
import { RelojInicio } from './reloj-inicio/reloj-inicio';

/** Rutas de la zona /reloj. Las nuevas pantallas del reloj se añaden aquí. */
export const RELOJ_ROUTES: Routes = [
  { path: '', component: RelojInicio, title: 'Ruta Fantasma · Reloj' },
  // Elegir ruta necesita sesión: las rutas y su sombra son de la cuenta del usuario (la API pide token)
  {
    path: 'elegir',
    component: ElegirRuta,
    canActivate: [authGuard],
    title: 'Ruta Fantasma · Elige ruta',
  },
];
