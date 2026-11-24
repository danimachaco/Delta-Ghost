/**
 * Modelos de las estadísticas del corredor. Es el contrato de la API de la PS-75
 * (GET /api/estadisticas), anotado también en CLAUDE.md.
 */

/** Totales de todas tus carreras */
export interface TotalesEstadisticas {
  carreras: number;
  distanciaMetros: number;
  tiempoSegundos: number;
  /** Rutas distintas que has corrido */
  rutas: number;
}

/** Lo que has corrido en una semana (de lunes a domingo) */
export interface SemanaEstadisticas {
  /** Lunes de la semana, en formato ISO (2026-11-16) */
  inicio: string;
  carreras: number;
  distanciaMetros: number;
  tiempoSegundos: number;
}

/** Una carrera, para ver cómo evoluciona tu ritmo */
export interface CarreraEstadisticas {
  /** Fecha ISO de la carrera */
  fecha: string;
  rutaId: string;
  rutaNombre: string;
  distanciaMetros: number;
  tiempoSegundos: number;
  /** true si esa carrera es tu mejor marca en la ruta */
  mejorMarca: boolean;
}

/** Estadísticas del usuario → GET /api/estadisticas */
export interface Estadisticas {
  totales: TotalesEstadisticas;
  /** Las últimas 8 semanas, de la más antigua a la más reciente (también las que tienen 0 carreras) */
  semanas: SemanaEstadisticas[];
  /** Tus últimas 20 carreras, de la más antigua a la más reciente */
  carreras: CarreraEstadisticas[];
}
