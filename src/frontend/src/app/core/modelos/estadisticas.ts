/**
 * Modelos de las estadísticas del corredor: lo que responde GET /api/estadisticas
 * (PS-75, `EstadisticasResponse` del backend), anotado también en CLAUDE.md.
 * Distancias en metros, tiempos en segundos y ritmos en segundos por km.
 */

/** Totales de todas tus carreras (incluida la grabación de tus rutas) */
export interface ResumenEstadisticas {
  carreras: number;
  /** Rutas distintas que has corrido */
  rutasCorridas: number;
  distanciaTotalMetros: number;
  tiempoTotalSegundos: number;
  /** Tiempo total entre distancia total; null si aún no has corrido */
  ritmoMedioSegundosKm: number | null;
  /** Ritmo de tu carrera más rápida por km; null si aún no has corrido */
  mejorRitmoSegundosKm: number | null;
  carreraMasLargaMetros: number;
}

/** Lo que has corrido en una semana (de lunes a domingo) */
export interface SemanaEstadisticas {
  /** Lunes de la semana, en formato ISO (2026-11-16) */
  inicio: string;
  carreras: number;
  distanciaMetros: number;
  tiempoSegundos: number;
}

/** Tus tiempos en una ruta */
export interface RutaEstadisticas {
  rutaId: string;
  nombre: string;
  carreras: number;
  primerTiempoSegundos: number;
  mejorTiempoSegundos: number;
  ultimoTiempoSegundos: number;
  /** Cuánto has bajado desde la primera vez (primer tiempo − mejor tiempo) */
  mejoraSegundos: number;
}

/** Una carrera, para ver cómo evoluciona tu ritmo */
export interface CarreraEstadisticas {
  /** null si es la grabación de la ruta */
  carreraId: string | null;
  rutaId: string;
  rutaNombre: string;
  /** Fecha y hora ISO de la carrera */
  fecha: string;
  tiempoTotalSegundos: number;
  distanciaMetros: number;
  /** null si la carrera no tiene distancia */
  ritmoSegundosKm: number | null;
}

/** Estadísticas del usuario → GET /api/estadisticas?semanas=N */
export interface Estadisticas {
  resumen: ResumenEstadisticas;
  /** Las últimas N semanas, de la más antigua a la actual (también las que tienen 0 carreras) */
  semanas: SemanaEstadisticas[];
  /** Una fila por ruta que has corrido */
  rutas: RutaEstadisticas[];
  /** Tus últimas carreras (hasta 50), de la más antigua a la más reciente */
  evolucion: CarreraEstadisticas[];
}
