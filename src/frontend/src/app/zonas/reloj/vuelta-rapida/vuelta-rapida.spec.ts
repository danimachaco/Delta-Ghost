import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AvisoSector } from '../../../core/servicios/aviso-sector';
import { PantallaEncendida } from '../../../core/servicios/pantalla-encendida';
import { VueltaRapidaGps } from '../../../core/servicios/vuelta-rapida-gps';
import { VueltaRapidaPantalla } from './vuelta-rapida';

/** Lectura del GPS (formato del navegador) a `metros` al norte de la salida */
const lectura = (metros: number, timestamp: number) => ({
  coords: { latitude: 40 + metros / 111_195, longitude: -3.7, accuracy: 5 },
  timestamp,
});

describe('VueltaRapidaPantalla', () => {
  let fixture: ComponentFixture<VueltaRapidaPantalla>;
  let el: HTMLElement;
  let modo: VueltaRapidaGps;
  let exito: (p: unknown) => void;
  const geo = {
    watchPosition: vi.fn((ok: (p: unknown) => void) => {
      exito = ok;
      return 9;
    }),
    clearWatch: vi.fn(),
  };
  const T0 = 1_000_000;

  async function actualizar(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
  }

  const texto = (selector: string) => el.querySelector(selector)?.textContent?.trim();
  const boton = (clase: string) => el.querySelector<HTMLButtonElement>(`button.${clase}`)!;

  /** Simula una vuelta: a mitad lejos de la salida y al final otra vez en ella */
  function vuelta(inicio: number, segundos: number): number {
    modo.registrar(
      { latitud: 40 + 150 / 111_195, longitud: -3.7, precision: 5 },
      inicio + (segundos / 2) * 1000,
    );
    const fin = inicio + segundos * 1000;
    modo.registrar({ latitud: 40, longitud: -3.7, precision: 5 }, fin);
    return fin;
  }

  beforeEach(async () => {
    geo.clearWatch.mockClear();
    Object.defineProperty(navigator, 'geolocation', { value: geo, configurable: true });
    await TestBed.configureTestingModule({
      imports: [VueltaRapidaPantalla],
      providers: [
        provideRouter([]),
        {
          provide: PantallaEncendida,
          useValue: {
            activar: vi.fn(async () => undefined),
            desactivar: vi.fn(async () => undefined),
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(VueltaRapidaPantalla);
    el = fixture.nativeElement;
    modo = TestBed.inject(VueltaRapidaGps);
    await fixture.whenStable();
  });

  afterEach(() => modo.reiniciar());

  it('antes de empezar explica el modo y espera a la señal GPS', async () => {
    expect(texto('.titulo')).toBe('Vuelta rápida');
    expect(texto('.aviso-inicio')).toBe('Buscando señal GPS…');
    expect(boton('boton').disabled).toBe(true);

    exito(lectura(0, T0));
    await actualizar();
    expect(texto('.aviso-inicio')).toBe('Señal GPS lista');
    expect(boton('boton').disabled).toBe(false);
  });

  it('al empezar enseña la vuelta 1 con su tiempo y el botón Terminar', async () => {
    exito(lectura(0, T0));
    await actualizar();
    boton('boton').click();
    await actualizar();

    expect(modo.estado()).toBe('en-curso');
    expect(texto('.etiqueta')).toBe('Vuelta 1');
    expect(texto('.tiempo')).toMatch(/^0:00,\d$/);
    expect(texto('.mejor-vuelta')).toBe('—');
    expect(boton('terminar')).toBeTruthy();
    expect(el.querySelector('.salir')).toBeNull();
  });

  it('tras varias vueltas enseña la mejor y cómo fue la última, con su color', async () => {
    exito(lectura(0, T0));
    await actualizar();
    modo.empezar(T0);
    let t = vuelta(T0, 95);
    t = vuelta(t, 98);
    await actualizar();

    expect(texto('.etiqueta')).toBe('Vuelta 3');
    expect(texto('.mejor-vuelta')).toBe('1:35,0');
    expect(texto('.ultima')).toBe('+3,0 s');
    expect(el.querySelector('.ultima')?.classList).toContain('peor');
  });

  it('al cerrar una vuelta lanza el destello con la forma y lo anuncia', async () => {
    exito(lectura(0, T0));
    await actualizar();
    modo.empezar(T0);
    const t = vuelta(T0, 95);
    vuelta(t, 93); // la más rápida → morado
    await actualizar();

    expect(TestBed.inject(AvisoSector).aviso()).toBe('morado');
    expect(el.querySelector('.destello.destello-morado')).not.toBeNull();
    expect(el.querySelector('app-flecha-sector.morado')).not.toBeNull();
    expect(texto('[aria-live="assertive"]')).toBe('Vuelta 2: 1:33,0. ¡Tu vuelta más rápida!');
  });

  it('al terminar enseña todas las vueltas con la mejor marcada en texto', async () => {
    exito(lectura(0, T0));
    await actualizar();
    modo.empezar(T0);
    let t = vuelta(T0, 95);
    t = vuelta(t, 92.5);
    vuelta(t, 97);
    await actualizar();
    boton('terminar').click();
    await actualizar();

    // Lo que se ve, columna a columna (número, tiempo y "Mejor" o la diferencia)
    const visibles = (li: Element) =>
      [...li.children].map((col) =>
        [...col.childNodes]
          .filter((n) => !(n instanceof HTMLElement && n.classList.contains('solo-lector')))
          .map((n) => n.textContent)
          .join('')
          .trim(),
      );
    const filas = [...el.querySelectorAll('.vueltas li')];
    expect(filas.map(visibles)).toEqual([
      ['1', '1:35,0'],
      ['2', '1:32,5', 'Mejor'],
      ['3', '1:37,0', '+4,5 s'],
    ]);
    // Lo que lee un lector de pantalla: con las columnas separadas
    expect(filas[1].textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'Vuelta 2, 1:32,5, Mejor vuelta',
    );
    expect(el.querySelectorAll('.vueltas li.mejor').length).toBe(1);
    expect(texto('.total')).toBe('Total 4:44,5');
    expect(boton('otra')).toBeTruthy();
  });

  it('"Otra vez" vuelve a empezar de cero', async () => {
    exito(lectura(0, T0));
    await actualizar();
    modo.empezar(T0);
    vuelta(T0, 95);
    modo.terminar();
    await actualizar();
    boton('otra').click();
    await actualizar();
    expect(modo.estado()).toBe('parado');
    expect(texto('.titulo')).toBe('Vuelta rápida');
  });

  it('sin vueltas completadas lo dice al terminar', async () => {
    exito(lectura(0, T0));
    await actualizar();
    modo.empezar(T0);
    modo.terminar();
    await actualizar();
    expect(el.textContent).toContain('No has completado ninguna vuelta.');
  });

  it('al salir de la pantalla termina el modo y apaga el GPS', async () => {
    exito(lectura(0, T0));
    await actualizar();
    modo.empezar(T0);
    fixture.destroy();
    expect(modo.estado()).toBe('terminado');
    expect(geo.clearWatch).toHaveBeenCalledWith(9);
  });
});
