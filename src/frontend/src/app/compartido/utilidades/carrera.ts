import { Carrera, Sector } from '../../core/modelos/carrera';

/** Redondea a 1 decimal para evitar ruido de coma flotante (…99999). */
function redondear(valor: number): number {
  const r = Math.round(valor * 10) / 10;
  return r === 0 ? 0 : r;
}

export function tiempoTotal(carrera: Carrera): number {
  return carrera.sectores.reduce((suma, s) => suma + s.tiempoSegundos, 0);
}

export function tiempoSombraTotal(carrera: Carrera): number {
  return carrera.sectores.reduce((suma, s) => suma + s.sombraSegundos, 0);
}

/** Diferencia final con la sombra: negativa si el corredor ha ido más rápido. */
export function diferenciaTotal(carrera: Carrera): number {
  return redondear(tiempoTotal(carrera) - tiempoSombraTotal(carrera));
}

/** Diferencia en un sector: negativa = mejor que la sombra. */
export function diferenciaSector(sector: Sector): number {
  return redondear(sector.tiempoSegundos - sector.sombraSegundos);
}

/** Mismo criterio que el reloj: empatar o ir por delante cuenta como "mejor". */
export function sectorMejor(sector: Sector): boolean {
  return diferenciaSector(sector) <= 0;
}

/** true si la carrera completa es más rápida que la sombra (será la nueva sombra). */
export function mejoraSombra(carrera: Carrera): boolean {
  return carrera.sectores.length > 0 && diferenciaTotal(carrera) < 0;
}
