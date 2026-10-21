import { PuntoGps } from '../../core/modelos/ruta';
import {
  distanciaKm,
  duracionSegundos,
  formatearDuracion,
  formatearFecha,
  formatearKm,
} from './rutas';

describe('utilidades de rutas', () => {
  // 1 grado de latitud son unos 111,2 km
  const puntos: PuntoGps[] = [
    { latitud: 40, longitud: -3.7, tiempoSegundos: 0 },
    { latitud: 40.01, longitud: -3.7, tiempoSegundos: 300 },
    { latitud: 40.02, longitud: -3.7, tiempoSegundos: 610 },
  ];

  it('calcula la distancia total en km', () => {
    expect(distanciaKm(puntos)).toBeCloseTo(2.224, 2);
  });

  it('una ruta con un solo punto mide 0 km y dura 0 s', () => {
    expect(distanciaKm([puntos[0]])).toBe(0);
    expect(duracionSegundos([puntos[0]])).toBe(0);
    expect(duracionSegundos([])).toBe(0);
  });

  it('calcula la duración con el primer y el último punto', () => {
    expect(duracionSegundos(puntos)).toBe(610);
  });

  it('formatea la duración como m:ss o h:mm:ss', () => {
    expect(formatearDuracion(1661)).toBe('27:41');
    expect(formatearDuracion(59)).toBe('0:59');
    expect(formatearDuracion(3725)).toBe('1:02:05');
  });

  it('formatea la fecha en español y tolera fechas no válidas', () => {
    expect(formatearFecha('2026-10-18T09:12:00')).toBe('18 oct 2026');
    expect(formatearFecha('no es una fecha')).toBe('');
  });

  it('formatea los km con coma', () => {
    expect(formatearKm(5.234)).toBe('5,2 km');
    expect(formatearKm(10)).toBe('10,0 km');
  });
});
