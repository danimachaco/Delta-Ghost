import { PuntoGps } from './ruta';

/**
 * Sombra de una ruta: la mejor marca contra la que se corre.
 * Coincide con SombraResponse y SectorSombraDto del backend (GET /api/rutas/{id}/sombra, PS-36).
 */
export interface Sombra {
  rutaId: string;
  /** Carrera que es la mejor marca, o null si la sombra es todavía la grabación de la ruta */
  carreraId: string | null;
  /** Tiempo total de la sombra en segundos */
  tiempoTotalSegundos: number;
  /** Puntos que recorre la sombra, con los segundos en los que pasó por cada uno */
  puntos: PuntoGps[];
  /** Sectores de la ruta con el tiempo de la sombra al terminar cada uno */
  sectores: SectorSombra[];
}

/** Sector de la ruta en la respuesta de la sombra */
export interface SectorSombra {
  numero: number;
  /** Orden del punto de la ruta donde empieza */
  puntoInicio: number;
  /** Orden del punto de la ruta donde termina */
  puntoFin: number;
  /** Segundos desde la salida en los que la sombra llega al final del sector */
  tiempoSegundos: number;
}
