import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { RespuestaAuth } from '../modelos/usuario';
import { Auth } from '../servicios/auth';
import { authInterceptor } from './auth-interceptor';
import { erroresInterceptor } from './errores-interceptor';

@Component({ template: '' })
class PantallaVacia {}

const SESION: RespuestaAuth = {
  token: 'token-de-prueba',
  usuario: { id: 'u1', nombre: 'Asier', email: 'asier@ruta.es' },
};

describe('authInterceptor', () => {
  let http: HttpClient;
  let servidor: HttpTestingController;
  let router: Router;
  let navegar: ReturnType<typeof vi.spyOn>;
  const base = environment.apiUrl;

  /** Prepara la app con (o sin) una sesión guardada de antes */
  function configurar(conSesion: boolean): Auth {
    localStorage.clear();
    if (conSesion) {
      localStorage.setItem('ruta-fantasma.sesion', JSON.stringify(SESION));
    }
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', component: PantallaVacia }]),
        provideHttpClient(withInterceptors([authInterceptor, erroresInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    servidor = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    return TestBed.inject(Auth);
  }

  afterEach(() => {
    servidor.verify();
    localStorage.clear();
  });

  it('añade el token a las peticiones a nuestra API', () => {
    configurar(true);
    http.get(`${base}/rutas`).subscribe();
    const peticion = servidor.expectOne(`${base}/rutas`);
    expect(peticion.request.headers.get('Authorization')).toBe('Bearer token-de-prueba');
    peticion.flush([]);
  });

  it('no envía el token a otros servidores', () => {
    configurar(true);
    http.get('https://tile.openstreetmap.org/1/1/1.png').subscribe();
    const peticion = servidor.expectOne('https://tile.openstreetmap.org/1/1/1.png');
    expect(peticion.request.headers.has('Authorization')).toBe(false);
    peticion.flush('');
  });

  it('si el servidor rechaza el token (401), cierra la sesión y lleva al login', async () => {
    const auth = configurar(true);
    await router.navigateByUrl('/app/amigos');
    let error: unknown;
    http.get(`${base}/amigos`).subscribe({ error: (e) => (error = e) });

    servidor
      .expectOne(`${base}/amigos`)
      .flush(
        { error: 'Tienes que iniciar sesión para hacer esto' },
        { status: 401, statusText: 'Unauthorized' },
      );

    expect(auth.estaAutenticado()).toBe(false);
    expect(localStorage.getItem('ruta-fantasma.sesion')).toBeNull();
    expect(navegar).toHaveBeenCalledWith(['/app/login'], {
      queryParams: { volver: '/app/amigos', caducada: 1 },
    });
    // La pantalla sigue recibiendo el error, por si quiere enseñar algo
    expect((error as { estado: number }).estado).toBe(401);
  });

  it('un 401 sin sesión (email o contraseña mal en el login) no navega a ningún sitio', () => {
    configurar(false);
    http.post(`${base}/auth/login`, {}).subscribe({ error: () => undefined });
    servidor
      .expectOne(`${base}/auth/login`)
      .flush({ error: 'Credenciales incorrectas' }, { status: 401, statusText: 'Unauthorized' });
    expect(navegar).not.toHaveBeenCalled();
  });

  it('otros errores (404, 500…) no cierran la sesión', () => {
    const auth = configurar(true);
    http.get(`${base}/rutas/9`).subscribe({ error: () => undefined });
    servidor
      .expectOne(`${base}/rutas/9`)
      .flush({ error: 'No existe' }, { status: 404, statusText: 'Not Found' });
    expect(auth.estaAutenticado()).toBe(true);
    expect(navegar).not.toHaveBeenCalled();
  });

  it('si varias peticiones fallan a la vez, solo lleva al login una vez', () => {
    configurar(true);
    http.get(`${base}/rutas`).subscribe({ error: () => undefined });
    http.get(`${base}/amigos`).subscribe({ error: () => undefined });
    for (const url of [`${base}/rutas`, `${base}/amigos`]) {
      servidor.expectOne(url).flush({}, { status: 401, statusText: 'Unauthorized' });
    }
    expect(navegar).toHaveBeenCalledTimes(1);
  });
});
