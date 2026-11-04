/** Punto GPS de una carrera (igual que el PuntoGps del backend). */
export interface PuntoGps {
  /** Latitud en grados (-90 a 90) */
  latitud: number;
  /** Longitud en grados (-180 a 180) */
  longitud: number;
  /** Segundos transcurridos desde el inicio de la carrera */
  tiempoSegundos: number;
  /** Precisión del GPS en metros (opcional; la usará el filtro de la historia 30) */
  precision?: number;
}

/** Lectura en vivo del GPS del dispositivo. */
export interface PosicionGps {
  latitud: number;
  longitud: number;
  /** Precisión en metros (cuanto menor, mejor) */
  precision: number;
}
