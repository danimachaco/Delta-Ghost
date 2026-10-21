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
});
