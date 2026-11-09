import { Component, computed, effect, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FlechaSector } from '../../../compartido/componentes/flecha-sector/flecha-sector';
import { PruebaAvisos } from '../../../compartido/componentes/prueba-avisos/prueba-avisos';
import { formatearDiferencia } from '../../../compartido/utilidades/formato-tiempo';
import { aPorcentaje } from '../../../compartido/utilidades/progreso';
import { AvisoSector } from '../../../core/servicios/aviso-sector';
import { Carrera } from '../../../core/servicios/carrera';
import { CARRERA_EJEMPLO } from '../../../core/servicios/carrera-ejemplo';
import { CarreraService } from '../../../core/servicios/carreras';
import { PantallaEncendida } from '../../../core/servicios/pantalla-encendida';

/**
 * Pantalla del reloj durante la carrera (mockup "2 · Reloj").
 *
 * - Desde la PS-45 lee los datos en vivo del servicio Carrera: el tiempo del cronómetro,
 *   tu progreso (según tu GPS), el de la sombra y la diferencia con ella.
 * - Avisa si el navegador no puede mantener la pantalla encendida (PS-46).
 * - Muestra el destello verde o rojo al terminar un sector (PS-49, servicio AvisoSector),
 *   con una flecha ▲/▼ y un texto para lectores de pantalla (PS-59).
 * - "Ver resumen" guarda la carrera y abre la pantalla de resumen (PS-50).
 * - Al acabar la carrera (en la meta o con Terminar) abre el resultado final (PS-62).
 *
 * Los inputs `progresoTu` y `progresoSombra` (0 = salida, 1 = meta), si se les da un valor,
 * mandan sobre el dato de la carrera. Así una carrera simulada (HU-40) puede mover los puntos.
 */
@Component({
  imports: [RouterLink, PruebaAvisos, FlechaSector],
  selector: 'app-reloj-inicio',
  styleUrl: './reloj-inicio.css',
  templateUrl: './reloj-inicio.html',
})
export class RelojInicio {
  protected readonly carrera = inject(Carrera);
  private readonly pantalla = inject(PantallaEncendida);
  private readonly carreras = inject(CarreraService);
  private readonly router = inject(Router);

  /** Destello de fin de sector: 'mejor' (verde), 'peor' (rojo) o null (PS-49) */
  protected readonly aviso = inject(AvisoSector).aviso;

  /** Texto del aviso para lectores de pantalla (PS-59): el destello y la flecha son solo visuales */
  protected readonly textoAviso = computed(() => {
    const aviso = this.aviso();
    if (aviso === 'mejor') return 'Sector mejor que tu sombra';
    if (aviso === 'peor') return 'Sector peor que tu sombra';
    return '';
  });

  /** Progreso del corredor, de 0 a 1. Si es null se usa el de la carrera en curso. */
  readonly progresoTu = input<number | null>(null);

  /** Progreso de la sombra, de 0 a 1. Si es null se usa el de la carrera en curso. */
  readonly progresoSombra = input<number | null>(null);

  /** true mientras se corre; false si no hay carrera o ya ha terminado */
  protected readonly enCurso = computed(() => this.carrera.estado() === 'en-curso');

  /** true si se corre y el navegador no puede mantener la pantalla encendida (PS-46) */
  protected readonly pantallaPuedeApagarse = computed(
    () => this.enCurso() && this.pantalla.estado() === 'no-disponible',
  );

  /** Posición del punto del corredor en la barra, en % (siempre entre 0 y 100) */
  protected readonly posicionTu = computed(() =>
    aPorcentaje(this.progresoTu() ?? this.carrera.progresoTu()),
  );

  /** Posición del punto de la sombra en la barra, en % (siempre entre 0 y 100) */
  protected readonly posicionSombra = computed(() =>
    aPorcentaje(this.progresoSombra() ?? this.carrera.progresoSombra()),
  );

  /** Texto para lectores de pantalla: la barra es visual y no lleva texto propio */
  protected readonly descripcionBarra = computed(
    () =>
      `Tú vas por el ${this.posicionTu()} % de la ruta y tu sombra por el ${this.posicionSombra()} %`,
  );

  /** Tiempo formateado como mm:ss (o h:mm:ss si pasa de una hora) */
  protected readonly tiempo = computed(() => {
    const total = this.carrera.segundos();
    const horas = Math.floor(total / 3600);
    const min = Math.floor((total % 3600) / 60);
    const seg = total % 60;
    const mmss = `${String(min).padStart(2, '0')}:${String(seg).padStart(2, '0')}`;
    return horas > 0 ? `${horas}:${mmss}` : mmss;
  });

  /** Kilómetros que llevas, como en el mockup: "km 2,3" */
  protected readonly kilometros = computed(
    () => `km ${(this.carrera.distanciaMetros() / 1000).toFixed(1).replace('.', ',')}`,
  );

  /** Diferencia con la sombra: negativo = vas mejor. Null si no hay carrera. */
  private readonly diferencia = this.carrera.diferencia;

  /** true si vas por delante de tu sombra (o empatado) */
  protected readonly vasMejor = computed(() => {
    const d = this.diferencia();
    return d !== null && d <= 0;
  });

  /** true si tu sombra va por delante */
  protected readonly vasPeor = computed(() => {
    const d = this.diferencia();
    return d !== null && d > 0;
  });

  /** Diferencia formateada, por ejemplo "-2,4 s" o "+1,0 s" (vacía si no hay carrera) */
  protected readonly textoDiferencia = computed(() => {
    const d = this.diferencia();
    return d === null ? '' : formatearDiferencia(d);
  });

  constructor() {
    // PS-62: en cuanto la carrera pasa de "en curso" a "terminada" (al llegar a la meta o con
    // el botón Terminar) se abre la pantalla de fin de carrera con el resultado final.
    let anterior = this.carrera.estado();
    effect(() => {
      const estado = this.carrera.estado();
      if (anterior === 'en-curso' && estado === 'terminada') {
        void this.router.navigateByUrl('/reloj/fin');
      }
      anterior = estado;
    });
  }

  /** Para la carrera antes de llegar a la meta (los datos se quedan para el resumen) */
  protected terminar(): void {
    this.carrera.terminar();
  }

  /**
   * Guarda la carrera y abre el resumen (PS-50).
   * TODO: el resumen todavía usa la carrera de ejemplo. Cuando se conecten los sectores
   * (PS-48) con la carrera en vivo, aquí se enviará la carrera real.
   */
  protected finalizar(): void {
    this.carreras.finalizar(CARRERA_EJEMPLO);
    void this.router.navigateByUrl('/app/resumen');
  }
}
