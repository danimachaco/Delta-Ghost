import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Pantalla del reloj. De momento muestra datos de ejemplo:
 * más adelante se conectará con el GPS y con la ruta guardada (la "sombra").
 */
@Component({
  imports: [RouterLink],
  selector: 'app-reloj-inicio',
  styleUrl: './reloj-inicio.css',
  templateUrl: './reloj-inicio.html',
})
export class RelojInicio {
  /** Tiempo de carrera en segundos (dato de ejemplo) */
  protected readonly segundos = signal(754);

  /** Diferencia con la sombra en el sector actual: negativo = vas mejor */
  protected readonly diferencia = signal(-2.4);

  /** Tiempo formateado como mm:ss */
  protected readonly tiempo = computed(() => {
    const min = Math.floor(this.segundos() / 60);
    const seg = this.segundos() % 60;
    return `${String(min).padStart(2, '0')}:${String(seg).padStart(2, '0')}`;
  });

  /** true si vas por delante de tu sombra en este sector */
  protected readonly vasMejor = computed(() => this.diferencia() <= 0);

  /** Diferencia formateada, por ejemplo "-2,4 s" o "+1,0 s" */
  protected readonly textoDiferencia = computed(() => {
    const signo = this.diferencia() > 0 ? '+' : '';
    return `${signo}${this.diferencia().toFixed(1).replace('.', ',')} s`;
  });
}
