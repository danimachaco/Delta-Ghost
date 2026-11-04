import { CarreraGrabada } from '../../core/modelos/carrera-grabada';
import { PuntoGps } from '../../core/modelos/punto-gps';

/** Error con la lista de problemas encontrados, pensado para mostrarse al usuario. */
export class ErrorCarreraInvalida extends Error {
  constructor(readonly errores: string[]) {
    super(errores.join(' '));
    this.name = 'ErrorCarreraInvalida';
  }
}

/** Para no inundar la pantalla si el archivo está totalmente roto */
const MAX_ERRORES = 5;

function esNumero(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isFinite(valor);
}

/**
 * Comprueba que un JSON ya parseado sea una carrera válida y devuelve una copia
 * limpia (sin campos desconocidos). Si no lo es, lanza ErrorCarreraInvalida.
 */
export function validarCarrera(datos: unknown): CarreraGrabada {
  if (typeof datos !== 'object' || datos === null || Array.isArray(datos)) {
    throw new ErrorCarreraInvalida(['El JSON debe ser un objeto con "nombre" y "puntos".']);
  }
  const { nombre, puntos } = datos as Record<string, unknown>;
  const errores: string[] = [];

  if (typeof nombre !== 'string' || nombre.trim() === '') {
    errores.push('Falta el nombre de la carrera.');
  }
  if (!Array.isArray(puntos) || puntos.length === 0) {
    errores.push('La carrera necesita al menos un punto.');
    throw new ErrorCarreraInvalida(errores);
  }

  const validos: PuntoGps[] = [];
  let tiempoAnterior = 0;

  puntos.forEach((p: unknown, i: number) => {
    if (errores.length >= MAX_ERRORES) return;
    const n = i + 1;
    if (typeof p !== 'object' || p === null) {
      errores.push(`Punto ${n}: formato incorrecto.`);
      return;
    }
    const { latitud, longitud, tiempoSegundos, precision } = p as Record<string, unknown>;

    if (!esNumero(latitud) || latitud < -90 || latitud > 90) {
      errores.push(`Punto ${n}: la latitud debe ser un número entre -90 y 90.`);
    } else if (!esNumero(longitud) || longitud < -180 || longitud > 180) {
      errores.push(`Punto ${n}: la longitud debe ser un número entre -180 y 180.`);
    } else if (!esNumero(tiempoSegundos) || tiempoSegundos < 0) {
      errores.push(`Punto ${n}: tiempoSegundos debe ser un número mayor o igual que 0.`);
    } else if (tiempoSegundos < tiempoAnterior) {
      errores.push(`Punto ${n}: el tiempo no puede retroceder.`);
    } else if (precision !== undefined && (!esNumero(precision) || precision < 0)) {
      errores.push(`Punto ${n}: la precisión debe ser un número mayor o igual que 0.`);
    } else {
      tiempoAnterior = tiempoSegundos;
      validos.push(
        precision === undefined
          ? { latitud, longitud, tiempoSegundos }
          : { latitud, longitud, tiempoSegundos, precision },
      );
    }
  });

  if (errores.length > 0) throw new ErrorCarreraInvalida(errores);
  return { nombre: (nombre as string).trim(), puntos: validos };
}
