import { inject, Service } from '@angular/core';
import { PosicionGps } from '../modelos/punto-gps';
import { Calculo } from './calculo';

/** Precisión máxima aceptada en metros (la misma que marca en verde la pantalla GPS) */
export const PRECISION_MAXIMA_M = 20;

/**
 * Velocidad máxima creíble para un corredor en m/s (43 km/h). Ni el récord del mundo
 * de 100 m llega a 12,5 m/s de media, así que algo más rápido es un error del GPS.
 */
export const VELOCIDAD_MAXIMA_MS = 12;

/** Por qué se descarta una lectura del GPS */
export type MotivoDescarte = 'precision' | 'salto' | 'repetida';

/** Resultado de pasar una lectura por el filtro */
export interface ResultadoFiltro {
  aceptada: boolean;
  /** null si la lectura es buena */
  motivo: MotivoDescarte | null;
}

/**
 * Filtro de lecturas del GPS. Descarta las que no sirven para medir una carrera:
 *  - **precision**: el propio GPS dice que puede fallar en más de 20 m.
 *  - **salto**: para llegar desde la última lectura buena habría que ir a más de 43 km/h.
 *  - **repetida**: llega con la misma hora (o anterior) que la última buena; el navegador
 *    a veces repite una posición guardada.
 *
 * Los saltos se miden siempre contra la última lectura ACEPTADA. Así, si una lectura mala
 * se colara, el filtro se corrige solo: el tiempo desde ella va creciendo y las lecturas
 * buenas siguientes vuelven a parecer creíbles.
 */
@Service()
export class FiltroGps {
  private readonly calculo = inject(Calculo);

  /** Última lectura aceptada y su hora en milisegundos */
  private ultima: { posicion: PosicionGps; marcaTiempo: number } | null = null;

  /**
   * Decide si una lectura es buena. Si lo es, pasa a ser la referencia para la siguiente.
   * @param marcaTiempo hora de la lectura en milisegundos (GeolocationPosition.timestamp)
   */
  evaluar(posicion: PosicionGps, marcaTiempo: number): ResultadoFiltro {
    // "!(… <= …)" también descarta precisiones que no son un número (NaN)
    if (!(posicion.precision <= PRECISION_MAXIMA_M)) {
      return descartar('precision');
    }

    if (this.ultima) {
      const segundos = (marcaTiempo - this.ultima.marcaTiempo) / 1000;
      if (segundos <= 0) {
        return descartar('repetida');
      }
      const metros = this.calculo.distancia(this.ultima.posicion, posicion);
      if (this.calculo.velocidad(metros, segundos) > VELOCIDAD_MAXIMA_MS) {
        return descartar('salto');
      }
    }

    this.ultima = { posicion, marcaTiempo };
    return { aceptada: true, motivo: null };
  }

  /** Olvida la última lectura: se llama al empezar una carrera o una grabación nueva. */
  reiniciar(): void {
    this.ultima = null;
  }
}

function descartar(motivo: MotivoDescarte): ResultadoFiltro {
  return { aceptada: false, motivo };
}
