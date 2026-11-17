import { Component, computed, input } from '@angular/core';
import { ResultadoAviso } from '../../../core/modelos/aviso';

const ESTRELLA =
  'M12 2.3 L14.7 9.1 L22 9.6 L16.4 14.2 L18.2 21.3 L12 17.4 L5.8 21.3 L7.6 14.2 L2 9.6 L9.3 9.1 Z';

/**
 * Flecha del resultado de un sector (PS-59): ▲ hacia arriba si has ido mejor que tu sombra
 * y ▼ hacia abajo si has ido peor.
 *
 * Así el aviso no depende solo del color verde o rojo: quien no distingue bien los colores
 * lo entiende por la forma. Es la misma idea que las flechas ↑/↓ del resumen (PS-50).
 *
 * La flecha es decorativa (`aria-hidden`): quien la usa debe dar también el texto
 * ("Sector mejor que tu sombra") para los lectores de pantalla.
 */
@Component({
  selector: 'app-flecha-sector',
  template: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path [attr.d]="trazo()" />
    </svg>
  `,
  styles: `
    :host {
      display: inline-block;
      width: 1em;
      height: 1em;
      line-height: 0;
    }

    svg {
      width: 100%;
      height: 100%;
    }

    path {
      fill: currentColor;
      /* Borde oscuro: la flecha se ve igual sobre el destello verde, el rojo o el fondo negro */
      stroke: #000;
      stroke-width: 1.5;
      stroke-linejoin: round;
    }
  `,
  host: {
    '[class.mejor]': "resultado() === 'mejor'",
    '[class.peor]': "resultado() === 'peor'",
    '[class.morado]': "resultado() === 'morado'",
  },
})
export class FlechaSector {
  /** 'mejor' → flecha hacia arriba; 'peor' → flecha hacia abajo */
  readonly resultado = input.required<ResultadoAviso>();

  /** Triángulo con la punta hacia arriba o hacia abajo */
  protected readonly trazo = computed(() => {
    switch (this.resultado()) {
      case 'mejor':
        return 'M12 3 L22 20 H2 Z';
      case 'peor':
        return 'M12 21 L2 4 H22 Z';
      case 'morado':
        return ESTRELLA;
    }
  });
}
