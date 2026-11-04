import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Carrera } from '../../../../core/modelos/carrera';
import { CarreraService } from '../../../../core/servicios/carrera';
import { Resumen } from './resumen';

describe('Resumen', () => {
  let fixture: ComponentFixture<Resumen>;

  async function crear(): Promise<HTMLElement> {
    fixture = TestBed.createComponent(Resumen);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Resumen],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('se crea', async () => {
    await crear();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra el tiempo total y la diferencia final', async () => {
    const el = await crear();
    expect(el.querySelector('.total .tiempo')?.textContent).toBe('12:44');
    expect(el.querySelector('.total .diferencia')?.textContent).toBe('-6,4 s');
  });

  it('lista los sectores con su tiempo y si fueron mejores o peores', async () => {
    const el = await crear();
    const filas = el.querySelectorAll('.sectores li');
    expect(filas.length).toBe(5);
    expect(filas[0].classList).toContain('mejor');
    expect(filas[2].classList).toContain('peor'); // el sector 3 fue más lento
    expect(filas[0].querySelector('.tiempo-sector')?.textContent).toBe('02:28');
  });

  it('si bate a la sombra, avisa de que será la nueva sombra', async () => {
    const el = await crear();
    expect(el.querySelector('.mensaje-mejor')?.textContent).toContain('nueva sombra');
  });

  it('si no bate a la sombra, no lo dice', async () => {
    const lenta: Carrera = {
      rutaNombre: 'Lenta',
      sectores: [{ indice: 1, tiempoSegundos: 160, sombraSegundos: 150 }],
    };
    TestBed.inject(CarreraService).finalizar(lenta);
    const el = await crear();
    expect(el.querySelector('.mensaje-mejor')).toBeNull();
    expect(el.querySelector('.total')?.classList).toContain('peor');
    expect(el.querySelector('.total .diferencia')?.textContent).toBe('+10,0 s');
  });
});