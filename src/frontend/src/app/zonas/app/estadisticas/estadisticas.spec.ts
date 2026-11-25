import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { Grafico } from '../../../compartido/componentes/grafico/grafico';
import { erroresInterceptor } from '../../../core/interceptores/errores-interceptor';
import { Estadisticas } from '../../../core/modelos/estadisticas';
import { EstadisticasPantalla } from './estadisticas';

/**
 * Gráfico falso: en las pruebas no hay canvas para que Chart.js dibuje, así que se sustituye
 * por uno que solo guarda lo que recibe y deja comprobarlo.
 */
@Component({
  selector: 'app-grafico',
  template: '',
  host: { '[attr.data-tipo]': 'tipo()', '[attr.aria-label]': 'descripcion()' },
})
class GraficoFalso {
  readonly tipo = input('bar');
  readonly etiquetas = input<string[]>([]);
  readonly valores = input<number[]>([]);
  readonly nombreSerie = input('');
  readonly formato = input<(valor: number) => string>((v) => String(v));
  readonly descripcion = input('');
}

describe('EstadisticasPantalla', () => {
  let fixture: ComponentFixture<EstadisticasPantalla>;
  let el: HTMLElement;
  let servidor: HttpTestingController;
  const url = `${environment.apiUrl}/estadisticas?semanas=8`;

  const datos: Estadisticas = {
    resumen: {
      carreras: 3,
      rutasCorridas: 2,
      distanciaTotalMetros: 15_300,
      tiempoTotalSegundos: 4_860,
      ritmoMedioSegundosKm: 318,
      mejorRitmoSegundosKm: 300,
      carreraMasLargaMetros: 5_300,
    },
    semanas: [
      { inicio: '2026-11-09', carreras: 1, distanciaMetros: 5_000, tiempoSegundos: 1_650 },
      { inicio: '2026-11-16', carreras: 2, distanciaMetros: 10_300, tiempoSegundos: 3_210 },
    ],
    rutas: [
      {
        rutaId: '1',
        nombre: 'Circuito del parque',
        carreras: 2,
        primerTiempoSegundos: 1_650,
        mejorTiempoSegundos: 1_500,
        ultimoTiempoSegundos: 1_500,
        mejoraSegundos: 150,
      },
    ],
    evolucion: [
      {
        carreraId: null,
        rutaId: '1',
        rutaNombre: 'Circuito del parque',
        fecha: '2026-11-12T08:00:00',
        tiempoTotalSegundos: 1_650,
        distanciaMetros: 5_000,
        ritmoSegundosKm: 330,
      },
      {
        carreraId: '7',
        rutaId: '1',
        rutaNombre: 'Circuito del parque',
        fecha: '2026-11-20T08:00:00',
        tiempoTotalSegundos: 1_500,
        distanciaMetros: 5_000,
        ritmoSegundosKm: 300,
      },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstadisticasPantalla],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([erroresInterceptor])),
        provideHttpClientTesting(),
      ],
    })
      .overrideComponent(EstadisticasPantalla, {
        remove: { imports: [Grafico] },
        add: { imports: [GraficoFalso] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(EstadisticasPantalla);
    el = fixture.nativeElement;
    servidor = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => servidor.verify());

  async function responder(
    cuerpo: Estadisticas | { error: string } | null,
    opciones?: { status: number; statusText: string },
  ): Promise<void> {
    servidor.expectOne({ method: 'GET', url }).flush(cuerpo, opciones);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  const graficos = () => [...el.querySelectorAll<HTMLElement>('app-grafico')];
  const componenteGrafico = (i: number) =>
    fixture.debugElement.queryAll((n) => n.name === 'app-grafico')[i]
      .componentInstance as GraficoFalso;

  it('muestra los esqueletos mientras carga', async () => {
    expect(el.querySelectorAll('.esqueleto').length).toBe(4);
    await responder(datos);
    expect(el.querySelectorAll('.esqueleto').length).toBe(0);
  });

  it('enseña los totales: carreras, distancia, tiempo y ritmo medio', async () => {
    await responder(datos);
    const cifras = [...el.querySelectorAll('.totales .cifra')].map(
      (c) => `${c.querySelector('dt')?.textContent}: ${c.querySelector('dd')?.textContent}`,
    );
    expect(cifras).toEqual([
      'Carreras: 3',
      'Distancia: 15,3 km',
      'Tiempo: 1:21:00',
      'Ritmo medio: 5:18 /km',
    ]);
  });

  it('dibuja los km por semana en barras y el ritmo en línea', async () => {
    await responder(datos);
    expect(graficos().map((g) => g.dataset['tipo'])).toEqual(['bar', 'line']);

    const semanas = componenteGrafico(0);
    expect(semanas.etiquetas()).toEqual(['9 nov', '16 nov']);
    expect(semanas.valores()).toEqual([5, 10.3]);
    expect(semanas.formato()(10.3)).toBe('10,3 km');

    // 330 s/km = 5,5 min/km; 300 s/km = 5 min/km
    const ritmo = componenteGrafico(1);
    expect(ritmo.valores()).toEqual([5.5, 5]);
    expect(ritmo.formato()(5.5)).toBe('5:30 /km');
  });

  it('describe cada gráfico con texto para los lectores de pantalla', async () => {
    await responder(datos);
    expect(graficos()[0].getAttribute('aria-label')).toBe(
      'Kilómetros por semana: semana del 9 nov, 5,0 km; semana del 16 nov, 10,3 km',
    );
    expect(graficos()[1].getAttribute('aria-label')).toContain('12 nov, 5:30 /km');
  });

  it('da los datos de las semanas también en una tabla', async () => {
    await responder(datos);
    const filas = [...el.querySelectorAll('tbody tr')].map((f) =>
      [...f.querySelectorAll('td')].map((c) => c.textContent),
    );
    expect(filas).toEqual([
      ['9 nov', '1', '5,0 km'],
      ['16 nov', '2', '10,3 km'],
    ]);
  });

  it('lista las últimas carreras, la más reciente primero, y marca la mejor marca', async () => {
    await responder(datos);
    const tarjetas = el.querySelectorAll('.lista .tarjeta');
    expect(tarjetas.length).toBe(2);
    expect(tarjetas[0].querySelector('.detalle')?.textContent).toContain('20 nov 2026');
    expect(tarjetas[0].querySelector('.etiqueta')?.textContent).toBe('Mejor marca');
    expect(tarjetas[0].querySelector('.tiempo')?.textContent).toBe('25:00');
    expect(tarjetas[1].querySelector('.etiqueta')).toBeNull();
  });

  it('si aún no has corrido invita a hacerlo y no pinta gráficos', async () => {
    await responder({
      resumen: {
        carreras: 0,
        rutasCorridas: 0,
        distanciaTotalMetros: 0,
        tiempoTotalSegundos: 0,
        ritmoMedioSegundosKm: null,
        mejorRitmoSegundosKm: null,
        carreraMasLargaMetros: 0,
      },
      semanas: [],
      rutas: [],
      evolucion: [],
    });
    expect(el.textContent).toContain('Todavía no has corrido ninguna carrera');
    expect(el.querySelector('a.boton')?.getAttribute('href')).toBe('/reloj/elegir');
    expect(graficos().length).toBe(0);
  });

  it('con un 404 (servidor sin la PS-75) lo explica en español', async () => {
    await responder({ error: 'Not Found' }, { status: 404, statusText: 'Not Found' });
    expect(el.querySelector('[role="alert"]')?.textContent).toContain(
      'Las estadísticas todavía no están disponibles.',
    );
  });

  it('si falla muestra el error y permite reintentar', async () => {
    await responder(null, { status: 500, statusText: 'Error' });
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Error en el servidor');

    el.querySelector<HTMLButtonElement>('.aviso button')!.click();
    await responder(datos);
    expect(graficos().length).toBe(2);
  });
});
