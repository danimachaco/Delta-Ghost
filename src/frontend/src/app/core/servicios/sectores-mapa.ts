import { distanciasAcumuladas } from '../../compartido/utilidades/geo';
import { PuntoGps } from '../modelos/punto-gps';
import { Sector } from '../modelos/sector';

/** Punto situado a `d` metros del inicio, interpolando posición y tiempo. */
function puntoEnDistancia(puntos: PuntoGps[], acum: number[], d: number): PuntoGps {
  const total = acum[acum.length - 1];
  const dist = Math.min(Math.max(d, 0), total);
  let i = 0;
  while (i < acum.length - 2 && acum[i + 1] < dist) i++;
  const largo = acum[i + 1] - acum[i];
  const t = largo === 0 ? 0 : (dist - acum[i]) / largo;
  const a = puntos[i];
  const b = puntos[i + 1];
  return {
    latitud: a.latitud + (b.latitud - a.latitud) * t,
    longitud: a.longitud + (b.longitud - a.longitud) * t,
    tiempoSegundos: a.tiempoSegundos + (b.tiempoSegundos - a.tiempoSegundos) * t,
  };
}

/** Puntos de la carrera entre dos distancias, con los extremos interpolados. */
function tramo(puntos: PuntoGps[], acum: number[], ini: number, fin: number): PuntoGps[] {
  const res = [puntoEnDistancia(puntos, acum, ini)];
  for (let i = 0; i < puntos.length; i++) {
    if (acum[i] > ini && acum[i] < fin) res.push(puntos[i]);
  }
  res.push(puntoEnDistancia(puntos, acum, fin));
  return res;
}

/**
 * Divide la carrera en sectores de `longitudSector` metros y compara cada uno
 * con la sombra. El último sector absorbe el resto de la ruta.
 * (Versión provisional en el frontend; la tarea 48 del backend podrá sustituirla.)
 */
export function calcularSectores(
  carrera: PuntoGps[],
  sombra: PuntoGps[],
  longitudSector = 500,
): Sector[] {
  if (carrera.length < 2 || sombra.length < 2) return [];
  const acumC = distanciasAcumuladas(carrera);
  const acumS = distanciasAcumuladas(sombra);
  const total = acumC[acumC.length - 1];
  const n = Math.max(1, Math.floor(total / longitudSector));

  return Array.from({ length: n }, (_, k) => {
    const ini = k * longitudSector;
    const fin = k === n - 1 ? total : (k + 1) * longitudSector;
    const puntos = tramo(carrera, acumC, ini, fin);
    const tiempo =
      puntoEnDistancia(carrera, acumC, fin).tiempoSegundos -
      puntoEnDistancia(carrera, acumC, ini).tiempoSegundos;
    const tiempoSombra =
      puntoEnDistancia(sombra, acumS, fin).tiempoSegundos -
      puntoEnDistancia(sombra, acumS, ini).tiempoSegundos;
    const diferencia = tiempo - tiempoSombra;
    return {
      numero: k + 1,
      distanciaMetros: fin - ini,
      tiempoSegundos: tiempo,
      tiempoSombraSegundos: tiempoSombra,
      diferenciaSegundos: diferencia,
      // Mismo criterio que el reloj: diferencia <= 0 es "vas mejor"
      resultado: diferencia <= 0 ? 'mejor' : 'peor',
      puntos,
    };
  });
}

/** Lo mínimo que necesita de una carrera (compatible con el modelo Carrera). */
interface CarreraConSectores {
  sectores: { indice: number; tiempoSegundos: number; sombraSegundos: number }[];
}

/**
 * Construye los sectores del mapa a partir de una carrera que ya trae los
 * tiempos por sector, y de un recorrido con coordenadas. Así el mapa y la
 * lista del resumen usan los mismos números.
 */
export function sectoresDesdeCarrera(
  carrera: CarreraConSectores,
  ruta: PuntoGps[],
  longitudSector = 500,
): Sector[] {
  if (ruta.length < 2) return [];
  const acum = distanciasAcumuladas(ruta);
  const total = acum[acum.length - 1];
  const n = carrera.sectores.length;

  return carrera.sectores.map((s, k) => {
    const ini = Math.min(k * longitudSector, total);
    const fin = k === n - 1 ? total : Math.min((k + 1) * longitudSector, total);
    const diferencia = s.tiempoSegundos - s.sombraSegundos;
    return {
      numero: s.indice,
      distanciaMetros: fin - ini,
      tiempoSegundos: s.tiempoSegundos,
      tiempoSombraSegundos: s.sombraSegundos,
      diferenciaSegundos: diferencia,
      resultado: diferencia <= 0 ? 'mejor' : 'peor',
      puntos: tramo(ruta, acum, ini, fin),
    };
  });
}

