import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CARRERA_EJEMPLO } from '../../../../core/servicios/carrera-ejemplo';
import { CIRCUITO_EJEMPLO } from '../../../../core/servicios/circuito-ejemplo';
import { sectoresDesdeCarrera } from '../../../../core/servicios/sectores';
import { MapaSectores } from './mapa-sectores';

// jsdom no implementa createSVGRect y sin él Leaflet no puede dibujar polilíneas
vi.hoisted(() => {
  (SVGElement.prototype as any).createSVGRect = () => ({});
});

describe('MapaSectores', () => {
  let fixture: ComponentFixture<MapaSectores>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [MapaSectores] }).compileComponents();
    fixture = TestBed.createComponent(MapaSectores);
    fixture.componentRef.setInput(
      'sectores',
      sectoresDesdeCarrera(CARRERA_EJEMPLO, CIRCUITO_EJEMPLO),
    );
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('crea el mapa de Leaflet', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.mapa')?.classList).toContain('leaflet-container');
  });

  it('dibuja una línea por sector', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('path.leaflet-interactive').length).toBe(5);
  });

  it('muestra la leyenda con texto', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.leyenda')?.textContent).toContain('Peor que la sombra');
  });
});
