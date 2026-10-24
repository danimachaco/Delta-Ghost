import { Component, OnDestroy, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ErrorGps, Gps } from '../../../core/servicios/gps';

/** Texto de ayuda para cada tipo de error del GPS. */
const MENSAJES: Record<ErrorGps, string> = {
  'permiso-denegado':
    'Has denegado el permiso de ubicación. Para activarlo, pulsa el candado junto a la dirección del navegador y permite "Ubicación"; en el móvil, revisa también Ajustes → Ubicación. Después recarga la página.',
  'no-disponible':
    'No se puede determinar tu posición. Comprueba que el GPS del dispositivo está activado y sal a un lugar con buena señal.',
  'tiempo-agotado': 'El GPS tarda demasiado en responder. Seguimos intentándolo…',
  'no-soportado': 'Este navegador no permite usar la ubicación.',
};

/** Convierte un número a texto con coma decimal, o "—" si aún no hay dato. */
function formatear(valor: number | undefined, decimales: number): string {
  return valor === undefined ? '—' : valor.toFixed(decimales).replace('.', ',');
}

/** Prototipo: muestra la posición GPS en vivo (HU-27). */
@Component({
  imports: [RouterLink],
  selector: 'app-gps-pantalla',
  styleUrl: './gps-pantalla.css',
  templateUrl: './gps-pantalla.html',
})
export class GpsPantalla implements OnInit, OnDestroy {
  private readonly gps = inject(Gps);

  protected readonly posicion = this.gps.posicion;
  protected readonly error = this.gps.error;

  protected readonly latitud = computed(() => formatear(this.posicion()?.latitud, 6));
  protected readonly longitud = computed(() => formatear(this.posicion()?.longitud, 6));
  protected readonly precision = computed(() => {
    const p = this.posicion()?.precision;
    return p === undefined ? '—' : `${Math.round(p)} m`;
  });

  /** Precisión aceptable: 20 m o menos (el mismo umbral que usará la grabación) */
  protected readonly precisionBuena = computed(() => (this.posicion()?.precision ?? Infinity) <= 20);

  protected readonly mensajeError = computed(() => {
    const e = this.error();
    return e ? MENSAJES[e] : null;
  });

  ngOnInit(): void {
    this.gps.iniciar();
  }

  ngOnDestroy(): void {
    this.gps.detener();
  }
}
