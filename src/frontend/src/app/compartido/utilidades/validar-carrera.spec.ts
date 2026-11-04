import { ErrorCarreraInvalida, validarCarrera } from './validar-carrera';

const p = (tiempoSegundos: number, latitud = 40.41, longitud = -3.7) => ({
  latitud,
  longitud,
  tiempoSegundos,
});

function errores(datos: unknown): string[] {
  try {
    validarCarrera(datos);
  } catch (e) {
    return (e as ErrorCarreraInvalida).errores;
  }
  return [];
}

describe('validarCarrera', () => {
  it('acepta el formato del backend e ignora campos extra', () => {
    const carrera = validarCarrera({ id: 'x', nombre: ' Parque ', fecha: '2026-10-20', puntos: [p(0), p(5)] });
    expect(carrera.nombre).toBe('Parque');
    expect(carrera.puntos).toEqual([p(0), p(5)]);
  });

  it('rechaza lo que no es un objeto', () => {
    expect(errores(null)).toHaveLength(1);
    expect(errores([])).toHaveLength(1);
    expect(errores('hola')).toHaveLength(1);
  });

  it('exige nombre y al menos un punto', () => {
    expect(errores({ nombre: '', puntos: [p(0)] })).toContain('Falta el nombre de la carrera.');
    expect(errores({ nombre: 'A', puntos: [] })).toContain('La carrera necesita al menos un punto.');
  });

  it('detecta coordenadas fuera de rango', () => {
    expect(errores({ nombre: 'A', puntos: [p(0, 91)] })[0]).toContain('latitud');
    expect(errores({ nombre: 'A', puntos: [p(0, 40, 181)] })[0]).toContain('longitud');
  });

  it('detecta tiempos negativos o que retroceden', () => {
    expect(errores({ nombre: 'A', puntos: [p(-1)] })[0]).toContain('tiempoSegundos');
    expect(errores({ nombre: 'A', puntos: [p(10), p(5)] })[0]).toContain('retroceder');
  });

  it('limita el número de errores devueltos', () => {
    const rotos = Array.from({ length: 50 }, () => p(0, 999));
    expect(errores({ nombre: 'A', puntos: rotos }).length).toBeLessThanOrEqual(5);
  });
});