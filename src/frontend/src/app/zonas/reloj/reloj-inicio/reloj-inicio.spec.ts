import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AvisoSector } from '../../../core/servicios/aviso-sector';
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

  it('no muestra destello si no hay aviso', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.destello')).toBeNull();
  });

  it('muestra el destello verde y el rojo según el aviso', async () => {
    const el = fixture.nativeElement as HTMLElement;
    const avisos = TestBed.inject(AvisoSector);

    avisos.avisar('mejor');
    await fixture.whenStable();
    expect(el.querySelector('.destello-mejor')).not.toBeNull();
    expect(el.querySelector('.destello-peor')).toBeNull();

    avisos.avisar('peor');
    await fixture.whenStable();
    expect(el.querySelector('.destello-peor')).not.toBeNull();
    expect(el.querySelector('.destello-mejor')).toBeNull();
  });

  it('los botones de prueba lanzan los avisos', async () => {
    const el = fixture.nativeElement as HTMLElement;
    (el.querySelector('.prueba .verde') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(el.querySelector('.destello-mejor')).not.toBeNull();
  });
});
