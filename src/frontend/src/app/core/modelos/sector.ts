import { PuntoGps } from './punto-gps';

export type ResultadoSector = 'mejor' | 'peor';

/** Tramo de la ruta (por defecto 500 m) comparado con la sombra. */
export interface Sector {
  numero: number;
  distanciaMetros: number;
  tiempoSegundos: number;
  tiempoSombraSegundos: number;
  /** Negativo = más rápido que la sombra */
  diferenciaSegundos: number;
  resultado: ResultadoSector;
  /** Puntos del tramo, con los extremos interpolados (los sectores conectan sin huecos) */
  puntos: PuntoGps[];
}
