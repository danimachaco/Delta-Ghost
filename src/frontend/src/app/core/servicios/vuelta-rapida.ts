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
import { DestroyRef, Service, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ResultadoAviso } from '../modelos/aviso';
import { PosicionGps } from '../modelos/punto-gps';
import { AvisoSector } from './aviso-sector';
import { Calculo } from './calculo';
import { Gps } from './gps';
import { PantallaEncendida } from './pantalla-encendida';

/**
 * Metros que hay que alejarse de la salida para que la vuelta "cuente". Evita que el GPS,
 * que oscila unos metros estando parado en la línea, cierre vueltas falsas.
 */
export const DISTANCIA_SALIR_M = 50;
/** Metros alrededor de la salida en los que se da la vuelta por cerrada al volver */
export const RADIO_META_M = 15;
/** Una vuelta de menos de estos segundos es un error del GPS, no una vuelta de verdad */
export const VUELTA_MINIMA_S = 20;

/** Fases del modo vuelta rápida */
export type EstadoVueltas = 'parado' | 'en-curso' | 'terminado';

/** Una vuelta terminada */
export interface Vuelta {
  numero: number;
  /** Tiempo de la vuelta en segundos (con décimas) */
  segundos: number;
  /**
   * Cómo ha ido comparada con las anteriores: 'morado' si es tu vuelta más rápida hasta ahora,
   * 'mejor' si mejora la anterior y 'peor' si no. La primera vuelta no se compara (null).
   */
  resultado: ResultadoAviso | null;
  /** Segundos de diferencia con la vuelta anterior (negativo = más rápida), o null en la primera */
  diferencia: number | null;
}

/**
 * Modo vuelta rápida para correr en pista (PS-79, historia PS-77): **cada vuelta es un sector**.
 *
 * Al empezar, la posición actual es la línea de salida y meta. Con cada lectura del GPS
 * (las filtradas de la PS-32) se mira la distancia a esa línea: cuando te has alejado al menos
 * DISTANCIA_SALIR_M y vuelves a estar a menos de RADIO_META_M, se cierra una vuelta. Su tiempo
 * se compara con las anteriores y se lanza el destello del reloj (PS-49/68): morado si es tu
 * mejor vuelta, verde si mejoras la anterior y rojo si no. La pantalla se mantiene encendida (PS-46).
 *
 * Usa su propio reloj (Date.now) y no el Cronometro de la carrera, para no mezclarse con una
 * carrera contra la sombra.
 */
@Service()
export class VueltaRapida {
  private readonly gps = inject(Gps);
  private readonly calculo = inject(Calculo);
  private readonly avisos = inject(AvisoSector);
  private readonly pantalla = inject(PantallaEncendida);

  readonly estado = signal<EstadoVueltas>('parado');
  /** Vueltas terminadas, de la primera a la última */
  readonly vueltas = signal<Vuelta[]>([]);

  /** Hora actual (ms); se refresca varias veces por segundo mientras se corre */
  private readonly ahora = signal(Date.now());
  /** Hora (ms) a la que empezó la vuelta actual */
  private readonly inicioVuelta = signal(0);
  private salida: PosicionGps | null = null;
  /** true cuando ya te has alejado lo bastante de la salida en esta vuelta */
  private alejado = false;
  private refresco: ReturnType<typeof setInterval> | null = null;

  /** Número de la vuelta que estás corriendo (1, 2, 3…) */
  readonly numeroVuelta = computed(() => this.vueltas().length + 1);

  /** Segundos que llevas en la vuelta actual */
  readonly segundosVuelta = computed(() =>
    this.estado() === 'en-curso' ? Math.max(0, (this.ahora() - this.inicioVuelta()) / 1000) : 0,
  );

  /** Tu vuelta más rápida, o null si aún no has terminado ninguna */
  readonly mejorVuelta = computed<Vuelta | null>(() =>
    this.vueltas().reduce<Vuelta | null>(
      (mejor, vuelta) => (mejor === null || vuelta.segundos < mejor.segundos ? vuelta : mejor),
      null,
    ),
  );

  /** La última vuelta terminada, o null */
  readonly ultimaVuelta = computed(() => this.vueltas().at(-1) ?? null);

  /** Segundos desde la salida hasta la última vuelta cerrada */
  readonly segundosTotales = computed(() =>
    this.vueltas().reduce((total, vuelta) => total + vuelta.segundos, 0),
  );

  constructor() {
    // Cada lectura válida del GPS puede cerrar una vuelta (si el modo está en marcha)
    this.gps.lecturasValidas.pipe(takeUntilDestroyed()).subscribe((p) => this.registrar(p));
    inject(DestroyRef).onDestroy(() => this.pararRefresco());
  }

  /**
   * Empieza en la posición actual, que pasa a ser la línea de salida y meta.
   * Devuelve false si todavía no hay una posición GPS fiable.
   */
  empezar(hora = Date.now()): boolean {
    const salida = this.gps.posicionValida();
    if (!salida || this.estado() === 'en-curso') {
      return false;
    }
    this.salida = salida;
    this.alejado = false;
    this.inicioVuelta.set(hora);
    this.ahora.set(hora);
    this.vueltas.set([]);
    this.estado.set('en-curso');
    this.gps.iniciar();
    void this.pantalla.activar();
    this.refresco = setInterval(() => this.ahora.set(Date.now()), 200);
    return true;
  }

  /** Mira si con esta lectura del GPS has cerrado una vuelta */
  registrar(posicion: PosicionGps, hora = Date.now()): void {
    if (this.estado() !== 'en-curso' || !this.salida) {
      return;
    }
    const metros = this.calculo.distancia(this.salida, posicion);
    if (metros >= DISTANCIA_SALIR_M) {
      this.alejado = true;
      return;
    }
    const segundos = (hora - this.inicioVuelta()) / 1000;
    if (this.alejado && metros <= RADIO_META_M && segundos >= VUELTA_MINIMA_S) {
      this.cerrarVuelta(segundos, hora);
    }
  }

  /** Para el modo; las vueltas terminadas se quedan para verlas */
  terminar(): void {
    if (this.estado() !== 'en-curso') {
      return;
    }
    this.pararRefresco();
    this.gps.detener();
    void this.pantalla.desactivar();
    this.estado.set('terminado');
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
    this.pararRefresco();
    if (this.estado() === 'en-curso') {
      this.gps.detener();
      void this.pantalla.desactivar();
    }
    this.vueltas.set([]);
    this.salida = null;
    this.estado.set('parado');
  }

  private cerrarVuelta(segundos: number, hora: number): void {
    const anteriores = this.vueltas();
    const anterior = anteriores.at(-1) ?? null;
    const mejor = this.mejorVuelta();
    let resultado: ResultadoAviso | null = null;
    if (anterior && mejor) {
      // Como en la F1: morado = tu vuelta más rápida, verde = mejoras la anterior, rojo = no
      resultado =
        segundos < mejor.segundos ? 'morado' : segundos <= anterior.segundos ? 'mejor' : 'peor';
    }
    this.vueltas.set([
      ...anteriores,
      {
        numero: anteriores.length + 1,
        segundos,
        resultado,
        diferencia: anterior ? segundos - anterior.segundos : null,
      },
    ]);
    if (resultado) {
      this.avisos.avisar(resultado);
    }
    // La vuelta siguiente empieza en el mismo momento en que se cierra esta
    this.inicioVuelta.set(hora);
    this.ahora.set(hora);
    this.alejado = false;
  }

  private pararRefresco(): void {
    if (this.refresco !== null) {
      clearInterval(this.refresco);
      this.refresco = null;
    }
  }
}
