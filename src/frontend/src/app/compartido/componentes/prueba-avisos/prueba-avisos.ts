import { Component, inject } from '@angular/core';
import { ResultadoAviso } from '../../../core/modelos/aviso';
import { AvisoSector } from '../../../core/servicios/aviso-sector';

/**
 * TEMPORAL — botones para probar los destellos mientras no exista la lógica
 * real de sectores (sub-tarea 48).
 *
 * Para quitarlo cuando ya no haga falta:
 *   1. Borra la carpeta `compartido/componentes/prueba-avisos/`.
 *   2. En `reloj-inicio.ts` borra el import y `PruebaAvisos` de `imports`.
 *   3. En `reloj-inicio.html` borra la línea `<app-prueba-avisos />`.
 */
@Component({
  selector: 'app-prueba-avisos',
  template: `
    <div class="prueba">
      <span>Prueba (temporal)</span>
      <button type="button" class="verde" (click)="probar('mejor')">Sector mejor</button>
      <button type="button" class="rojo" (click)="probar('peor')">Sector peor</button>
    </div>
  `,
  styles: `
    .prueba { display: flex; align-items: center; gap: 8px; margin-top: 16px; font-size: 0.8rem; color: var(--color-texto-suave); }
    button { padding: 6px 12px; border-radius: 999px; border: 1px solid var(--color-borde); background: transparent; color: var(--color-texto); cursor: pointer; }
    .verde { border-color: var(--color-mejor); }
    .rojo { border-color: var(--color-peor); }
  `,
})
export class PruebaAvisos {
  private readonly avisos = inject(AvisoSector);

  protected probar(resultado: ResultadoAviso): void {
    this.avisos.avisar(resultado);
  }
}
