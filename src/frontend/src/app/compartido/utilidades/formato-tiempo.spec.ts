import { formatearDiferencia, formatearTiempo } from './formato-tiempo';

describe('formato-tiempo', () => {
  it('formatea el tiempo como mm:ss', () => {
    expect(formatearTiempo(754)).toBe('12:34');
    expect(formatearTiempo(5)).toBe('00:05');
    expect(formatearTiempo(763.6)).toBe('12:44');
  });

  it('formatea la diferencia con signo y coma decimal', () => {
    expect(formatearDiferencia(-2.4)).toBe('-2,4 s');
    expect(formatearDiferencia(1)).toBe('+1,0 s');
    expect(formatearDiferencia(0)).toBe('0,0 s');
  });

  it('no muestra "-0,0" para diferencias minúsculas', () => {
    expect(formatearDiferencia(-0.04)).toBe('0,0 s');
  });
});
