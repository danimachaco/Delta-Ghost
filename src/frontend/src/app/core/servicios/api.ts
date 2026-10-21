import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Parámetros de búsqueda que se añaden a la URL (?clave=valor) */
export type ParametrosConsulta = Record<string, string | number | boolean>;

/**
 * Servicio HTTP base. Es el ÚNICO sitio de la app que habla con el backend:
 * los demás servicios (rutas, usuarios…) lo usan en vez de usar HttpClient directamente.
 *
 * Así la dirección del servidor se configura en un solo lugar (`environments/`)
 * y todos los errores pasan por el interceptor de errores.
 *
 * Ejemplo de uso desde otro servicio:
 *   private readonly api = inject(Api);
 *   listar() { return this.api.get<Ruta[]>('rutas'); }
 */
@Service()
export class Api {
  private readonly http = inject(HttpClient);
  private readonly urlBase = environment.apiUrl;

  /** GET: pide datos al servidor */
  get<T>(ruta: string, parametros?: ParametrosConsulta): Observable<T> {
    return this.http.get<T>(this.url(ruta), { params: this.aParams(parametros) });
  }

  /** POST: crea algo nuevo en el servidor */
  post<T>(ruta: string, cuerpo: unknown): Observable<T> {
    return this.http.post<T>(this.url(ruta), cuerpo);
  }

  /** PUT: actualiza algo que ya existe */
  put<T>(ruta: string, cuerpo: unknown): Observable<T> {
    return this.http.put<T>(this.url(ruta), cuerpo);
  }

  /** DELETE: borra algo del servidor */
  delete<T = void>(ruta: string): Observable<T> {
    return this.http.delete<T>(this.url(ruta));
  }

  /** Une la dirección base con la ruta: 'rutas/5' → 'http://localhost:8080/api/rutas/5' */
  private url(ruta: string): string {
    return `${this.urlBase}/${ruta.replace(/^\/+/, '')}`;
  }

  private aParams(parametros?: ParametrosConsulta): HttpParams | undefined {
    return parametros ? new HttpParams({ fromObject: parametros }) : undefined;
  }
}
