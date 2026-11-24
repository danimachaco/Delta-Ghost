import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Grafico } from '../../../compartido/componentes/grafico/grafico';
import {
  formatearDuracion,
  formatearFecha,
  formatearKm,
  formatearRitmo,
} from '../../../compartido/utilidades/rutas';
import { ErrorApi } from '../../../core/modelos/error-api';
import { Estadisticas } from '../../../core/modelos/estadisticas';
import { EstadisticasServicio } from '../../../core/servicios/estadisticas';

/** Estados posibles de la pantalla */
type Estado = 'cargando' | 'error' | 'listo';

/** Fecha corta para el eje del gráfico: "2026-11-16" → "16 nov" */
const fechaCorta = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' });

function etiquetaSemana(inicio: string): string {
  return fechaCorta.format(new Date(`${inicio}T00:00:00`)).replace('.', '');
}

/** Segundos por km de una distancia y un tiempo, o null si no hay distancia */
function ritmo(distanciaMetros: number, tiempoSegundos: number): number | null {
  return distanciaMetros > 0 ? (tiempoSegundos / distanciaMetros) * 1000 : null;
}

/** Kilómetros con un decimal y coma: 5234 m → "5,2" */
function km(metros: number): string {
  return (metros / 1000).toFixed(1).replace('.', ',');
}

/**
 * Web de estadísticas del corredor (PS-76, /app/estadisticas).
 *
 * Con los datos de GET /api/estadisticas (PS-75) enseña tus totales, un gráfico de barras
 * con los kilómetros de cada semana y un gráfico de línea con la evolución de tu ritmo,
 * hechos con Chart.js. Debajo, las mismas cifras en texto (tabla y lista), porque un
 * gráfico dibujado en un canvas no lo puede leer un lector de pantalla.
 */
@Component({
  imports: [RouterLink, Grafico],
  selector: 'app-estadisticas',
  styleUrl: './estadisticas.css',
  templateUrl: './estadisticas.html',
})
export class EstadisticasPantalla implements OnInit {
  private readonly servicio = inject(EstadisticasServicio);

  protected readonly estado = signal<Estado>('cargando');
  protected readonly mensajeError = signal('');
  private readonly datos = signal<Estadisticas | null>(null);

  /** true si todavía no has corrido ninguna carrera */
  protected readonly vacio = computed(() => (this.datos()?.totales.carreras ?? 0) === 0);

  /** Las cuatro cifras de arriba */
  protected readonly totales = computed(() => {
    const t = this.datos()?.totales;
    if (!t) {
      return [];
    }
    return [
      { nombre: 'Carreras', valor: String(t.carreras) },
      { nombre: 'Distancia', valor: formatearKm(t.distanciaMetros / 1000) },
      { nombre: 'Tiempo', valor: formatearDuracion(t.tiempoSegundos) },
      { nombre: 'Ritmo medio', valor: formatearRitmo(ritmo(t.distanciaMetros, t.tiempoSegundos)) },
    ];
  });

  // ---- Gráfico 1: kilómetros por semana (barras) ----
  private readonly semanas = computed(() => this.datos()?.semanas ?? []);
  protected readonly etiquetasSemanas = computed(() =>
    this.semanas().map((s) => etiquetaSemana(s.inicio)),
  );
  protected readonly kmSemanas = computed(() =>
    this.semanas().map((s) => Math.round(s.distanciaMetros / 100) / 10),
  );
  protected readonly formatoKm = (valor: number) => `${String(valor).replace('.', ',')} km`;
  protected readonly descripcionSemanas = computed(
    () =>
      'Kilómetros por semana: ' +
      this.semanas()
        .map((s) => `semana del ${etiquetaSemana(s.inicio)}, ${km(s.distanciaMetros)} km`)
        .join('; '),
  );
  /** Filas de la tabla con los mismos datos del gráfico */
  protected readonly filasSemanas = computed(() =>
    this.semanas().map((s) => ({
      semana: etiquetaSemana(s.inicio),
      carreras: s.carreras,
      distancia: formatearKm(s.distanciaMetros / 1000),
    })),
  );

  // ---- Gráfico 2: evolución del ritmo (línea) ----
  /** Carreras con distancia (sin ella no hay ritmo), de la más antigua a la más reciente */
  private readonly carrerasConRitmo = computed(() =>
    (this.datos()?.carreras ?? []).filter((c) => c.distanciaMetros > 0),
  );
  protected readonly etiquetasRitmo = computed(() =>
    this.carrerasConRitmo().map((c) => etiquetaSemana(c.fecha.slice(0, 10))),
  );
  /** Ritmo en minutos por km (5,28 = 5:17 /km), que es lo que dibuja el gráfico */
  protected readonly minutosPorKm = computed(() =>
    this.carrerasConRitmo().map(
      (c) => Math.round(((ritmo(c.distanciaMetros, c.tiempoSegundos) ?? 0) / 60) * 100) / 100,
    ),
  );
  protected readonly formatoRitmo = (minutos: number) => formatearRitmo(minutos * 60);
  protected readonly descripcionRitmo = computed(
    () =>
      'Ritmo de tus últimas carreras: ' +
      this.carrerasConRitmo()
        .map(
          (c) =>
            `${etiquetaSemana(c.fecha.slice(0, 10))}, ${formatearRitmo(ritmo(c.distanciaMetros, c.tiempoSegundos))}`,
        )
        .join('; '),
  );

  /** Lista de las últimas carreras, de la más reciente a la más antigua */
  protected readonly ultimas = computed(() =>
    [...(this.datos()?.carreras ?? [])].reverse().map((c, i) => ({
      clave: `${c.fecha}-${i}`,
      ruta: c.rutaNombre,
      fecha: formatearFecha(c.fecha),
      distancia: formatearKm(c.distanciaMetros / 1000),
      tiempo: formatearDuracion(c.tiempoSegundos),
      ritmo: formatearRitmo(ritmo(c.distanciaMetros, c.tiempoSegundos)),
      mejorMarca: c.mejorMarca,
    })),
  );

  ngOnInit(): void {
    this.cargar();
  }

  /** Pide las estadísticas al backend (también se usa en el botón "Reintentar") */
  protected cargar(): void {
    this.estado.set('cargando');
    this.servicio.mias().subscribe({
      next: (datos) => {
        this.datos.set(datos);
        this.estado.set('listo');
      },
      error: (error: ErrorApi) => {
        // 404: el servidor todavía no tiene la API de estadísticas (PS-75)
        this.mensajeError.set(
          error.estado === 404 ? 'Las estadísticas todavía no están disponibles.' : error.mensaje,
        );
        this.estado.set('error');
      },
    });
  }
}
