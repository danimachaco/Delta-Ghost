import { TestBed } from '@angular/core/testing';
import { Gps } from './gps';

describe('Gps', () => {
  let exito: (p: unknown) => void;
  let fallo: (e: unknown) => void;
  const mock = {
    watchPosition: vi.fn((ok: (p: unknown) => void, err: (e: unknown) => void) => {
      exito = ok;
      fallo = err;
      return 7;
    }),
    clearWatch: vi.fn(),
  };

  beforeEach(() => {
    mock.watchPosition.mockClear();
    mock.clearWatch.mockClear();
    Object.defineProperty(navigator, 'geolocation', { value: mock, configurable: true });
  });

  it('guarda la posición y la precisión que llegan del GPS', () => {
    const gps = TestBed.inject(Gps);
    gps.iniciar();
    exito({ coords: { latitude: 40.41, longitude: -3.7, accuracy: 12 } });
    expect(gps.posicion()).toEqual({ latitud: 40.41, longitud: -3.7, precision: 12 });
    expect(gps.error()).toBeNull();
  });

  it('no abre dos watchers si se llama dos veces a iniciar', () => {
    const gps = TestBed.inject(Gps);
    gps.iniciar();
    gps.iniciar();
    expect(mock.watchPosition).toHaveBeenCalledTimes(1);
  });

  it('marca permiso-denegado y deja de escuchar', () => {
    const gps = TestBed.inject(Gps);
    gps.iniciar();
    fallo({ code: 1 });
    expect(gps.error()).toBe('permiso-denegado');
    expect(mock.clearWatch).toHaveBeenCalledWith(7);
    expect(gps.activo()).toBe(false);
  });

  it('distingue señal no disponible y tiempo agotado', () => {
    const gps = TestBed.inject(Gps);
    gps.iniciar();
    fallo({ code: 2 });
    expect(gps.error()).toBe('no-disponible');
    fallo({ code: 3 });
    expect(gps.error()).toBe('tiempo-agotado');
  });

  it('detener llama a clearWatch', () => {
    const gps = TestBed.inject(Gps);
    gps.iniciar();
    gps.detener();
    expect(mock.clearWatch).toHaveBeenCalledWith(7);
  });
});
