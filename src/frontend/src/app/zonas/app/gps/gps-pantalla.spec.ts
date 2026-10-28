import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { GpsPantalla } from './gps-pantalla';

describe('GpsPantalla', () => {
  let fixture: ComponentFixture<GpsPantalla>;
  let exito: (p: unknown) => void;
  let fallo: (e: unknown) => void;
  const mock = {
    watchPosition: vi.fn((ok: (p: unknown) => void, err: (e: unknown) => void) => {
      exito = ok;
      fallo = err;
      return 1;
    }),
    clearWatch: vi.fn(),
  };

  beforeEach(async () => {
    Object.defineProperty(navigator, 'geolocation', { value: mock, configurable: true });
    await TestBed.configureTestingModule({
      imports: [GpsPantalla],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(GpsPantalla);
    await fixture.whenStable();
  });

  const texto = (selector: string) =>
    (fixture.nativeElement as HTMLElement).querySelector(selector)?.textContent?.trim();

  it('muestra latitud, longitud y precisión cuando llega una posición', async () => {
    exito({ coords: { latitude: 40.416775, longitude: -3.70379, accuracy: 12.4 } });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(texto('.latitud')).toBe('40,416775');
    expect(texto('.longitud')).toBe('-3,703790');
    expect(texto('.precision')).toBe('12 m');
  });

  it('se actualiza cuando llega una posición nueva', async () => {
    exito({ coords: { latitude: 40.0, longitude: -3.0, accuracy: 30 } });
    exito({ coords: { latitude: 40.5, longitude: -3.5, accuracy: 8 } });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(texto('.latitud')).toBe('40,500000');
  });

  it('explica cómo activar la ubicación si se deniega el permiso', async () => {
    fallo({ code: 1 });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(texto('.aviso-error')).toContain('permiso de ubicación');
  });

  it('cuenta las lecturas descartadas por el filtro y explica el motivo', async () => {
    exito({ coords: { latitude: 40.4, longitude: -3.7, accuracy: 60 }, timestamp: 1000 });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(texto('.filtro')).toContain('Lecturas descartadas: 1');
    expect(texto('.motivo')).toContain('precisión peor de 20 m');
  });

  it('deja de escuchar el GPS al destruirse', () => {
    fixture.destroy();
    expect(mock.clearWatch).toHaveBeenCalled();
  });
});
