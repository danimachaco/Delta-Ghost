import { Component } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { authGuard } from './auth-guard';

@Component({ template: 'privada' })
class PaginaPrivada {}

@Component({ template: 'login' })
class PaginaLogin {}

describe('authGuard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function configurar(): void {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'privada', component: PaginaPrivada, canActivate: [authGuard] },
          { path: 'app/login', component: PaginaLogin },
        ]),
      ],
    });
  }

  it('sin sesión manda a /app/login recordando a dónde se quería ir', async () => {
    configurar();
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/privada', PaginaLogin);
    expect(TestBed.inject(Router).url).toBe('/app/login?volver=%2Fprivada');
  });

  it('con sesión deja pasar', async () => {
    localStorage.setItem(
      'ruta-fantasma.sesion',
      JSON.stringify({ token: 't', usuario: { id: '1', nombre: 'A', email: 'a@a.es' } }),
    );
    configurar();
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/privada', PaginaPrivada);
  });
});
