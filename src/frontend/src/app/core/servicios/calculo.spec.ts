import { TestBed } from '@angular/core/testing';
import { Calculo, Coordenada, haversineMetros } from './calculo';

describe('Calculo', () => {
  let calculo: Calculo;

  // Puerta del Sol → Plaza Mayor (Madrid): unos 360 m en línea recta
  const sol: Coordenada = { latitud: 40.416775, longitud: -3.70379 };
  const plazaMayor: Coordenada = { latitud: 40.415511, longitud: -3.707726 };

  beforeEach(() => {
    calculo = TestBed.inject(Calculo);
  });

  it('la distancia de un punto a sí mismo es 0', () => {
    expect(calculo.distancia(sol, sol)).toBe(0);
  });

  it('1 grado de latitud mide unos 111,2 km', () => {
    const d = calculo.distancia({ latitud: 40, longitud: -3.7 }, { latitud: 41, longitud: -3.7 });
    expect(d).toBeCloseTo(111_195, -1);
  });

  it('calcula una distancia real entre dos lugares de Madrid', () => {
    expect(calculo.distancia(sol, plazaMayor)).toBeGreaterThan(350);
    expect(calculo.distancia(sol, plazaMayor)).toBeLessThan(370);
  });

  it('da lo mismo de A a B que de B a A', () => {
    expect(calculo.distancia(sol, plazaMayor)).toBeCloseTo(calculo.distancia(plazaMayor, sol), 6);
  });

  it('la función suelta y el servicio dan el mismo resultado', () => {
    expect(haversineMetros(sol, plazaMayor)).toBe(calculo.distancia(sol, plazaMayor));
  });

  it('funciona en puntos opuestos del planeta (media vuelta a la Tierra)', () => {
    const d = calculo.distancia({ latitud: 0, longitud: 0 }, { latitud: 0, longitud: 180 });
    expect(d).toBeCloseTo(Math.PI * 6_371_000, -1);
  });

  it('suma los tramos para la distancia total', () => {
    const puntos = [
      { latitud: 40, longitud: -3.7 },
      { latitud: 40.01, longitud: -3.7 },
      { latitud: 40.02, longitud: -3.7 },
    ];
    expect(calculo.distanciaTotal(puntos)).toBeCloseTo(2_224, 0);
    expect(calculo.distanciaTotal([puntos[0]])).toBe(0);
    expect(calculo.distanciaTotal([])).toBe(0);
  });

  it('calcula la velocidad en m/s y no divide entre 0', () => {
    expect(calculo.velocidad(100, 20)).toBe(5);
    expect(calculo.velocidad(100, 0)).toBe(0);
  });

  it('calcula el ritmo en segundos por km', () => {
    expect(calculo.ritmo(5_200, 1_648)).toBeCloseTo(316.9, 1); // 5,2 km en 27:28 → 5:17 /km
    expect(calculo.ritmo(0, 60)).toBeNull();
  });
});
