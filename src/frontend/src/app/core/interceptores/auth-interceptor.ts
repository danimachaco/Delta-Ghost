import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Auth } from '../servicios/auth';

/**
 * Añade el token del usuario a las peticiones que van a NUESTRA API
 * (cabecera `Authorization: Bearer <token>`). A otros servidores no se envía nunca.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(Auth).token();

  if (!token || !req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
