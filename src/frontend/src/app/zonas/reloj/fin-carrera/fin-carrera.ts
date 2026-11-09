import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FlechaSector } from '../../../compartido/componentes/flecha-sector/flecha-sector';
import { formatearDiferencia } from '../../../compartido/utilidades/formato-tiempo';
import {
  formatearDuracion,
  formatearKm,
  formatearRitmo,
} from '../../../compartido/utilidades/rutas';
import { ErrorApi } from '../../../core/modelos/error-api';
import { Ruta } from '../../../core/modelos/ruta';
import { ColorSector, ResultadoSector, Sector } from '../../../core/modelos/sombra';
import { Calculo } from '../../../core/servicios/calculo';
import { Carrera } from '../../../core/servicios/carrera';
import { Rutas } from '../../../core/servicios/rutas';
import { Sectores } from '../../../core/servicios/sectores';

/** Radio del anillo de sectores (en unidades del viewBox 0–100 del SVG) */
const RADIO_ANILLO = 46;
/** Hueco entre dos sectores del anillo, en las mismas unidades */
const HUECO_ANILLO = 2.5;

/** Un trozo del anillo: un sector de la ruta pintado en verde, rojo o gris (sin correr) */
interface ArcoSector {
  numero: number;
  color: ColorSector | 'pendiente';
  /** stroke-dasharray del trozo: "largo hueco" */
  trazo: string;
  /** stroke-dashoffset para colocarlo en su sitio del anillo */
  desplazamiento: number;
}

/** Estados del botón Guardar */
type EstadoGuardado = 'sin-guardar' | 'guardando' | 'guardada' | 'error';

/**
 * Pantalla de fin de carrera del reloj (PS-62, /reloj/fin), según el mockup "3 · Resumen".
 *
 * Al acabar la carrera, el reloj enseña el resultado final: tiempo, diferencia con la sombra,
 * distancia, ritmo y cuántos sectores has ganado, con un anillo partido en sectores en verde
 * (mejor que la sombra) o rojo (peor). Los sectores se calculan con la lógica de la PS-48
 * a partir de tus puntos GPS. Si has llegado a la meta, puedes guardar la carrera en el
 * backend (POST /api/rutas/{id}/carreras, PS-33), que decide si es tu nueva sombra.
 */
@Component({
  imports: [RouterLink, FlechaSector],
  selector: 'app-fin-carrera',
  styleUrl: './fin-carrera.css',
  templateUrl: './fin-carrera.html',
})
export class FinCarrera {
  protected readonly carrera = inject(Carrera);
  private readonly calculo = inject(Calculo);
  private readonly sectores = inject(Sectores);
  private readonly rutas = inject(Rutas);

  protected readonly estadoGuardado = signal<EstadoGuardado>('sin-guardar');
  protected readonly errorGuardado = signal<string | null>(null);
  /** true si el backend dice que esta carrera es tu nueva sombra */
  protected readonly nuevaSombra = signal(false);

  /** Hay datos que enseñar: la carrera ha terminado (o se ha parado antes de la meta) */
  protected readonly hayCarrera = computed(() => this.carrera.estado() === 'terminada');

  protected readonly tiempo = computed(() => formatearDuracion(this.carrera.segundos()));

  /** Diferencia final con la sombra: negativa = has sido más rápido */
  private readonly diferencia = computed(() => this.carrera.diferencia() ?? 0);
  protected readonly ganaste = computed(() => this.diferencia() <= 0);
  protected readonly textoDiferencia = computed(
    () => `${formatearDiferencia(this.diferencia())} vs sombra`,
  );

  protected readonly distancia = computed(() => formatearKm(this.carrera.distanciaMetros() / 1000));
  protected readonly ritmo = computed(() =>
    formatearRitmo(this.calculo.ritmo(this.carrera.distanciaMetros(), this.carrera.segundos())),
  );

  /**
   * Resultado de cada sector que has terminado. Se repite tu recorrido punto a punto
   * con la comparación por sectores de la PS-48 (la misma que avisa durante la carrera).
   */
  private readonly resultados = computed<readonly ResultadoSector[]>(() => {
    const ruta = this.carrera.ruta();
    const sombra = this.carrera.sombra();
    const puntos = this.carrera.puntos();
    if (!ruta || !sombra || puntos.length < 2) {
      return [];
    }
    const comparacion = this.sectores.comparar(ruta.puntos, sombra.puntos, this.sectoresRuta(ruta));
    // Si has llegado a la meta, tu último punto cuenta como la meta exacta: el GPS suele
    // quedarse unos metros corto y el último sector no se daría nunca por terminado
    const meta = this.sectores.limites(ruta.puntos, this.sectoresRuta(ruta)).at(-1)?.metrosFin ?? 0;
    const completada = this.carrera.completada();
    let metros = 0;
    puntos.forEach((punto, i) => {
      if (i > 0) {
        metros += this.calculo.distancia(puntos[i - 1], punto);
      }
      const ultimo = i === puntos.length - 1;
      comparacion.actualizar(
        ultimo && completada ? Math.max(metros, meta) : metros,
        punto.tiempoSegundos,
      );
    });
    return comparacion.resultados;
  });

  /** Número total de sectores de la ruta (los corridos y los que no) */
  private readonly totalSectores = computed(() => {
    const ruta = this.carrera.ruta();
    return ruta ? this.sectores.limites(ruta.puntos, this.sectoresRuta(ruta)).length : 0;
  });

  /** Sectores en verde (iguales o mejores que la sombra) */
  private readonly ganados = computed(
    () => this.resultados().filter((r) => r.color === 'verde').length,
  );

  /** "2/3": sectores ganados de los que tiene la ruta */
  protected readonly textoSectores = computed(() => `${this.ganados()}/${this.totalSectores()}`);

  /** Lo mismo dicho con palabras para los lectores de pantalla */
  protected readonly descripcionSectores = computed(
    () => `Has mejorado a tu sombra en ${this.ganados()} de ${this.totalSectores()} sectores`,
  );

  /** Trozos del anillo, uno por sector, empezando arriba y en el sentido de las agujas del reloj */
  protected readonly arcos = computed<ArcoSector[]>(() => {
    const total = this.totalSectores();
    if (total === 0) {
      return [];
    }
    const circunferencia = 2 * Math.PI * RADIO_ANILLO;
    const largo = circunferencia / total;
    const resultados = this.resultados();
    return Array.from({ length: total }, (_, i) => ({
      numero: i + 1,
      color: resultados[i]?.color ?? 'pendiente',
      trazo: `${Math.max(0, largo - HUECO_ANILLO)} ${circunferencia}`,
      desplazamiento: -i * largo,
    }));
  });

  protected readonly radioAnillo = RADIO_ANILLO;

  /** Solo se guarda una carrera que ha llegado a la meta: una a medias tendría un tiempo falso */
  protected readonly puedeGuardar = computed(() => this.hayCarrera() && this.carrera.completada());

  /** Envía la carrera al backend; él decide si es la nueva sombra */
  protected guardar(): void {
    const ruta = this.carrera.ruta();
    if (!ruta || !this.puedeGuardar() || this.estadoGuardado() === 'guardando') {
      return;
    }
    this.estadoGuardado.set('guardando');
    this.errorGuardado.set(null);
    this.rutas.subirCarrera(ruta.id, this.carrera.puntos()).subscribe({
      next: (guardada) => {
        this.nuevaSombra.set(guardada.mejorMarca);
        this.estadoGuardado.set('guardada');
      },
      error: (error: ErrorApi) => {
        this.errorGuardado.set(error.mensaje);
        this.estadoGuardado.set('error');
      },
    });
  }

  /** Sectores de la ruta que trae la sombra; si no trae, se reparten por defecto (PS-48) */
  private sectoresRuta(ruta: Ruta): readonly Sector[] {
    const sectores = this.carrera.sombra()?.sectores ?? [];
    return sectores.length > 0 ? sectores : this.sectores.dividir(ruta.puntos.length);
  }
}
