import { TestBed } from '@angular/core/testing';
import { AvisoSector, DURACION_AVISO_MS, VIBRACION_MEJOR, VIBRACION_PEOR } from './aviso-sector';

describe('AvisoSector', () => {
  let servicio: AvisoSector;
  let vibrar: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    vibrar = vi.fn();
    Object.defineProperty(navigator, 'vibrate', { value: vibrar, configurable: true, writable: true });
    servicio = TestBed.inject(AvisoSector);
  });

  afterEach(() => {
    vi.useRealTimers();
    Reflect.deleteProperty(navigator, 'vibrate');
  });

  it('empieza sin aviso', () => {
    expect(servicio.aviso()).toBeNull();
  });

  it('el aviso verde dura 3 s y vibra dos veces', () => {
    servicio.avisar('mejor');
    expect(servicio.aviso()).toBe('mejor');
    expect(vibrar).toHaveBeenCalledWith(VIBRACION_MEJOR);

    vi.advanceTimersByTime(DURACION_AVISO_MS - 1);
    expect(servicio.aviso()).toBe('mejor');
    vi.advanceTimersByTime(1);
    expect(servicio.aviso()).toBeNull();
  });

  it('el aviso rojo vibra una vez de forma larga', () => {
    servicio.avisar('peor');
    expect(servicio.aviso()).toBe('peor');
    expect(vibrar).toHaveBeenCalledWith(VIBRACION_PEOR);
  });

  it('un aviso nuevo reinicia el tiempo del anterior', () => {
    servicio.avisar('mejor');
    vi.advanceTimersByTime(2000);
    servicio.avisar('peor');
    vi.advanceTimersByTime(2000);
    expect(servicio.aviso()).toBe('peor');
    vi.advanceTimersByTime(1000);
    expect(servicio.aviso()).toBeNull();
  });

  it('no falla si el dispositivo no soporta vibración', () => {
    Reflect.deleteProperty(navigator, 'vibrate');
    expect(() => servicio.avisar('mejor')).not.toThrow();
    expect(servicio.aviso()).toBe('mejor');
  });
});