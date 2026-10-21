import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { erroresInterceptor } from '../../../core/interceptores/errores-interceptor';
import { Registro } from './registro';

describe('Registro', () => {
  let fixture: ComponentFixture<Registro>;
  let el: HTMLElement;
  let servidor: HttpTestingController;
  const url = `${environment.apiUrl}/auth/registro`;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Registro],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([erroresInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Registro);
    el = fixture.nativeElement;
    servidor = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => servidor.verify());

  function escribir(id: string, valor: string): void {
    const input = el.querySelector<HTMLInputElement>(`#${id}`)!;
    input.value = valor;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
  }

  function rellenar(password: string, confirmar: string): void {
    escribir('nombre', '  Asier ');
    escribir('email', 'asier@ruta.es');
    escribir('password', password);
    escribir('confirmar', confirmar);
  }

  async function enviar(): Promise<void> {
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('avisa si las contraseñas no coinciden y no envía nada', async () => {
    rellenar('123456', '654321');
    await enviar();
    expect(el.textContent).toContain('Las contraseñas no coinciden');
    servidor.expectNone(url);
  });

  it('exige una contraseña de al menos 6 caracteres', async () => {
    rellenar('123', '123');
    await enviar();
    expect(el.textContent).toContain('Mínimo 6 caracteres');
    servidor.expectNone(url);
  });

  it('envía nombre, email y contraseña (sin la confirmación) y entra en la app', async () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    rellenar('123456', '123456');
    await enviar();

    const peticion = servidor.expectOne(url);
    expect(peticion.request.body).toEqual({
      nombre: 'Asier',
      email: 'asier@ruta.es',
      password: '123456',
    });
    peticion.flush({ token: 't', usuario: { id: '1', nombre: 'Asier', email: 'asier@ruta.es' } });
    expect(navegar).toHaveBeenCalledWith('/app');
  });

  it('muestra el error del servidor (por ejemplo, email ya registrado)', async () => {
    rellenar('123456', '123456');
    await enviar();

    servidor
      .expectOne(url)
      .flush({ error: 'Ya existe una cuenta con ese email' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(el.querySelector('.error-servidor')?.textContent).toContain('Ya existe una cuenta');
  });
});
