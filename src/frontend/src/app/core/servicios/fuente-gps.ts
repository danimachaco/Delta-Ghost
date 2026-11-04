import { Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { PuntoGps } from '../modelos/punto-gps';

/**
 * Contrato de "de dónde vienen las posiciones". Los componentes del reloj
 * dependerán de esta clase y no de una implementación concreta:
 *  - GPS real (watchPosition)          → historias 27/28
 *  - SimuladorGpsService (JSON grabado) → historia 40
 * Así se cambia de fuente con un provider, sin tocar las pantallas.
 */
export abstract class FuenteGps {
  /** Última posición recibida (null si todavía no hay ninguna) */
  abstract readonly posicion: Signal<PuntoGps | null>;
  /** Flujo de posiciones, una emisión por cada punto recibido */
  abstract readonly puntos$: Observable<PuntoGps>;
}
