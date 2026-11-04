import { Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { aPorcentaje } from '../../../compartido/utilidades/progreso';

/**
 * Pantalla del reloj. De momento muestra datos de ejemplo:
 * más adelante se conectará con el GPS y con la ruta guardada (la "sombra").
 *
 * El progreso de cada punto llega por `input()` (0 = salida, 1 = meta), así el
 * componente no sabe de dónde viene el dato: hoy es un valor de ejemplo y la
 * carrera real o simulada (HU-40 y HU-42) lo alimentará sin reescribir nada.
 */
@Component({
  imports: [RouterLink],
  selector: 'app-reloj-inicio',
  styleUrl: './reloj-inicio.css',
  templateUrl: './reloj-inicio.html',
})
export class RelojInicio {
  /** Progreso del corredor en la ruta, de 0 a 1 (dato de ejemplo) */
  readonly progresoTu = input(0.44);

  /** Progreso de la sombra en la ruta, de 0 a 1 (dato de ejemplo) */
  readonly progresoSombra = input(0.4);

  /** Tiempo de carrera en segundos (dato de ejemplo) */
  protected readonly segundos = signal(754);

  /** Diferencia con la sombra en el sector actual: negativo = vas mejor */
  protected readonly diferencia = signal(-2.4);

  /** Posición del punto del corredor en la barra, en % (siempre entre 0 y 100) */
  protected readonly posicionTu = computed(() => aPorcentaje(this.progresoTu()));

  /** Posición del punto de la sombra en la barra, en % (siempre entre 0 y 100) */
  protected readonly posicionSombra = computed(() => aPorcentaje(this.progresoSombra()));

  /** Texto para lectores de pantalla: la barra es visual y no lleva texto propio */
  protected readonly descripcionBarra = computed(
    () =>
      `Tú vas por el ${this.posicionTu()} % de la ruta y tu sombra por el ${this.posicionSombra()} %`,
  );

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

