import { Routes } from '@angular/router';
import { AppInicio } from './app-inicio/app-inicio';
import { Login } from './login/login';
import { Registro } from './registro/registro';

/** Rutas de la zona /app. Las nuevas pantallas de la app móvil se añaden aquí. */
export const APP_ROUTES: Routes = [
  { path: 'login', component: Login, title: 'Ruta Fantasma · Iniciar sesión' },
  { path: 'registro', component: Registro, title: 'Ruta Fantasma · Crear cuenta' },
  { path: '', component: AppInicio, title: 'Ruta Fantasma · App' },
];
