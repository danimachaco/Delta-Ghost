/**
 * Modelos del ranking de una ruta. Es el contrato de la API de la PS-64
 * (GET /api/rutas/{id}/ranking), anotado también en CLAUDE.md.
 */

/** Un corredor en el ranking: su mejor carrera en la ruta */
export interface EntradaRanking {
  /** Puesto, empezando en 1 (el más rápido) */
  posicion: number;
  /** Quién ha corrido. Solo id y nombre: el email de otros corredores no se enseña. */
  usuario: { id: string; nombre: string };
  /** Tiempo de su mejor carrera en la ruta, en segundos */
  tiempoTotalSegundos: number;
  /** Fecha ISO de esa carrera */
  fecha: string;
}

/** Ranking de una ruta → GET /api/rutas/{id}/ranking */
export interface RankingRuta {
  rutaId: string;
  rutaNombre: string;
  /** Del más rápido al más lento, una entrada por corredor */
  entradas: EntradaRanking[];
}
