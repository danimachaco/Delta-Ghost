import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppInicio } from './app-inicio';

describe('AppInicio', () => {
  let fixture: ComponentFixture<AppInicio>;

  async function crear(): Promise<HTMLElement> {
    await TestBed.configureTestingModule({
      imports: [AppInicio],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(AppInicio);
    await fixture.whenStable();
    return fixture.nativeElement;
  }

  beforeEach(() => localStorage.clear());

  it('sin sesión muestra el enlace para entrar', async () => {
    const el = await crear();
    expect(el.querySelector('a[href="/app/login"]')?.textContent).toContain('Entrar');
  });

  it('con sesión saluda al usuario y permite salir', async () => {
    localStorage.setItem(
      'ruta-fantasma.sesion',
      JSON.stringify({ token: 't', usuario: { id: '1', nombre: 'Asier', email: 'a@a.es' } }),
    );
    const el = await crear();
    expect(el.textContent).toContain('Hola, Asier');

    el.querySelector<HTMLButtonElement>('.sesion button')!.click();
    await fixture.whenStable();
    expect(el.querySelector('a[href="/app/login"]')).toBeTruthy();
  });
});
