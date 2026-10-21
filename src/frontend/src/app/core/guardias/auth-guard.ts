import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../servicios/auth';

/**
 * Protege una ruta: si no has iniciado sesión te manda a /app/login
 * y, al entrar, te devuelve a la página que querías ver (?volver=...).
 *
 * Uso en un archivo de rutas:
 *   { path: 'perfil', component: Perfil, canActivate: [authGuard] }
 */
export const authGuard: CanActivateFn = (_ruta, estado) => {
  if (inject(Auth).estaAutenticado()) {
    return true;
  }
  return inject(Router).createUrlTree(['/app/login'], { queryParams: { volver: estado.url } });
};
