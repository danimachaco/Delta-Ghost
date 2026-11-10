import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { environment } from '../../../../environments/environment';
import { erroresInterceptor } from '../../../core/interceptores/errores-interceptor';
import { EntradaRanking, RankingRuta } from '../../../core/modelos/ranking';
import { RankingPantalla } from './ranking';

/** Entrada de ejemplo del ranking */
function entrada(posicion: number, id: string, nombre: string, segundos: number): EntradaRanking {
  return {
    posicion,
    usuario: { id, nombre },
    tiempoTotalSegundos: segundos,
    fecha: '2026-11-08T09:30:00',
  };
}

describe('RankingPantalla', () => {
  let harness: RouterTestingHarness;
  let el: HTMLElement;
  let servidor: HttpTestingController;
  const url = `${environment.apiUrl}/rutas/7/ranking`;

  const ranking: RankingRuta = {
    rutaId: '7',
    rutaNombre: 'Circuito del parque',
    entradas: [
      entrada(1, 'u2', 'Daniel', 1500),
      entrada(2, 'u1', 'Asier', 1512),
      entrada(3, 'u3', 'Adam', 1661),
    ],
  };

  beforeEach(async () => {
    // Ha iniciado sesión Asier (usuario u1)
    localStorage.setItem(
      'ruta-fantasma.sesion',
      JSON.stringify({
        token: 'token-de-prueba',
        usuario: { id: 'u1', nombre: 'Asier', email: 'asier@ruta.es' },
      }),
    );
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'app/ranking/:rutaId', component: RankingPantalla },
          { path: '**', children: [] },
        ]),
        provideHttpClient(withInterceptors([erroresInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    servidor = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/app/ranking/7', RankingPantalla);
    el = harness.routeNativeElement!;
  });

  afterEach(() => {
    servidor.verify();
    localStorage.clear();
  });

  async function responder(
    cuerpo: RankingRuta | { error: string } | null,
    opciones?: { status: number; statusText: string },
  ): Promise<void> {
    servidor.expectOne({ method: 'GET', url }).flush(cuerpo, opciones);
    harness.detectChanges();
    await harness.fixture.whenStable();
  }

  const filas = () => [...el.querySelectorAll('ol .fila')];
  const texto = (fila: Element, selector: string) =>
    fila.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim();

  it('muestra los esqueletos mientras carga', async () => {
    expect(el.querySelectorAll('.esqueleto').length).toBe(3);
    await responder(ranking);
    expect(el.querySelectorAll('.esqueleto').length).toBe(0);
  });

  it('pinta el ranking del más rápido al más lento con el tiempo y la diferencia con el líder', async () => {
    await responder(ranking);
    expect(el.querySelector('h2')?.textContent).toContain('Circuito del parque');
    expect(filas().length).toBe(3);

    expect(texto(filas()[0], '.puesto')).toBe('1.º');
    expect(texto(filas()[0], '.nombre')).toBe('Daniel');
    expect(texto(filas()[0], '.tiempo')).toBe('25:00');
    expect(texto(filas()[0], '.tiempos .detalle')).toBe('líder');

    expect(texto(filas()[2], '.nombre')).toBe('Adam');
    expect(texto(filas()[2], '.tiempo')).toBe('27:41');
    expect(texto(filas()[2], '.tiempos .detalle')).toBe('+2:41');
    expect(texto(filas()[2], '.info .detalle')).toBe('8 nov 2026');
  });

  it('destaca tu fila con texto (no solo con color) y dice tu puesto', async () => {
    await responder(ranking);
    expect(filas()[1].classList).toContain('tuya');
    expect(filas()[1].getAttribute('aria-current')).toBe('true');
    expect(texto(filas()[1], '.nombre')).toBe('Asier Tú');
    expect(texto(filas()[1], '.tiempos .detalle')).toBe('+0:12');
    expect(el.querySelectorAll('.etiqueta-tu').length).toBe(1);
    expect(el.querySelector('.resumen')?.textContent).toBe('Vas 2.º de 3 corredores.');
  });

  it('ordena por puesto aunque el servidor las mande desordenadas', async () => {
    await responder({ ...ranking, entradas: [...ranking.entradas].reverse() });
    expect(filas().map((f) => texto(f, '.nombre'))).toEqual(['Daniel', 'Asier Tú', 'Adam']);
  });

  it('si no estás en el ranking, lo dice', async () => {
    await responder({ ...ranking, entradas: [entrada(1, 'u2', 'Daniel', 1500)] });
    expect(el.querySelector('.resumen')?.textContent).toBe('Todavía no has corrido esta ruta.');
    expect(el.querySelector('.tuya')).toBeNull();
  });

  it('si nadie ha corrido la ruta invita a correrla', async () => {
    await responder({ ...ranking, entradas: [] });
    expect(el.textContent).toContain('Todavía nadie ha corrido esta ruta');
    expect(el.querySelector('a.boton')?.getAttribute('href')).toBe('/reloj/elegir?ruta=7');
  });

  it('si falla muestra el error y permite reintentar', async () => {
    await responder(null, { status: 500, statusText: 'Error' });
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Error en el servidor');

    el.querySelector<HTMLButtonElement>('.aviso button')!.click();
    await responder(ranking);
    expect(filas().length).toBe(3);
  });

  it('con un 404 (ruta sin ranking o servidor sin la PS-64) lo explica en español', async () => {
    await responder({ error: 'Not Found' }, { status: 404, statusText: 'Not Found' });
    expect(el.querySelector('[role="alert"]')?.textContent).toContain(
      'Esta ruta todavía no tiene ranking.',
    );
  });

  it('tiene un enlace para volver a Mis rutas', async () => {
    await responder(ranking);
    expect(el.querySelector('a.volver')?.getAttribute('href')).toBe('/app');
  });
});
