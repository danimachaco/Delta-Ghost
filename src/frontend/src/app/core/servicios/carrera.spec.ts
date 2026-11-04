import { TestBed } from '@angular/core/testing';
import { Ruta } from '../modelos/ruta';
import { Sombra } from '../modelos/sombra';
import { Carrera } from './carrera';
import { Cronometro } from './cronometro';
import { Gps } from './gps';

describe('Carrera', () => {
  let carrera: Carrera;
  let cronometro: Cronometro;
  const gps = { iniciar: vi.fn(), detener: vi.fn() };

  const puntos = [
    { latitud: 40.4, longitud: -3.7, tiempoSegundos: 0 },
    { latitud: 40.401, longitud: -3.7, tiempoSegundos: 30 },
  ];
  const ruta: Ruta = { id: '1', nombre: 'Parque', fecha: '2026-11-01T10:00:00', puntos };
  const sombra: Sombra = {
    rutaId: '1',
    carreraId: null,
    tiempoTotalSegundos: 30,
    puntos,
    sectores: [],
  };

  beforeEach(() => {
    vi.useFakeTimers();
    gps.iniciar.mockClear();
    gps.detener.mockClear();
    TestBed.configureTestingModule({ providers: [{ provide: Gps, useValue: gps }] });
    carrera = TestBed.inject(Carrera);
    cronometro = TestBed.inject(Cronometro);
  });

  afterEach(() => {
    cronometro.reiniciar();
    vi.useRealTimers();
  });

  it('empieza sin carrera', () => {
    expect(carrera.estado()).toBe('sin-carrera');
    expect(carrera.ruta()).toBeNull();
  });

  it('iniciar() guarda la ruta y la sombra, enciende el GPS y arranca el cronómetro', () => {
    expect(carrera.iniciar(ruta, sombra)).toBe(true);
    expect(carrera.estado()).toBe('en-curso');
    expect(carrera.ruta()).toBe(ruta);
    expect(carrera.sombra()).toBe(sombra);
    expect(gps.iniciar).toHaveBeenCalled();
    expect(cronometro.estado()).toBe('corriendo');

    vi.advanceTimersByTime(3000);
    expect(carrera.segundos()).toBe(3);
  });

  it('no empieza otra carrera si ya hay una en curso', () => {
    carrera.iniciar(ruta, sombra);
    expect(carrera.iniciar(ruta, sombra)).toBe(false);
  });

  it('no empieza con una sombra de menos de 2 puntos', () => {
    expect(carrera.iniciar(ruta, { ...sombra, puntos: [puntos[0]] })).toBe(false);
    expect(carrera.estado()).toBe('sin-carrera');
  });

  it('terminar() para el tiempo y apaga el GPS, pero guarda los datos', () => {
    carrera.iniciar(ruta, sombra);
    vi.advanceTimersByTime(5000);
    carrera.terminar();
    vi.advanceTimersByTime(5000);

    expect(carrera.estado()).toBe('terminada');
    expect(carrera.segundos()).toBe(5);
    expect(gps.detener).toHaveBeenCalled();
    expect(carrera.ruta()).toBe(ruta);
  });

  it('descartar() lo deja todo a cero', () => {
    carrera.iniciar(ruta, sombra);
    vi.advanceTimersByTime(2000);
    carrera.descartar();

    expect(carrera.estado()).toBe('sin-carrera');
    expect(carrera.ruta()).toBeNull();
    expect(carrera.sombra()).toBeNull();
    expect(carrera.segundos()).toBe(0);
  });

  it('después de terminar se puede empezar otra carrera desde cero', () => {
    carrera.iniciar(ruta, sombra);
    vi.advanceTimersByTime(4000);
    carrera.terminar();

    expect(carrera.iniciar(ruta, sombra)).toBe(true);
    expect(carrera.segundos()).toBe(0);
  });
});
