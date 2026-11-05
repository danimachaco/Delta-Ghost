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
});
