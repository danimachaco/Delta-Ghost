import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RelojInicio } from './reloj-inicio';

describe('RelojInicio', () => {
  let component: RelojInicio;
  let fixture: ComponentFixture<RelojInicio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RelojInicio],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RelojInicio);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('se crea', () => {
    expect(component).toBeTruthy();
  });

  it('muestra el tiempo como mm:ss y la diferencia con la sombra', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.tiempo')?.textContent).toBe('12:34');
    expect(el.querySelector('.diferencia')?.textContent).toBe('-2,4 s');
    expect(el.querySelector('.esfera')?.classList).toContain('mejor');
  });
});
