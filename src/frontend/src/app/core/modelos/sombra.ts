/**
 * Modelos de la sombra y los sectores. Coinciden con los DTO del backend
 * (SectorDto.java, SectorSombraDto.java y SombraResponse.java).
 */
import { PuntoGps } from './ruta';

/** Tramo de una ruta, como los sectores de un circuito de F1 */
export interface Sector {
  /** Número del sector: 1, 2, 3… */
  numero: number;
  /** Posición (índice) del punto de la ruta donde empieza */
  puntoInicio: number;
  /** Posición (índice) del punto de la ruta donde termina */
  puntoFin: number;
}

/** Sector con el tiempo en que la sombra lo termina */
export interface SectorSombra extends Sector {
  /** Segundos desde la salida en los que la sombra llega al final del sector */
  tiempoSegundos: number;
}

/**
 * Contra qué sombra se corre (PS-69):
 *  - `MEJOR`: tu mejor marca en la ruta (la de siempre, por defecto).
 *  - `ULTIMA`: tu última carrera en la ruta, aunque no sea la mejor.
 *  - `ORIGINAL`: la grabación con la que se creó la ruta.
 */
export type TipoSombra = 'MEJOR' | 'ULTIMA' | 'ORIGINAL';

/** Sombra de una ruta → GET /api/rutas/{id}/sombra?tipo=… */
export interface Sombra {
  rutaId: string;
  /**
   * Tipo de sombra que ha devuelto el servidor (PS-70). Un servidor anterior a la PS-70
   * no lo envía y devuelve siempre la mejor marca.
   */
  tipo?: TipoSombra;
  /** Carrera que es la mejor marca, o null si la sombra es la propia grabación de la ruta */
  carreraId: string | null;
  tiempoTotalSegundos: number;
  /** Puntos que recorre la sombra, con sus tiempos */
  puntos: PuntoGps[];
  sectores: SectorSombra[];
}

/** Color del aviso al terminar un sector: verde si lo has hecho más rápido que la sombra, rojo si no */
export type ColorSector = 'verde' | 'rojo';

/** Resultado de un sector ya terminado */
export interface ResultadoSector {
  numero: number;
  /** Segundos que has tardado en este sector */
  tiempoCorredor: number;
  /** Segundos que tardó la sombra en este mismo sector */
  tiempoSombra: number;
  /** tiempoCorredor − tiempoSombra: negativo = has ganado tiempo en el sector */
  diferenciaSector: number;
  /** Diferencia total con la sombra al terminar el sector (desde la salida) */
  diferenciaAcumulada: number;
  color: ColorSector;
}
