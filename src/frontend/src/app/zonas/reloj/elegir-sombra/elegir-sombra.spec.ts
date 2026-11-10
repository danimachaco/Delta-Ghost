import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { environment } from '../../../../environments/environment';
import { erroresInterceptor } from '../../../core/interceptores/errores-interceptor';
import { Ruta } from '../../../core/modelos/ruta';
import { Sombra, TipoSombra } from '../../../core/modelos/sombra';
import { Carrera } from '../../../core/servicios/carrera';
import { Cronometro } from '../../../core/servicios/cronometro';
import { ElegirSombra } from './elegir-sombra';

describe('ElegirSombra', () => {
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
  const base = `${environment.apiUrl}/rutas/7`;
  const noEncontrado = { status: 404, statusText: 'Not Found' };

  const puntos = (segundos: number) => [
    { latitud: 40.4, longitud: -3.7, tiempoSegundos: 0 },
    { latitud: 40.41, longitud: -3.7, tiempoSegundos: segundos },
  ];
  const ruta: Ruta = {
    id: '7',
    nombre: 'Circuito del parque',
    fecha: '2026-10-20T09:00:00',
    puntos: puntos(1661),
  };
  /** Sombra como la devuelve el servidor con la PS-70 (con `tipo`) o uno anterior (sin él) */
  const sombra = (segundos: number, tipo?: TipoSombra): Sombra => ({
    rutaId: '7',
    carreraId: null,
    tiempoTotalSegundos: segundos,
    puntos: puntos(segundos),
    sectores: [],
    ...(tipo ? { tipo } : {}),
  });

  /** Lectura del GPS con buena precisión */
  const lectura = { coords: { latitude: 40.4, longitude: -3.7, accuracy: 5 }, timestamp: 1_000 };

  beforeEach(() => {
    mock.clearWatch.mockClear();
    Object.defineProperty(navigator, 'geolocation', { value: mock, configurable: true });
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'reloj/sombra', component: ElegirSombra },
          { path: 'reloj/elegir', children: [] },
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

  async function actualizar(): Promise<void> {
    harness.detectChanges();
    await harness.fixture.whenStable();
  }

  /** Abre la pantalla de la ruta 7 y responde a la petición de la ruta */
  async function abrir(): Promise<void> {
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/reloj/sombra?ruta=7', ElegirSombra);
    el = harness.routeNativeElement!;
    servidor.expectOne({ method: 'GET', url: base }).flush(ruta);
    await actualizar();
  }

  /** Responde a las tres sombras como un servidor que ya tiene la PS-70 */
  async function responderSombras(): Promise<void> {
    servidor.expectOne(`${base}/sombra`).flush(sombra(1500, 'MEJOR'));
    servidor.expectOne(`${base}/sombra?tipo=ULTIMA`).flush(sombra(1570, 'ULTIMA'));
    servidor.expectOne(`${base}/sombra?tipo=ORIGINAL`).flush(sombra(1661, 'ORIGINAL'));
    await actualizar();
  }

  const tarjetas = () => [...el.querySelectorAll<HTMLButtonElement>('.tarjeta')];
  const textos = () =>
    tarjetas().map(
      (t) =>
        `${t.querySelector('.nombre')?.textContent} · ${t.querySelector('.detalle')?.textContent}`,
    );
  const empezar = () => el.querySelector<HTMLButtonElement>('.empezar')!;
  const aviso = () => el.querySelector('.aviso')?.textContent?.trim();

  it('enseña la ruta y pide sus tres sombras', async () => {
    await abrir();
    expect(el.querySelector('.ruta')?.textContent).toBe('Circuito del parque');
    expect(textos()).toEqual(['Mejor marca · …', 'Última carrera · …', 'Grabación original · …']);
    expect(aviso()).toBe('Cargando tu sombra…');
    expect(empezar().disabled).toBe(true);

    await responderSombras();
    expect(textos()).toEqual([
      'Mejor marca · 25:00',
      'Última carrera · 26:10',
      'Grabación original · 27:41',
    ]);
  });

  it('empieza con la mejor marca elegida y se puede cambiar de sombra', async () => {
    await abrir();
    await responderSombras();
    expect(tarjetas()[0].getAttribute('aria-pressed')).toBe('true');

    tarjetas()[2].click();
    await actualizar();
    expect(tarjetas()[2].getAttribute('aria-pressed')).toBe('true');
    expect(tarjetas()[0].getAttribute('aria-pressed')).toBe('false');
  });

  it('con señal GPS, Empezar inicia la carrera contra la sombra elegida y abre el reloj', async () => {
    await abrir();
    await responderSombras();
    expect(aviso()).toBe('Buscando señal GPS…');
    expect(empezar().disabled).toBe(true);

    exito(lectura);
    tarjetas()[1].click();
    await actualizar();
    expect(aviso()).toBe('Señal GPS lista');
    empezar().click();
    await actualizar();

    const carrera = TestBed.inject(Carrera);
    expect(carrera.estado()).toBe('en-curso');
    expect(carrera.ruta()?.nombre).toBe('Circuito del parque');
    expect(carrera.sombra()?.tipo).toBe('ULTIMA');
    expect(carrera.sombra()?.tiempoTotalSegundos).toBe(1570);
    expect(TestBed.inject(Cronometro).estado()).toBe('corriendo');
    expect(TestBed.inject(Router).url).toBe('/reloj');
    // Al salir de la pantalla el GPS sigue encendido para la carrera
    expect(mock.clearWatch).not.toHaveBeenCalled();
  });

  it('con un servidor anterior a la PS-70 solo deja correr contra la mejor marca', async () => {
    await abrir();
    // El servidor ignora ?tipo= y devuelve siempre la misma sombra, sin el campo `tipo`
    servidor.expectOne(`${base}/sombra`).flush(sombra(1500));
    servidor.expectOne(`${base}/sombra?tipo=ULTIMA`).flush(sombra(1500));
    servidor.expectOne(`${base}/sombra?tipo=ORIGINAL`).flush(sombra(1500));
    exito(lectura);
    await actualizar();

    expect(textos()).toEqual([
      'Mejor marca · 25:00',
      'Última carrera · no disponible',
      'Grabación original · no disponible',
    ]);
    expect(tarjetas()[1].disabled).toBe(true);
    expect(tarjetas()[2].disabled).toBe(true);
    expect(empezar().disabled).toBe(false);
  });

  it('si aún no hay carreras (404), la última carrera sale desactivada', async () => {
    await abrir();
    servidor.expectOne(`${base}/sombra`).flush(sombra(1661, 'MEJOR'));
    servidor
      .expectOne(`${base}/sombra?tipo=ULTIMA`)
      .flush({ error: 'Todavía no has corrido esta ruta' }, noEncontrado);
    servidor.expectOne(`${base}/sombra?tipo=ORIGINAL`).flush(sombra(1661, 'ORIGINAL'));
    await actualizar();

    expect(textos()[1]).toBe('Última carrera · sin carreras todavía');
    expect(tarjetas()[1].disabled).toBe(true);
    expect(tarjetas()[0].getAttribute('aria-pressed')).toBe('true');
  });

  it('si falla la mejor marca no deja empezar hasta elegir otra sombra', async () => {
    await abrir();
    servidor.expectOne(`${base}/sombra`).flush({}, { status: 500, statusText: 'Error' });
    servidor.expectOne(`${base}/sombra?tipo=ULTIMA`).flush(sombra(1570, 'ULTIMA'));
    servidor.expectOne(`${base}/sombra?tipo=ORIGINAL`).flush(sombra(1661, 'ORIGINAL'));
    exito(lectura);
    await actualizar();
    expect(aviso()).toBe('Elige otra sombra');
    expect(empezar().disabled).toBe(true);

    tarjetas()[1].click();
    await actualizar();
    expect(empezar().disabled).toBe(false);
  });

  it('una sombra con menos de 2 puntos no se puede elegir', async () => {
    await abrir();
    servidor.expectOne(`${base}/sombra`).flush({ ...sombra(0, 'MEJOR'), puntos: [] });
    servidor.expectOne(`${base}/sombra?tipo=ULTIMA`).flush(sombra(1570, 'ULTIMA'));
    servidor.expectOne(`${base}/sombra?tipo=ORIGINAL`).flush(sombra(1661, 'ORIGINAL'));
    await actualizar();
    expect(textos()[0]).toBe('Mejor marca · sin puntos suficientes');
    expect(tarjetas()[0].disabled).toBe(true);
  });

  it('sin ?ruta= manda a elegir una ruta', async () => {
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/reloj/sombra', ElegirSombra);
    el = harness.routeNativeElement!;
    await actualizar();
    expect(el.querySelector('[role="alert"]')?.textContent).toContain(
      'Primero tienes que elegir una ruta',
    );
    expect(el.querySelector('.mensaje a[href="/reloj/elegir"]')).toBeTruthy();
  });

  it('si la ruta no existe enseña el error', async () => {
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/reloj/sombra?ruta=7', ElegirSombra);
    el = harness.routeNativeElement!;
    const error = { error: 'La ruta no existe' };
    servidor.expectOne(base).flush(error, noEncontrado);
    servidor.expectOne(`${base}/sombra`).flush(error, noEncontrado);
    servidor.expectOne(`${base}/sombra?tipo=ULTIMA`).flush(error, noEncontrado);
    servidor.expectOne(`${base}/sombra?tipo=ORIGINAL`).flush(error, noEncontrado);
    await actualizar();
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('La ruta no existe');
  });

  it('si se sale sin empezar apaga el GPS y cancela las peticiones', async () => {
    await abrir();
    const pendiente = servidor.expectOne(`${base}/sombra`);
    servidor.expectOne(`${base}/sombra?tipo=ULTIMA`).flush(sombra(1570, 'ULTIMA'));
    servidor.expectOne(`${base}/sombra?tipo=ORIGINAL`).flush(sombra(1661, 'ORIGINAL'));
    await harness.navigateByUrl('/reloj/elegir');
    expect(mock.clearWatch).toHaveBeenCalledWith(7);
    expect(pendiente.cancelled).toBe(true);
  });
});
