import { formatearDiferenciaVuelta, formatearVuelta } from './formato-vuelta';

describe('formato de vueltas', () => {
  it('formatearVuelta() escribe minutos, segundos y décimas', () => {
    expect(formatearVuelta(92.43)).toBe('1:32,4');
    expect(formatearVuelta(45.06)).toBe('0:45,1');
    expect(formatearVuelta(59.96)).toBe('1:00,0');
    expect(formatearVuelta(0)).toBe('0:00,0');
    expect(formatearVuelta(-3)).toBe('0:00,0');
  });

  it('formatearDiferenciaVuelta() lleva signo y una décima', () => {
    expect(formatearDiferenciaVuelta(-1.24)).toBe('-1,2 s');
    expect(formatearDiferenciaVuelta(0.5)).toBe('+0,5 s');
    expect(formatearDiferenciaVuelta(0.01)).toBe('0,0 s');
  });
});
