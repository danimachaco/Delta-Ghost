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

import { inject, Service } from '@angular/core';
import { PuntoGps } from '../modelos/ruta';
import { ResultadoSector, Sector } from '../modelos/sombra';
import { Calculo } from './calculo';
import { DiferenciaSombra, PerfilSombra } from './diferencia-sombra';

/** Sectores en los que se divide una ruta si no se indica otra cosa, como en la F1 */
export const SECTORES_POR_DEFECTO = 3;

/**
 * Reparte los puntos de una ruta en sectores de tamaño parecido (PS-48).
 * Con 7 puntos (0..6) y 3 sectores quedan los tramos 0→2, 2→4 y 4→6: el final de un
 * sector es el inicio del siguiente. Nunca hay más sectores que tramos entre puntos.
 * Es el mismo reparto que hace el backend al crear una ruta (RutaService.dividirEnSectores).
 */
export function dividirEnSectores(numeroPuntos: number, pedidos = SECTORES_POR_DEFECTO): Sector[] {
  const ultimo = numeroPuntos - 1;
  const numero = Math.max(0, Math.min(pedidos, ultimo));
  const sectores: Sector[] = [];
  for (let i = 0; i < numero; i++) {
    sectores.push({
      numero: i + 1,
      puntoInicio: Math.round((i * ultimo) / numero),
      puntoFin: Math.round(((i + 1) * ultimo) / numero),
    });
  }
  return sectores;
}

/** Final de un sector medido en metros desde la salida */
interface LimiteSector {
  numero: number;
  metrosFin: number;
}

/**
 * Comparación por sectores de UNA carrera contra su sombra (PS-48).
 *
 * Se le pasan las lecturas del corredor (metros recorridos y segundos) con `actualizar()`.
 * Cada vez que el corredor cruza el final de un sector, devuelve el resultado de ese sector:
 * su tiempo, el de la sombra y si va en verde o en rojo, como los tiempos por sector de la F1.
 */
export class ComparacionSectores {
  private readonly _resultados: ResultadoSector[] = [];
  /** Índice del próximo sector por terminar */
  private siguiente = 0;
  /** Última lectura del corredor, para interpolar el momento exacto en que cruza un final */
  private anterior = { metros: 0, segundos: 0 };
  /** Segundos del corredor y de la sombra al empezar el sector actual */
  private inicioCorredor = 0;
  private inicioSombra = 0;

  constructor(
    private readonly perfil: PerfilSombra,
    private readonly limites: readonly LimiteSector[],
  ) {}

  /** Sectores ya terminados, en orden */
  get resultados(): readonly ResultadoSector[] {
    return this._resultados;
  }

  /** Número del sector por el que va el corredor (1, 2, 3…), o null si ya ha pasado el último */
  get sectorActual(): number | null {
    return this.limites[this.siguiente]?.numero ?? null;
  }

  /** true cuando se han terminado todos los sectores */
  get terminada(): boolean {
    return this.siguiente >= this.limites.length;
  }

  /**
   * Nueva lectura del corredor: lleva `metros` recorridos en `segundos`.
   * Devuelve los sectores que se han terminado con esta lectura (normalmente ninguno o uno;
   * varios si el GPS ha estado un rato sin dar señal).
   */
  actualizar(metros: number, segundos: number): ResultadoSector[] {
    const terminados: ResultadoSector[] = [];
    while (!this.terminada && metros >= this.limites[this.siguiente].metrosFin) {
      const limite = this.limites[this.siguiente];
      const tCorredor = this.momentoDeCruce(limite.metrosFin, metros, segundos);
      const tSombra = this.perfil.tiempoEnDistancia(limite.metrosFin);

      const tiempoCorredor = tCorredor - this.inicioCorredor;
      const tiempoSombra = tSombra - this.inicioSombra;
      const resultado: ResultadoSector = {
        numero: limite.numero,
        tiempoCorredor,
        tiempoSombra,
        diferenciaSector: tiempoCorredor - tiempoSombra,
        diferenciaAcumulada: tCorredor - tSombra,
        // Empatar con la sombra cuenta como verde: no has perdido tiempo
        color: tiempoCorredor <= tiempoSombra ? 'verde' : 'rojo',
      };
      this._resultados.push(resultado);
      terminados.push(resultado);

      this.inicioCorredor = tCorredor;
      this.inicioSombra = tSombra;
      this.siguiente++;
    }
    this.anterior = { metros, segundos };
    return terminados;
  }

  /**
   * Segundo exacto en que el corredor pasó por `metrosFin`, repartiendo proporcionalmente
   * entre la lectura anterior y la actual (el GPS no da una lectura justo en la línea).
   */
  private momentoDeCruce(metrosFin: number, metros: number, segundos: number): number {
    const avance = metros - this.anterior.metros;
    if (avance <= 0) {
      return segundos;
    }
    const fraccion = Math.min(1, Math.max(0, (metrosFin - this.anterior.metros) / avance));
    return this.anterior.segundos + fraccion * (segundos - this.anterior.segundos);
  }
}

/**
 * Lógica de sectores de la carrera (PS-48): divide la ruta en sectores, calcula dónde
 * termina cada uno en metros y crea la comparación con la sombra.
 */
@Service()
export class Sectores {
  private readonly calculo = inject(Calculo);
  private readonly diferencia = inject(DiferenciaSombra);

  /** Divide una ruta de `numeroPuntos` puntos en sectores (3 por defecto) */
  dividir(numeroPuntos: number, pedidos = SECTORES_POR_DEFECTO): Sector[] {
    return dividirEnSectores(numeroPuntos, pedidos);
  }

  /** Metros desde la salida hasta el final de cada sector, medidos sobre los puntos de la ruta */
  limites(puntosRuta: readonly PuntoGps[], sectores: readonly Sector[]): LimiteSector[] {
    const acumulados = [0];
    for (let i = 1; i < puntosRuta.length; i++) {
      acumulados.push(acumulados[i - 1] + this.calculo.distancia(puntosRuta[i - 1], puntosRuta[i]));
    }
    return sectores
      .filter((s) => s.puntoFin < acumulados.length)
      .map((s) => ({ numero: s.numero, metrosFin: acumulados[s.puntoFin] }));
  }

  /**
   * Prepara la comparación por sectores de una carrera.
   * @param puntosRuta  puntos de la ruta (donde están definidos los sectores)
   * @param sombra      puntos de la sombra (la mejor marca, o la propia ruta)
   * @param sectores    sectores de la ruta; si no se pasan se divide en 3
   */
  comparar(
    puntosRuta: readonly PuntoGps[],
    sombra: readonly PuntoGps[],
    sectores: readonly Sector[] = this.dividir(puntosRuta.length),
  ): ComparacionSectores {
    return new ComparacionSectores(
      this.diferencia.perfil(sombra),
      this.limites(puntosRuta, sectores),
    );
  }
}
