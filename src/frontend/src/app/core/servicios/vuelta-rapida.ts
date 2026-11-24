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
