import { Routes } from '@angular/router';
import { AppInicio } from './app-inicio/app-inicio';
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
];
