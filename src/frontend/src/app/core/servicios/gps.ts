import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { PosicionGps } from '../modelos/punto-gps';
import { FiltroGps, MotivoDescarte } from './filtro-gps';

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

  /**
   * Última posición que ha pasado el filtro (PS-32): buena precisión y sin saltos imposibles.
   * Es la que deben usar la grabación de rutas y la carrera; `posicion` es la lectura en bruto.
   */
  readonly posicionValida = signal<PosicionGps | null>(null);
  /** Lecturas descartadas por el filtro desde que se inició el GPS */
  readonly descartadas = signal(0);
  /** Motivo del último descarte, o null si la última lectura fue buena */
  readonly ultimoDescarte = signal<MotivoDescarte | null>(null);

  private readonly filtro = inject(FiltroGps);
  private idWatch: number | null = null;

  /** Empieza a escuchar el GPS (si ya estaba activo, no hace nada). */
  iniciar(): void {
    if (this.idWatch !== null) return;
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      this.error.set('no-soportado');
      return;
    }
    this.error.set(null);
    this.reiniciarFiltro();
    this.idWatch = navigator.geolocation.watchPosition(
      (p) => {
        this.error.set(null);
        const posicion: PosicionGps = {
          latitud: p.coords.latitude,
          longitud: p.coords.longitude,
          precision: p.coords.accuracy,
        };
        this.posicion.set(posicion);
        // Si el navegador no da la hora de la lectura, se usa la hora actual
        this.filtrar(posicion, p.timestamp ?? Date.now());
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

  /** Pasa la lectura por el filtro y actualiza posicionValida o el contador de descartes. */
  private filtrar(posicion: PosicionGps, marcaTiempo: number): void {
    const resultado = this.filtro.evaluar(posicion, marcaTiempo);
    this.ultimoDescarte.set(resultado.motivo);
    if (resultado.aceptada) {
      this.posicionValida.set(posicion);
    } else {
      this.descartadas.update((n) => n + 1);
    }
  }

  /** Cada vez que se inicia el GPS empieza una sesión nueva: se olvidan las lecturas anteriores. */
  private reiniciarFiltro(): void {
    this.filtro.reiniciar();
    this.posicionValida.set(null);
    this.descartadas.set(0);
    this.ultimoDescarte.set(null);
  }
}
