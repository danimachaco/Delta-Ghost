import { Service, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  distanciaSombraEn,
  distanciasAcumuladas,
  tiempoSombraEn,
} from '../../compartido/utilidades/sombra';
import { PosicionGps } from '../modelos/punto-gps';
import { PuntoGps, Ruta } from '../modelos/ruta';
import { Sombra } from '../modelos/sombra';
import { Calculo } from './calculo';
import { Cronometro } from './cronometro';
import { Gps } from './gps';
import { PantallaEncendida } from './pantalla-encendida';

/**
 * Metros que pueden faltar para dar la meta por alcanzada. El GPS casi nunca da una lectura
 * justo en la línea de meta, y sumar muchos tramos cortos deja siempre unos milímetros por debajo
 * de la longitud de la ruta; sin este margen la carrera no terminaría sola (PS-62).
 */
export const MARGEN_META_M = 10;

/** Fases de la carrera: sin empezar, corriendo contra la sombra o ya terminada */
export type EstadoCarrera = 'sin-carrera' | 'en-curso' | 'terminada';

/**
 * Carrera contra la sombra (PS-42).
 *
 * - Guarda qué ruta se corre y su sombra, y pone en marcha el cronómetro y el GPS (PS-44).
 * - Calcula en vivo dónde vas tú, dónde va tu sombra y la diferencia de tiempo (PS-45):
 *   tu distancia sale de tus puntos GPS filtrados (PS-32) y el servicio Calculo (PS-31);
 *   la de la sombra, de sus puntos y el tiempo del cronómetro (PS-38).
 * - Mantiene la pantalla encendida mientras se corre (PS-46).
 *
 * Es un servicio de toda la app porque la carrera se empieza en la pantalla
 * "Elige ruta" y sigue viva en la pantalla del reloj, que solo lee sus datos.
 */
@Service()
export class Carrera {
  private readonly cronometro = inject(Cronometro);
  private readonly gps = inject(Gps);
  private readonly calculo = inject(Calculo);
  private readonly pantalla = inject(PantallaEncendida);

  readonly estado = signal<EstadoCarrera>('sin-carrera');
  /** Ruta que se está corriendo */
  readonly ruta = signal<Ruta | null>(null);
  /** Mejor marca de esa ruta, contra la que se corre */
  readonly sombra = signal<Sombra | null>(null);
  /** Tiempo de carrera en segundos (lo lleva el cronómetro de la PS-38) */
  readonly segundos = this.cronometro.segundos;
  /** Tus puntos GPS en esta carrera, con los segundos en los que pasaste por cada uno */
  readonly puntos = signal<PuntoGps[]>([]);

  /** Metros desde la salida hasta cada punto de la sombra (se calcula una vez por carrera) */
  private readonly acumuladasSombra = computed(() =>
    distanciasAcumuladas(this.sombra()?.puntos ?? []),
  );

  /** Longitud de la ruta en metros: lo que recorrió la sombra de la salida a la meta */
  readonly distanciaRutaMetros = computed(() => this.acumuladasSombra().at(-1) ?? 0);

  /** Metros que llevas tú, sin pasar de la longitud de la ruta */
  readonly distanciaMetros = computed(() =>
    Math.min(this.calculo.distanciaTotal(this.puntos()), this.distanciaRutaMetros()),
  );

  /**
   * true si has llegado a la meta (con un margen de MARGEN_META_M metros, y nunca más de un
   * 10 % de la ruta). Solo entonces termina sola y se puede guardar (PS-62).
   */
  readonly completada = computed(() => {
    const meta = this.distanciaRutaMetros();
    return meta > 0 && this.distanciaMetros() >= meta - Math.min(MARGEN_META_M, meta / 10);
  });

  /** Tu progreso en la ruta: 0 = salida, 1 = meta */
  readonly progresoTu = computed(() => this.fraccion(this.distanciaMetros()));

  /** Progreso de la sombra en el mismo tiempo de carrera que llevas tú */
  readonly progresoSombra = computed(() => {
    const sombra = this.sombra();
    if (!sombra) return 0;
    const metros = distanciaSombraEn(sombra.puntos, this.acumuladasSombra(), this.tiempoActual());
    return this.fraccion(metros);
  });

  /**
   * Diferencia con la sombra en segundos: tu tiempo menos el que tardó la sombra en llegar
   * a donde estás tú. Negativo = vas por delante (mejor); positivo = vas por detrás.
   * Es null si no hay carrera.
   */
  readonly diferencia = computed<number | null>(() => {
    const sombra = this.sombra();
    if (!sombra || this.estado() === 'sin-carrera') return null;
    const tiempoSombra = tiempoSombraEn(
      sombra.puntos,
      this.acumuladasSombra(),
      this.distanciaMetros(),
    );
    return this.tiempoActual() - tiempoSombra;
  });

  /** Última posición añadida, para no añadir la misma dos veces */
  private ultimaPosicion: PosicionGps | null = null;

  constructor() {
    // Cada lectura válida del GPS se añade a tu recorrido (registrar() la ignora si no hay carrera).
    // Se usa la suscripción y no la signal posicionValida para no perder lecturas que lleguen juntas.
    this.gps.lecturasValidas.pipe(takeUntilDestroyed()).subscribe((p) => this.registrar(p));
  }

  /**
   * Empieza a correr la ruta contra su sombra: el cronómetro arranca desde cero y el GPS
   * se queda encendido. Devuelve false si ya hay una carrera en curso o si la sombra
   * no tiene puntos suficientes para compararse con ella.
   */
  iniciar(ruta: Ruta, sombra: Sombra): boolean {
    if (this.estado() === 'en-curso' || sombra.puntos.length < 2) {
      return false;
    }
    this.ruta.set(ruta);
    this.sombra.set(sombra);
    // La salida es donde estás al pulsar Empezar (la pantalla espera a tener señal fiable)
    const salida = this.gps.posicionValida();
    this.ultimaPosicion = salida;
    this.puntos.set(salida ? [aPunto(salida, 0)] : []);
    this.gps.iniciar();
    this.cronometro.reiniciar();
    this.cronometro.iniciar();
    // Si la pantalla se apagara, el navegador frenaría la página y el reloj dejaría de verse
    void this.pantalla.activar();
    this.estado.set('en-curso');
    return true;
  }

  /** Añade una lectura del GPS a tu recorrido y termina la carrera al llegar a la meta */
  registrar(posicion: PosicionGps): void {
    if (this.estado() !== 'en-curso' || posicion === this.ultimaPosicion) {
      return;
    }
    this.ultimaPosicion = posicion;
    this.puntos.update((puntos) => {
      // El tiempo nunca puede ir hacia atrás (el backend rechazaría la carrera)
      const anterior = puntos.at(-1)?.tiempoSegundos ?? 0;
      return [...puntos, aPunto(posicion, Math.max(anterior, this.segundos()))];
    });
    if (this.completada()) {
      this.terminar();
    }
  }

  /** Para el cronómetro y apaga el GPS; los datos se quedan para el resumen */
  terminar(): void {
    if (this.estado() !== 'en-curso') {
      return;
    }
    this.cronometro.pausar();
    this.gps.detener();
    void this.pantalla.desactivar();
    this.estado.set('terminada');
  }

  /** Olvida la carrera y lo deja todo como al principio */
  descartar(): void {
    this.cronometro.reiniciar();
    this.gps.detener();
    void this.pantalla.desactivar();
    this.ruta.set(null);
    this.sombra.set(null);
    this.puntos.set([]);
    this.ultimaPosicion = null;
    this.estado.set('sin-carrera');
  }

  /** Tiempo de carrera con décimas, para que el punto de la sombra avance suave */
  private tiempoActual(): number {
    return this.cronometro.milisegundos() / 1000;
  }

  /** Metros → fracción de la ruta (0–1) */
  private fraccion(metros: number): number {
    const total = this.distanciaRutaMetros();
    return total > 0 ? Math.min(1, metros / total) : 0;
  }
}

/** Convierte una lectura del GPS en un punto de la carrera (la precisión no se guarda) */
function aPunto(posicion: PosicionGps, tiempoSegundos: number): PuntoGps {
  return { latitud: posicion.latitud, longitud: posicion.longitud, tiempoSegundos };
}
