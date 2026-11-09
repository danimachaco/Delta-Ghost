import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { Amigos } from './amigos';

describe('Amigos', () => {
  let amigos: Amigos;
  let servidor: HttpTestingController;
  const base = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    amigos = TestBed.inject(Amigos);
    servidor = TestBed.inject(HttpTestingController);
  });

  afterEach(() => servidor.verify());

  it('listar() pide GET /api/amigos', () => {
    amigos.listar().subscribe();
    servidor.expectOne({ method: 'GET', url: `${base}/amigos` }).flush([]);
  });

  it('solicitudes() pide GET /api/amigos/solicitudes', () => {
    amigos.solicitudes().subscribe();
    servidor
      .expectOne({ method: 'GET', url: `${base}/amigos/solicitudes` })
      .flush({ recibidas: [], enviadas: [] });
  });

  it('enviar() envía POST /api/amigos/solicitudes con el email', () => {
    amigos.enviar('luis@correo.com').subscribe();
    const peticion = servidor.expectOne({ method: 'POST', url: `${base}/amigos/solicitudes` });
    expect(peticion.request.body).toEqual({ email: 'luis@correo.com' });
    peticion.flush({});
  });

  it('aceptar() envía POST /api/amigos/solicitudes/{id}/aceptar', () => {
    amigos.aceptar('7').subscribe();
    servidor.expectOne({ method: 'POST', url: `${base}/amigos/solicitudes/7/aceptar` }).flush({});
  });
});
