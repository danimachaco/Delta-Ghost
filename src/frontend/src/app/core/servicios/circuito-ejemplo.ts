import { distanciaMetros } from '../../compartido/utilidades/geo';
import { PuntoGps } from '../modelos/punto-gps';

const CENTRO = { latitud: 40.4153, longitud: -3.6845 }; // Parque del Retiro (Madrid)
const RADIO_M = 400;
const PUNTOS = 100;
const SEGUNDOS_POR_METRO = 0.3; // 5:00/km

/**
 * TEMPORAL — recorrido de ejemplo (circuito circular de ~2,5 km) que da las
 * coordenadas al mapa mientras no existan carreras reales con puntos GPS.
 * Los tiempos de los sectores salen de CARRERA_EJEMPLO.
 */
function crearCircuito(): PuntoGps[] {
  const mLat = 1 / 111195;
  const mLon = 1 / (111195 * Math.cos((CENTRO.latitud * Math.PI) / 180));
  const puntos: PuntoGps[] = [];
  let tiempo = 0;
  for (let i = 0; i <= PUNTOS; i++) {
    const ang = (2 * Math.PI * i) / PUNTOS;
    const p: PuntoGps = {
      latitud: CENTRO.latitud + Math.sin(ang) * RADIO_M * mLat,
      longitud: CENTRO.longitud + Math.cos(ang) * RADIO_M * mLon,
      tiempoSegundos: 0,
    };
    if (i > 0) tiempo += distanciaMetros(puntos[i - 1], p) * SEGUNDOS_POR_METRO;
    puntos.push({ ...p, tiempoSegundos: tiempo });
  }
  return puntos;
}

export const CIRCUITO_EJEMPLO: PuntoGps[] = crearCircuito();
