import { TestBed } from '@angular/core/testing';
import { Cronometro } from './cronometro';

describe('Cronometro', () => {
  let cron: Cronometro;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    cron = TestBed.inject(Cronometro);
  });

  afterEach(() => {
    cron.reiniciar();
    vi.useRealTimers();
  });

  it('empieza parado y a cero', () => {
    expect(cron.estado()).toBe('parado');
    expect(cron.segundos()).toBe(0);
  });

  it('cuenta los segundos mientras corre', () => {
    cron.iniciar();
    vi.advanceTimersByTime(5000);
    expect(cron.estado()).toBe('corriendo');
    expect(cron.segundos()).toBe(5);
  });

  it('no se salta segundos: muestra el entero que toca', () => {
    cron.iniciar();
    vi.advanceTimersByTime(1900);
    expect(cron.segundos()).toBe(1);
    vi.advanceTimersByTime(200);
    expect(cron.segundos()).toBe(2);
  });

  it('sigue contando el tiempo real aunque los temporizadores se congelen (pantalla apagada)', () => {
    cron.iniciar();
    vi.advanceTimersByTime(3000);
    // El reloj del sistema avanza 60 s pero el navegador no dispara ningún intervalo
    vi.setSystemTime(Date.now() + 60_000);
    expect(cron.segundos()).toBe(3);
    // Al volver a la pantalla se refresca al instante con el tiempo real
    document.dispatchEvent(new Event('visibilitychange'));
    expect(cron.segundos()).toBe(63);
  });

  it('al pausar congela el tiempo', () => {
    cron.iniciar();
    vi.advanceTimersByTime(4000);
    cron.pausar();
    vi.advanceTimersByTime(10_000);
    expect(cron.estado()).toBe('pausado');
    expect(cron.segundos()).toBe(4);
  });

  it('al reanudar sigue desde donde estaba, sin contar el tiempo en pausa', () => {
    cron.iniciar();
    vi.advanceTimersByTime(4000);
    cron.pausar();
    vi.advanceTimersByTime(30_000);
    cron.reanudar();
    vi.advanceTimersByTime(2000);
    expect(cron.estado()).toBe('corriendo');
    expect(cron.segundos()).toBe(6);
  });

  it('alternar pausa y reanuda', () => {
    cron.iniciar();
    cron.alternar();
    expect(cron.estado()).toBe('pausado');
    cron.alternar();
    expect(cron.estado()).toBe('corriendo');
  });

  it('iniciar de nuevo con la carrera en marcha no la reinicia', () => {
    cron.iniciar();
    vi.advanceTimersByTime(7000);
    cron.iniciar();
    expect(cron.segundos()).toBe(7);
  });

  it('pausar o reanudar sin haber empezado no hace nada', () => {
    cron.pausar();
    cron.reanudar();
    expect(cron.estado()).toBe('parado');
  });

  it('reiniciar lo deja a cero y parado', () => {
    cron.iniciar();
    vi.advanceTimersByTime(9000);
    cron.reiniciar();
    expect(cron.estado()).toBe('parado');
    expect(cron.segundos()).toBe(0);
  });

  it('al reiniciar no queda ningún temporizador activo', () => {
    cron.iniciar();
    cron.reiniciar();
    expect(vi.getTimerCount()).toBe(0);
  });
});
