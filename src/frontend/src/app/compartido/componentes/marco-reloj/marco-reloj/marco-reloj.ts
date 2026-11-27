import { Component, input } from '@angular/core';

/**
 * Marco redondo de reloj (PS-81): bisel metálico y corona alrededor de lo que se proyecte dentro.
 *
 * - Con `activo = false` (por defecto) es invisible (`display: contents`): la pantalla se ve igual que siempre.
 * - Con `activo = true` dibuja el bisel. Su grosor sale de la variable CSS `--d` (diámetro de la esfera),
 *   que define quien lo usa, así el marco escala a cualquier tamaño de proyector.
 * Es solo decorativo (`aria-hidden`): no cambia lo que leen los lectores de pantalla.
 */
@Component({
  selector: 'app-marco-reloj',
  styleUrl: './marco-reloj.css',
  template: `
    <div class="caja">
      <div class="bisel"><ng-content /></div>
      <span class="corona" aria-hidden="true"></span>
    </div>
  `,
  host: { '[class.activo]': 'activo()' },
})
export class MarcoReloj {
  /** true para dibujar el bisel (modo demo) */
  readonly activo = input(false);
}
