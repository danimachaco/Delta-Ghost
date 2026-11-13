import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { environment } from '../../../../environments/environment';
import { erroresInterceptor } from '../../../core/interceptores/errores-interceptor';
import { Ruta } from '../../../core/modelos/ruta';
import { ElegirRuta } from './elegir-ruta';

describe('ElegirRuta', () => {
  let harness: RouterTestingHarness;
  let el: HTMLElement;
  let servidor: HttpTestingController;
  const base = `${environment.apiUrl}/rutas`;

  const puntos = (segundos: number) => [
    { latitud: 40.4, longitud: -3.7, tiempoSegundos: 0 },
    { latitud: 40.41, longitud: -3.7, tiempoSegundos: segundos },
  ];
  const rutas: Ruta[] = [
    { id: '1', nombre: 'Ribera del río', fecha: '2026-10-10T09:00:00', puntos: puntos(600) },
    { id: '2', nombre: 'Circuito del parque', fecha: '2026-10-20T09:00:00', puntos: puntos(1661) },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'reloj/elegir', component: ElegirRuta },
          { path: 'reloj/sombra', children: [] },
          { path: 'reloj', children: [] },
        ]),
        provideHttpClient(withInterceptors([erroresInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    servidor = TestBed.inject(HttpTestingController);
  });

  afterEach(() => servidor.verify());

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
  const siguiente = () => el.querySelector<HTMLButtonElement>('.siguiente')!;
  const aviso = () => el.querySelector('.aviso')?.textContent?.trim();

  it('muestra las rutas de la más nueva a la más antigua con km y tiempo', async () => {
    await abrir();
    expect(tarjetas().length).toBe(2);
    expect(tarjetas()[0].querySelector('.nombre')?.textContent).toBe('Circuito del parque');
    expect(tarjetas()[0].querySelector('.detalle')?.textContent).toBe('grabada en 27:41');
    expect(tarjetas()[0].querySelector('.distancia')?.textContent).toBe('1,1 km');
    expect(aviso()).toBe('Toca una ruta para elegirla');
    expect(siguiente().disabled).toBe(true);
  });

  it('al tocar una ruta queda elegida y deja pasar a elegir la sombra', async () => {
    await abrir();
    tarjetas()[1].click();
    await actualizar();
    expect(tarjetas()[1].getAttribute('aria-pressed')).toBe('true');
    expect(tarjetas()[0].getAttribute('aria-pressed')).toBe('false');
    expect(aviso()).toBe('Ahora elige tu sombra');
    expect(siguiente().disabled).toBe(false);
  });

  it('Siguiente abre la pantalla Elige sombra con la ruta elegida (PS-71)', async () => {
    await abrir();
    tarjetas()[1].click();
    await actualizar();
    siguiente().click();
    await actualizar();
    expect(TestBed.inject(Router).url).toBe('/reloj/sombra?ruta=1');
  });

  it('?ruta=ID deja elegida esa ruta', async () => {
    await abrir('/reloj/elegir?ruta=1');
    expect(tarjetas()[1].classList).toContain('elegida');
    expect(siguiente().disabled).toBe(false);
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
});
