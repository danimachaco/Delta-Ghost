import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { NuevaRuta, Ruta } from '../modelos/ruta';
import { Sombra } from '../modelos/sombra';
import { Api } from './api';

/**
 * Servicio de rutas: habla con /api/rutas del backend a través del servicio Api.
 * Lee rutas, guarda las nuevas y descarga su sombra; editar y borrar se añadirán cuando haya pantallas para ello.
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

  /** Sombra (mejor marca) de una ruta para correr contra ella → GET /api/rutas/{id}/sombra */
  sombra(id: string): Observable<Sombra> {
    return this.api.get<Sombra>(`rutas/${encodeURIComponent(id)}/sombra`);
  }
}
