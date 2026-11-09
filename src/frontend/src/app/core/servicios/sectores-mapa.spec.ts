import { CARRERA_EJEMPLO } from './carrera-ejemplo';
import { CIRCUITO_EJEMPLO } from './circuito-ejemplo';
import { calcularSectores, sectoresDesdeCarrera } from './sectores-mapa';
import { distanciaMetros } from '../../compartido/utilidades/geo';
import { formatearDiferencia, formatearTiempo } from '../../compartido/utilidades/formato-tiempo';
import { PuntoGps } from '../modelos/punto-gps';

/** Mismo circuito con los tiempos multiplicados por un factor (0,9 = más rápido). */
function conRitmo(factor: number): PuntoGps[] {
  return CIRCUITO_EJEMPLO.map((p) => ({ ...p, tiempoSegundos: p.tiempoSegundos * factor }));
}

describe('geo y formato', () => {
  it('1 grado de latitud son unos 111,19 km', () => {
    const d = distanciaMetros(
      { latitud: 40, longitud: 0, tiempoSegundos: 0 },
      { latitud: 41, longitud: 0, tiempoSegundos: 0 },
    );
    expect(d / 1000).toBeCloseTo(111.19, 1);
  });

  it('formatea tiempo y diferencia como el reloj', () => {
    expect(formatearTiempo(754)).toBe('12:34');
    expect(formatearDiferencia(-2.4)).toBe('-2,4 s');
    expect(formatearDiferencia(1)).toBe('+1,0 s');
  });
});

describe('calcularSectores (con puntos GPS)', () => {
  it('divide el circuito en 5 sectores', () => {
    const sectores = calcularSectores(conRitmo(0.9), CIRCUITO_EJEMPLO);
    expect(sectores.length).toBe(5);
    expect(sectores[0].distanciaMetros).toBeCloseTo(500, 0);
  });

  it('marca mejor si la carrera es más rápida que la sombra y peor si es más lenta', () => {
    expect(calcularSectores(conRitmo(0.9), CIRCUITO_EJEMPLO).every((s) => s.resultado === 'mejor')).toBe(true);
    expect(calcularSectores(conRitmo(1.1), CIRCUITO_EJEMPLO).every((s) => s.resultado === 'peor')).toBe(true);
  });

  it('devuelve vacío si no hay datos suficientes', () => {
    expect(calcularSectores([], CIRCUITO_EJEMPLO)).toEqual([]);
  });
});

describe('sectoresDesdeCarrera (CARRERA_EJEMPLO)', () => {
  const sectores = sectoresDesdeCarrera(CARRERA_EJEMPLO, CIRCUITO_EJEMPLO);

  it('crea un sector por cada sector de la carrera', () => {
    expect(sectores.length).toBe(CARRERA_EJEMPLO.sectores.length);
  });

  it('usa los tiempos de la carrera', () => {
    expect(sectores[0].tiempoSegundos).toBe(148);
    expect(sectores[0].diferenciaSegundos).toBe(-2);
  });

  it('marca el sector 3 como peor y el resto como mejor', () => {
    expect(sectores.map((s) => s.resultado)).toEqual(['mejor', 'mejor', 'peor', 'mejor', 'mejor']);
  });

  it('los sectores conectan sin huecos', () => {
    for (let i = 1; i < sectores.length; i++) {
      const fin = sectores[i - 1].puntos.at(-1)!;
      const ini = sectores[i].puntos[0];
      expect(ini.latitud).toBeCloseTo(fin.latitud, 8);
      expect(ini.longitud).toBeCloseTo(fin.longitud, 8);
    }
  });
});
