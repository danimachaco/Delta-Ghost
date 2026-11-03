import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { erroresInterceptor } from '../../../core/interceptores/errores-interceptor';
import { Grabacion } from '../../../core/servicios/grabacion';
import { GrabarRuta } from './grabar-ruta';

describe('GrabarRuta', () => {
  let fixture: ComponentFixture<GrabarRuta>;
  let el: HTMLElement;
  let servidor: HttpTestingController;
  let exito: (p: unknown) => void;
  const mock = {
    watchPosition: vi.fn((ok: (p: unknown) => void) => {
      exito = ok;
      return 3;
    }),
    clearWatch: vi.fn(),
  };
  const url = `${environment.apiUrl}/rutas`;

  /** Lectura del GPS: "metros" al norte de la salida, con buena precisión */
  const lectura = (metros: number, timestamp: number, accuracy = 5) => ({
    coords: { latitude: 40.4 + (metros * 0.0001) / 11.1, longitude: -3.7, accuracy },
    timestamp,
  });

  beforeEach(async () => {
    mock.clearWatch.mockClear();
    Object.defineProperty(navigator, 'geolocation', { value: mock, configurable: true });
    await TestBed.configureTestingModule({
      imports: [GrabarRuta],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([erroresInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GrabarRuta);
    el = fixture.nativeElement;
    servidor = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => servidor.verify());

  async function actualizar(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
  }

  const boton = (texto: string) =>
    [...el.querySelectorAll('button')].find((b) => b.textContent?.trim() === texto) as
      | HTMLButtonElement
      | undefined;

  /** Llega a la pantalla de resumen con una ruta de 3 puntos */
  async function grabarRutaCorta(): Promise<void> {
    exito(lectura(0, 1_000));
    await actualizar();
    boton('Empezar')!.click();
    exito(lectura(10, 6_000));
    await actualizar();
    exito(lectura(20, 11_000));
    await actualizar();
    boton('Terminar')!.click();
    await actualizar();
  }

  it('no deja empezar hasta tener señal GPS fiable', async () => {
    expect(boton('Empezar')?.disabled).toBe(true);
    expect(el.textContent).toContain('Buscando señal GPS');

    exito(lectura(0, 1_000, 60)); // precisión mala: sigue sin dejar
    await actualizar();
    expect(boton('Empezar')?.disabled).toBe(true);

    exito(lectura(0, 2_000));
    await actualizar();
    expect(el.textContent).toContain('Señal GPS lista');
    expect(boton('Empezar')?.disabled).toBe(false);
  });

  it('al empezar muestra el cronómetro y oculta el menú para no salir sin querer', async () => {
    exito(lectura(0, 1_000));
    await actualizar();
    boton('Empezar')!.click();
    await actualizar();
    expect(el.querySelector('.tiempo')?.textContent).toBe('0:00');
    expect(el.textContent).toContain('Grabando');
    expect(el.querySelector('.menu-inferior')).toBeNull();
  });

  it('graba los puntos y al guardar envía la ruta y vuelve a Mis rutas', async () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    await grabarRutaCorta();

    expect(el.textContent).toContain('Ruta terminada');
    const nombre = el.querySelector<HTMLInputElement>('#nombre')!;
    expect(nombre.value).toContain('Ruta del');

    nombre.value = '  Parque del Retiro ';
    nombre.dispatchEvent(new Event('input'));
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    await actualizar();

    const peticion = servidor.expectOne({ method: 'POST', url });
    expect(peticion.request.body.nombre).toBe('Parque del Retiro');
    expect(peticion.request.body.puntos.length).toBe(3);
    expect(peticion.request.body.puntos[0].tiempoSegundos).toBe(0);
    peticion.flush({ id: '1', nombre: 'Parque del Retiro', fecha: '', puntos: [] });
    expect(navegar).toHaveBeenCalledWith('/app');
  });

  it('no envía nada si el nombre está vacío', async () => {
    await grabarRutaCorta();
    const nombre = el.querySelector<HTMLInputElement>('#nombre')!;
    nombre.value = '   ';
    nombre.dispatchEvent(new Event('input'));
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    await actualizar();

    expect(el.querySelector('.error-campo')?.textContent).toContain('Escribe un nombre');
    servidor.expectNone(url);
  });

  it('muestra el error del servidor y deja volver a intentarlo', async () => {
    await grabarRutaCorta();
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    await actualizar();

    servidor.expectOne(url).flush(null, { status: 500, statusText: 'Server Error' });
    await actualizar();
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Error en el servidor');
    expect(boton('Guardar ruta')?.disabled).toBe(false);
  });

  it('avisa si la ruta es demasiado corta para guardarla', async () => {
    exito(lectura(0, 1_000));
    await actualizar();
    boton('Empezar')!.click();
    await actualizar();
    boton('Terminar')!.click();
    await actualizar();

    expect(el.textContent).toContain('demasiado corta');
    expect(el.querySelector('form')).toBeNull();
  });

  it('descartar vuelve al principio', async () => {
    await grabarRutaCorta();
    boton('Descartar')!.click();
    await actualizar();
    expect(TestBed.inject(Grabacion).estado()).toBe('parada');
    expect(boton('Empezar')).toBeTruthy();
  });

  it('al salir de la pantalla cancela la grabación y apaga el GPS', async () => {
    exito(lectura(0, 1_000));
    await actualizar();
    boton('Empezar')!.click();
    fixture.destroy();
    expect(TestBed.inject(Grabacion).estado()).toBe('parada');
    expect(mock.clearWatch).toHaveBeenCalledWith(3);
  });
});
