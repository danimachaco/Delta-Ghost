import { Injectable, signal } from '@angular/core';
import { ResultadoAviso } from '../modelos/aviso';

/** Duración del destello en pantalla (criterio de aceptación de la HU-47: 3 segundos). */
export const DURACION_AVISO_MS = 3000;
/** Verde: dos vibraciones cortas (vibra, pausa, vibra). */
export const VIBRACION_MEJOR = [200, 100, 200];
/** Rojo: una vibración larga. */
export const VIBRACION_PEOR = 800;

/**
 * Gestiona el aviso de fin de sector: activa el destello verde o rojo durante
 * 3 segundos y hace vibrar el dispositivo.
 *
 * Quien calcule los sectores (sub-tarea 48) solo tiene que llamar a
 * `avisar('mejor')` o `avisar('peor')` cuando termine un sector.
 */
@Injectable({ providedIn: 'root' })
export class AvisoSector {
  private readonly _aviso = signal<ResultadoAviso | null>(null);
  private temporizador?: ReturnType<typeof setTimeout>;

  /** Aviso activo ahora mismo (null si no hay destello). */
  readonly aviso = this._aviso.asReadonly();

  avisar(resultado: ResultadoAviso): void {
    // Si llega un aviso nuevo mientras hay otro activo, se reinicia el tiempo
    clearTimeout(this.temporizador);
    this._aviso.set(resultado);
    this.vibrar(resultado);
    this.temporizador = setTimeout(() => this._aviso.set(null), DURACION_AVISO_MS);
  }

  private vibrar(resultado: ResultadoAviso): void {
    // iOS Safari no soporta la API de vibración: en ese caso solo hay destello
    if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
    navigator.vibrate(resultado === 'mejor' ? VIBRACION_MEJOR : VIBRACION_PEOR);
  }
}
