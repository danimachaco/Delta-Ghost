import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { erroresInterceptor } from '../../../core/interceptores/errores-interceptor';
import { Login } from './login';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let el: HTMLElement;
  let servidor: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([erroresInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    el = fixture.nativeElement;
    servidor = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => servidor.verify());

  /** Escribe en un campo como lo haría el usuario */
  function escribir(id: string, valor: string): void {
    const input = el.querySelector<HTMLInputElement>(`#${id}`)!;
    input.value = valor;
    input.dispatchEvent(new Event('input'));
  }

  async function enviar(): Promise<void> {
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('con el formulario vacío muestra errores y no llama al servidor', async () => {
    await enviar();
    expect(el.querySelectorAll('.error-campo').length).toBe(2);
    servidor.expectNone(`${environment.apiUrl}/auth/login`);
  });

  it('avisa si el email no es válido', async () => {
    escribir('email', 'no-es-un-email');
    escribir('password', '123456');
    await enviar();
    expect(el.querySelector('.error-campo')?.textContent).toContain('El email no es válido');
  });

  it('si todo va bien entra en la app', async () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    escribir('email', 'asier@ruta.es');
    escribir('password', '123456');
    await enviar();

    servidor.expectOne(`${environment.apiUrl}/auth/login`).flush({
      token: 't',
      usuario: { id: '1', nombre: 'Asier', email: 'asier@ruta.es' },
    });
    expect(navegar).toHaveBeenCalledWith('/app');
  });

  it('con credenciales incorrectas muestra un aviso', async () => {
    escribir('email', 'asier@ruta.es');
    escribir('password', 'mala');
    await enviar();

    servidor
      .expectOne(`${environment.apiUrl}/auth/login`)
      .flush({ error: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(el.querySelector('.error-servidor')?.textContent).toContain(
      'El email o la contraseña no son correctos',
    );
    expect(el.querySelector('button')?.disabled).toBe(false);
  });
});
