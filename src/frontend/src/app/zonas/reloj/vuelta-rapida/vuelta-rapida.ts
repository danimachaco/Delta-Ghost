import { Component, OnDestroy, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FlechaSector } from '../../../compartido/componentes/flecha-sector/flecha-sector';
import {
  formatearDiferenciaVuelta,
  formatearVuelta,
} from '../../../compartido/utilidades/formato-vuelta';
import { AvisoSector } from '../../../core/servicios/aviso-sector';
import { Carrera } from '../../../core/servicios/carrera';
import { ErrorGps, Gps } from '../../../core/servicios/gps';
import { VueltaRapidaGps } from '../../../core/servicios/vuelta-rapida-gps';

/** Mensajes cortos para cada error del GPS (caben en la pantalla del reloj) */
const ERRORES_GPS: Record<ErrorGps, string> = {
  'permiso-denegado': 'Activa el permiso de ubicación y recarga',
  'no-disponible': 'No hay señal GPS',
  'tiempo-agotado': 'El GPS tarda en responder…',
  'no-soportado': 'Este navegador no permite usar la ubicación',
};

/**
 * Pantalla del modo vuelta rápida en el reloj (PS-79, /reloj/vueltas).
 *
 * 1. Antes de empezar: te colocas en la línea de salida y esperas a la señal GPS.
 * 2. Corriendo: tiempo de la vuelta actual en grande, número de vuelta, tu mejor vuelta y
 *    cómo fue la última. Al cerrar cada vuelta, destello morado/verde/rojo con su forma (PS-59/68).
 * 3. Al terminar: la lista de vueltas con la mejor destacada.
 *
 * La lógica (detectar vueltas y compararlas) está en el servicio VueltaRapidaGps.
 */
@Component({
  imports: [RouterLink, FlechaSector],
  selector: 'app-vuelta-rapida',
  styleUrl: './vuelta-rapida.css',
  templateUrl: './vuelta-rapida.html',
})
export class VueltaRapidaPantalla implements OnInit, OnDestroy {
  private readonly gps = inject(Gps);
  protected readonly modo = inject(VueltaRapidaGps);
  protected readonly carrera = inject(Carrera);

  /** Destello del reloj al cerrar una vuelta */
  protected readonly aviso = inject(AvisoSector).aviso;

  /** Texto del aviso para lectores de pantalla: el destello y la forma son solo visuales */
  protected readonly textoAviso = computed(() => {
    const ultima = this.modo.ultimaVuelta();
    if (!this.aviso() || !ultima) return '';
    const tiempo = `Vuelta ${ultima.numero}: ${formatearVuelta(ultima.segundos)}`;
    if (this.aviso() === 'morado') return `${tiempo}. ¡Tu vuelta más rápida!`;
    if (this.aviso() === 'mejor') return `${tiempo}. Mejor que la anterior`;
    return `${tiempo}. Peor que la anterior`;
  });

  /** No se puede empezar mientras corres contra una sombra: los dos usan el GPS y la pantalla */
  protected readonly hayCarrera = computed(() => this.carrera.estado() === 'en-curso');
  protected readonly senalLista = computed(() => this.gps.posicionValida() !== null);
  protected readonly puedeEmpezar = computed(() => this.senalLista() && !this.hayCarrera());

  /** Qué falta para poder empezar */
  protected readonly avisoInicio = computed(() => {
    const error = this.gps.error();
    if (this.hayCarrera()) return 'Tienes una carrera contra tu sombra en marcha';
    if (error) return ERRORES_GPS[error];
    return this.senalLista() ? 'Señal GPS lista' : 'Buscando señal GPS…';
  });

  /** true si el aviso de inicio es un problema (se pinta en rojo) */
  protected readonly avisoEsError = computed(() => this.hayCarrera() || this.gps.error() !== null);

  protected readonly tiempoVuelta = computed(() => formatearVuelta(this.modo.segundosVuelta()));
  protected readonly textoMejor = computed(() => {
    const mejor = this.modo.mejorVuelta();
    return mejor ? formatearVuelta(mejor.segundos) : '—';
  });

  /** Cómo fue la última vuelta frente a la anterior ("-1,2 s"), y de qué color */
  protected readonly ultima = computed(() => {
    const ultima = this.modo.ultimaVuelta();
    if (!ultima || ultima.diferencia === null || ultima.resultado === null) return null;
    return {
      texto: formatearDiferenciaVuelta(ultima.diferencia),
      resultado: ultima.resultado,
    };
  });

  /** Filas del resumen final */
  protected readonly filas = computed(() => {
    const mejor = this.modo.mejorVuelta();
    return this.modo.vueltas().map((v) => ({
      numero: v.numero,
      tiempo: formatearVuelta(v.segundos),
      diferencia: v.diferencia === null ? '' : formatearDiferenciaVuelta(v.diferencia),
      esMejor: mejor?.numero === v.numero,
    }));
  });

  protected readonly tiempoTotal = computed(() => formatearVuelta(this.modo.segundosTotales()));

  ngOnInit(): void {
    // Si había un modo vuelta rápida terminado de antes, se empieza de cero
    if (this.modo.estado() === 'terminado') {
      this.modo.reiniciar();
    }
    if (!this.hayCarrera()) {
      this.gps.iniciar();
    }
  }

  ngOnDestroy(): void {
    // Salir de la pantalla termina el modo y apaga el GPS (si no lo usa una carrera)
    this.modo.terminar();
    if (!this.hayCarrera()) {
      this.gps.detener();
    }
  }

  protected empezar(): void {
    if (this.puedeEmpezar()) {
      this.modo.empezar();
    }
  }

  protected terminar(): void {
    this.modo.terminar();
  }

  protected otraVez(): void {
    this.modo.reiniciar();
    this.gps.iniciar();
  }
}
