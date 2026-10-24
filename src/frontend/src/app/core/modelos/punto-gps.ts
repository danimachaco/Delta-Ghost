/** Punto GPS de una carrera (igual que el PuntoGps del backend). */
export interface PuntoGps {
  latitud: number;
  longitud: number;
  /** Segundos transcurridos desde el inicio de la carrera */
  tiempoSegundos: number;
}

/** Lectura en vivo del GPS del dispositivo. */
export interface PosicionGps {
  latitud: number;
  longitud: number;
  /** Precisión en metros (cuanto menor, mejor) */
  precision: number;
}
