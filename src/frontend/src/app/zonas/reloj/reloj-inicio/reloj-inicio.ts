import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PruebaAvisos } from '../../../compartido/componentes/prueba-avisos/prueba-avisos';
import { formatearDiferencia, formatearTiempo } from '../../../compartido/utilidades/formato-tiempo';
import { AvisoSector } from '../../../core/servicios/aviso-sector';
import { CarreraService } from '../../../core/servicios/carrera';
import { CARRERA_EJEMPLO } from '../../../core/servicios/carrera-ejemplo';

/**
 * Pantalla del reloj. De momento muestra datos de ejemplo:
 * más adelante se conectará con el GPS y con la ruta guardada (la "sombra").
 */
@Component({
  imports: [RouterLink, PruebaAvisos],
  selector: 'app-reloj-inicio',
  styleUrl: './reloj-inicio.css',
  templateUrl: './reloj-inicio.html',
})
export class RelojInicio {
  /** Destello de fin de sector: 'mejor' (verde), 'peor' (rojo) o null */
  protected readonly aviso = inject(AvisoSector).aviso;

  private readonly carreras = inject(CarreraService);
  private readonly router = inject(Router);

  /** Tiempo de carrera en segundos (dato de ejemplo) */
  protected readonly segundos = signal(754);

  /** Diferencia con la sombra en el sector actual: negativo = vas mejor */
  protected readonly diferencia = signal(-2.4);

  /** Tiempo formateado como mm:ss */
  protected readonly tiempo = computed(() => formatearTiempo(this.segundos()));

  /** true si vas por delante de tu sombra en este sector */
  protected readonly vasMejor = computed(() => this.diferencia() <= 0);

  /** Diferencia formateada, por ejemplo "-2,4 s" o "+1,0 s" */
  protected readonly textoDiferencia = computed(() => formatearDiferencia(this.diferencia()));

  /**
   * Termina la carrera y abre el resumen.
   * TODO: cuando exista el GPS y la lógica de sectores (sub-tarea 48), aquí se
   * enviará la carrera real en lugar de la de ejemplo.
   */
  protected finalizar(): void {
    this.carreras.finalizar(CARRERA_EJEMPLO);
    void this.router.navigateByUrl('/app/resumen');
  }
}



