/**
 * Tiempo de una vuelta con décimas, como en las pantallas de la F1 (PS-79):
 * 92,43 s → "1:32,4"; 45,06 s → "0:45,1". En pista las vueltas se ganan por décimas.
 */
export function formatearVuelta(segundos: number): string {
  const decimas = Math.round(Math.max(0, segundos) * 10);
  const minutos = Math.floor(decimas / 600);
  const resto = (decimas % 600) / 10;
  const [enteros, decimal] = resto.toFixed(1).split('.');
  return `${minutos}:${enteros.padStart(2, '0')},${decimal}`;
}

/** Diferencia entre dos vueltas con signo y décimas: -1,24 → "-1,2 s"; 0,5 → "+0,5 s" */
export function formatearDiferenciaVuelta(segundos: number): string {
  const redondeado = Math.round(segundos * 10) / 10;
  const signo = redondeado > 0 ? '+' : redondeado < 0 ? '-' : '';
  return `${signo}${Math.abs(redondeado).toFixed(1).replace('.', ',')} s`;
}
