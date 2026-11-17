import { TestBed } from '@angular/core/testing';
import { FlechaSector } from './flecha-sector';

describe('FlechaSector', () => {
  /** Crea la flecha con un resultado y devuelve su elemento */
  async function crear(resultado: 'mejor' | 'peor' | 'morado'): Promise<HTMLElement> {
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

  it('PS-68: si es el mejor sector de todos se dibuja una estrella de cinco puntas', async () => {
    const el = await crear('morado');
    const trazo = el.querySelector('path')?.getAttribute('d') ?? '';
    // Estrella: 10 vértices (5 puntas y 5 entrantes), distinta de los triángulos de 3
    expect(trazo.match(/[ML]/g)?.length).toBe(10);
    expect(el.classList).toContain('morado');
  });

  it('es decorativa: los lectores de pantalla no la leen', async () => {
    const el = await crear('mejor');
    expect(el.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });
});
