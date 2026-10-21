import { Location } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { App } from './app';
import { routes } from './app.routes';
import { AppInicio } from './zonas/app/app-inicio/app-inicio';
import { Login } from './zonas/app/login/login';
import { Registro } from './zonas/app/registro/registro';
import { RelojInicio } from './zonas/reloj/reloj-inicio/reloj-inicio';
import { WebInicio } from './zonas/web/web-inicio/web-inicio';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('se crea la aplicación', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  // navigateByUrl(url, Componente) falla si la ruta no muestra ese componente

  it('la raíz redirige a la zona /web', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/', WebInicio);
    expect(TestBed.inject(Location).path()).toBe('/web');
  });

  it('carga la zona /reloj', async () => {
    const harness = await RouterTestingHarness.create();
    expect(await harness.navigateByUrl('/reloj', RelojInicio)).toBeInstanceOf(RelojInicio);
  });

  it('carga la zona /app', async () => {
    const harness = await RouterTestingHarness.create();
    expect(await harness.navigateByUrl('/app', AppInicio)).toBeInstanceOf(AppInicio);
  });

  it('carga las pantallas de inicio de sesión y registro', async () => {
    const harness = await RouterTestingHarness.create();
    expect(await harness.navigateByUrl('/app/login', Login)).toBeInstanceOf(Login);
    expect(await harness.navigateByUrl('/app/registro', Registro)).toBeInstanceOf(Registro);
  });

  it('una ruta desconocida redirige a /web', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/no-existe', WebInicio);
    expect(TestBed.inject(Location).path()).toBe('/web');
  });
});
