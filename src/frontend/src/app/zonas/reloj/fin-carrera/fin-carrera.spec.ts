import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { erroresInterceptor } from '../../../core/interceptores/errores-interceptor';
import { PosicionGps } from '../../../core/modelos/punto-gps';
import { PuntoGps, Ruta } from '../../../core/modelos/ruta';
import { Sombra } from '../../../core/modelos/sombra';
import { Carrera } from '../../../core/servicios/carrera';
import { Cronometro } from '../../../core/servicios/cronometro';
import { Gps } from '../../../core/servicios/gps';
import { PantallaEncendida } from '../../../core/servicios/pantalla-encendida';
import { FinCarrera } from './fin-carrera';

/** Grados de latitud que equivalen a `metros` hacia el norte (1° ≈ 111 195 m) */
const norte = (metros: number) => 40 + metros / 111_195;
const posicion = (metros: number): PosicionGps => ({
  latitud: norte(metros),
  longitud: -3.7,
  precision: 5,
});

describe('FinCarrera', () => {
  let fixture: ComponentFixture<FinCarrera>;
  let el: HTMLElement;
  let carrera: Carrera;
  let servidor: HttpTestingController;
  let lecturas: Subject<PosicionGps>;

  // Ruta de 300 m en 3 sectores de 100 m. La sombra hace cada sector en 40 s (2:00 en total).
  const puntos: PuntoGps[] = [0, 100, 200, 300].map((m, i) => ({
    latitud: norte(m),
    longitud: -3.7,
    tiempoSegundos: i * 40,
  }));
  const ruta: Ruta = { id: '7', nombre: 'Parque', fecha: '2026-11-01T10:00:00', puntos };
  const sombra: Sombra = {
    rutaId: '7',
    carreraId: null,
    tiempoTotalSegundos: 120,
    puntos,
    sectores: [
      { numero: 1, puntoInicio: 0, puntoFin: 1, tiempoSegundos: 40 },
      { numero: 2, puntoInicio: 1, puntoFin: 2, tiempoSegundos: 80 },
      { numero: 3, puntoInicio: 2, puntoFin: 3, tiempoSegundos: 120 },
    ],
  };

  /** Avanza el reloj `segundos` y llega una lectura del GPS a `metros` de la salida */
  function correr(segundos: number, metros: number): void {
    vi.advanceTimersByTime(segundos * 1000);
    lecturas.next(posicion(metros));
  }

  /** Carrera completa: sector 1 en 30 s (mejor), sector 2 en 50 s (peor), sector 3 en 30 s (mejor) */
  function carreraCompleta(): void {
    carrera.iniciar(ruta, sombra);
    correr(30, 100);
    correr(50, 200);
    correr(30, 300); // llega a la meta: la carrera termina sola
  }

  async function pintar(): Promise<void> {
    // La carrera ya está simulada: se vuelve a los temporizadores reales para que Angular pinte
    vi.useRealTimers();
    fixture = TestBed.createComponent(FinCarrera);
    el = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  }

  const texto = (selector: string) => el.querySelector(selector)?.textContent?.trim();

  beforeEach(() => {
    vi.useFakeTimers();
    lecturas = new Subject<PosicionGps>();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([erroresInterceptor])),
        provideHttpClientTesting(),
        {
          provide: Gps,
          useValue: {
            iniciar: vi.fn(),
            detener: vi.fn(),
            posicionValida: signal<PosicionGps | null>(posicion(0)),
            lecturasValidas: lecturas,
          },
        },
        {
          provide: PantallaEncendida,
          useValue: {
            activar: vi.fn(async () => undefined),
            desactivar: vi.fn(async () => undefined),
          },
        },
      ],
    });
    carrera = TestBed.inject(Carrera);
    servidor = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    servidor.verify();
    TestBed.inject(Cronometro).reiniciar();
    vi.useRealTimers();
  });

  it('muestra el resultado final: tiempo, diferencia, distancia, ritmo y sectores', async () => {
    carreraCompleta();
    await pintar();

    expect(carrera.estado()).toBe('terminada');
    expect(texto('.titulo')).toBe('Carrera terminada');
    expect(texto('.tiempo')).toBe('1:50');
    // 110 s frente a los 120 s de la sombra
    expect(texto('.diferencia')).toBe('-10,0 s vs sombra');
    expect(el.querySelector('.diferencia')?.classList).toContain('mejor');
    expect(el.querySelector('.diferencia app-flecha-sector.mejor')).not.toBeNull();

    const cifras = [...el.querySelectorAll('.cifras dd')].map((d) => d.textContent?.trim());
    // 110 s en 0,3 km → 367 s/km = 6:07 /km. Sectores ganados: el 1 y el 3
    expect(cifras).toEqual(['0,3 km', '6:07 /km', '2/3']);
    expect(el.querySelectorAll('.cifras dd')[2].getAttribute('aria-label')).toBe(
      'Has mejorado a tu sombra en 2 de 3 sectores',
    );
  });

  it('si el GPS se queda unos metros antes de la meta, el último sector también cuenta', async () => {
    carrera.iniciar(ruta, sombra);
    correr(30, 100);
    correr(50, 200);
    correr(30, 296); // 4 m antes de la meta: dentro del margen
    await pintar();

    expect(carrera.estado()).toBe('terminada');
    expect(texto('.titulo')).toBe('Carrera terminada');
    const arcos = [...el.querySelectorAll('.anillo .arco')].map((a) => a.getAttribute('class'));
    expect(arcos).toEqual(['arco verde', 'arco rojo', 'arco verde']);
    expect(el.querySelector('.boton')).not.toBeNull();
  });

  it('pinta el anillo con un trozo por sector: verde, rojo y verde', async () => {
    carreraCompleta();
    await pintar();

    const arcos = [...el.querySelectorAll('.anillo .arco')].map((a) => a.getAttribute('class'));
    expect(arcos).toEqual(['arco verde', 'arco rojo', 'arco verde']);
    expect(el.querySelector('.anillo')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('Guardar sube la carrera al backend y avisa si es la nueva sombra', async () => {
    carreraCompleta();
    await pintar();

    el.querySelector<HTMLButtonElement>('.boton')!.click();
    await fixture.whenStable();
    expect(texto('.boton')).toBe('Guardando…');

    const peticion = servidor.expectOne({
      method: 'POST',
      url: `${environment.apiUrl}/rutas/7/carreras`,
    });
    expect(peticion.request.body.puntos.map((p: PuntoGps) => p.tiempoSegundos)).toEqual([
      0, 30, 80, 110,
    ]);
    peticion.flush({
      id: '1',
      rutaId: '7',
      fecha: '',
      tiempoTotalSegundos: 110,
      mejorMarca: true,
      puntos: [],
    });
    await fixture.whenStable();

    expect(texto('.estado-guardado')).toBe('¡Guardada! Es tu nueva sombra');
    expect(el.querySelector('.boton')).toBeNull();
  });

  it('si no es mejor marca, solo dice que se ha guardado', async () => {
    carreraCompleta();
    await pintar();
    el.querySelector<HTMLButtonElement>('.boton')!.click();
    servidor.expectOne(`${environment.apiUrl}/rutas/7/carreras`).flush({
      id: '2',
      rutaId: '7',
      fecha: '',
      tiempoTotalSegundos: 110,
      mejorMarca: false,
      puntos: [],
    });
    await fixture.whenStable();
    expect(texto('.estado-guardado')).toBe('Carrera guardada');
  });

  it('si el servidor falla enseña el error y deja volver a intentarlo', async () => {
    carreraCompleta();
    await pintar();
    el.querySelector<HTMLButtonElement>('.boton')!.click();
    servidor
      .expectOne(`${environment.apiUrl}/rutas/7/carreras`)
      .flush({ error: 'La ruta no existe' }, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();

    expect(texto('.error')).toBe('La ruta no existe');
    expect(texto('.boton')).toBe('Guardar');
  });

  it('una carrera parada antes de la meta se enseña pero no se puede guardar', async () => {
    carrera.iniciar(ruta, sombra);
    correr(30, 100);
    correr(20, 150);
    carrera.terminar();
    await pintar();

    expect(texto('.titulo')).toBe('Carrera sin terminar');
    expect(el.querySelector('.boton')).toBeNull();
    expect(texto('.nota')).toContain('no se guarda');
    // Solo se ha terminado el sector 1; los otros dos salen en gris
    const arcos = [...el.querySelectorAll('.anillo .arco')].map((a) => a.getAttribute('class'));
    expect(arcos).toEqual(['arco verde', 'arco pendiente', 'arco pendiente']);
  });

  it('sin carrera terminada invita a elegir una ruta', async () => {
    await pintar();
    expect(texto('.nota')).toBe('No hay ninguna carrera terminada.');
    expect(el.querySelector('a[href="/reloj/elegir"]')).not.toBeNull();
    expect(el.querySelector('.anillo')).toBeNull();
  });
});
