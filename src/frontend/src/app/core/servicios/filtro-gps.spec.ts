import { TestBed } from '@angular/core/testing';
import { PosicionGps } from '../modelos/punto-gps';
import { FiltroGps } from './filtro-gps';

/** 0,0001º de latitud son unos 11,1 m */
const METRO_EN_GRADOS = 0.0001 / 11.1;

/** Posición a "metros" al norte del punto de salida */
function posicion(metros: number, precision = 5): PosicionGps {
  return { latitud: 40.4 + metros * METRO_EN_GRADOS, longitud: -3.7, precision };
}

describe('FiltroGps', () => {
  let filtro: FiltroGps;

  beforeEach(() => {
    filtro = TestBed.inject(FiltroGps);
  });

  it('acepta la primera lectura si tiene buena precisión', () => {
    expect(filtro.evaluar(posicion(0), 0)).toEqual({ aceptada: true, motivo: null });
  });

  it('descarta lecturas con precisión peor de 20 m (y acepta justo 20 m)', () => {
    expect(filtro.evaluar(posicion(0, 35), 0)).toEqual({ aceptada: false, motivo: 'precision' });
    expect(filtro.evaluar(posicion(0, 20), 0).aceptada).toBe(true);
  });

  it('descarta precisiones que no son un número', () => {
    expect(filtro.evaluar(posicion(0, NaN), 0).motivo).toBe('precision');
  });

  it('acepta el movimiento normal de un corredor (4 m/s)', () => {
    filtro.evaluar(posicion(0), 0);
    expect(filtro.evaluar(posicion(4), 1000).aceptada).toBe(true);
    expect(filtro.evaluar(posicion(8), 2000).aceptada).toBe(true);
  });

  it('descarta un salto imposible (200 m en 1 segundo)', () => {
    filtro.evaluar(posicion(0), 0);
    expect(filtro.evaluar(posicion(200), 1000)).toEqual({ aceptada: false, motivo: 'salto' });
  });

  it('compara con la última lectura BUENA, no con la descartada', () => {
    filtro.evaluar(posicion(0), 0);
    filtro.evaluar(posicion(200), 1000); // salto descartado
    // 8 m en 2 s desde la última buena: normal
    expect(filtro.evaluar(posicion(8), 2000).aceptada).toBe(true);
  });

  it('descarta lecturas repetidas o que llegan desordenadas', () => {
    filtro.evaluar(posicion(0), 5000);
    expect(filtro.evaluar(posicion(1), 5000).motivo).toBe('repetida');
    expect(filtro.evaluar(posicion(1), 4000).motivo).toBe('repetida');
  });

  it('se recupera solo si se coló una lectura mala', () => {
    filtro.evaluar(posicion(300), 0); // lectura mala aceptada como primera
    // Al principio las buenas parecen saltos…
    expect(filtro.evaluar(posicion(0), 1000).motivo).toBe('salto');
    // …pero con el tiempo vuelven a ser creíbles (300 m en 30 s = 10 m/s)
    expect(filtro.evaluar(posicion(0), 30000).aceptada).toBe(true);
  });

  it('reiniciar olvida la última lectura', () => {
    filtro.evaluar(posicion(0), 0);
    filtro.reiniciar();
    expect(filtro.evaluar(posicion(5000), 1000).aceptada).toBe(true);
  });
});
