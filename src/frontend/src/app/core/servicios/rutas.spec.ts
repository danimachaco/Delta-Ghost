import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { Rutas } from './rutas';

describe('Rutas', () => {
  let rutas: Rutas;
  let servidor: HttpTestingController;
  const base = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    rutas = TestBed.inject(Rutas);
    servidor = TestBed.inject(HttpTestingController);
  });

  afterEach(() => servidor.verify());

  it('listar() pide GET /api/rutas', () => {
    rutas.listar().subscribe();
    servidor.expectOne({ method: 'GET', url: `${base}/rutas` }).flush([]);
  });

  it('obtener() pide GET /api/rutas/{id}', () => {
    rutas.obtener('abc').subscribe();
    servidor.expectOne({ method: 'GET', url: `${base}/rutas/abc` }).flush({});
  });

  it('sombra() con tipo pide GET /api/rutas/{id}/sombra?tipo=…', () => {
    rutas.sombra('7', 'ULTIMA').subscribe();
    const peticion = servidor.expectOne(`${base}/rutas/7/sombra?tipo=ULTIMA`);
    expect(peticion.request.method).toBe('GET');
    peticion.flush({});

    // La mejor marca es la sombra por defecto: no hace falta el parámetro
    rutas.sombra('7', 'MEJOR').subscribe();
    servidor.expectOne(`${base}/rutas/7/sombra`).flush({});
  });

  it('sombra() pide GET /api/rutas/{id}/sombra', () => {
    rutas.sombra('abc').subscribe();
    servidor.expectOne({ method: 'GET', url: `${base}/rutas/abc/sombra` }).flush({});
  });

  it('crear() envía POST /api/rutas con el nombre y los puntos', () => {
    const nueva = {
      nombre: 'Parque',
      puntos: [
        { latitud: 40.41, longitud: -3.7, tiempoSegundos: 0 },
        { latitud: 40.42, longitud: -3.7, tiempoSegundos: 60 },
      ],
    };
    rutas.crear(nueva).subscribe();
    const peticion = servidor.expectOne({ method: 'POST', url: `${base}/rutas` });
    expect(peticion.request.body).toEqual(nueva);
    peticion.flush({ id: '1', ...nueva, fecha: '2026-11-03T10:00:00' });
  });

  it('subirCarrera() envía POST /api/rutas/{id}/carreras con los puntos', () => {
    const puntos = [
      { latitud: 40.41, longitud: -3.7, tiempoSegundos: 0 },
      { latitud: 40.42, longitud: -3.7, tiempoSegundos: 55 },
    ];
    rutas.subirCarrera('7', puntos).subscribe();
    const peticion = servidor.expectOne({ method: 'POST', url: `${base}/rutas/7/carreras` });
    expect(peticion.request.body).toEqual({ puntos });
    peticion.flush({});
  });
});
