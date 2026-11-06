import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { CarreraGuardada, NuevaRuta, PuntoGps, Ruta } from '../modelos/ruta';
import { Sombra } from '../modelos/sombra';
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

  /** Sombra de una ruta (mejor marca con el tiempo de cada sector) → GET /api/rutas/{id}/sombra */
  sombra(id: string): Observable<Sombra> {
    return this.api.get<Sombra>(`rutas/${encodeURIComponent(id)}/sombra`);
  }

  /** Guarda una ruta nueva con sus puntos → POST /api/rutas (necesita sesión iniciada) */
  crear(ruta: NuevaRuta): Observable<Ruta> {
    return this.api.post<Ruta>('rutas', ruta);
  }

  /**
   * Guarda una carrera corrida sobre una ruta → POST /api/rutas/{id}/carreras (PS-33).
   * El backend decide si es la nueva sombra (`mejorMarca`). Necesita al menos 2 puntos.
   */
  subirCarrera(rutaId: string, puntos: PuntoGps[]): Observable<CarreraGuardada> {
    return this.api.post<CarreraGuardada>(`rutas/${encodeURIComponent(rutaId)}/carreras`, {
      puntos,
    });
  }
}
