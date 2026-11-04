import { Injectable, OnDestroy, computed, signal } from '@angular/core';

/** Estado del cronómetro: sin empezar, contando o detenido a mitad de carrera */
export type EstadoCronometro = 'parado' | 'corriendo' | 'pausado';

/**
 * Cronómetro de la carrera.
 *
 * No cuenta "ticks": guarda la hora a la que empezó el tramo actual y calcula
 * `ahora - inicio` cada vez que se refresca. Así, aunque el móvil apague la
 * pantalla o el navegador frene los temporizadores de una pestaña en segundo
 * plano, el tiempo mostrado sigue siendo el real. El intervalo solo sirve para
 * refrescar la vista, y al volver a la pantalla (visibilitychange) se refresca
 * al instante.
 *
 * Al pausar, el tiempo en pausa NO cuenta: se guarda lo acumulado y se retoma
 * desde ahí al reanudar. Se usa Date.now() (y no performance.now()) porque sigue
 * avanzando mientras el dispositivo está suspendido.
 *
 * Es un servicio de toda la app (core): la pantalla de elegir ruta (HU-42)
 * podrá dar la orden de empezar y el reloj solo leer `segundos`.
 */
@Injectable({ providedIn: 'root' })
export class Cronometro implements OnDestroy {
  /** Cada cuánto se refresca la vista (ms). Menos de 1 s para no saltarse segundos. */
  private static readonly REFRESCO_MS = 200;

  readonly estado = signal<EstadoCronometro>('parado');

  /** Tiempo transcurrido en milisegundos, descontando las pausas */
  readonly milisegundos = signal(0);

  /** Tiempo transcurrido en segundos enteros */
  readonly segundos = computed(() => Math.floor(this.milisegundos() / 1000));

  /** Milisegundos acumulados en los tramos ya cerrados (antes de la última pausa) */
  private acumuladoMs = 0;
  /** Hora (Date.now) a la que empezó el tramo actual; solo vale si está corriendo */
  private inicioTramo = 0;
  private intervalo: ReturnType<typeof setInterval> | null = null;

  private readonly alCambiarVisibilidad = () => this.refrescar();

  /** Empieza desde cero. Si ya estaba en marcha o en pausa no hace nada. */
  iniciar(): void {
    if (this.estado() !== 'parado') {
      return;
    }
    this.acumuladoMs = 0;
    this.milisegundos.set(0);
    this.arrancarTramo();
  }

  /** Detiene el tiempo sin perder lo acumulado */
  pausar(): void {
    if (this.estado() !== 'corriendo') {
      return;
    }
    this.acumuladoMs += Date.now() - this.inicioTramo;
    this.milisegundos.set(this.acumuladoMs);
    this.detenerRefresco();
    this.estado.set('pausado');
  }

  /** Retoma el tiempo desde donde se pausó */
  reanudar(): void {
    if (this.estado() !== 'pausado') {
      return;
    }
    this.arrancarTramo();
  }

  /** Alterna entre pausar y reanudar (para el botón del reloj) */
  alternar(): void {
    if (this.estado() === 'corriendo') {
      this.pausar();
    } else {
      this.reanudar();
    }
  }

  /** Lo deja todo a cero y parado */
  reiniciar(): void {
    this.detenerRefresco();
    this.acumuladoMs = 0;
    this.milisegundos.set(0);
    this.estado.set('parado');
  }

  ngOnDestroy(): void {
    this.detenerRefresco();
  }

  private arrancarTramo(): void {
    this.inicioTramo = Date.now();
    this.estado.set('corriendo');
    this.intervalo = setInterval(() => this.refrescar(), Cronometro.REFRESCO_MS);
    document.addEventListener('visibilitychange', this.alCambiarVisibilidad);
  }

  private detenerRefresco(): void {
    if (this.intervalo !== null) {
      clearInterval(this.intervalo);
      this.intervalo = null;
    }
    document.removeEventListener('visibilitychange', this.alCambiarVisibilidad);
  }

  /** Recalcula el tiempo transcurrido a partir de la hora real */
  private refrescar(): void {
    if (this.estado() === 'corriendo') {
      this.milisegundos.set(this.acumuladoMs + Date.now() - this.inicioTramo);
    }
  }
}
