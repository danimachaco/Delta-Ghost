import { Routes } from '@angular/router';
import { authGuard } from '../../core/guardias/auth-guard';
import { AmigosPantalla } from './amigos/amigos';
import { AppInicio } from './app-inicio/app-inicio';
import { GrabarRuta } from './grabar/grabar-ruta';
import { ListaRutas } from './lista-rutas/lista-rutas';
import { Login } from './login/login';
import { RankingPantalla } from './ranking/ranking';
import { Registro } from './registro/registro';
import { GpsPantalla } from './gps/gps-pantalla';
import { Resumen } from './resumen/resumen/resumen';

/** Rutas de la zona /app. Las nuevas pantallas de la app móvil se añaden aquí. */
export const APP_ROUTES: Routes = [
  { path: 'login', component: Login, title: 'Ruta Fantasma · Iniciar sesión' },
  { path: 'registro', component: Registro, title: 'Ruta Fantasma · Crear cuenta' },
  {
    // AppInicio es el marco (cabecera + menú); las pantallas van como hijas
    path: '',
    component: AppInicio,
    children: [
      { path: '', component: ListaRutas, title: 'Ruta Fantasma · Mis rutas' },
      // Amigos necesita sesión: las solicitudes y la lista son de la cuenta del usuario (PS-57)
      {
        path: 'amigos',
        component: AmigosPantalla,
        canActivate: [authGuard],
        title: 'Ruta Fantasma · Amigos',
      },
      // Ranking de una ruta (PS-65): también necesita sesión, la API pide token
      {
        path: 'ranking/:rutaId',
        component: RankingPantalla,
        canActivate: [authGuard],
        title: 'Ruta Fantasma · Ranking',
      },
    ],
  },
  { path: 'gps', component: GpsPantalla, title: 'Ruta Fantasma · GPS' },
  // Grabar necesita sesión: la ruta se guarda en la cuenta del usuario (POST /api/rutas pide token)
  {
    path: 'grabar',
    component: GrabarRuta,
    canActivate: [authGuard],
    title: 'Ruta Fantasma · Grabar ruta',
  },
  { path: 'resumen', component: Resumen, title: 'Ruta Fantasma · Resumen' },
];
