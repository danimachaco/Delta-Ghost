import { Service } from '@angular/core';

/** Cualquier cosa con latitud y longitud: sirve para PuntoGps (rutas) y PosicionGps (GPS en vivo). */
export interface Coordenada {
  /** Latitud en grados */
  latitud: number;
  /** Longitud en grados */
  longitud: number;
}

/** Radio medio de la Tierra en metros */
export const RADIO_TIERRA_M = 6_371_000;

/**
 * Distancia en metros entre dos puntos GPS con la fórmula del semiverseno (Haversine).
 * Tiene en cuenta que la Tierra es (casi) una esfera, así que es exacta para las
 * distancias de una carrera (el error es menor del 0,5 %).
 *
 * Se exporta también como función suelta para poder usarla en utilidades que no son servicios.
 */
export function haversineMetros(a: Coordenada, b: Coordenada): number {
  const rad = (grados: number) => (grados * Math.PI) / 180;
  const dLat = rad(b.latitud - a.latitud);
  const dLon = rad(b.longitud - a.longitud);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitud)) * Math.cos(rad(b.latitud)) * Math.sin(dLon / 2) ** 2;
  // min(1, …) evita errores de redondeo en puntos casi opuestos del planeta
  return 2 * RADIO_TIERRA_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Servicio de cálculo de la carrera: distancias, velocidad y ritmo.
 * Lo usan el filtro del GPS, la grabación de rutas y el reloj, para que
 * todos calculen exactamente igual.
 */
@Service()
export class Calculo {
  /** Distancia en metros entre dos puntos (fórmula de Haversine) */
  distancia(a: Coordenada, b: Coordenada): number {
    return haversineMetros(a, b);
  }

  /** Distancia total en metros de un recorrido: suma de los tramos entre puntos consecutivos */
  distanciaTotal(puntos: readonly Coordenada[]): number {
    let total = 0;
    for (let i = 1; i < puntos.length; i++) {
      total += haversineMetros(puntos[i - 1], puntos[i]);
    }
    return total;
  }

  /** Velocidad media en metros por segundo (0 si el tiempo no es positivo) */
  velocidad(metros: number, segundos: number): number {
    return segundos > 0 ? metros / segundos : 0;
  }

  /**
   * Ritmo en segundos por kilómetro, como lo miden los corredores (p. ej. 317 s/km = 5:17 /km).
   * Devuelve null si todavía no se ha recorrido distancia, porque el ritmo sería infinito.
   */
  ritmo(metros: number, segundos: number): number | null {
    return metros > 0 && segundos >= 0 ? (segundos / metros) * 1000 : null;
  }
}
