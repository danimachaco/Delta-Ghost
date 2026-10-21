import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ErrorApi } from '../modelos/error-api';

/**
 * Interceptor de errores: se ejecuta en TODAS las peticiones HTTP.
 * Si la petición falla, convierte el error de Angular en un `ErrorApi`
 * con un mensaje en español, para que los componentes solo tengan que mostrarlo.
 */
export const erroresInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((error: unknown) =>
      throwError(() => (error instanceof HttpErrorResponse ? aErrorApi(error) : error)),
    ),
  );

/** Traduce un error HTTP a un mensaje comprensible para el usuario. */
export function aErrorApi(error: HttpErrorResponse): ErrorApi {
  const cuerpo: unknown = error.error;
  // El backend responde { error: '...' } en los errores generales
  const mensajeServidor = esObjeto(cuerpo) && typeof cuerpo['error'] === 'string' ? cuerpo['error'] : null;

  switch (true) {
    case error.status === 0:
      return crear(0, 'No se puede conectar con el servidor. Comprueba tu conexión.');

    case error.status === 400 && esObjeto(cuerpo) && !mensajeServidor: {
      // Errores de validación: el backend responde { campo: 'mensaje', ... }
      const errores = Object.fromEntries(
        Object.entries(cuerpo).map(([campo, msg]) => [campo, String(msg)]),
      );
      return crear(400, `Revisa los datos: ${Object.values(errores).join('. ')}`, errores);
    }

    case error.status === 401:
      return crear(401, mensajeServidor ?? 'Tu sesión ha caducado o los datos no son correctos.');

    case error.status === 403:
      return crear(403, 'No tienes permiso para hacer esto.');

    case error.status === 404:
      return crear(404, mensajeServidor ?? 'No se ha encontrado lo que buscas.');

    case error.status >= 500:
      return crear(error.status, 'Error en el servidor. Inténtalo de nuevo más tarde.');

    default:
      return crear(error.status, mensajeServidor ?? 'Ha ocurrido un error inesperado.');
  }
}

function crear(estado: number, mensaje: string, errores: Record<string, string> = {}): ErrorApi {
  return { estado, mensaje, errores };
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}
