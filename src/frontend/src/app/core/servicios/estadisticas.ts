import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { Estadisticas } from '../modelos/estadisticas';
import { Api } from './api';

/** Semanas del gráfico de barras: dos meses se leen bien en la pantalla de un móvil */
export const SEMANAS_ESTADISTICAS = 8;

/**
 * Servicio de estadísticas: habla con /api/estadisticas del backend (PS-75)
 * a través del servicio Api. Necesita sesión iniciada.
 */
@Service()
export class EstadisticasServicio {
  private readonly api = inject(Api);

  /** Tus totales, km por semana, tiempos por ruta y últimas carreras → GET /api/estadisticas */
  mias(semanas = SEMANAS_ESTADISTICAS): Observable<Estadisticas> {
    return this.api.get<Estadisticas>('estadisticas', { semanas });
  }
}
