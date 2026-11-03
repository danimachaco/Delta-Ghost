import { TestBed } from '@angular/core/testing';
import { PosicionGps } from '../modelos/punto-gps';
import { Grabacion } from './grabacion';
import { Gps } from './gps';

/** Posición a "metros" al norte del punto de salida (0,0001º de latitud ≈ 11,1 m) */
const pos = (metros: number): PosicionGps => ({
  latitud: 40.4 + (metros * 0.0001) / 11.1,
  longitud: -3.7,
  precision: 5,
});

describe('Grabacion', () => {
  let grabacion: Grabacion;
  let gps: Gps;

  beforeEach(() => {
    grabacion = TestBed.inject(Grabacion);
    gps = TestBed.inject(Gps);
  });

  afterEach(() => {
    grabacion.descartar();
    vi.useRealTimers();
  });

  it('no deja empezar sin una posición GPS fiable', () => {
    expect(grabacion.puedeEmpezar()).toBe(false);
    expect(grabacion.empezar()).toBe(false);
    expect(grabacion.estado()).toBe('parada');
  });

  it('al empezar guarda la posición actual como primer punto (segundo 0)', () => {
    gps.posicionValida.set(pos(0));
    expect(grabacion.puedeEmpezar()).toBe(true);
    expect(grabacion.empezar(1_000)).toBe(true);
    expect(grabacion.estado()).toBe('grabando');
    expect(grabacion.puntos()).toEqual([{ latitud: 40.4, longitud: -3.7, tiempoSegundos: 0 }]);
  });

  it('añade los puntos con los segundos desde el inicio y calcula distancia y ritmo', () => {
    gps.posicionValida.set(pos(0));
    grabacion.empezar(0);
    grabacion.registrar(pos(50), 10_000);
    grabacion.registrar(pos(100), 20_000);
    grabacion.terminar(20_000);

    expect(grabacion.puntos().map((p) => p.tiempoSegundos)).toEqual([0, 10, 20]);
    expect(grabacion.distanciaMetros()).toBeCloseTo(100, 0);
    expect(grabacion.segundos()).toBe(20);
    expect(grabacion.ritmo()).toBeCloseTo(200, 0); // 100 m en 20 s → 3:20 /km
    expect(grabacion.estado()).toBe('terminada');
  });

  it('añade sola cada lectura válida del GPS, aunque lleguen dos seguidas', () => {
    let exito: (p: unknown) => void = () => undefined;
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { watchPosition: (ok: (p: unknown) => void) => ((exito = ok), 1), clearWatch: () => undefined },
    });
    const lectura = (metros: number, timestamp: number, accuracy = 5) => ({
      coords: { latitude: pos(metros).latitud, longitude: -3.7, accuracy },
      timestamp,
    });

    gps.iniciar();
    exito(lectura(0, 1_000));
    grabacion.empezar();
    exito(lectura(10, 6_000));
    exito(lectura(20, 11_000)); // dos lecturas en el mismo instante: no se pierde ninguna
    exito(lectura(30, 16_000, 60)); // precisión mala: el filtro la descarta
    expect(grabacion.puntos().length).toBe(3);
    gps.detener();
  });

  it('no añade dos veces la misma posición ni graba si no está grabando', () => {
    const p = pos(10);
    gps.posicionValida.set(pos(0));
    grabacion.empezar(0);
    grabacion.registrar(p, 5_000);
    grabacion.registrar(p, 6_000);
    expect(grabacion.puntos().length).toBe(2);

    grabacion.terminar(6_000);
    grabacion.registrar(pos(20), 7_000);
    expect(grabacion.puntos().length).toBe(2);
  });

  it('los tiempos de los puntos nunca van hacia atrás', () => {
    gps.posicionValida.set(pos(0));
    grabacion.empezar(10_000);
    grabacion.registrar(pos(10), 20_000);
    grabacion.registrar(pos(20), 15_000); // llega con hora anterior
    expect(grabacion.puntos().map((p) => p.tiempoSegundos)).toEqual([0, 10, 10]);
  });

  it('el cronómetro avanza cada segundo mientras se graba', () => {
    vi.useFakeTimers();
    gps.posicionValida.set(pos(0));
    grabacion.empezar(Date.now());
    vi.advanceTimersByTime(3_000);
    expect(grabacion.segundos()).toBe(3);
  });

  it('descartar borra todo y vuelve al principio', () => {
    gps.posicionValida.set(pos(0));
    grabacion.empezar(0);
    grabacion.registrar(pos(10), 5_000);
    grabacion.descartar();
    expect(grabacion.estado()).toBe('parada');
    expect(grabacion.puntos()).toEqual([]);
    expect(grabacion.segundos()).toBe(0);
  });
});
