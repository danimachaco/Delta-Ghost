import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ErrorCarreraInvalida } from '../../../compartido/utilidades/validar-carrera';
import {
  EstadoSimulacion,
  SimuladorGpsService,
  VELOCIDADES,
} from '../../../core/servicios/simulador-gps.service';

const ETIQUETAS: Record<EstadoSimulacion, string> = {
  'sin-carrera': 'Sin carrera cargada',
  detenida: 'Lista para reproducir',
  reproduciendo: 'Reproduciendo',
  pausada: 'En pausa',
  terminada: 'Carrera terminada',
};

/**
 * Panel de pruebas y demos (/reloj/simulador): carga una carrera en JSON y la
 * reproduce como si viniera del GPS. Es una herramienta de equipo, no una
 * pantalla del producto, por eso vive aparte de la pantalla del reloj.
 */
@Component({
  imports: [RouterLink, DecimalPipe],
  selector: 'app-simulador-panel',
  styleUrl: './simulador-panel.css',
  templateUrl: './simulador-panel.html',
})
export class SimuladorPanel {
  protected readonly simulador = inject(SimuladorGpsService);
  protected readonly velocidades = VELOCIDADES;
  protected readonly errores = signal<string[]>([]);
  protected readonly etiquetaEstado = computed(() => ETIQUETAS[this.simulador.estado()]);

  /** Se ejecuta al elegir un archivo .json */
  protected async alElegirArchivo(evento: Event): Promise<void> {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;
    await this.cargarTexto(() => archivo.text());
    input.value = ''; // permite volver a elegir el mismo archivo
  }

  /** Carga el JSON de ejemplo incluido en la app (public/carreras) */
  protected async cargarEjemplo(): Promise<void> {
    await this.cargarTexto(async () => {
      const respuesta = await fetch('carreras/ejemplo-parque.json');
      if (!respuesta.ok) throw new Error('No se encontró la carrera de ejemplo.');
      return respuesta.text();
    });
  }

  private async cargarTexto(leer: () => Promise<string>): Promise<void> {
    try {
      this.simulador.cargarJson(await leer());
      this.errores.set([]);
    } catch (e) {
      this.errores.set(
        e instanceof ErrorCarreraInvalida ? e.errores : ['No se pudo leer el archivo.'],
      );
    }
  }
}
