import { Injectable, OnDestroy, signal } from '@angular/core';

/**
 * Estado del bloqueo de pantalla:
 * - `apagado`: no se ha pedido (la pantalla se apaga como siempre).
 * - `activo`: el navegador mantiene la pantalla encendida.
 * - `no-disponible`: el navegador no lo permite (no tiene la API, batería baja, pestaña oculta…).
 */
export type EstadoPantalla = 'apagado' | 'activo' | 'no-disponible';

/**
 * Mantiene la pantalla encendida durante la carrera con la Screen Wake Lock API (PS-46).
 *
 * El navegador suelta el bloqueo él solo cuando la pestaña se oculta (cambiar de app,
 * bloquear el móvil). Por eso, mientras se quiera la pantalla encendida, al volver a la
 * pestaña (`visibilitychange`) se pide otra vez.
 *
 * Si el navegador no tiene la API (Firefox antiguo, navegadores de escritorio sin soporte)
 * no falla nada: el estado pasa a `no-disponible` y el reloj avisa al corredor.
 */
@Injectable({ providedIn: 'root' })
export class PantallaEncendida implements OnDestroy {
  readonly estado = signal<EstadoPantalla>('apagado');

  /** true entre activar() y desactivar(): la pantalla debería estar encendida */
  private quiere = false;
  private bloqueo: WakeLockSentinel | null = null;

  private readonly alCambiarVisibilidad = () => {
    if (this.quiere && document.visibilityState === 'visible' && this.bloqueo === null) {
      void this.pedir();
    }
  };

  /** true si el navegador tiene la Screen Wake Lock API */
  get soportado(): boolean {
    return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
  }

  /** Pide mantener la pantalla encendida hasta que se llame a desactivar() */
  async activar(): Promise<void> {
    if (this.quiere) {
      return;
    }
    this.quiere = true;
    document.addEventListener('visibilitychange', this.alCambiarVisibilidad);
    await this.pedir();
  }

  /** Deja que la pantalla se apague otra vez como siempre */
  async desactivar(): Promise<void> {
    this.quiere = false;
    document.removeEventListener('visibilitychange', this.alCambiarVisibilidad);
    const bloqueo = this.bloqueo;
    this.bloqueo = null;
    this.estado.set('apagado');
    await bloqueo?.release().catch(() => undefined);
  }

  ngOnDestroy(): void {
    void this.desactivar();
  }

  /** Hace la petición al navegador; si la rechaza, se marca como no disponible */
  private async pedir(): Promise<void> {
    if (!this.soportado) {
      this.estado.set('no-disponible');
      return;
    }
    try {
      const bloqueo = await navigator.wakeLock.request('screen');
      // Si mientras tanto se ha desactivado, se suelta enseguida
      if (!this.quiere) {
        await bloqueo.release();
        return;
      }
      this.bloqueo = bloqueo;
      this.estado.set('activo');
      // El navegador lo suelta al ocultar la pestaña; al volver se pedirá otra vez
      bloqueo.addEventListener('release', () => {
        if (this.bloqueo === bloqueo) {
          this.bloqueo = null;
          if (this.quiere) {
            this.estado.set('no-disponible');
          }
        }
      });
    } catch {
      // NotAllowedError: batería baja, modo ahorro o la pestaña no está visible
      this.estado.set('no-disponible');
    }
  }
}
