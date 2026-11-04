import { PuntoGps } from '../../core/modelos/ruta';
import { distanciaSombraEn, distanciasAcumuladas, tiempoSombraEn } from './sombra';

/** Grados de latitud que equivalen a `metros` hacia el norte (1° ≈ 111 195 m) */
const norte = (metros: number) => 40 + metros / 111_195;

describe('utilidades de la sombra', () => {
  // Sombra que recorre 100 m en 20 s, se para 10 s y hace otros 100 m en 10 s
  const puntos: PuntoGps[] = [
    { latitud: norte(0), longitud: -3.7, tiempoSegundos: 0 },
    { latitud: norte(100), longitud: -3.7, tiempoSegundos: 20 },
    { latitud: norte(100), longitud: -3.7, tiempoSegundos: 30 },
    { latitud: norte(200), longitud: -3.7, tiempoSegundos: 40 },
  ];
  const acumuladas = distanciasAcumuladas(puntos);

  it('distanciasAcumuladas suma los metros hasta cada punto', () => {
    expect(acumuladas.length).toBe(4);
    expect(acumuladas[0]).toBe(0);
    expect(acumuladas[1]).toBeCloseTo(100, 0);
    expect(acumuladas[2]).toBeCloseTo(100, 0);
    expect(acumuladas[3]).toBeCloseTo(200, 0);
    expect(distanciasAcumuladas([])).toEqual([]);
  });

  it('distanciaSombraEn interpola entre puntos', () => {
    expect(distanciaSombraEn(puntos, acumuladas, 0)).toBe(0);
    expect(distanciaSombraEn(puntos, acumuladas, 10)).toBeCloseTo(50, 0);
    expect(distanciaSombraEn(puntos, acumuladas, 25)).toBeCloseTo(100, 0); // parada
    expect(distanciaSombraEn(puntos, acumuladas, 35)).toBeCloseTo(150, 0);
  });

  it('distanciaSombraEn no sale de la ruta', () => {
    expect(distanciaSombraEn(puntos, acumuladas, -5)).toBe(0);
    expect(distanciaSombraEn(puntos, acumuladas, 999)).toBeCloseTo(200, 0);
    expect(distanciaSombraEn([], [], 10)).toBe(0);
  });

  it('tiempoSombraEn dice cuándo pasó la sombra por esos metros', () => {
    expect(tiempoSombraEn(puntos, acumuladas, 0)).toBe(0);
    expect(tiempoSombraEn(puntos, acumuladas, 50)).toBeCloseTo(10, 1);
    // Los 150 m los pasó después de la parada: 30 s + 5 s
    expect(tiempoSombraEn(puntos, acumuladas, 150)).toBeCloseTo(35, 1);
  });

  it('tiempoSombraEn devuelve el tiempo de llegada si se piden más metros que la ruta', () => {
    expect(tiempoSombraEn(puntos, acumuladas, 5000)).toBe(40);
    expect(tiempoSombraEn([], [], 10)).toBe(0);
  });

  it('las dos funciones son inversas', () => {
    for (const segundos of [5, 12, 33, 38]) {
      const metros = distanciaSombraEn(puntos, acumuladas, segundos);
      expect(tiempoSombraEn(puntos, acumuladas, metros)).toBeCloseTo(segundos, 1);
    }
  });
});
