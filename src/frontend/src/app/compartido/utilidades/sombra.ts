import { haversineMetros } from '../../core/servicios/calculo';
import { PuntoGps } from '../../core/modelos/ruta';

/**
 * Funciones para saber dónde está la sombra en cada momento de la carrera (PS-45).
 * La sombra es una lista de puntos con los segundos en los que pasó por cada uno;
 * entre dos puntos se supone que fue a velocidad constante (interpolación lineal).
 */

/**
 * Metros recorridos desde la salida hasta cada punto (el primero siempre es 0).
 * Se calcula una vez por carrera y se reutiliza en cada actualización del reloj.
 */
export function distanciasAcumuladas(puntos: readonly PuntoGps[]): number[] {
  const acumuladas: number[] = [];
  let total = 0;
  puntos.forEach((punto, i) => {
    if (i > 0) {
      total += haversineMetros(puntos[i - 1], punto);
    }
    acumuladas.push(total);
  });
  return acumuladas;
}

/**
 * Metros que llevaba recorridos la sombra a los `segundos` de carrera.
 * Antes de la salida devuelve 0 y, cuando ya ha llegado a la meta, la distancia total.
 */
export function distanciaSombraEn(
  puntos: readonly PuntoGps[],
  acumuladas: readonly number[],
  segundos: number,
): number {
  if (puntos.length === 0) return 0;
  if (segundos <= puntos[0].tiempoSegundos) return 0;
  for (let i = 1; i < puntos.length; i++) {
    const t0 = puntos[i - 1].tiempoSegundos;
    const t1 = puntos[i].tiempoSegundos;
    if (segundos <= t1) {
      // Si dos puntos tienen el mismo tiempo, la sombra ya está en el segundo
      const parte = t1 > t0 ? (segundos - t0) / (t1 - t0) : 1;
      return acumuladas[i - 1] + parte * (acumuladas[i] - acumuladas[i - 1]);
    }
  }
  return acumuladas[acumuladas.length - 1];
}

/**
 * Segundos que tardó la sombra en recorrer `metros` desde la salida.
 * Si se piden más metros que la ruta, devuelve el tiempo de llegada a la meta.
 */
export function tiempoSombraEn(
  puntos: readonly PuntoGps[],
  acumuladas: readonly number[],
  metros: number,
): number {
  if (puntos.length === 0) return 0;
  if (metros <= 0) return puntos[0].tiempoSegundos;
  for (let i = 1; i < puntos.length; i++) {
    const d0 = acumuladas[i - 1];
    const d1 = acumuladas[i];
    // Los tramos sin distancia (la sombra parada) se saltan: lo que cuenta es cuándo se movió
    if (metros <= d1 && d1 > d0) {
      const parte = (metros - d0) / (d1 - d0);
      const t0 = puntos[i - 1].tiempoSegundos;
      return t0 + parte * (puntos[i].tiempoSegundos - t0);
    }
  }
  return puntos[puntos.length - 1].tiempoSegundos;
}
