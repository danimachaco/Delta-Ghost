/**
 * Limita un progreso al rango 0–1 (0 = salida, 1 = meta).
 * Un valor que no es un número (NaN, infinito) se trata como 0 para que
 * el reloj nunca dibuje un punto fuera de la barra.
 */
export function limitarProgreso(valor: number): number {
  if (!Number.isFinite(valor)) {
    return 0;
  }
  return Math.min(1, Math.max(0, valor));
}

/** Convierte un progreso 0–1 en un porcentaje entero 0–100 (0,444 → 44) */
export function aPorcentaje(progreso: number): number {
  return Math.round(limitarProgreso(progreso) * 100);
}
