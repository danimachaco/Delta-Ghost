import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { erroresInterceptor } from '../interceptores/errores-interceptor';
import { ErrorApi } from '../modelos/error-api';
import { Api } from './api';

describe('Api', () => {
  let api: Api;
  let servidor: HttpTestingController;
  const base = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([erroresInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    api = TestBed.inject(Api);
    servidor = TestBed.inject(HttpTestingController);
  });

  // Comprueba que no queda ninguna petición sin responder
  afterEach(() => servidor.verify());

  it('GET une la dirección base con la ruta y añade los parámetros', () => {
    let respuesta: unknown;
    api.get('/rutas', { pagina: 2 }).subscribe((r) => (respuesta = r));

    const peticion = servidor.expectOne(`${base}/rutas?pagina=2`);
    expect(peticion.request.method).toBe('GET');
    peticion.flush([{ id: '1' }]);
    expect(respuesta).toEqual([{ id: '1' }]);
  });

  it('POST, PUT y DELETE usan el método y el cuerpo correctos', () => {
    api.post('rutas', { nombre: 'Parque' }).subscribe();
    api.put('rutas/1', { nombre: 'Río' }).subscribe();
    api.delete('rutas/1').subscribe();

    const post = servidor.expectOne({ method: 'POST', url: `${base}/rutas` });
    expect(post.request.body).toEqual({ nombre: 'Parque' });
    post.flush({});
    servidor.expectOne({ method: 'PUT', url: `${base}/rutas/1` }).flush({});
    servidor.expectOne({ method: 'DELETE', url: `${base}/rutas/1` }).flush(null);
  });

  it('si no hay conexión devuelve un ErrorApi con mensaje en español', () => {
    let error: ErrorApi | undefined;
    api.get('rutas').subscribe({ error: (e: ErrorApi) => (error = e) });

    servidor.expectOne(`${base}/rutas`).error(new ProgressEvent('error'), { status: 0 });
    expect(error?.estado).toBe(0);
    expect(error?.mensaje).toContain('No se puede conectar');
  });

  it('traduce los errores de validación del backend (400)', () => {
    let error: ErrorApi | undefined;
    api.post('rutas', {}).subscribe({ error: (e: ErrorApi) => (error = e) });

    servidor
      .expectOne(`${base}/rutas`)
      .flush({ nombre: 'El nombre es obligatorio' }, { status: 400, statusText: 'Bad Request' });
    expect(error?.errores).toEqual({ nombre: 'El nombre es obligatorio' });
    expect(error?.mensaje).toBe('Revisa los datos: El nombre es obligatorio');
  });

  it('usa el mensaje del backend en un 404', () => {
    let error: ErrorApi | undefined;
    api.get('rutas/x').subscribe({ error: (e: ErrorApi) => (error = e) });

    servidor
      .expectOne(`${base}/rutas/x`)
      .flush({ error: 'No existe la ruta con id x' }, { status: 404, statusText: 'Not Found' });
    expect(error).toEqual({ estado: 404, mensaje: 'No existe la ruta con id x', errores: {} });
  });

  it('da un mensaje genérico si falla el servidor (500)', () => {
    let error: ErrorApi | undefined;
    api.get('rutas').subscribe({ error: (e: ErrorApi) => (error = e) });

    servidor.expectOne(`${base}/rutas`).flush(null, { status: 500, statusText: 'Server Error' });
    expect(error?.mensaje).toContain('Error en el servidor');
  });
});
