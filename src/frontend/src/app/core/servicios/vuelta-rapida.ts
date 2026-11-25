import { Service, computed, signal } from '@angular/core';
import { distanciasAcumuladas, tiempoSombraEn } from '../../compartido/utilidades/sombra';
import { ResultadoAviso } from '../modelos/aviso';
import { PuntoGps } from '../modelos/ruta';
import { Vuelta } from '../modelos/vuelta';
import { Coordenada, haversineMetros } from './calculo';

/** A cuántos metros de la salida se considera que se está pasando por la línea de meta */
export const RADIO_META_M = 20;

/**
 * Metros mínimos de una vuelta. Evita que el ruido del GPS cierre vueltas falsas
 * nada más salir, mientras el corredor sigue cerca de la línea.
 */
export const DISTANCIA_MINIMA_VUELTA_M = 100;

/** Opciones del modo vuelta rápida (por defecto, las de una pista de atletismo de 400 m) */
export interface OpcionesVueltaRapida {
  radioMetaMetros?: number;
  distanciaMinimaMetros?: number;
}

/**
 * Lógica del modo vuelta rápida (PS-78), sin Angular para poder probarla sola.
 *
 * El corredor da vueltas a un circuito (por ejemplo, una pista) que empieza y acaba en la misma
 * línea: el punto donde pulsó "Empezar". Con cada lectura del GPS:
 *
 * 1. Suma los metros de la vuelta actual.
 * 2. Cuando ya lleva al menos `distanciaMinimaMetros` y vuelve a estar a menos de
 *    `radioMetaMetros` de la salida, está pasando por la línea. Espera a la lectura más cercana
 *    a la salida y a la siguiente, que ya se aleja, y calcula el momento del cruce repartiendo
 *    el tiempo entre las dos según lo lejos que estaba cada una de la línea. Así el tiempo no
 *    depende de en qué punto cayó cada lectura del GPS (normalmente hay una por segundo).
 * 3. Compara la vuelta con la mejor y con la anterior, y decide el aviso (morado, verde o rojo).
 *
 * Si el GPS falla (por ejemplo, en una pista cubierta) se puede cerrar la vuelta a mano con
 * `marcarVuelta()`, como el botón "lap" de los relojes deportivos.
 */
export class ModoVueltaRapida {
  private readonly radio: number;
  private readonly distanciaMinima: number;

  private readonly _vueltas: Vuelta[] = [];
  /** Puntos de la vuelta actual, con los segundos de sesión (no los de la vuelta) */
  private puntos: PuntoGps[] = [];
  /** Metros de la vuelta actual */
  private metros = 0;
  /** Lectura más cercana a la salida mientras se pasa por la línea */
  private candidato: { indice: number; distancia: number } | null = null;

  /** Puntos de la mejor vuelta (relativos a su inicio) y sus distancias acumuladas, para la diferencia en vivo */
  private mejorPuntos: PuntoGps[] = [];
  private mejorAcumuladas: number[] = [];

  constructor(
    /** Línea de salida y meta */
    readonly salida: Coordenada,
    opciones: OpcionesVueltaRapida = {},
    /** Segundos de sesión en los que empieza la primera vuelta */
    inicioSegundos = 0,
  ) {
    this.radio = opciones.radioMetaMetros ?? RADIO_META_M;
    this.distanciaMinima = opciones.distanciaMinimaMetros ?? DISTANCIA_MINIMA_VUELTA_M;
    this.puntos = [
      { latitud: salida.latitud, longitud: salida.longitud, tiempoSegundos: inicioSegundos },
    ];
  }

  /** Vueltas terminadas, en orden */
  get vueltas(): readonly Vuelta[] {
    return this._vueltas;
  }

  /** La vuelta más rápida hasta ahora, o null si todavía no se ha terminado ninguna */
  get mejorVuelta(): Vuelta | null {
    return this._vueltas.reduce<Vuelta | null>(
      (mejor, v) => (mejor === null || v.tiempoSegundos < mejor.tiempoSegundos ? v : mejor),
      null,
    );
  }

  /** Número de la vuelta que se está dando ahora */
  get numeroVuelta(): number {
    return this._vueltas.length + 1;
  }

  /** Metros que se llevan en la vuelta actual */
  get metrosVuelta(): number {
    return this.metros;
  }

  /** Segundos de sesión en los que empezó la vuelta actual */
  get inicioVueltaSegundos(): number {
    return this.puntos[0].tiempoSegundos;
  }

  /**
   * Nueva lectura del GPS, con los segundos de sesión (los del cronómetro).
   * Devuelve la vuelta si se acaba de cerrar con esta lectura, o null.
   */
  registrar(punto: PuntoGps): Vuelta | null {
    const anterior = this.puntos[this.puntos.length - 1];
    // El tiempo nunca va hacia atrás
    const actual = {
      ...punto,
      tiempoSegundos: Math.max(punto.tiempoSegundos, anterior.tiempoSegundos),
    };
    this.metros += haversineMetros(anterior, actual);
    this.puntos.push(actual);

    if (this.metros < this.distanciaMinima) {
      return null;
    }
    const distancia = haversineMetros(actual, this.salida);
    const candidato = this.candidato;
    if (distancia <= this.radio && (candidato === null || distancia < candidato.distancia)) {
      // Se sigue acercando a la línea: este punto es el mejor candidato para cerrar la vuelta
      this.candidato = { indice: this.puntos.length - 1, distancia };
      return null;
    }
    if (candidato !== null) {
      // Ya no se acerca: ha cruzado la línea entre la lectura más cercana y esta
      return this.cerrar(candidato.indice, this.puntos.length - 1);
    }
    return null;
  }

  /** Cierra la vuelta a mano en la última lectura (botón "vuelta"). Devuelve null si aún no se ha movido. */
  marcarVuelta(): Vuelta | null {
    return this.puntos.length < 2 ? null : this.cerrar(this.puntos.length - 1);
  }

  /**
   * Diferencia en vivo con la mejor vuelta: segundos que llevas en esta vuelta menos los que tardaste
   * en la mejor en recorrer los mismos metros. Negativo = vas más rápido que tu mejor vuelta.
   * Es null mientras no haya ninguna vuelta terminada.
   */
  diferenciaEnVivo(segundosSesion: number): number | null {
    if (this.mejorPuntos.length < 2) {
      return null;
    }
    const enVuelta = segundosSesion - this.inicioVueltaSegundos;
    return enVuelta - tiempoSombraEn(this.mejorPuntos, this.mejorAcumuladas, this.metros);
  }

  /**
   * Termina la vuelta en el punto `indice` y empieza la siguiente desde ahí.
   * Si se pasa `siguiente` (la lectura que ya se aleja), el cruce se calcula entre las dos: con la
   * más cercana a 10 m antes de la línea y la siguiente a 10 m después, se cruzó justo a mitad de tiempo.
   */
  private cerrar(indice: number, siguiente?: number): Vuelta {
    const cruce = this.cruce(indice, siguiente);
    const puntosVuelta = [...this.puntos.slice(0, indice + 1), ...(cruce ? [cruce] : [])];
    const inicio = puntosVuelta[0].tiempoSegundos;
    const fin = puntosVuelta[puntosVuelta.length - 1].tiempoSegundos;
    const relativos = puntosVuelta.map((p) => ({
      ...p,
      tiempoSegundos: p.tiempoSegundos - inicio,
    }));
    const acumuladas = distanciasAcumuladas(relativos);
    const tiempo = fin - inicio;

    const mejor = this.mejorVuelta;
    const anterior = this._vueltas.at(-1) ?? null;
    const esMejor = mejor === null || tiempo < mejor.tiempoSegundos;
    const vuelta: Vuelta = {
      numero: this.numeroVuelta,
      tiempoSegundos: tiempo,
      inicioSegundos: inicio,
      finSegundos: fin,
      distanciaMetros: acumuladas[acumuladas.length - 1],
      puntos: relativos,
      diferenciaConMejorSegundos: mejor ? tiempo - mejor.tiempoSegundos : null,
      diferenciaConAnteriorSegundos: anterior ? tiempo - anterior.tiempoSegundos : null,
      esMejor,
      resultado: resultado(tiempo, mejor, anterior),
    };
    this._vueltas.push(vuelta);
    if (esMejor) {
      this.mejorPuntos = relativos;
      this.mejorAcumuladas = acumuladas;
    }

    // La siguiente vuelta empieza donde acabó esta, con las lecturas que ya llegaron después
    this.puntos = cruce ? [cruce, ...this.puntos.slice(indice + 1)] : this.puntos.slice(indice);
    this.metros = distanciasAcumuladas(this.puntos).at(-1) ?? 0;
    this.candidato = null;
    return vuelta;
  }

  /**
   * Punto en la línea de meta con el momento del cruce, o null si la lectura más cercana ya está
   * en la línea (o no hay lectura siguiente con la que repartir el tiempo).
   */
  private cruce(indice: number, siguiente?: number): PuntoGps | null {
    if (siguiente === undefined) {
      return null;
    }
    const antes = this.puntos[indice];
    const despues = this.puntos[siguiente];
    const dAntes = haversineMetros(antes, this.salida);
    const dDespues = haversineMetros(despues, this.salida);
    if (dAntes === 0) {
      return null;
    }
    const parte = dAntes / (dAntes + dDespues);
    return {
      latitud: this.salida.latitud,
      longitud: this.salida.longitud,
      tiempoSegundos:
        antes.tiempoSegundos + parte * (despues.tiempoSegundos - antes.tiempoSegundos),
    };
  }
}

/** Aviso de una vuelta frente a la mejor y a la anterior (ver Vuelta.resultado) */
function resultado(
  tiempo: number,
  mejor: Vuelta | null,
  anterior: Vuelta | null,
): ResultadoAviso | null {
  if (mejor === null || anterior === null) {
    return null;
  }
  if (tiempo < mejor.tiempoSegundos) {
    return 'morado';
  }
  return tiempo < anterior.tiempoSegundos ? 'mejor' : 'peor';
}

/** Fases del modo vuelta rápida */
export type EstadoVueltaRapida = 'parado' | 'en-curso' | 'terminado';

/**
 * Modo vuelta rápida para las pantallas (PS-78). Envuelve ModoVueltaRapida con signals para que
 * la pantalla del reloj (PS-79) solo tenga que leerlas.
 *
 * Uso desde el reloj: `iniciar(posicion, cronometro.segundos())` al pulsar "Empezar"; después,
 * con cada lectura válida del GPS, `registrar({ ...posicion, tiempoSegundos: cronometro.segundos() })`.
 * Cuando `ultimaVuelta` cambia, se lanza el aviso con su `resultado` (el servicio AvisoSector
 * ya sabe mostrar morado, verde y rojo).
 */
@Service()
export class VueltaRapida {
  private modo: ModoVueltaRapida | null = null;

  readonly estado = signal<EstadoVueltaRapida>('parado');
  /** Vueltas terminadas, en orden */
  readonly vueltas = signal<readonly Vuelta[]>([]);
  /** La última vuelta terminada: cuando cambia, el reloj muestra su aviso */
  readonly ultimaVuelta = computed(() => this.vueltas().at(-1) ?? null);
  /** La vuelta más rápida de la sesión (la última que bajó la mejor marca) */
  readonly mejorVuelta = computed(
    () => [...this.vueltas()].reverse().find((v) => v.esMejor) ?? null,
  );
  /** Número de la vuelta que se está dando */
  readonly numeroVuelta = computed(() => this.vueltas().length + 1);
  /** Diferencia en vivo con la mejor vuelta (ver ModoVueltaRapida.diferenciaEnVivo); null sin mejor vuelta */
  readonly diferencia = signal<number | null>(null);
  /** Metros que se llevan en la vuelta actual */
  readonly metrosVuelta = signal(0);

  /** Empieza la sesión: la posición actual es la línea de salida y meta */
  iniciar(salida: Coordenada, segundos = 0, opciones?: OpcionesVueltaRapida): void {
    this.modo = new ModoVueltaRapida(salida, opciones, segundos);
    this.vueltas.set([]);
    this.diferencia.set(null);
    this.metrosVuelta.set(0);
    this.estado.set('en-curso');
  }

  /** Nueva lectura del GPS con los segundos del cronómetro. Devuelve la vuelta si se acaba de cerrar. */
  registrar(punto: PuntoGps): Vuelta | null {
    if (!this.modo || this.estado() !== 'en-curso') {
      return null;
    }
    const vuelta = this.modo.registrar(punto);
    this.actualizar(punto.tiempoSegundos);
    return vuelta;
  }

  /** Cierra la vuelta a mano (botón "vuelta") */
  marcarVuelta(segundos: number): Vuelta | null {
    if (!this.modo || this.estado() !== 'en-curso') {
      return null;
    }
    const vuelta = this.modo.marcarVuelta();
    this.actualizar(segundos);
    return vuelta;
  }

  /** Termina la sesión; las vueltas se quedan para enseñar el resumen */
  terminar(): void {
    if (this.estado() === 'en-curso') {
      this.estado.set('terminado');
    }
  }

  /** Lo deja todo como al principio */
  reiniciar(): void {
    this.modo = null;
    this.vueltas.set([]);
    this.diferencia.set(null);
    this.metrosVuelta.set(0);
    this.estado.set('parado');
  }

  private actualizar(segundos: number): void {
    const modo = this.modo!;
    if (modo.vueltas.length !== this.vueltas().length) {
      this.vueltas.set([...modo.vueltas]);
    }
    this.diferencia.set(modo.diferenciaEnVivo(segundos));
    this.metrosVuelta.set(modo.metrosVuelta);
  }
}
