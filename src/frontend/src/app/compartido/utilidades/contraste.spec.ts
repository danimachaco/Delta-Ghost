import { CONTRASTE_GRAFICO, CONTRASTE_TEXTO, contraste, luminancia, rgb } from './contraste';

/**
 * Colores de styles.css que usa la pantalla del reloj.
 * ¡Si cambias un color en styles.css, cámbialo también aquí! Así esta prueba avisa
 * si el color nuevo no tiene contraste suficiente.
 */
const PALETA: Record<string, string> = {
  '--color-superficie': '#161b22',
  '--color-texto': '#e6edf3',
  '--color-texto-suave': '#8b949e',
  '--color-primario': '#7c5cff',
  '--color-mejor': '#2ecc71',
  '--color-peor': '#e74c3c',
  '--reloj-boton': '#6a4ce8',
  '--reloj-boton-terminar': '#c0392b',
  '--reloj-linea': '#6e7681',
};

function variable(nombre: string): string {
  return PALETA[nombre];
}

describe('contraste (WCAG)', () => {
  it('convierte un color hexadecimal a RGB', () => {
    expect(rgb('#7c5cff')).toEqual([124, 92, 255]);
    expect(() => rgb('rojo')).toThrow();
  });

  it('la luminancia va de 0 (negro) a 1 (blanco)', () => {
    expect(luminancia('#000000')).toBe(0);
    expect(luminancia('#ffffff')).toBe(1);
  });

  it('negro y blanco tienen el contraste máximo (21:1) y un color consigo mismo el mínimo (1:1)', () => {
    expect(contraste('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contraste('#ffffff', '#000000')).toBeCloseTo(21, 5);
    expect(contraste('#7c5cff', '#7c5cff')).toBe(1);
  });

  it('coincide con valores conocidos', () => {
    // #767676 sobre blanco es el gris más claro que pasa 4,5:1
    expect(contraste('#767676', '#ffffff')).toBeCloseTo(4.54, 2);
  });

  /**
   * PS-60: los colores de la pantalla del reloj cumplen los mínimos.
   * Si alguien cambia un color y deja de cumplirse, esta prueba falla.
   */
  describe('colores del reloj', () => {
    const esfera = '#050505';
    const negro = '#000000';
    const blanco = '#ffffff';

    const pares: [string, string, string, number][] = [
      ['texto sobre la esfera', variable('--color-texto'), esfera, CONTRASTE_TEXTO],
      ['texto suave sobre la esfera', variable('--color-texto-suave'), esfera, CONTRASTE_TEXTO],
      ['texto suave sobre el fondo', variable('--color-texto-suave'), negro, CONTRASTE_TEXTO],
      [
        'texto suave sobre una tarjeta',
        variable('--color-texto-suave'),
        variable('--color-superficie'),
        CONTRASTE_TEXTO,
      ],
      ['enlace morado sobre el fondo', variable('--color-primario'), negro, CONTRASTE_TEXTO],
      ['diferencia en verde (texto grande)', variable('--color-mejor'), esfera, CONTRASTE_GRAFICO],
      ['diferencia en rojo (texto grande)', variable('--color-peor'), esfera, CONTRASTE_GRAFICO],
      ['error en rojo (texto normal)', variable('--color-peor'), esfera, CONTRASTE_TEXTO],
      ['texto de los botones morados', blanco, variable('--reloj-boton'), CONTRASTE_TEXTO],
      ['texto del botón Terminar', blanco, variable('--reloj-boton-terminar'), CONTRASTE_TEXTO],
      ['pista de la barra', variable('--reloj-linea'), esfera, CONTRASTE_GRAFICO],
      ['borde de la esfera', variable('--reloj-linea'), negro, CONTRASTE_GRAFICO],
      ['destello verde en el borde', variable('--color-mejor'), negro, CONTRASTE_GRAFICO],
      ['destello rojo en el borde', variable('--color-peor'), negro, CONTRASTE_GRAFICO],
    ];

    for (const [nombre, frente, fondo, minimo] of pares) {
      it(`${nombre}: al menos ${minimo}:1`, () => {
        expect(contraste(frente, fondo)).toBeGreaterThanOrEqual(minimo);
      });
    }
  });
});
