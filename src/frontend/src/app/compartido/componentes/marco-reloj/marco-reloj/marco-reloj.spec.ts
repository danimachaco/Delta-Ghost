import { TestBed } from '@angular/core/testing';
import { MarcoReloj } from './marco-reloj';

describe('MarcoReloj', () => {
  async function crear(activo?: boolean): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(MarcoReloj);
    if (activo !== undefined) {
      fixture.componentRef.setInput('activo', activo);
    }
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('por defecto está inactivo: no dibuja el bisel', async () => {
    const el = await crear();
    expect(el.classList).not.toContain('activo');
  });

  it('en modo demo se activa', async () => {
    const el = await crear(true);
    expect(el.classList).toContain('activo');
  });

  it('el bisel y la corona son decorativos', async () => {
    const el = await crear(true);
    expect(el.querySelector('.bisel')).not.toBeNull();
    expect(el.querySelector('.corona')?.getAttribute('aria-hidden')).toBe('true');
  });
});
