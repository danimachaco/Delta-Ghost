import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { authInterceptor } from '../interceptores/auth-interceptor';
import { erroresInterceptor } from '../interceptores/errores-interceptor';
import { RespuestaAuth } from '../modelos/usuario';
import { Auth, tokenCaducado } from './auth';

const RESPUESTA: RespuestaAuth = {
  token: 'token-de-prueba',
  usuario: { id: 'u1', nombre: 'Asier', email: 'asier@ruta.es' },
};

describe('Auth', () => {
  let servidor: HttpTestingController;
  const base = environment.apiUrl;

  function configurar(): Auth {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor, erroresInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    servidor = TestBed.inject(HttpTestingController);
    return TestBed.inject(Auth);
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => servidor.verify());

  it('al iniciar sesión guarda el usuario y el token', () => {
    const auth = configurar();
    auth.login({ email: 'asier@ruta.es', password: '123456' }).subscribe();

    const peticion = servidor.expectOne({ method: 'POST', url: `${base}/auth/login` });
    expect(peticion.request.body).toEqual({ email: 'asier@ruta.es', password: '123456' });
    peticion.flush(RESPUESTA);

    expect(auth.estaAutenticado()).toBe(true);
    expect(auth.usuario()?.nombre).toBe('Asier');
    expect(auth.token()).toBe('token-de-prueba');
  });

  it('el registro llama a /auth/registro y deja la sesión iniciada', () => {
    const auth = configurar();
    auth.registrar({ nombre: 'Asier', email: 'asier@ruta.es', password: '123456' }).subscribe();

    servidor.expectOne({ method: 'POST', url: `${base}/auth/registro` }).flush(RESPUESTA);
    expect(auth.estaAutenticado()).toBe(true);
  });

  it('recuerda la sesión al recargar la página (localStorage)', () => {
    localStorage.setItem('ruta-fantasma.sesion', JSON.stringify(RESPUESTA));
    const auth = configurar();
    expect(auth.usuario()?.email).toBe('asier@ruta.es');
  });

  it('ignora una sesión guardada que esté corrupta', () => {
    localStorage.setItem('ruta-fantasma.sesion', '{esto no es json');
    expect(configurar().estaAutenticado()).toBe(false);
  });

  it('cerrar sesión borra el usuario y lo guardado', () => {
    localStorage.setItem('ruta-fantasma.sesion', JSON.stringify(RESPUESTA));
    const auth = configurar();
    auth.cerrarSesion();
    expect(auth.estaAutenticado()).toBe(false);
    expect(localStorage.getItem('ruta-fantasma.sesion')).toBeNull();
  });

  it('si el login falla no inicia sesión', () => {
    const auth = configurar();
    let estado = 0;
    auth
      .login({ email: 'a@a.es', password: 'mal' })
      .subscribe({ error: (e) => (estado = e.estado) });

    servidor
      .expectOne(`${base}/auth/login`)
      .flush({ error: 'Credenciales incorrectas' }, { status: 401, statusText: 'Unauthorized' });
    expect(estado).toBe(401);
    expect(auth.estaAutenticado()).toBe(false);
  });

  it('el interceptor añade el token solo a las peticiones a nuestra API', () => {
    localStorage.setItem('ruta-fantasma.sesion', JSON.stringify(RESPUESTA));
    configurar();
    const http = TestBed.inject(HttpClient);

    http.get(`${base}/rutas`).subscribe();
    http.get('https://otro-servidor.com/datos').subscribe();

    const aLaApi = servidor.expectOne(`${base}/rutas`);
    const aOtro = servidor.expectOne('https://otro-servidor.com/datos');
    expect(aLaApi.request.headers.get('Authorization')).toBe('Bearer token-de-prueba');
    expect(aOtro.request.headers.has('Authorization')).toBe(false);
    aLaApi.flush([]);
    aOtro.flush({});
  });

  describe('sesión caducada', () => {
    /** Crea un JWT de prueba que caduca en la fecha `exp` (segundos). La firma da igual. */
    const jwt = (exp: number) =>
      `cabecera.${btoa(JSON.stringify({ sub: 'u1', exp })).replace(/=+$/, '')}.firma`;
    const ahora = Date.UTC(2026, 10, 10, 12, 0, 0);

    it('tokenCaducado() lee la fecha de caducidad del token', () => {
      expect(tokenCaducado(jwt(ahora / 1000 + 60), ahora)).toBe(false);
      expect(tokenCaducado(jwt(ahora / 1000 - 60), ahora)).toBe(true);
      expect(tokenCaducado(jwt(ahora / 1000), ahora)).toBe(true);
    });

    it('si el token no se puede leer, lo da por bueno (decide el servidor)', () => {
      expect(tokenCaducado('token-de-prueba')).toBe(false);
      expect(tokenCaducado('a.no-es-base64!.c')).toBe(false);
    });

    it('al abrir la app, una sesión guardada con el token caducado no se carga', () => {
      localStorage.setItem(
        'ruta-fantasma.sesion',
        JSON.stringify({ ...RESPUESTA, token: jwt(Date.now() / 1000 - 3600) }),
      );
      const auth = configurar();
      expect(auth.estaAutenticado()).toBe(false);
      expect(localStorage.getItem('ruta-fantasma.sesion')).toBeNull();
    });

    it('una sesión guardada con el token en vigor sí se carga', () => {
      localStorage.setItem(
        'ruta-fantasma.sesion',
        JSON.stringify({ ...RESPUESTA, token: jwt(Date.now() / 1000 + 3600) }),
      );
      const auth = configurar();
      expect(auth.usuario()?.nombre).toBe('Asier');
    });
  });
});
