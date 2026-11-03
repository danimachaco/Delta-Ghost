import { Routes } from '@angular/router';
import { authGuard } from '../../core/guardias/auth-guard';
import { AppInicio } from './app-inicio/app-inicio';
import { GrabarRuta } from './grabar/grabar-ruta';
import { ListaRutas } from './lista-rutas/lista-rutas';
import { Login } from './login/login';
import { Registro } from './registro/registro';
import { GpsPantalla } from './gps/gps-pantalla';

/** Rutas de la zona /app. Las nuevas pantallas de la app móvil se añaden aquí. */
export const APP_ROUTES: Routes = [
  { path: 'login', component: Login, title: 'Ruta Fantasma · Iniciar sesión' },
  { path: 'registro', component: Registro, title: 'Ruta Fantasma · Crear cuenta' },
  {
    // AppInicio es el marco (cabecera + menú); las pantallas van como hijas
    path: '',
    component: AppInicio,
    children: [{ path: '', component: ListaRutas, title: 'Ruta Fantasma · Mis rutas' }],
  },
  { path: 'gps', component: GpsPantalla, title: 'Ruta Fantasma · GPS' },
  // Grabar necesita sesión: la ruta se guarda en la cuenta del usuario (POST /api/rutas pide token)
  {
    path: 'grabar',
    component: GrabarRuta,
    canActivate: [authGuard],
    title: 'Ruta Fantasma · Grabar ruta',
  },
];
