import { TestBed } from '@angular/core/testing';
import { PuntoGps } from '../modelos/ruta';
import { DiferenciaSombra } from './diferencia-sombra';

describe('DiferenciaSombra', () => {
  let servicio: DiferenciaSombra;

  // Sombra en línea recta hacia el norte: 3 tramos de unos 111 m, el segundo más lento
  const sombra: PuntoGps[] = [
    { latitud: 40.0, longitud: -3.7, tiempoSegundos: 0 },
    { latitud: 40.001, longitud: -3.7, tiempoSegundos: 30 },
    { latitud: 40.002, longitud: -3.7, tiempoSegundos: 70 },
    { latitud: 40.003, longitud: -3.7, tiempoSegundos: 100 },
  ];

  beforeEach(() => {
    servicio = TestBed.inject(DiferenciaSombra);
  });

  it('calcula la distancia acumulada hasta cada punto', () => {
    const perfil = servicio.perfil(sombra);
    expect(perfil.acumulados[0]).toBe(0);
    expect(perfil.acumulados[1]).toBeCloseTo(111.2, 0);
    expect(perfil.distanciaTotal).toBeCloseTo(333.6, 0);
    expect(perfil.tiempoTotal).toBe(100);
  });

  it('interpola el tiempo de la sombra a mitad de un tramo', () => {
    const perfil = servicio.perfil(sombra);
    const mitadSegundoTramo = (perfil.acumulados[1] + perfil.acumulados[2]) / 2;
    expect(perfil.tiempoEnDistancia(0)).toBe(0);
    expect(perfil.tiempoEnDistancia(perfil.acumulados[1])).toBeCloseTo(30, 6);
    expect(perfil.tiempoEnDistancia(mitadSegundoTramo)).toBeCloseTo(50, 6);
  });

  it('interpola la distancia de la sombra en un instante', () => {
    const perfil = servicio.perfil(sombra);
    expect(perfil.distanciaEnTiempo(15)).toBeCloseTo(perfil.acumulados[1] / 2, 6);
    expect(perfil.distanciaEnTiempo(70)).toBeCloseTo(perfil.acumulados[2], 6);
  });

  it('no se sale del recorrido antes de la salida ni después de la meta', () => {
    const perfil = servicio.perfil(sombra);
    expect(perfil.tiempoEnDistancia(-50)).toBe(0);
    expect(perfil.tiempoEnDistancia(10_000)).toBe(100);
    expect(perfil.distanciaEnTiempo(-5)).toBe(0);
    expect(perfil.distanciaEnTiempo(500)).toBeCloseTo(perfil.distanciaTotal, 6);
  });

  it('diferencia negativa si vas por delante de la sombra', () => {
    const metros = servicio.perfil(sombra).acumulados[1];
    // La sombra tardó 30 s en hacer el primer tramo; tú lo has hecho en 27 s
    const d = servicio.calcular(sombra, metros, 27)!;
    expect(d.segundos).toBeCloseTo(-3, 6);
    expect(d.metros).toBeGreaterThan(0);
  });

  it('diferencia positiva si vas por detrás de la sombra', () => {
    const metros = servicio.perfil(sombra).acumulados[1];
    const d = servicio.calcular(sombra, metros, 34)!;
    expect(d.segundos).toBeCloseTo(4, 6);
    expect(d.metros).toBeLessThan(0);
  });

  it('diferencia 0 si vas exactamente al ritmo de la sombra', () => {
    const perfil = servicio.perfil(sombra);
    const d = servicio.calcular(sombra, perfil.acumulados[2], 70)!;
    expect(d.segundos).toBeCloseTo(0, 6);
    expect(d.metros).toBeCloseTo(0, 6);
  });

  it('da el progreso de la sombra para dibujar su punto', () => {
    expect(servicio.calcular(sombra, 0, 0)!.progresoSombra).toBe(0);
    expect(servicio.calcular(sombra, 0, 70)!.progresoSombra).toBeCloseTo(2 / 3, 3);
    expect(servicio.calcular(sombra, 0, 999)!.progresoSombra).toBeCloseTo(1, 6);
  });

  it('si la sombra se paró, toma el primer momento en que llegó a ese sitio', () => {
    const conParada: PuntoGps[] = [
      { latitud: 40.0, longitud: -3.7, tiempoSegundos: 0 },
      { latitud: 40.001, longitud: -3.7, tiempoSegundos: 30 },
      { latitud: 40.001, longitud: -3.7, tiempoSegundos: 45 },
      { latitud: 40.002, longitud: -3.7, tiempoSegundos: 75 },
    ];
    const perfil = servicio.perfil(conParada);
    expect(perfil.tiempoEnDistancia(perfil.acumulados[1])).toBeCloseTo(30, 6);
    expect(perfil.distanciaEnTiempo(40)).toBeCloseTo(perfil.acumulados[1], 6);
  });

  it('reutiliza el perfil si la sombra no cambia', () => {
    expect(servicio.perfil(sombra)).toBe(servicio.perfil(sombra));
    expect(servicio.perfil([...sombra])).not.toBe(servicio.perfil(sombra));
  });

  it('devuelve null si la sombra no tiene al menos 2 puntos', () => {
    expect(servicio.calcular([], 100, 30)).toBeNull();
    expect(servicio.calcular([sombra[0]], 100, 30)).toBeNull();
  });
});
