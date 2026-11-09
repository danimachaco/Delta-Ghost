import { CARRERA_EJEMPLO } from './carrera-ejemplo';
import { CIRCUITO_EJEMPLO } from './circuito-ejemplo';
import { calcularSectores, sectoresDesdeCarrera } from './sectores';
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
import { TestBed } from '@angular/core/testing';
import { PuntoGps } from '../modelos/ruta';
import { dividirEnSectores, Sectores } from './sectores';

describe('Sectores', () => {
  let sectores: Sectores;

  // Ruta recta hacia el norte de 7 puntos (6 tramos de unos 111 m), 30 s por tramo: 60 s por sector
  const ruta: PuntoGps[] = Array.from({ length: 7 }, (_, i) => ({
    latitud: 40 + i * 0.001,
    longitud: -3.7,
    tiempoSegundos: i * 30,
  }));

  beforeEach(() => {
    sectores = TestBed.inject(Sectores);
  });

  /** Metros desde la salida hasta el final de cada sector de la ruta */
  const finales = () =>
    sectores.limites(ruta, sectores.dividir(ruta.length)).map((l) => l.metrosFin);

  describe('dividirEnSectores', () => {
    it('divide 7 puntos en 3 sectores como el backend: 0→2, 2→4 y 4→6', () => {
      expect(dividirEnSectores(7)).toEqual([
        { numero: 1, puntoInicio: 0, puntoFin: 2 },
        { numero: 2, puntoInicio: 2, puntoFin: 4 },
        { numero: 3, puntoInicio: 4, puntoFin: 6 },
      ]);
    });

    it('reparte tramos de tamaño parecido cuando no salen exactos', () => {
      expect(dividirEnSectores(11).map((s) => [s.puntoInicio, s.puntoFin])).toEqual([
        [0, 3],
        [3, 7],
        [7, 10],
      ]);
    });

    it('nunca crea más sectores que tramos, ni sectores sin puntos', () => {
      expect(dividirEnSectores(2, 5)).toEqual([{ numero: 1, puntoInicio: 0, puntoFin: 1 }]);
      expect(dividirEnSectores(1)).toEqual([]);
      expect(dividirEnSectores(0)).toEqual([]);
    });
  });

  it('calcula en qué metro termina cada sector', () => {
    const [s1, s2, s3] = finales();
    expect(s1).toBeCloseTo(222.4, 0);
    expect(s2).toBeCloseTo(2 * s1, 6);
    expect(s3).toBeCloseTo(3 * s1, 6);
  });

  it('marca en verde un sector más rápido que la sombra', () => {
    const comparacion = sectores.comparar(ruta, ruta);
    expect(comparacion.sectorActual).toBe(1);
    expect(comparacion.actualizar(100, 25)).toEqual([]);

    const [resultado] = comparacion.actualizar(finales()[0], 55);
    expect(resultado.numero).toBe(1);
    expect(resultado.tiempoCorredor).toBeCloseTo(55, 6);
    expect(resultado.tiempoSombra).toBeCloseTo(60, 6);
    expect(resultado.diferenciaSector).toBeCloseTo(-5, 6);
    expect(resultado.color).toBe('verde');
    expect(comparacion.sectorActual).toBe(2);
  });

  it('marca en rojo un sector más lento y acumula la diferencia desde la salida', () => {
    const comparacion = sectores.comparar(ruta, ruta);
    const [s1, s2] = finales();
    comparacion.actualizar(s1, 55); // sector 1: −5 s
    const [resultado] = comparacion.actualizar(s2, 130); // sector 2: 75 s contra 60 s

    expect(resultado.tiempoCorredor).toBeCloseTo(75, 6);
    expect(resultado.diferenciaSector).toBeCloseTo(15, 6);
    expect(resultado.diferenciaAcumulada).toBeCloseTo(10, 6);
    expect(resultado.color).toBe('rojo');
  });

  it('interpola el momento exacto en que se cruza el final del sector', () => {
    const comparacion = sectores.comparar(ruta, ruta);
    const s1 = finales()[0];
    comparacion.actualizar(s1 * 0.5, 25);
    // Entre las dos lecturas el corredor cruza la línea justo a mitad de camino → a los 50 s
    const [resultado] = comparacion.actualizar(s1 * 1.5, 75);
    expect(resultado.tiempoCorredor).toBeCloseTo(50, 6);
    expect(resultado.color).toBe('verde');
  });

  it('cierra varios sectores a la vez si el GPS estuvo un rato sin señal', () => {
    const comparacion = sectores.comparar(ruta, ruta);
    const resultados = comparacion.actualizar(finales()[2], 150);

    expect(resultados.map((r) => r.numero)).toEqual([1, 2, 3]);
    expect(resultados.every((r) => r.color === 'verde')).toBe(true);
    expect(resultados[2].diferenciaAcumulada).toBeCloseTo(-30, 6);
    expect(comparacion.terminada).toBe(true);
    expect(comparacion.sectorActual).toBeNull();
    expect(comparacion.resultados.length).toBe(3);
    // Pasada la meta ya no hay más sectores
    expect(comparacion.actualizar(finales()[2] + 50, 170)).toEqual([]);
  });

  it('compara con una sombra que tiene otros puntos que la ruta', () => {
    // Mejor marca grabada con solo 3 puntos (salida, mitad y meta) en 150 s
    const sombra = [
      ruta[0],
      { ...ruta[3], tiempoSegundos: 75 },
      { ...ruta[6], tiempoSegundos: 150 },
    ];
    const comparacion = sectores.comparar(ruta, sombra);
    const [resultado] = comparacion.actualizar(finales()[0], 55);
    // La sombra pasó por el final del sector 1 (2/3 de su primer tramo) a los 50 s
    expect(resultado.tiempoSombra).toBeCloseTo(50, 3);
    expect(resultado.color).toBe('rojo');
  });

  it('usa los sectores que se le pasan (por ejemplo, los que vienen del backend)', () => {
    const comparacion = sectores.comparar(ruta, ruta, [{ numero: 1, puntoInicio: 0, puntoFin: 6 }]);
    expect(comparacion.actualizar(finales()[0], 55)).toEqual([]);
    expect(comparacion.actualizar(finales()[2], 170)[0].tiempoSombra).toBeCloseTo(180, 6);
  });
});
