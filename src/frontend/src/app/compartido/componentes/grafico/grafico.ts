import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  ChartConfiguration,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';

// Solo se registran las piezas de Chart.js que se usan (barras, líneas y tooltip):
// así el paquete que descarga el navegador es mucho más pequeño que con Chart.js completo.
Chart.register(
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
);

/** Tipos de gráfico que se pueden pintar */
export type TipoGrafico = 'bar' | 'line';

/** Colores de la app que necesita el gráfico (Chart.js dibuja en un canvas y no lee CSS) */
export interface ColoresGrafico {
  serie: string;
  texto: string;
  rejilla: string;
}

/** Datos para montar la configuración de Chart.js */
export interface DatosGrafico {
  tipo: TipoGrafico;
  etiquetas: string[];
  valores: number[];
  nombreSerie: string;
  /** Cómo se escribe un valor en el eje y en el tooltip (por ejemplo "5:17 /km") */
  formato: (valor: number) => string;
  colores: ColoresGrafico;
  /** false si el usuario ha pedido reducir el movimiento */
  animar: boolean;
}

/**
 * Monta la configuración de Chart.js a partir de los datos. Es una función aparte para
 * poder probarla sin canvas (en las pruebas no hay navegador de verdad para dibujar).
 */
export function crearConfiguracion(datos: DatosGrafico): ChartConfiguration {
  const { colores } = datos;
  return {
    type: datos.tipo,
    data: {
      labels: datos.etiquetas,
      datasets: [
        {
          label: datos.nombreSerie,
          data: datos.valores,
          backgroundColor: colores.serie,
          borderColor: colores.serie,
          borderWidth: 2,
          borderRadius: datos.tipo === 'bar' ? 6 : 0,
          pointRadius: 4,
          tension: 0.25,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: datos.animar ? undefined : false,
      plugins: {
        tooltip: {
          callbacks: {
            label: (contexto) => `${datos.nombreSerie}: ${datos.formato(contexto.parsed.y ?? 0)}`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: colores.texto },
          grid: { display: false },
        },
        y: {
          beginAtZero: datos.tipo === 'bar',
          ticks: { color: colores.texto, callback: (valor) => datos.formato(Number(valor)) },
          grid: { color: colores.rejilla },
        },
      },
    },
  };
}

/** Lee un color de las variables CSS de styles.css (con un valor por si no existe) */
function colorCss(nombre: string, porDefecto: string): string {
  const valor = getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();
  return valor || porDefecto;
}

/**
 * Gráfico de barras o de línea con Chart.js (PS-76).
 *
 * Un canvas no lo lee un lector de pantalla, así que el gráfico lleva `role="img"` y una
 * descripción con los datos (`descripcion`). Quien lo use debe dar además los datos en texto.
 */
@Component({
  selector: 'app-grafico',
  template: `<canvas #lienzo role="img" [attr.aria-label]="descripcion()"></canvas>`,
  styles: `
    :host {
      position: relative;
      display: block;
      height: 220px;
    }
  `,
})
export class Grafico {
  readonly tipo = input<TipoGrafico>('bar');
  readonly etiquetas = input.required<string[]>();
  readonly valores = input.required<number[]>();
  readonly nombreSerie = input.required<string>();
  readonly formato = input<(valor: number) => string>((valor) => String(valor));
  /** Resumen en texto del gráfico para los lectores de pantalla */
  readonly descripcion = input.required<string>();

  private readonly lienzo = viewChild.required<ElementRef<HTMLCanvasElement>>('lienzo');
  /** true cuando el canvas ya está en la página y se puede dibujar */
  private readonly enPagina = signal(false);
  private grafico: Chart | null = null;

  constructor() {
    afterNextRender(() => this.enPagina.set(true));

    // Cada vez que cambian los datos se vuelve a dibujar
    effect(() => {
      if (!this.enPagina()) {
        return;
      }
      this.dibujar(
        crearConfiguracion({
          tipo: this.tipo(),
          etiquetas: this.etiquetas(),
          valores: this.valores(),
          nombreSerie: this.nombreSerie(),
          formato: this.formato(),
          colores: {
            serie: colorCss('--color-primario', '#7c5cff'),
            texto: colorCss('--color-texto-suave', '#8b949e'),
            rejilla: colorCss('--color-borde', '#30363d'),
          },
          animar: !matchMedia('(prefers-reduced-motion: reduce)').matches,
        }),
      );
    });

    inject(DestroyRef).onDestroy(() => this.grafico?.destroy());
  }

  private dibujar(configuracion: ChartConfiguration): void {
    const contexto = this.lienzo().nativeElement.getContext('2d');
    if (!contexto) {
      return;
    }
    this.grafico?.destroy();
    this.grafico = new Chart(contexto, configuracion);
  }
}
