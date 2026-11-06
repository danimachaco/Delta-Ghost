import { TestBed } from '@angular/core/testing';
import { FlechaSector } from './flecha-sector';

describe('FlechaSector', () => {
  /** Crea la flecha con un resultado y devuelve su elemento */
  async function crear(resultado: 'mejor' | 'peor'): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(FlechaSector);
    fixture.componentRef.setInput('resultado', resultado);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('si vas mejor la flecha apunta hacia arriba', async () => {
    const el = await crear('mejor');
    // El primer punto del triángulo (la punta) está arriba del todo: y = 3
    expect(el.querySelector('path')?.getAttribute('d')).toMatch(/^M12 3 /);
    expect(el.classList).toContain('mejor');
  });

  it('si vas peor la flecha apunta hacia abajo', async () => {
    const el = await crear('peor');
    expect(el.querySelector('path')?.getAttribute('d')).toMatch(/^M12 21 /);
    expect(el.classList).toContain('peor');
  });

  it('es decorativa: los lectores de pantalla no la leen', async () => {
    const el = await crear('mejor');
    expect(el.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });
});
