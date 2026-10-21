import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { erroresInterceptor } from '../../../core/interceptores/errores-interceptor';
import { Ruta } from '../../../core/modelos/ruta';
import { ListaRutas } from './lista-rutas';

/** Ruta de ejemplo en línea recta: cada 0,01º de latitud ≈ 1,11 km */
function ruta(id: string, nombre: string, fecha: string, segundos: number): Ruta {
  return {
    id,
    nombre,
    fecha,
    puntos: [
      { latitud: 40, longitud: -3.7, tiempoSegundos: 0 },
      { latitud: 40.01, longitud: -3.7, tiempoSegundos: segundos },
    ],
  };
}

describe('ListaRutas', () => {
  let fixture: ComponentFixture<ListaRutas>;
  let el: HTMLElement;
  let servidor: HttpTestingController;
  const url = `${environment.apiUrl}/rutas`;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaRutas],
      providers: [
        provideHttpClient(withInterceptors([erroresInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ListaRutas);
    el = fixture.nativeElement;
    servidor = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => servidor.verify());

  async function responder(cuerpo: Ruta[] | null, opciones?: { status: number; statusText: string }) {
    servidor.expectOne(url).flush(cuerpo, opciones);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('muestra los esqueletos mientras carga', () => {
    expect(el.querySelectorAll('.esqueleto').length).toBe(3);
    servidor.expectOne(url).flush([]);
  });

  it('pinta las rutas de la más reciente a la más antigua con km y tiempo de sombra', async () => {
    await responder([
      ruta('a', 'Ribera del río', '2026-10-15T19:40:00', 2650),
      ruta('b', 'Circuito del parque', '2026-10-18T09:12:00', 1661),
    ]);

    const tarjetas = el.querySelectorAll('.tarjeta');
    expect(tarjetas.length).toBe(2);
    expect(tarjetas[0].querySelector('.nombre')?.textContent).toBe('Circuito del parque');
    expect(tarjetas[0].querySelector('.distancia')?.textContent).toBe('1,1 km');
    expect(tarjetas[0].querySelector('.detalle')?.textContent).toContain('sombra 27:41');
    expect(tarjetas[0].querySelector('.detalle')?.textContent).toContain('18 oct 2026');
    expect(el.querySelector('.contador')?.textContent).toContain('2 rutas guardadas');
  });

  it('si no hay rutas muestra un mensaje', async () => {
    await responder([]);
    expect(el.textContent).toContain('Todavía no tienes rutas guardadas');
  });

  it('si falla muestra el error y permite reintentar', async () => {
    await responder(null, { status: 500, statusText: 'Server Error' });
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Error en el servidor');

    el.querySelector<HTMLButtonElement>('.aviso button')!.click();
    fixture.detectChanges();
    expect(el.querySelectorAll('.esqueleto').length).toBe(3);

    await responder([ruta('a', 'Parque', '2026-10-18T09:12:00', 600)]);
    expect(el.querySelectorAll('.tarjeta').length).toBe(1);
  });
});
