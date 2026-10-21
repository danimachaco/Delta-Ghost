/**
 * Modelos de las rutas. Coinciden con los DTO del backend Spring Boot
 * (PuntoGps.java y RutaResponse.java).
 */

/** Punto GPS de una carrera */
export interface PuntoGps {
  /** Latitud en grados */
  latitud: number;
  /** Longitud en grados */
  longitud: number;
  /** Segundos transcurridos desde el inicio de la carrera */
  tiempoSegundos: number;
}

/** Carrera guardada, tal y como la devuelve GET /api/rutas */
export interface Ruta {
  id: string;
  nombre: string;
  /** Fecha en formato ISO, p. ej. "2026-10-18T09:12:00" */
  fecha: string;
  puntos: PuntoGps[];
}
