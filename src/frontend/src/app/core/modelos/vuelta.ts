import { ResultadoAviso } from './aviso';
import { PuntoGps } from './ruta';

/**
 * Una vuelta terminada en el modo vuelta rápida (PS-78), como las vueltas de un circuito de F1.
 */
export interface Vuelta {
  /** Número de la vuelta: 1, 2, 3… */
  numero: number;
  /** Segundos que se tardó en dar la vuelta */
  tiempoSegundos: number;
  /** Segundos de sesión en los que empezó y terminó la vuelta (desde que se pulsó "Empezar") */
  inicioSegundos: number;
  finSegundos: number;
  /** Metros recorridos en la vuelta */
  distanciaMetros: number;
  /** Puntos GPS de la vuelta, con los segundos desde que empezó la vuelta (el primero es 0) */
  puntos: PuntoGps[];
  /** tiempo − mejor vuelta anterior: negativo = has bajado tu mejor vuelta. null en la primera */
  diferenciaConMejorSegundos: number | null;
  /** tiempo − vuelta anterior: negativo = más rápida que la anterior. null en la primera */
  diferenciaConAnteriorSegundos: number | null;
  /** true si es la mejor vuelta de la sesión en el momento de terminarla */
  esMejor: boolean;
  /**
   * Aviso del reloj al terminar la vuelta, con los mismos colores que los sectores:
   * - `morado`: nueva vuelta rápida (bajas tu mejor vuelta), como la vuelta rápida de la F1.
   * - `mejor` (verde): más rápida que la vuelta anterior, pero sin bajar la mejor.
   * - `peor` (rojo): más lenta que la vuelta anterior.
   * - `null` en la primera vuelta: todavía no hay con qué comparar.
   */
  resultado: ResultadoAviso | null;
}
