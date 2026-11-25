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
  });
});
