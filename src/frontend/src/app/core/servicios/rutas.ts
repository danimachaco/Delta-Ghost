import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { NuevaRuta, Ruta } from '../modelos/ruta';
import { Api } from './api';

/**
 * Servicio de rutas: habla con /api/rutas del backend a través del servicio Api.
 * Lee rutas y guarda las nuevas; editar y borrar se añadirán cuando haya pantallas para ello.
 */
@Service()
export class Rutas {
  private readonly api = inject(Api);

  /** Todas las rutas guardadas → GET /api/rutas */
  listar(): Observable<Ruta[]> {
    return this.api.get<Ruta[]>('rutas');
  }

  /** Una ruta concreta → GET /api/rutas/{id} */
  obtener(id: string): Observable<Ruta> {
    return this.api.get<Ruta>(`rutas/${encodeURIComponent(id)}`);
  }

  /** Guarda una ruta nueva con sus puntos → POST /api/rutas (necesita sesión iniciada) */
  crear(ruta: NuevaRuta): Observable<Ruta> {
    return this.api.post<Ruta>('rutas', ruta);
  }
}
