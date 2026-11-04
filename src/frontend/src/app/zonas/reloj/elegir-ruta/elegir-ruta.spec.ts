import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { environment } from '../../../../environments/environment';
import { erroresInterceptor } from '../../../core/interceptores/errores-interceptor';
import { Ruta } from '../../../core/modelos/ruta';
import { Sombra } from '../../../core/modelos/sombra';
import { Carrera } from '../../../core/servicios/carrera';
import { Cronometro } from '../../../core/servicios/cronometro';
import { ElegirRuta } from './elegir-ruta';

describe('ElegirRuta', () => {
  let harness: RouterTestingHarness;
  let el: HTMLElement;
  let servidor: HttpTestingController;
  let exito: (p: unknown) => void;
  const mock = {
    watchPosition: vi.fn((ok: (p: unknown) => void) => {
      exito = ok;
      return 7;
    }),
    clearWatch: vi.fn(),
  };
  const base = `${environment.apiUrl}/rutas`;

  const puntos = (segundos: number) => [
    { latitud: 40.4, longitud: -3.7, tiempoSegundos: 0 },
    { latitud: 40.41, longitud: -3.7, tiempoSegundos: segundos },
  ];
  const rutas: Ruta[] = [
    { id: '1', nombre: 'Ribera del río', fecha: '2026-10-10T09:00:00', puntos: puntos(600) },
    { id: '2', nombre: 'Circuito del parque', fecha: '2026-10-20T09:00:00', puntos: puntos(1661) },
  ];
  const sombra = (rutaId: string, segundos: number): Sombra => ({
    rutaId,
    carreraId: null,
    tiempoTotalSegundos: segundos,
    puntos: puntos(segundos),
    sectores: [],
  });

  /** Lectura del GPS con buena precisión */
  const lectura = { coords: { latitude: 40.4, longitude: -3.7, accuracy: 5 }, timestamp: 1_000 };

  beforeEach(async () => {
    mock.clearWatch.mockClear();
    Object.defineProperty(navigator, 'geolocation', { value: mock, configurable: true });
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'reloj/elegir', component: ElegirRuta },
          { path: 'reloj', children: [] },
        ]),
        provideHttpClient(withInterceptors([erroresInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    servidor = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    servidor.verify();
    TestBed.inject(Carrera).descartar();
  });

  /** Abre la pantalla (con ?ruta=… si se indica) y responde a la lista de rutas */
  async function abrir(url = '/reloj/elegir', respuesta: Ruta[] = rutas): Promise<void> {
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url, ElegirRuta);
    el = harness.routeNativeElement!;
    servidor.expectOne({ method: 'GET', url: base }).flush(respuesta);
    await actualizar();
  }

  async function actualizar(): Promise<void> {
    harness.detectChanges();
    await harness.fixture.whenStable();
  }

  const tarjetas = () => [...el.querySelectorAll<HTMLButtonElement>('.tarjeta')];
  const empezar = () => el.querySelector<HTMLButtonElement>('.empezar')!;
  const aviso = () => el.querySelector('.aviso')?.textContent?.trim();

  it('muestra las rutas de la más nueva a la más antigua con km y tiempo de la sombra', async () => {
    await abrir();
    expect(tarjetas().length).toBe(2);
    expect(tarjetas()[0].querySelector('.nombre')?.textContent).toBe('Circuito del parque');
    expect(tarjetas()[0].querySelector('.detalle')?.textContent).toBe('sombra 27:41');
    expect(tarjetas()[0].querySelector('.distancia')?.textContent).toBe('1,1 km');
    expect(aviso()).toBe('Toca una ruta para elegirla');
    expect(empezar().disabled).toBe(true);
  });

  it('al elegir una ruta descarga su sombra y enseña su tiempo', async () => {
    await abrir();
    tarjetas()[0].click();
    await actualizar();
    expect(tarjetas()[0].getAttribute('aria-pressed')).toBe('true');
    expect(aviso()).toBe('Cargando tu sombra…');

    // La sombra es una carrera mejor que la grabación: la tarjeta muestra el tiempo nuevo
    servidor.expectOne(`${base}/2/sombra`).flush(sombra('2', 1500));
    await actualizar();
    expect(tarjetas()[0].querySelector('.detalle')?.textContent).toBe('sombra 25:00');
    expect(aviso()).toBe('Buscando señal GPS…');
  });

  it('con la sombra y señal GPS, Empezar inicia la carrera y abre el reloj', async () => {
    await abrir();
    tarjetas()[1].click();
    servidor.expectOne(`${base}/1/sombra`).flush(sombra('1', 600));
    exito(lectura);
    await actualizar();
    expect(aviso()).toBe('Señal GPS lista');
    expect(empezar().disabled).toBe(false);

    empezar().click();
    await actualizar();

    const carrera = TestBed.inject(Carrera);
    expect(carrera.estado()).toBe('en-curso');
    expect(carrera.ruta()?.nombre).toBe('Ribera del río');
    expect(carrera.sombra()?.tiempoTotalSegundos).toBe(600);
    expect(TestBed.inject(Cronometro).estado()).toBe('corriendo');
    expect(TestBed.inject(Router).url).toBe('/reloj');
    // Al salir de la pantalla el GPS sigue encendido para la carrera
    expect(mock.clearWatch).not.toHaveBeenCalled();
  });

  it('?ruta=ID deja elegida esa ruta', async () => {
    await abrir('/reloj/elegir?ruta=1');
    servidor.expectOne(`${base}/1/sombra`).flush(sombra('1', 600));
    await actualizar();
    expect(tarjetas()[1].classList).toContain('elegida');
  });

  it('si la sombra falla avisa y no deja empezar', async () => {
    await abrir();
    tarjetas()[0].click();
    servidor
      .expectOne(`${base}/2/sombra`)
      .flush({ error: 'Ruta no encontrada' }, { status: 404, statusText: 'Not Found' });
    exito(lectura);
    await actualizar();
    expect(el.querySelector('.aviso.error')?.textContent).toContain('Ruta no encontrada');
    expect(empezar().disabled).toBe(true);
  });

  it('una sombra con menos de 2 puntos no se puede correr', async () => {
    await abrir();
    tarjetas()[0].click();
    servidor.expectOne(`${base}/2/sombra`).flush({ ...sombra('2', 0), puntos: [] });
    await actualizar();
    expect(aviso()).toContain('no tiene puntos suficientes');
    expect(empezar().disabled).toBe(true);
  });

  it('si se elige otra ruta antes de que llegue la sombra, se cancela la primera petición', async () => {
    await abrir();
    tarjetas()[0].click();
    const primera = servidor.expectOne(`${base}/2/sombra`);
    tarjetas()[1].click();
    servidor.expectOne(`${base}/1/sombra`).flush(sombra('1', 600));
    expect(primera.cancelled).toBe(true);
  });

  it('sin rutas propone grabar una', async () => {
    await abrir('/reloj/elegir', []);
    expect(el.textContent).toContain('Todavía no tienes rutas');
    expect(el.querySelector('a[href="/app/grabar"]')).toBeTruthy();
  });

  it('si falla la lista muestra el error y permite reintentar', async () => {
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/reloj/elegir', ElegirRuta);
    el = harness.routeNativeElement!;
    servidor
      .expectOne(base)
      .flush({ error: 'Error en el servidor' }, { status: 500, statusText: 'Error' });
    await actualizar();
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Error en el servidor');

    el.querySelector<HTMLButtonElement>('.mensaje button')!.click();
    servidor.expectOne(base).flush(rutas);
    await actualizar();
    expect(tarjetas().length).toBe(2);
  });

  it('si se sale sin empezar apaga el GPS', async () => {
    await abrir();
    await harness.navigateByUrl('/reloj');
    expect(mock.clearWatch).toHaveBeenCalledWith(7);
  });
});
