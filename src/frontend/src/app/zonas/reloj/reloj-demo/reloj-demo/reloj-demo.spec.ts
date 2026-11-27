import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RelojDemo } from './reloj-demo';

describe('RelojDemo', () => {
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RelojDemo],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(RelojDemo);
    el = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  it('enseña el reloj en modo demo con el marco activo', () => {
    expect(el.querySelector('app-reloj-inicio.demo')).not.toBeNull();
    expect(el.querySelector('app-marco-reloj.activo')).not.toBeNull();
  });

  it('antes de empezar invita a pulsar Empezar demo y no enseña enlaces de navegación', () => {
    expect(el.querySelector('.principal')?.textContent?.trim()).toBe('Empezar demo');
    expect(el.querySelector('.sin-carrera')?.textContent).toContain('Empezar demo');
    expect(el.querySelector('app-reloj-inicio a')).toBeNull();
    expect(el.querySelector('app-prueba-avisos')).toBeNull();
  });

  it('permite elegir la velocidad de la demo (x10 por defecto)', () => {
    const botones = [...el.querySelectorAll<HTMLButtonElement>('.velocidades button')];
    expect(botones.map((b) => b.textContent?.trim())).toEqual(['x1', 'x2', 'x5', 'x10']);
    expect(botones[3].getAttribute('aria-pressed')).toBe('true');
  });
});
