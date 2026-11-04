import { PuntoGps } from './punto-gps';

/**
 * Carrera grabada: es el subconjunto de RutaResponse del backend que necesita
 * el simulador (id y fecha, si vienen en el JSON, se ignoran).
 */
export interface CarreraGrabada {
  nombre: string;
  puntos: PuntoGps[];
}
