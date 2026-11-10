import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { RankingRuta } from '../modelos/ranking';
import { Api } from './api';

/**
 * Servicio del ranking: habla con /api/rutas/{id}/ranking del backend (PS-64)
 * a través del servicio Api. Necesita sesión iniciada.
 */
@Service()
export class Ranking {
  private readonly api = inject(Api);

  /** Ranking de una ruta, del corredor más rápido al más lento → GET /api/rutas/{id}/ranking */
  deRuta(rutaId: string): Observable<RankingRuta> {
    return this.api.get<RankingRuta>(`rutas/${encodeURIComponent(rutaId)}/ranking`);
  }
}
