import { aPorcentaje, limitarProgreso } from './progreso';

describe('progreso', () => {
  it('deja pasar los valores entre 0 y 1', () => {
    expect(limitarProgreso(0)).toBe(0);
    expect(limitarProgreso(0.4)).toBe(0.4);
    expect(limitarProgreso(1)).toBe(1);
  });

  it('limita los valores fuera de rango', () => {
    expect(limitarProgreso(-0.3)).toBe(0);
    expect(limitarProgreso(1.7)).toBe(1);
  });

  it('trata los valores no numéricos como 0', () => {
    expect(limitarProgreso(NaN)).toBe(0);
    expect(limitarProgreso(Infinity)).toBe(0);
  });

  it('convierte el progreso en un porcentaje entero', () => {
    expect(aPorcentaje(0.444)).toBe(44);
    expect(aPorcentaje(2)).toBe(100);
  });
});
