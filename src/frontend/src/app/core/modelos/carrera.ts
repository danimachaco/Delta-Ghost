/** Distancia de cada sector por defecto (criterio de la HU-47). */
export const DISTANCIA_SECTOR_METROS = 500;

/** Un sector de una carrera comparado con el mismo sector de la sombra. */
export interface Sector {
  /** Número de sector, empezando en 1 */
  indice: number;
  /** Segundos que ha tardado el corredor */
  tiempoSegundos: number;
  /** Segundos que tardó la sombra en ese mismo sector */
  sombraSegundos: number;
}

/** Una carrera terminada, lista para mostrar en el resumen. */
export interface Carrera {
  rutaNombre: string;
  sectores: Sector[];
}
