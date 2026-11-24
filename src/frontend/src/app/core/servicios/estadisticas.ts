import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { Estadisticas } from '../modelos/estadisticas';
import { Api } from './api';

/**
 * Servicio de estadísticas: habla con /api/estadisticas del backend (PS-75)
 * a través del servicio Api. Necesita sesión iniciada.
 */
@Service()
export class EstadisticasServicio {
  private readonly api = inject(Api);

  /** Tus totales, km por semana y últimas carreras → GET /api/estadisticas */
  mias(): Observable<Estadisticas> {
    return this.api.get<Estadisticas>('estadisticas');
  }
}
