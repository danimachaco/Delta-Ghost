import { PuntoGps } from '../../core/modelos/punto-gps';

const RADIO_TIERRA_M = 6371000;

/** Distancia en metros entre dos puntos (fórmula de Haversine). */
export function distanciaMetros(a: PuntoGps, b: PuntoGps): number {
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.latitud - a.latitud);
  const dLon = rad(b.longitud - a.longitud);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitud)) * Math.cos(rad(b.latitud)) * Math.sin(dLon / 2) ** 2;
  return 2 * RADIO_TIERRA_M * Math.asin(Math.sqrt(h));
}

/** Distancia acumulada en cada punto (el primero vale 0). */
export function distanciasAcumuladas(puntos: PuntoGps[]): number[] {
  const acumuladas = [0];
  for (let i = 1; i < puntos.length; i++) {
    acumuladas.push(acumuladas[i - 1] + distanciaMetros(puntos[i - 1], puntos[i]));
  }
  return acumuladas;
}
