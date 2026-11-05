import { Injectable, signal } from '@angular/core';
import { mejoraSombra } from '../../compartido/utilidades/carrera';
import { Carrera } from '../modelos/carrera';

/**
 * Guarda en memoria la última carrera terminada (la que muestra el resumen)
 * y la sombra actual.
 *
 * TODO (cuando exista la API de carreras, sub-tareas 33 y 36): enviar la
 * carrera al backend y que sea el servidor quien decida cuál es la sombra.
 */
@Injectable({ providedIn: 'root' })
export class CarreraService {
  private readonly _ultimaCarrera = signal<Carrera | null>(null);
  private readonly _sombra = signal<Carrera | null>(null);

  readonly ultimaCarrera = this._ultimaCarrera.asReadonly();
  readonly sombra = this._sombra.asReadonly();

  /** Registra una carrera terminada. Si bate a la sombra, pasa a ser la nueva sombra. */
  finalizar(carrera: Carrera): void {
    this._ultimaCarrera.set(carrera);
    if (mejoraSombra(carrera)) {
      this._sombra.set(carrera);
    }
  }
}
