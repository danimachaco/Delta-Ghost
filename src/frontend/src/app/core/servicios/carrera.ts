import { Service, inject, signal } from '@angular/core';
import { Ruta } from '../modelos/ruta';
import { Sombra } from '../modelos/sombra';
import { Cronometro } from './cronometro';
import { Gps } from './gps';

/** Fases de la carrera: sin empezar, corriendo contra la sombra o ya terminada */
export type EstadoCarrera = 'sin-carrera' | 'en-curso' | 'terminada';

/**
 * Carrera contra la sombra (PS-42).
 *
 * Guarda qué ruta se corre y su sombra, y pone en marcha el cronómetro y el GPS.
 * Es un servicio de toda la app porque la carrera se empieza en la pantalla
 * "Elige ruta" (PS-44) y sigue viva en la pantalla del reloj, que solo lee sus datos.
 */
@Service()
export class Carrera {
  private readonly cronometro = inject(Cronometro);
  private readonly gps = inject(Gps);

  readonly estado = signal<EstadoCarrera>('sin-carrera');
  /** Ruta que se está corriendo */
  readonly ruta = signal<Ruta | null>(null);
  /** Mejor marca de esa ruta, contra la que se corre */
  readonly sombra = signal<Sombra | null>(null);
  /** Tiempo de carrera en segundos (lo lleva el cronómetro de la PS-38) */
  readonly segundos = this.cronometro.segundos;

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
    this.gps.iniciar();
    this.cronometro.reiniciar();
    this.cronometro.iniciar();
    this.estado.set('en-curso');
    return true;
  }

  /** Para el cronómetro y apaga el GPS; los datos se quedan para el resumen */
  terminar(): void {
    if (this.estado() !== 'en-curso') {
      return;
    }
    this.cronometro.pausar();
    this.gps.detener();
    this.estado.set('terminada');
  }

  /** Olvida la carrera y lo deja todo como al principio */
  descartar(): void {
    this.cronometro.reiniciar();
    this.gps.detener();
    this.ruta.set(null);
    this.sombra.set(null);
    this.estado.set('sin-carrera');
  }
}
