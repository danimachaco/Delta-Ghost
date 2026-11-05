import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  diferenciaSector,
  diferenciaTotal,
  mejoraSombra,
  sectorMejor,
  tiempoTotal,
} from '../../../../compartido/utilidades/carrera';
import { formatearDiferencia, formatearTiempo } from '../../../../compartido/utilidades/formato-tiempo';
import { DISTANCIA_SECTOR_METROS } from '../../../../core/modelos/carrera';
import { CARRERA_EJEMPLO } from '../../../../core/servicios/carrera-ejemplo';
import { CarreraService } from '../../../../core/servicios/carreras';

/** Pantalla de resumen que aparece al terminar una carrera (HU-50). */
@Component({
  imports: [RouterLink],
  selector: 'app-resumen',
  styleUrl: './resumen.css',
  templateUrl: './resumen.html',
})
export class Resumen {
  private readonly carreras = inject(CarreraService);

  /** Última carrera terminada. Si se entra directo a /app/resumen, usa la de ejemplo. */
  protected readonly carrera = computed(() => this.carreras.ultimaCarrera() ?? CARRERA_EJEMPLO);

  protected readonly tiempo = computed(() => formatearTiempo(tiempoTotal(this.carrera())));
  protected readonly diferencia = computed(() => formatearDiferencia(diferenciaTotal(this.carrera())));
  protected readonly mejoro = computed(() => mejoraSombra(this.carrera()));

  /** Distancia total en km, por ejemplo "2,5" */
  protected readonly distanciaKm = computed(() =>
    ((this.carrera().sectores.length * DISTANCIA_SECTOR_METROS) / 1000).toFixed(1).replace('.', ','),
  );

  /** Una fila por sector, con los textos ya formateados */
  protected readonly filas = computed(() =>
    this.carrera().sectores.map((s) => ({
      indice: s.indice,
      tiempo: formatearTiempo(s.tiempoSegundos),
      diferencia: formatearDiferencia(diferenciaSector(s)),
      mejor: sectorMejor(s),
    })),
  );
}
