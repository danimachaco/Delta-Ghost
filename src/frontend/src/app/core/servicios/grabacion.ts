import { computed, DestroyRef, inject, Service, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PosicionGps } from '../modelos/punto-gps';
import { PuntoGps } from '../modelos/ruta';
import { Calculo } from './calculo';
import { Gps } from './gps';

/** Fases de una grabación: antes de empezar, mientras se corre y al terminar */
export type EstadoGrabacion = 'parada' | 'grabando' | 'terminada';

/**
 * Graba una ruta mientras el corredor se mueve (PS-34).
 *
 * - Usa solo las posiciones que pasan el filtro del GPS (`Gps.posicionValida`, PS-32),
 *   así los saltos y las lecturas imprecisas no se cuelan en la ruta.
 * - Cada punto guarda los segundos desde que se pulsó "Empezar".
 * - La distancia y el ritmo se calculan con el servicio Calculo (PS-31).
 *
 * Es un servicio (y no código de la pantalla) para que el reloj pueda reutilizarlo en la carrera.
 */
@Service()
export class Grabacion {
  private readonly gps = inject(Gps);
  private readonly calculo = inject(Calculo);

  readonly estado = signal<EstadoGrabacion>('parada');
  /** Puntos grabados hasta ahora, en orden */
  readonly puntos = signal<PuntoGps[]>([]);
  /** Segundos transcurridos desde que se empezó (se actualiza cada segundo) */
  readonly segundos = signal(0);

  /** Distancia recorrida en metros */
  readonly distanciaMetros = computed(() => this.calculo.distanciaTotal(this.puntos()));
  /** Ritmo en segundos por km, o null si todavía no hay distancia */
  readonly ritmo = computed(() => this.calculo.ritmo(this.distanciaMetros(), this.segundos()));
  /** Solo se puede empezar cuando el GPS ya da una posición fiable */
  readonly puedeEmpezar = computed(
    () => this.estado() !== 'grabando' && this.gps.posicionValida() !== null,
  );

  /** Hora (ms) en la que se pulsó "Empezar" */
  private inicio = 0;
  private reloj: ReturnType<typeof setInterval> | null = null;
  /** Última posición añadida, para no añadir la misma dos veces */
  private ultimaPosicion: PosicionGps | null = null;

  constructor() {
    // Cada lectura válida del GPS se añade a la ruta (registrar() la ignora si no se está grabando).
    // Se usa la suscripción y no la signal posicionValida para no perder lecturas que lleguen juntas.
    this.gps.lecturasValidas
      .pipe(takeUntilDestroyed())
      .subscribe((posicion) => this.registrar(posicion, Date.now()));
    inject(DestroyRef).onDestroy(() => this.pararReloj());
  }

  /** Empieza a grabar desde la posición actual. Devuelve false si aún no hay señal GPS fiable. */
  empezar(ahora = Date.now()): boolean {
    const posicion = this.gps.posicionValida();
    if (!posicion || this.estado() === 'grabando') {
      return false;
    }
    this.inicio = ahora;
    this.ultimaPosicion = posicion;
    this.puntos.set([aPunto(posicion, 0)]);
    this.segundos.set(0);
    this.estado.set('grabando');
    this.reloj = setInterval(() => this.segundos.set(this.transcurridos(Date.now())), 1000);
    return true;
  }

  /** Añade una posición a la ruta con los segundos transcurridos en `ahora` (ms). */
  registrar(posicion: PosicionGps, ahora: number): void {
    if (this.estado() !== 'grabando' || posicion === this.ultimaPosicion) {
      return;
    }
    this.ultimaPosicion = posicion;
    this.puntos.update((puntos) => {
      // El tiempo nunca puede ir hacia atrás (el backend rechazaría la ruta)
      const anterior = puntos.at(-1)?.tiempoSegundos ?? 0;
      return [...puntos, aPunto(posicion, Math.max(anterior, this.transcurridos(ahora)))];
    });
  }

  /** Para el cronómetro y deja la ruta lista para guardarla. */
  terminar(ahora = Date.now()): void {
    if (this.estado() !== 'grabando') {
      return;
    }
    this.pararReloj();
    this.segundos.set(this.transcurridos(ahora));
    this.estado.set('terminada');
  }

  /** Borra lo grabado y vuelve al principio. */
  descartar(): void {
    this.pararReloj();
    this.puntos.set([]);
    this.segundos.set(0);
    this.ultimaPosicion = null;
    this.estado.set('parada');
  }

  private transcurridos(ahora: number): number {
    return Math.max(0, Math.round((ahora - this.inicio) / 1000));
  }

  private pararReloj(): void {
    if (this.reloj !== null) {
      clearInterval(this.reloj);
      this.reloj = null;
    }
  }
}

/** Convierte una lectura del GPS en un punto de la ruta (la precisión no se guarda). */
function aPunto(posicion: PosicionGps, tiempoSegundos: number): PuntoGps {
  return { latitud: posicion.latitud, longitud: posicion.longitud, tiempoSegundos };
}
