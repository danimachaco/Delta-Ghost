import { Routes } from '@angular/router';
import { authGuard } from '../../core/guardias/auth-guard';
import { ElegirRuta } from './elegir-ruta/elegir-ruta';
import { ElegirSombra } from './elegir-sombra/elegir-sombra';
import { FinCarrera } from './fin-carrera/fin-carrera';
import { RelojInicio } from './reloj-inicio/reloj-inicio';
import { SimuladorPanel } from './simulador/simulador-panel';
import { VueltaRapidaPantalla } from './vuelta-rapida/vuelta-rapida';

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
  // PS-71: pantalla previa a la carrera para elegir contra qué sombra correr (?ruta=ID)
  {
    path: 'sombra',
    component: ElegirSombra,
    canActivate: [authGuard],
    title: 'Ruta Fantasma · Elige sombra',
  },
  // PS-62: resultado final en el reloj al acabar la carrera
  { path: 'fin', component: FinCarrera, title: 'Ruta Fantasma · Fin de carrera' },
  // PS-79: modo vuelta rápida para correr en pista (cada vuelta es un sector). No usa rutas
  // guardadas ni el backend, así que no necesita sesión
  { path: 'vueltas', component: VueltaRapidaPantalla, title: 'Ruta Fantasma · Vuelta rápida' },
  { path: 'simulador', component: SimuladorPanel, title: 'Ruta Fantasma · Simulador' },
];
