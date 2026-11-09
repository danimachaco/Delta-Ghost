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

/** Datos para guardar una ruta nueva → POST /api/rutas (RutaRequest del backend) */
export interface NuevaRuta {
  /** Nombre de la ruta (obligatorio, máximo 60 caracteres) */
  nombre: string;
  /** Al menos 2 puntos, con tiempos que nunca van hacia atrás */
  puntos: PuntoGps[];
}

/** Carrera guardada, tal y como la devuelve POST /api/rutas/{id}/carreras (CarreraResponse del backend) */
export interface CarreraGuardada {
  id: string;
  rutaId: string;
  /** Fecha en formato ISO */
  fecha: string;
  tiempoTotalSegundos: number;
  /** true si esta carrera es ahora la sombra de la ruta (la mejor marca) */
  mejorMarca: boolean;
  puntos: PuntoGps[];
}
