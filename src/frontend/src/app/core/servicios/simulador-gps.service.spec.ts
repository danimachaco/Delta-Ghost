import { ErrorCarreraInvalida } from '../../compartido/utilidades/validar-carrera';
import { PuntoGps } from '../modelos/punto-gps';
import { SimuladorGpsService } from './simulador-gps.service';

// Puntos en t = 0, 10, 15 y 30 segundos
const CARRERA = {
  nombre: 'Prueba',
  puntos: [0, 10, 15, 30].map((t, i) => ({ latitud: 40.41 + i / 1000, longitud: -3.7, tiempoSegundos: t })),
};

describe('SimuladorGpsService', () => {
  let servicio: SimuladorGpsService;
  let recibidos: PuntoGps[];

  beforeEach(() => {
    vi.useFakeTimers();
    servicio = new SimuladorGpsService();
    recibidos = [];
    servicio.puntos$.subscribe((p) => recibidos.push(p));
  });

  afterEach(() => {
    servicio.ngOnDestroy();
    vi.useRealTimers();
  });

  it('empieza sin carrera y no hace nada al reproducir', () => {
    servicio.reproducir();
    expect(servicio.estado()).toBe('sin-carrera');
    expect(recibidos).toHaveLength(0);
  });

  it('rechaza JSON inválido sin perder la carrera cargada', () => {
    servicio.cargar(CARRERA);
    expect(() => servicio.cargarJson('{no es json')).toThrow(ErrorCarreraInvalida);
    expect(() => servicio.cargar({ nombre: 'X', puntos: [] })).toThrow(ErrorCarreraInvalida);
    expect(servicio.carrera()?.nombre).toBe('Prueba');
  });

  it('carga desde texto JSON', () => {
    servicio.cargarJson(JSON.stringify(CARRERA));
    expect(servicio.estado()).toBe('detenida');
  });

  it('emite el primer punto al instante y los demás respetando los tiempos', () => {
    servicio.cargar(CARRERA);
    servicio.reproducir();
    expect(recibidos).toHaveLength(1);
    vi.advanceTimersByTime(9_999);
    expect(recibidos).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(recibidos).toHaveLength(2);
    vi.advanceTimersByTime(5_000);
    expect(recibidos).toHaveLength(3);
    expect(servicio.posicion()?.tiempoSegundos).toBe(15);
  });

  it('acelera dividiendo los tiempos por el factor', () => {
    servicio.cargar(CARRERA);
    servicio.cambiarVelocidad(10);
    servicio.reproducir();
    vi.advanceTimersByTime(1_000); // 10 s de carrera
    expect(recibidos).toHaveLength(2);
    vi.advanceTimersByTime(2_000); // hasta 30 s de carrera
    expect(recibidos).toHaveLength(4);
  });

  it('termina, avisa con fin$ y deja de emitir', () => {
    let fines = 0;
    servicio.fin$.subscribe(() => fines++);
    servicio.cargar(CARRERA);
    servicio.reproducir();
    vi.advanceTimersByTime(60_000);
    expect(recibidos).toHaveLength(4);
    expect(servicio.estado()).toBe('terminada');
    expect(servicio.progreso()).toBe(1);
    expect(fines).toBe(1);
  });

  it('pausa y reanuda sin perder el tiempo ya transcurrido', () => {
    servicio.cargar(CARRERA);
    servicio.reproducir();
    vi.advanceTimersByTime(4_000);
    servicio.pausar();
    vi.advanceTimersByTime(60_000); // en pausa no pasa nada
    expect(recibidos).toHaveLength(1);
    servicio.reproducir(); // reanuda: faltaban 6 s
    vi.advanceTimersByTime(5_999);
    expect(recibidos).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(recibidos).toHaveLength(2);
  });

  it('cambiar la velocidad en caliente se aplica al tiempo restante', () => {
    servicio.cargar(CARRERA);
    servicio.reproducir();
    vi.advanceTimersByTime(4_000); // faltan 6 s de carrera
    servicio.cambiarVelocidad(2); // ahora 3 s reales
    vi.advanceTimersByTime(2_999);
    expect(recibidos).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(recibidos).toHaveLength(2);
  });

  it('detener vuelve al principio y permite reproducir de nuevo', () => {
    servicio.cargar(CARRERA);
    servicio.reproducir();
    vi.advanceTimersByTime(10_000);
    servicio.detener();
    expect(servicio.estado()).toBe('detenida');
    expect(servicio.posicion()).toBeNull();
    vi.advanceTimersByTime(60_000);
    expect(recibidos).toHaveLength(2); // nada más tras detener
    servicio.reproducir();
    expect(recibidos).toHaveLength(3);
    expect(servicio.indice()).toBe(0);
  });

  it('rechaza velocidades no permitidas', () => {
    expect(() => servicio.cambiarVelocidad(3)).toThrow();
  });
});
