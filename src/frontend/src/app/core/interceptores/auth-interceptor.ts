import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ErrorApi } from '../modelos/error-api';
import { Auth } from '../servicios/auth';

/** Pantalla de inicio de sesión */
const RUTA_LOGIN = '/app/login';

/**
 * Añade el token del usuario a las peticiones que van a NUESTRA API
 * (cabecera `Authorization: Bearer <token>`). A otros servidores no se envía nunca.
 *
 * Si el servidor responde 401 a una petición que llevaba token, la sesión ya no vale
 * (ha caducado a las 24 h o el token no es válido). Entonces se cierra la sesión y se
 * lleva al usuario al login, con `?volver=` para volver luego a donde estaba y
 * `?caducada=1` para explicarle qué ha pasado.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const router = inject(Router);
  const token = auth.token();

  if (!token || !req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })).pipe(
    catchError((error: unknown) => {
      // Solo si la sesión sigue siendo la misma: si ya se cerró (por otra petición), no se repite
      if (estadoHttp(error) === 401 && auth.token() === token) {
        auth.cerrarSesion();
        const actual = router.url;
        const volver = actual.startsWith(RUTA_LOGIN) ? null : actual;
        void router.navigate([RUTA_LOGIN], { queryParams: { volver, caducada: 1 } });
      }
      return throwError(() => error);
    }),
  );
};

/**
 * Código HTTP del error. El interceptor de errores ya lo ha convertido en un ErrorApi
 * (con `estado`), pero se acepta también el error original de Angular por si cambia el orden.
 */
function estadoHttp(error: unknown): number | null {
  if (error instanceof HttpErrorResponse) {
    return error.status;
  }
  const estado = (error as Partial<ErrorApi> | null)?.estado;
  return typeof estado === 'number' ? estado : null;
}
