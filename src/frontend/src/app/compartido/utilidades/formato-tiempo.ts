/** Redondea a 1 decimal y evita el "-0,0". */
function redondear(valor: number): number {
  const r = Math.round(valor * 10) / 10;
  return r === 0 ? 0 : r;
}

/** Segundos → "mm:ss" (754 → "12:34"). */
export function formatearTiempo(segundos: number): string {
  const total = Math.round(segundos);
  const min = Math.floor(total / 60);
  const seg = total % 60;
  return `${String(min).padStart(2, '0')}:${String(seg).padStart(2, '0')}`;
}

/** Diferencia con la sombra: "-2,4 s" (vas mejor), "+1,0 s" (vas peor) o "0,0 s". */
export function formatearDiferencia(segundos: number): string {
  const r = redondear(segundos);
  const signo = r > 0 ? '+' : '';
  return `${signo}${r.toFixed(1).replace('.', ',')} s`;
}
