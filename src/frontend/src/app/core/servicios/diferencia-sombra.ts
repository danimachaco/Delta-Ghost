import { inject, Service } from '@angular/core';
import { PuntoGps } from '../modelos/ruta';
import { Calculo } from './calculo';

/**
 * Recorrido de la sombra preparado para hacer cálculos rápidos (PS-43).
 *
 * Al crearlo se calcula UNA vez la distancia acumulada hasta cada punto, así cada
 * lectura del GPS (una por segundo) solo tiene que buscar en qué tramo cae y
 * repartir proporcionalmente (interpolación lineal) entre los dos puntos del tramo.
 */
export class PerfilSombra {
  /** Metros recorridos por la sombra al llegar a cada punto: [0, 40, 95, …] */
  readonly acumulados: readonly number[];
  /** Distancia total de la sombra en metros */
  readonly distanciaTotal: number;
  /** Tiempo total de la sombra en segundos (el del último punto) */
  readonly tiempoTotal: number;

  constructor(
    private readonly puntos: readonly PuntoGps[],
    calculo: Calculo,
  ) {
    const acumulados = [0];
    for (let i = 1; i < puntos.length; i++) {
      acumulados.push(acumulados[i - 1] + calculo.distancia(puntos[i - 1], puntos[i]));
    }
    this.acumulados = acumulados;
    this.distanciaTotal = acumulados[acumulados.length - 1];
    this.tiempoTotal = puntos.at(-1)?.tiempoSegundos ?? 0;
  }

  /** Hace falta al menos un tramo (2 puntos) para poder comparar */
  get valido(): boolean {
    return this.puntos.length >= 2;
  }

  /**
   * Segundos que tardó la sombra en recorrer `metros`.
   * Si la sombra se paró (tramo de 0 m) se toma el primer momento en que llegó a ese sitio.
   * Por encima de la distancia total devuelve el tiempo total (la sombra ya ha llegado a meta).
   */
  tiempoEnDistancia(metros: number): number {
    if (!this.valido) {
      return 0;
    }
    const m = Math.min(this.distanciaTotal, Math.max(0, metros));
    const i = this.tramo(this.acumulados, m);
    const largo = this.acumulados[i + 1] - this.acumulados[i];
    const fraccion = largo > 0 ? (m - this.acumulados[i]) / largo : 0;
    const t0 = this.puntos[i].tiempoSegundos;
    return t0 + fraccion * (this.puntos[i + 1].tiempoSegundos - t0);
  }

  /** Metros que llevaba recorridos la sombra a los `segundos` de carrera (para dibujar su punto) */
  distanciaEnTiempo(segundos: number): number {
    if (!this.valido) {
      return 0;
    }
    const tiempos = this.puntos.map((p) => p.tiempoSegundos);
    const s = Math.min(this.tiempoTotal, Math.max(tiempos[0], segundos));
    const i = this.tramo(tiempos, s);
    const duracion = tiempos[i + 1] - tiempos[i];
    const fraccion = duracion > 0 ? (s - tiempos[i]) / duracion : 1;
    return this.acumulados[i] + fraccion * (this.acumulados[i + 1] - this.acumulados[i]);
  }

  /** Primer tramo [i, i+1] cuyo final alcanza `valor` (los valores van de menor a mayor) */
  private tramo(valores: readonly number[], valor: number): number {
    let i = 0;
    while (i < valores.length - 2 && valores[i + 1] < valor) {
      i++;
    }
    return i;
  }
}

/** Resultado de comparar al corredor con su sombra en un momento de la carrera */
export interface Diferencia {
  /**
   * Segundos de diferencia en el mismo punto del recorrido: los que lleva el corredor
   * menos los que tardó la sombra en llegar ahí. Negativo = vas mejor (verde), positivo = peor (rojo).
   */
  segundos: number;
  /** Metros que el corredor saca a la sombra (positivo) o que le faltan (negativo) en este instante */
  metros: number;
  /** Progreso de la sombra en la ruta, de 0 (salida) a 1 (meta), para el punto del reloj */
  progresoSombra: number;
}

/**
 * Calcula la diferencia del corredor con su sombra (PS-43).
 *
 * La comparación se hace por distancia recorrida, no por posición GPS: cuando el corredor
 * lleva X metros se mira cuánto tardó la sombra en hacer esos mismos X metros. Así no
 * importa que los puntos GPS de las dos carreras no caigan exactamente en el mismo sitio.
 */
@Service()
export class DiferenciaSombra {
  private readonly calculo = inject(Calculo);

  /** Último perfil creado, para no recalcular las distancias en cada lectura del GPS */
  private ultimo: { puntos: readonly PuntoGps[]; perfil: PerfilSombra } | null = null;

  /** Prepara el recorrido de la sombra (se reutiliza si se pasa la misma lista de puntos) */
  perfil(puntos: readonly PuntoGps[]): PerfilSombra {
    if (this.ultimo?.puntos !== puntos) {
      this.ultimo = { puntos, perfil: new PerfilSombra(puntos, this.calculo) };
    }
    return this.ultimo.perfil;
  }

  /**
   * Diferencia con la sombra cuando el corredor lleva `metros` recorridos en `segundos`.
   * Devuelve null si la sombra no tiene al menos 2 puntos.
   */
  calcular(sombra: readonly PuntoGps[], metros: number, segundos: number): Diferencia | null {
    const perfil = this.perfil(sombra);
    if (!perfil.valido) {
      return null;
    }
    const distanciaSombra = perfil.distanciaEnTiempo(segundos);
    return {
      segundos: segundos - perfil.tiempoEnDistancia(metros),
      metros: metros - distanciaSombra,
      progresoSombra: perfil.distanciaTotal > 0 ? distanciaSombra / perfil.distanciaTotal : 0,
    };
  }
}
