import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { Amistad, Solicitudes } from '../modelos/amigo';
import { Api } from './api';

/**
 * Servicio de amigos: habla con /api/amigos del backend (PS-56) a través del servicio Api.
 * Todas las peticiones necesitan sesión iniciada (el authInterceptor añade el token).
 */
@Service()
export class Amigos {
  private readonly api = inject(Api);

  /** Tus amigos, del más reciente al más antiguo → GET /api/amigos */
  listar(): Observable<Amistad[]> {
    return this.api.get<Amistad[]>('amigos');
  }

  /** Solicitudes pendientes recibidas y enviadas → GET /api/amigos/solicitudes */
  solicitudes(): Observable<Solicitudes> {
    return this.api.get<Solicitudes>('amigos/solicitudes');
  }

  /**
   * Envía una solicitud de amistad al corredor con ese email → POST /api/amigos/solicitudes.
   * Si esa persona ya te la había enviado, la respuesta llega ya como ACEPTADA.
   */
  enviar(email: string): Observable<Amistad> {
    return this.api.post<Amistad>('amigos/solicitudes', { email });
  }

  /** Acepta una solicitud recibida → POST /api/amigos/solicitudes/{id}/aceptar */
  aceptar(id: string): Observable<Amistad> {
    return this.api.post<Amistad>(`amigos/solicitudes/${encodeURIComponent(id)}/aceptar`, {});
  }
}
