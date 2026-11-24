import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { PosicionGps } from '../modelos/punto-gps';
import { AvisoSector } from './aviso-sector';
import { Gps } from './gps';
import { PantallaEncendida } from './pantalla-encendida';
import { DISTANCIA_SALIR_M, VueltaRapida } from './vuelta-rapida';

/** Lectura del GPS a `metros` al norte de la salida (1° de latitud ≈ 111 195 m) */
const posicion = (metros: number): PosicionGps => ({
  latitud: 40 + metros / 111_195,
  longitud: -3.7,
  precision: 5,
});

describe('VueltaRapida', () => {
  let modo: VueltaRapida;
  let lecturas: Subject<PosicionGps>;
  let gps: { iniciar: ReturnType<typeof vi.fn>; detener: ReturnType<typeof vi.fn> };
  const pantalla = {
    activar: vi.fn(async () => undefined),
    desactivar: vi.fn(async () => undefined),
  };
  const avisos = { avisar: vi.fn() };
  const T0 = 1_000_000;

  /**
   * Da una vuelta a la pista que dura `segundos` y empieza en `inicio` (ms):
   * a mitad de vuelta el GPS te ve a 150 m de la salida y al final de nuevo en la salida.
   * Devuelve la hora (ms) a la que termina.
   */
  function vuelta(inicio: number, segundos: number): number {
    modo.registrar(posicion(150), inicio + (segundos / 2) * 1000);
    const fin = inicio + segundos * 1000;
    modo.registrar(posicion(3), fin);
    return fin;
  }

  beforeEach(() => {
    lecturas = new Subject<PosicionGps>();
    gps = { iniciar: vi.fn(), detener: vi.fn() };
    pantalla.activar.mockClear();
    pantalla.desactivar.mockClear();
    avisos.avisar.mockClear();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Gps,
          useValue: {
            ...gps,
            posicionValida: signal<PosicionGps | null>(posicion(0)),
            lecturasValidas: lecturas,
          },
        },
        { provide: PantallaEncendida, useValue: pantalla },
        { provide: AvisoSector, useValue: avisos },
      ],
    });
    modo = TestBed.inject(VueltaRapida);
  });

  afterEach(() => modo.reiniciar());

  it('empieza parado y sin vueltas', () => {
    expect(modo.estado()).toBe('parado');
    expect(modo.vueltas()).toEqual([]);
    expect(modo.numeroVuelta()).toBe(1);
  });

  it('al empezar, la posición actual es la salida y la pantalla se mantiene encendida', () => {
    expect(modo.empezar(T0)).toBe(true);
    expect(modo.estado()).toBe('en-curso');
    expect(pantalla.activar).toHaveBeenCalled();
  });

  it('no empieza sin una posición GPS fiable', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Gps,
          useValue: {
            iniciar: vi.fn(),
            detener: vi.fn(),
            posicionValida: signal<PosicionGps | null>(null),
            lecturasValidas: new Subject<PosicionGps>(),
          },
        },
        { provide: PantallaEncendida, useValue: pantalla },
      ],
    });
    const otro = TestBed.inject(VueltaRapida);
    expect(otro.empezar(T0)).toBe(false);
    expect(otro.estado()).toBe('parado');
  });

  it('cierra una vuelta al volver a la salida después de alejarse', () => {
    modo.empezar(T0);
    vuelta(T0, 92.4);
    expect(modo.vueltas()).toEqual([
      { numero: 1, segundos: 92.4, resultado: null, diferencia: null },
    ]);
    expect(modo.numeroVuelta()).toBe(2);
    // La primera vuelta no se compara con nada: no hay destello
    expect(avisos.avisar).not.toHaveBeenCalled();
  });

  it('no cierra vuelta si no te has alejado lo bastante de la salida (el GPS baila)', () => {
    modo.empezar(T0);
    modo.registrar(posicion(DISTANCIA_SALIR_M - 10), T0 + 30_000);
    modo.registrar(posicion(2), T0 + 60_000);
    expect(modo.vueltas()).toEqual([]);
  });

  it('una "vuelta" de menos de 20 s es un error del GPS y no cuenta', () => {
    modo.empezar(T0);
    modo.registrar(posicion(150), T0 + 5_000);
    modo.registrar(posicion(2), T0 + 10_000);
    expect(modo.vueltas()).toEqual([]);
  });

  it('compara cada vuelta: morado si es la mejor, verde si mejora la anterior y rojo si no', () => {
    modo.empezar(T0);
    let t = vuelta(T0, 95); // 1: 95 s
    t = vuelta(t, 98); // 2: peor que la 1 → rojo
    t = vuelta(t, 96); // 3: mejor que la 2 pero no la mejor → verde
    vuelta(t, 93); // 4: la más rápida → morado

    expect(modo.vueltas().map((v) => v.resultado)).toEqual([null, 'peor', 'mejor', 'morado']);
    expect(modo.vueltas().map((v) => v.diferencia)).toEqual([null, 3, -2, -3]);
    expect(avisos.avisar.mock.calls.map((c) => c[0])).toEqual(['peor', 'mejor', 'morado']);
    expect(modo.mejorVuelta()?.numero).toBe(4);
    expect(modo.segundosTotales()).toBe(382);
  });

  it('la vuelta siguiente empieza justo cuando se cierra la anterior', () => {
    modo.empezar(T0);
    const fin = vuelta(T0, 90);
    modo.registrar(posicion(150), fin + 40_000);
    modo.registrar(posicion(1), fin + 91_500);
    expect(modo.vueltas()[1].segundos).toBe(91.5);
  });

  it('las lecturas del GPS llegan solas desde el servicio Gps', () => {
    vi.useFakeTimers();
    vi.setSystemTime(T0);
    modo.empezar();
    vi.setSystemTime(T0 + 45_000);
    lecturas.next(posicion(150));
    vi.setSystemTime(T0 + 90_000);
    lecturas.next(posicion(4));
    expect(modo.vueltas().length).toBe(1);
    expect(modo.vueltas()[0].segundos).toBe(90);
    vi.useRealTimers();
  });

  it('el tiempo de la vuelta actual avanza mientras corres', () => {
    vi.useFakeTimers();
    vi.setSystemTime(T0);
    modo.empezar();
    vi.advanceTimersByTime(12_400);
    expect(modo.segundosVuelta()).toBeCloseTo(12.4, 1);
    vi.useRealTimers();
  });

  it('terminar() para, apaga el GPS y la pantalla, y guarda las vueltas', () => {
    modo.empezar(T0);
    vuelta(T0, 90);
    modo.terminar();
    expect(modo.estado()).toBe('terminado');
    expect(gps.detener).toHaveBeenCalled();
    expect(pantalla.desactivar).toHaveBeenCalled();
    expect(modo.vueltas().length).toBe(1);
    // Ya no se cierran más vueltas
    modo.registrar(posicion(150), T0 + 150_000);
    modo.registrar(posicion(1), T0 + 200_000);
    expect(modo.vueltas().length).toBe(1);
  });

  it('reiniciar() lo deja todo como al principio', () => {
    modo.empezar(T0);
    vuelta(T0, 90);
    modo.terminar();
    modo.reiniciar();
    expect(modo.estado()).toBe('parado');
    expect(modo.vueltas()).toEqual([]);
  });
});
