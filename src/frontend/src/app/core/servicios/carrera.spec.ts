import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { PosicionGps } from '../modelos/punto-gps';
import { PuntoGps, Ruta } from '../modelos/ruta';
import { Sombra } from '../modelos/sombra';
import { Carrera } from './carrera';
import { Cronometro } from './cronometro';
import { Gps } from './gps';

/** Grados de latitud que equivalen a `metros` hacia el norte (1° ≈ 111 195 m) */
const norte = (metros: number) => 40 + metros / 111_195;
/** Lectura del GPS a `metros` al norte de la salida */
const posicion = (metros: number): PosicionGps => ({
  latitud: norte(metros),
  longitud: -3.7,
  precision: 5,
});

describe('Carrera', () => {
  let carrera: Carrera;
  let cronometro: Cronometro;
  let lecturas: Subject<PosicionGps>;
  let gps: {
    iniciar: ReturnType<typeof vi.fn>;
    detener: ReturnType<typeof vi.fn>;
    posicionValida: ReturnType<typeof signal<PosicionGps | null>>;
    lecturasValidas: Subject<PosicionGps>;
  };

  // La sombra corre 200 m en línea recta en 100 s, a 2 m/s
  const puntos: PuntoGps[] = [
    { latitud: norte(0), longitud: -3.7, tiempoSegundos: 0 },
    { latitud: norte(100), longitud: -3.7, tiempoSegundos: 50 },
    { latitud: norte(200), longitud: -3.7, tiempoSegundos: 100 },
  ];
  const ruta: Ruta = { id: '1', nombre: 'Parque', fecha: '2026-11-01T10:00:00', puntos };
  const sombra: Sombra = {
    rutaId: '1',
    carreraId: null,
    tiempoTotalSegundos: 100,
    puntos,
    sectores: [],
  };

  /** Avanza el reloj `segundos` y después llega una lectura del GPS a `metros` */
  function correr(segundos: number, metros: number): void {
    vi.advanceTimersByTime(segundos * 1000);
    lecturas.next(posicion(metros));
  }

  beforeEach(() => {
    vi.useFakeTimers();
    lecturas = new Subject<PosicionGps>();
    gps = {
      iniciar: vi.fn(),
      detener: vi.fn(),
      posicionValida: signal<PosicionGps | null>(posicion(0)),
      lecturasValidas: lecturas,
    };
    TestBed.configureTestingModule({ providers: [{ provide: Gps, useValue: gps }] });
    carrera = TestBed.inject(Carrera);
    cronometro = TestBed.inject(Cronometro);
  });

  afterEach(() => {
    cronometro.reiniciar();
    vi.useRealTimers();
  });

  describe('empezar y terminar (PS-44)', () => {
    it('empieza sin carrera', () => {
      expect(carrera.estado()).toBe('sin-carrera');
      expect(carrera.ruta()).toBeNull();
      expect(carrera.diferencia()).toBeNull();
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
      correr(2, 5);
      carrera.descartar();

      expect(carrera.estado()).toBe('sin-carrera');
      expect(carrera.ruta()).toBeNull();
      expect(carrera.sombra()).toBeNull();
      expect(carrera.puntos()).toEqual([]);
      expect(carrera.segundos()).toBe(0);
    });

    it('después de terminar se puede empezar otra carrera desde cero', () => {
      carrera.iniciar(ruta, sombra);
      correr(4, 8);
      carrera.terminar();

      expect(carrera.iniciar(ruta, sombra)).toBe(true);
      expect(carrera.segundos()).toBe(0);
      expect(carrera.puntos().length).toBe(1);
    });
  });

  describe('cálculo en vivo (PS-45)', () => {
    it('la salida es la posición GPS al empezar, en el segundo 0', () => {
      carrera.iniciar(ruta, sombra);
      expect(carrera.puntos()).toEqual([{ latitud: norte(0), longitud: -3.7, tiempoSegundos: 0 }]);
      expect(carrera.distanciaRutaMetros()).toBeCloseTo(200, 0);
      expect(carrera.progresoTu()).toBe(0);
    });

    it('cada lectura del GPS se añade con los segundos de carrera', () => {
      carrera.iniciar(ruta, sombra);
      correr(10, 25);
      correr(10, 50);
      expect(carrera.puntos().map((p) => p.tiempoSegundos)).toEqual([0, 10, 20]);
      expect(carrera.distanciaMetros()).toBeCloseTo(50, 0);
    });

    it('no añade lecturas si no hay carrera en curso', () => {
      lecturas.next(posicion(10));
      expect(carrera.puntos()).toEqual([]);
    });

    it('si vas más rápido que la sombra, vas por delante y la diferencia es negativa', () => {
      carrera.iniciar(ruta, sombra);
      // A los 20 s llevas 60 m; la sombra pasó por los 60 m a los 30 s
      correr(20, 60);
      expect(carrera.progresoTu()).toBeCloseTo(0.3, 2);
      expect(carrera.progresoSombra()).toBeCloseTo(0.2, 2); // la sombra lleva 40 m
      expect(carrera.diferencia()).toBeCloseTo(-10, 1);
    });

    it('si vas más lento, la sombra va por delante y la diferencia es positiva', () => {
      carrera.iniciar(ruta, sombra);
      // A los 30 s llevas 40 m; la sombra pasó por los 40 m a los 20 s
      correr(30, 40);
      expect(carrera.progresoSombra()).toBeGreaterThan(carrera.progresoTu());
      expect(carrera.diferencia()).toBeCloseTo(10, 1);
    });

    it('si te quedas parado, la diferencia sigue creciendo con el tiempo', () => {
      carrera.iniciar(ruta, sombra);
      vi.advanceTimersByTime(8000);
      expect(carrera.diferencia()).toBeCloseTo(8, 0);
      expect(carrera.progresoSombra()).toBeCloseTo(0.08, 2);
    });

    it('al llegar a la meta la carrera termina sola', () => {
      carrera.iniciar(ruta, sombra);
      correr(40, 100);
      expect(carrera.estado()).toBe('en-curso');
      correr(40, 205);
      expect(carrera.estado()).toBe('terminada');
      expect(carrera.progresoTu()).toBe(1);
      // 80 s frente a los 100 s de la sombra
      expect(carrera.diferencia()).toBeCloseTo(-20, 1);
      expect(gps.detener).toHaveBeenCalled();
    });

    it('no añade dos veces la misma lectura', () => {
      carrera.iniciar(ruta, sombra);
      const misma = posicion(10);
      vi.advanceTimersByTime(1000);
      lecturas.next(misma);
      lecturas.next(misma);
      expect(carrera.puntos().length).toBe(2);
    });
  });
});
