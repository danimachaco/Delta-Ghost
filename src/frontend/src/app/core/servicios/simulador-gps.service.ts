import { Injectable, OnDestroy, computed, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { ErrorCarreraInvalida, validarCarrera } from '../../compartido/utilidades/validar-carrera';
import { CarreraGrabada } from '../modelos/carrera-grabada';
import { PuntoGps } from '../modelos/punto-gps';
import { FuenteGps } from './fuente-gps';

export type EstadoSimulacion = 'sin-carrera' | 'detenida' | 'reproduciendo' | 'pausada' | 'terminada';

/** Velocidades de reproducción disponibles (x1 = tiempo real) */
export const VELOCIDADES = [1, 2, 5, 10] as const;

/**
 * Reproduce una carrera grabada como si sus puntos llegaran del GPS.
 *
 * Cada punto se emite respetando la diferencia real de `tiempoSegundos` con el
 * anterior, dividida por el factor de velocidad. No se usa un intervalo fijo
 * porque falsearía los ritmos (y con ellos las diferencias con la sombra).
 */
@Injectable({ providedIn: 'root' })
export class SimuladorGpsService extends FuenteGps implements OnDestroy {
  private readonly _carrera = signal<CarreraGrabada | null>(null);
  private readonly _estado = signal<EstadoSimulacion>('sin-carrera');
  private readonly _indice = signal(-1);
  private readonly _factor = signal(1);
  private readonly _posicion = signal<PuntoGps | null>(null);
  private readonly emisor = new Subject<PuntoGps>();
  private readonly _fin = new Subject<void>();

  readonly carrera = this._carrera.asReadonly();
  readonly estado = this._estado.asReadonly();
  /** Índice del último punto emitido (-1 si aún no ha empezado) */
  readonly indice = this._indice.asReadonly();
  readonly factor = this._factor.asReadonly();
  readonly posicion = this._posicion.asReadonly();
  readonly puntos$ = this.emisor.asObservable();
  /** Emite una vez cuando se emite el último punto de la carrera */
  readonly fin$ = this._fin.asObservable();

  /** Progreso de 0 a 1 */
  readonly progreso = computed(() => {
    const carrera = this._carrera();
    return carrera ? (this._indice() + 1) / carrera.puntos.length : 0;
  });

  private temporizador?: ReturnType<typeof setTimeout>;
  private inicioTemporizador = 0;
  /** Segundos de carrera que faltan para el siguiente punto */
  private restanteSeg = 0;

  /** Carga un JSON en texto. Lanza ErrorCarreraInvalida si no es válido. */
  cargarJson(texto: string): void {
    let datos: unknown;
    try {
      datos = JSON.parse(texto);
    } catch {
      throw new ErrorCarreraInvalida(['El archivo no es un JSON válido.']);
    }
    this.cargar(datos);
  }

  /** Carga una carrera ya parseada. Lanza ErrorCarreraInvalida si no es válida. */
  cargar(datos: unknown): void {
    const carrera = validarCarrera(datos); // si falla, no se toca el estado actual
    this.detener();
    this._carrera.set(carrera);
    this._estado.set('detenida');
  }

  /** Empieza desde el principio, o reanuda si estaba en pausa. */
  reproducir(): void {
    const estado = this._estado();
    if (estado === 'sin-carrera' || estado === 'reproduciendo') return;
    if (estado === 'pausada') {
      this._estado.set('reproduciendo');
      this.programar();
      return;
    }
    this._indice.set(-1);
    this._estado.set('reproduciendo');
    this.emitirSiguiente();
  }

  pausar(): void {
    if (this._estado() !== 'reproduciendo') return;
    const consumidoSeg = ((Date.now() - this.inicioTemporizador) * this._factor()) / 1000;
    this.restanteSeg = Math.max(0, this.restanteSeg - consumidoSeg);
    this.limpiar();
    this._estado.set('pausada');
  }

  /** Para la simulación y vuelve al principio (la carrera sigue cargada). */
  detener(): void {
    this.limpiar();
    this._indice.set(-1);
    this._posicion.set(null);
    this._estado.set(this._carrera() ? 'detenida' : 'sin-carrera');
  }

  /** Cambia la velocidad; si está reproduciendo se aplica al instante. */
  cambiarVelocidad(factor: number): void {
    if (!(VELOCIDADES as readonly number[]).includes(factor)) {
      throw new Error(`Velocidad no permitida: x${factor}`);
    }
    const estabaReproduciendo = this._estado() === 'reproduciendo';
    if (estabaReproduciendo) this.pausar();
    this._factor.set(factor);
    if (estabaReproduciendo) this.reproducir();
  }

  ngOnDestroy(): void {
    this.limpiar();
    this.emisor.complete();
    this._fin.complete();
  }

  private emitirSiguiente(): void {
    const puntos = this._carrera()!.puntos;
    const i = this._indice() + 1;
    const punto = puntos[i];
    this._indice.set(i);
    this._posicion.set(punto);
    this.emisor.next(punto);

    // Un suscriptor pudo pausar o detener dentro de next()
    if (this._estado() !== 'reproduciendo') return;

    if (i === puntos.length - 1) {
      this._estado.set('terminada');
      this._fin.next();
      return;
    }
    this.restanteSeg = puntos[i + 1].tiempoSegundos - punto.tiempoSegundos;
    this.programar();
  }

  private programar(): void {
    this.limpiar();
    this.inicioTemporizador = Date.now();
    this.temporizador = setTimeout(() => {
      this.temporizador = undefined;
      if (this._estado() === 'reproduciendo') this.emitirSiguiente();
    }, (this.restanteSeg * 1000) / this._factor());
  }

  private limpiar(): void {
    if (this.temporizador !== undefined) {
      clearTimeout(this.temporizador);
      this.temporizador = undefined;
    }
  }
}
