import { TestBed } from '@angular/core/testing';
import { PuntoGps } from '../modelos/ruta';
import { Coordenada } from './calculo';
import { ModoVueltaRapida, VueltaRapida } from './vuelta-rapida';

/**
 * Pista circular de 400 m (radio ≈ 63,7 m) alrededor de un centro en Madrid.
 * Cada vuelta son 40 lecturas separadas 10 m; la lectura 40 vuelve a la salida.
 */
const CENTRO = { latitud: 40.4, longitud: -3.7 };
const RADIO = 400 / (2 * Math.PI);
const METROS_POR_GRADO = 111_195;

function puntoEnPista(fraccion: number): Coordenada {
  const angulo = fraccion * 2 * Math.PI;
  return {
    latitud: CENTRO.latitud + (RADIO * Math.cos(angulo)) / METROS_POR_GRADO,
    longitud:
      CENTRO.longitud +
      (RADIO * Math.sin(angulo)) / (METROS_POR_GRADO * Math.cos((CENTRO.latitud * Math.PI) / 180)),
  };
}

const SALIDA = puntoEnPista(0);

/** Lecturas 1..40 de una vuelta que empieza en `inicio` y dura `duracion` segundos */
function vuelta(inicio: number, duracion: number): PuntoGps[] {
  return Array.from({ length: 40 }, (_, i) => ({
    ...puntoEnPista((i + 1) / 40),
    tiempoSegundos: inicio + ((i + 1) * duracion) / 40,
  }));
}

/** Da varias vueltas seguidas y una lectura más (la que, al alejarse, cierra la última) */
function darVueltas(modo: ModoVueltaRapida, duraciones: number[]): void {
  let inicio = 0;
  for (const duracion of duraciones) {
    vuelta(inicio, duracion).forEach((p) => modo.registrar(p));
    inicio += duracion;
  }
  modo.registrar({ ...puntoEnPista(1 / 40), tiempoSegundos: inicio + 2 });
}

describe('ModoVueltaRapida', () => {
  it('cierra cada vuelta al volver a pasar por la salida', () => {
    const modo = new ModoVueltaRapida(SALIDA);
    darVueltas(modo, [100, 95]);

    expect(modo.vueltas.length).toBe(2);
    expect(modo.vueltas[0].numero).toBe(1);
    expect(modo.vueltas[0].tiempoSegundos).toBeCloseTo(100, 6);
    expect(modo.vueltas[0].distanciaMetros).toBeCloseTo(400, -1);
    expect(modo.vueltas[0].puntos[0].tiempoSegundos).toBe(0);
    expect(modo.vueltas[1].inicioSegundos).toBeCloseTo(100, 6);
    expect(modo.vueltas[1].tiempoSegundos).toBeCloseTo(95, 6);
    expect(modo.numeroVuelta).toBe(3);
  });

  it('la vuelta se cierra cuando la lectura ya se aleja de la línea, no antes', () => {
    const modo = new ModoVueltaRapida(SALIDA);
    const lecturas = vuelta(0, 100);
    // Las lecturas 38, 39 y 40 están a menos de 20 m de la salida, pero todavía se acerca
    lecturas.forEach((p) => expect(modo.registrar(p)).toBeNull());
    const cerrada = modo.registrar({ ...puntoEnPista(1 / 40), tiempoSegundos: 102.5 });
    expect(cerrada?.tiempoSegundos).toBeCloseTo(100, 6);
  });

  it('si falta la lectura justo en la línea, calcula el cruce entre la de antes y la de después', () => {
    const modo = new ModoVueltaRapida(SALIDA);
    const lecturas = vuelta(0, 100);
    lecturas.slice(0, 39).forEach((p) => modo.registrar(p)); // se pierde la lectura 40
    // La 39 está 10 m antes de la línea (97,5 s) y la siguiente 10 m después (102,5 s): cruzó a los 100 s
    const cerrada = modo.registrar({ ...puntoEnPista(1 / 40), tiempoSegundos: 102.5 });
    expect(cerrada?.tiempoSegundos).toBeCloseTo(100, 3);
    expect(modo.inicioVueltaSegundos).toBeCloseTo(100, 3);
  });

  it('no cierra vueltas falsas por el ruido del GPS cerca de la salida', () => {
    const modo = new ModoVueltaRapida(SALIDA);
    // El corredor da saltitos alrededor de la línea antes de arrancar
    for (let s = 1; s <= 10; s++) {
      const ruido = puntoEnPista(s % 2 === 0 ? 0.01 : -0.01);
      expect(modo.registrar({ ...ruido, tiempoSegundos: s })).toBeNull();
    }
    expect(modo.vueltas.length).toBe(0);
  });

  it('avisa en morado al bajar la mejor vuelta, en verde si mejora la anterior y en rojo si no', () => {
    const modo = new ModoVueltaRapida(SALIDA);
    darVueltas(modo, [100, 95, 98, 96]);
    const [v1, v2, v3, v4] = modo.vueltas;

    expect(v1.resultado).toBeNull(); // la primera no tiene con qué compararse
    expect(v1.esMejor).toBe(true);
    expect(v1.diferenciaConMejorSegundos).toBeNull();

    expect(v2.resultado).toBe('morado');
    expect(v2.esMejor).toBe(true);
    expect(v2.diferenciaConMejorSegundos).toBeCloseTo(-5, 6);

    expect(v3.resultado).toBe('peor');
    expect(v3.esMejor).toBe(false);
    expect(v3.diferenciaConMejorSegundos).toBeCloseTo(3, 6);
    expect(v3.diferenciaConAnteriorSegundos).toBeCloseTo(3, 6);

    expect(v4.resultado).toBe('mejor'); // más rápida que la anterior (98) pero no que la mejor (95)
    expect(v4.diferenciaConAnteriorSegundos).toBeCloseTo(-2, 6);
    expect(modo.mejorVuelta?.numero).toBe(2);
  });

  it('calcula en vivo la diferencia con la mejor vuelta en el mismo punto de la pista', () => {
    const modo = new ModoVueltaRapida(SALIDA);
    expect(modo.diferenciaEnVivo(10)).toBeNull(); // sin vuelta terminada no hay con qué comparar

    darVueltas(modo, [100]); // la última lectura (1/40 de la vuelta 2) llega a los 102 s
    // Media vuelta más: en la mejor vuelta se tardó 50 s en hacer 200 m; ahora se hacen en 45 s
    vuelta(100, 90)
      .slice(1, 20)
      .forEach((p) => modo.registrar(p));
    expect(modo.metrosVuelta).toBeCloseTo(200, -1);
    expect(modo.diferenciaEnVivo(145)).toBeCloseTo(-5, 0);
  });

  it('se puede cerrar la vuelta a mano con el botón', () => {
    const modo = new ModoVueltaRapida(SALIDA);
    expect(modo.marcarVuelta()).toBeNull(); // sin moverse no hay vuelta
    vuelta(0, 100)
      .slice(0, 20)
      .forEach((p) => modo.registrar(p));
    const manual = modo.marcarVuelta();
    expect(manual?.tiempoSegundos).toBeCloseTo(50, 6);
    expect(modo.numeroVuelta).toBe(2);
    expect(modo.inicioVueltaSegundos).toBeCloseTo(50, 6);
  });

  it('respeta un radio y una distancia mínima distintos', () => {
    const modo = new ModoVueltaRapida(SALIDA, { distanciaMinimaMetros: 500 });
    darVueltas(modo, [100]);
    // Con 500 m mínimos, a los 400 m todavía no se puede cerrar la vuelta
    expect(modo.vueltas.length).toBe(0);
  });
});

describe('VueltaRapida', () => {
  let servicio: VueltaRapida;

  beforeEach(() => {
    servicio = TestBed.inject(VueltaRapida);
  });

  it('expone las vueltas, la mejor y la diferencia como signals', () => {
    servicio.iniciar(SALIDA);
    expect(servicio.estado()).toBe('en-curso');
    expect(servicio.numeroVuelta()).toBe(1);

    let inicio = 0;
    for (const duracion of [100, 95]) {
      vuelta(inicio, duracion).forEach((p) => servicio.registrar(p));
      inicio += duracion;
    }
    const cerrada = servicio.registrar({ ...puntoEnPista(1 / 40), tiempoSegundos: 197 });

    expect(cerrada?.numero).toBe(2);
    expect(servicio.vueltas().length).toBe(2);
    expect(servicio.ultimaVuelta()?.resultado).toBe('morado');
    expect(servicio.mejorVuelta()?.numero).toBe(2);
    expect(servicio.numeroVuelta()).toBe(3);
    expect(servicio.diferencia()).not.toBeNull();
    expect(servicio.metrosVuelta()).toBeGreaterThan(0);
  });

  it('el botón de vuelta cierra la vuelta actual', () => {
    servicio.iniciar(SALIDA, 0);
    vuelta(0, 100)
      .slice(0, 10)
      .forEach((p) => servicio.registrar(p));
    expect(servicio.marcarVuelta(25)?.numero).toBe(1);
    expect(servicio.vueltas().length).toBe(1);
  });

  it('al terminar ignora las lecturas y al reiniciar lo borra todo', () => {
    servicio.iniciar(SALIDA);
    servicio.terminar();
    expect(servicio.estado()).toBe('terminado');
    expect(servicio.registrar({ ...puntoEnPista(0.5), tiempoSegundos: 50 })).toBeNull();
    expect(servicio.marcarVuelta(50)).toBeNull();

    servicio.reiniciar();
    expect(servicio.estado()).toBe('parado');
    expect(servicio.vueltas()).toEqual([]);
    expect(servicio.diferencia()).toBeNull();
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
