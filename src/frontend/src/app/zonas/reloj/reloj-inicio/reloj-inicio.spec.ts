import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RelojInicio } from './reloj-inicio';

describe('RelojInicio', () => {
  let component: RelojInicio;
  let fixture: ComponentFixture<RelojInicio>;
  let el: HTMLElement;

  /** Cambia un input del componente y espera a que se pinte */
  async function poner(nombre: 'progresoTu' | 'progresoSombra', valor: number) {
    fixture.componentRef.setInput(nombre, valor);
    await fixture.whenStable();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RelojInicio],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RelojInicio);
    component = fixture.componentInstance;
    el = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  it('se crea', () => {
    expect(component).toBeTruthy();
  });

  it('muestra el tiempo como mm:ss y la diferencia con la sombra', () => {
    expect(el.querySelector('.tiempo')?.textContent).toBe('12:34');
    expect(el.querySelector('.diferencia')?.textContent).toBe('-2,4 s');
    expect(el.querySelector('.esfera')?.classList).toContain('mejor');
  });

  it('muestra los dos puntos en la barra, cada uno con su forma', () => {
    expect(el.querySelectorAll('.barra .punto').length).toBe(2);
    expect(el.querySelector('.punto-tu')).toBeTruthy();
    expect(el.querySelector('.punto-sombra')).toBeTruthy();
  });

  it('coloca cada punto según su progreso', async () => {
    await poner('progresoTu', 0.6);
    await poner('progresoSombra', 0.25);
    expect((el.querySelector('.punto-tu') as HTMLElement).style.left).toBe('60%');
    expect((el.querySelector('.punto-sombra') as HTMLElement).style.left).toBe('25%');
  });

  it('el punto de la sombra puede ir por delante del tuyo', async () => {
    await poner('progresoTu', 0.3);
    await poner('progresoSombra', 0.8);
    const tu = parseFloat((el.querySelector('.punto-tu') as HTMLElement).style.left);
    const sombra = parseFloat((el.querySelector('.punto-sombra') as HTMLElement).style.left);
    expect(sombra).toBeGreaterThan(tu);
  });

  it('no deja que un punto se salga de la barra', async () => {
    await poner('progresoTu', 1.7);
    await poner('progresoSombra', -0.5);
    expect((el.querySelector('.punto-tu') as HTMLElement).style.left).toBe('100%');
    expect((el.querySelector('.punto-sombra') as HTMLElement).style.left).toBe('0%');
  });

  it('describe la barra para lectores de pantalla', async () => {
    await poner('progresoTu', 0.5);
    await poner('progresoSombra', 0.4);
    const etiqueta = el.querySelector('.barra')?.getAttribute('aria-label') ?? '';
    expect(etiqueta).toContain('50 %');
    expect(etiqueta).toContain('40 %');
  });
});
