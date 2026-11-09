/**
 * Contraste entre dos colores según las pautas de accesibilidad WCAG 2 (PS-60).
 *
 * Mínimos de la norma (nivel AA):
 *  - texto normal: 4,5:1
 *  - texto grande (24 px, o 18,66 px en negrita) y elementos gráficos (iconos, bordes, barras): 3:1
 */

/** Mínimo de contraste para texto normal (WCAG AA) */
export const CONTRASTE_TEXTO = 4.5;
/** Mínimo de contraste para texto grande y elementos gráficos (WCAG AA) */
export const CONTRASTE_GRAFICO = 3;

/** "#7c5cff" → [124, 92, 255] */
export function rgb(hex: string): [number, number, number] {
  const limpio = hex.replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(limpio)) {
    throw new Error(`Color no válido: ${hex}`);
  }
  return [0, 2, 4].map((i) => parseInt(limpio.slice(i, i + 2), 16)) as [number, number, number];
}

/** Luminancia relativa de un color (0 = negro, 1 = blanco), con la fórmula de la WCAG */
export function luminancia(hex: string): number {
  const [r, g, b] = rgb(hex).map((valor) => {
    const c = valor / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Relación de contraste entre dos colores: de 1 (iguales) a 21 (negro y blanco) */
export function contraste(a: string, b: string): number {
  const [claro, oscuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (oscuro + 0.05);
}
