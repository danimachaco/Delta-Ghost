import { PuntoGps } from '../../core/modelos/ruta';
import { haversineMetros } from '../../core/servicios/calculo';

/**
 * Distancia total de una ruta en km, sumando la distancia entre cada par
 * de puntos consecutivos. Usa la misma fórmula de Haversine que el servicio Calculo.
 */
export function distanciaKm(puntos: PuntoGps[]): number {
  let metros = 0;
  for (let i = 1; i < puntos.length; i++) {
    metros += haversineMetros(puntos[i - 1], puntos[i]);
  }
  return metros / 1000;
}

/** Duración de la carrera en segundos (tiempo del último punto menos el del primero) */
export function duracionSegundos(puntos: PuntoGps[]): number {
  if (puntos.length < 2) {
    return 0;
  }
  return Math.max(0, puntos[puntos.length - 1].tiempoSegundos - puntos[0].tiempoSegundos);
}

/** Formatea segundos como "27:41", o "1:02:05" si pasa de una hora */
export function formatearDuracion(segundos: number): string {
  const s = Math.max(0, Math.round(segundos));
  const horas = Math.floor(s / 3600);
  const minutos = Math.floor((s % 3600) / 60);
  const resto = String(s % 60).padStart(2, '0');
  return horas > 0
    ? `${horas}:${String(minutos).padStart(2, '0')}:${resto}`
    : `${minutos}:${resto}`;
}

/** Formatea una fecha ISO en español corto: "2026-10-18T09:12:00" → "18 oct 2026" */
export function formatearFecha(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) {
    return '';
  }
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
    .format(fecha)
    .replace('.', '');
}

/** Formatea un ritmo en segundos por km como "5:17 /km", o "—" si no hay ritmo */
export function formatearRitmo(segundosPorKm: number | null): string {
  if (segundosPorKm === null || !Number.isFinite(segundosPorKm)) {
    return '—';
  }
  return `${formatearDuracion(segundosPorKm)} /km`;
}

/** Formatea km con una decimal y coma española: 5.234 → "5,2 km" */
export function formatearKm(km: number): string {
  return `${km.toFixed(1).replace('.', ',')} km`;
}
