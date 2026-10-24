import { Injectable, OnDestroy, signal } from '@angular/core';
import { PosicionGps } from '../modelos/punto-gps';

/** Motivos por los que puede fallar la localización. */
export type ErrorGps = 'permiso-denegado' | 'no-disponible' | 'tiempo-agotado' | 'no-soportado';

/**
 * Servicio de GPS: envuelve navigator.geolocation.watchPosition y expone
 * la posición como signals. Lo reutilizarán la grabación de rutas y la carrera.
 */
@Injectable({ providedIn: 'root' })
export class Gps implements OnDestroy {
  /** Última posición recibida (null hasta que llega la primera) */
  readonly posicion = signal<PosicionGps | null>(null);
  /** Último error, o null si todo va bien */
  readonly error = signal<ErrorGps | null>(null);
  /** true mientras se está escuchando el GPS */
  readonly activo = signal(false);

  private idWatch: number | null = null;

  /** Empieza a escuchar el GPS (si ya estaba activo, no hace nada). */
  iniciar(): void {
    if (this.idWatch !== null) return;
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      this.error.set('no-soportado');
      return;
    }
    this.error.set(null);
    this.idWatch = navigator.geolocation.watchPosition(
      (p) => {
        this.error.set(null);
        this.posicion.set({
          latitud: p.coords.latitude,
          longitud: p.coords.longitude,
          precision: p.coords.accuracy,
        });
      },
      (e) => {
        // Códigos de GeolocationPositionError: 1 permiso, 2 no disponible, 3 tiempo agotado
        if (e.code === 1) {
          this.error.set('permiso-denegado');
          this.detener();
        } else if (e.code === 2) {
          this.error.set('no-disponible');
        } else {
          this.error.set('tiempo-agotado');
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );
    this.activo.set(true);
  }

  /** Deja de escuchar el GPS para no gastar batería. */
  detener(): void {
    if (this.idWatch !== null) {
      navigator.geolocation.clearWatch(this.idWatch);
      this.idWatch = null;
    }
    this.activo.set(false);
  }

  ngOnDestroy(): void {
    this.detener();
  }
}
