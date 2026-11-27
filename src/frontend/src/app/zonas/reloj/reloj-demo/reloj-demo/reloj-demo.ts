import { Component, OnDestroy, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { PuntoGps, Ruta } from '../../../../core/modelos/ruta';
import { Sombra } from '../../../../core/modelos/sombra';
import { AvisoSector } from '../../../../core/servicios/aviso-sector';
import { Carrera } from '../../../../core/servicios/carrera';
import { Cronometro } from '../../../../core/servicios/cronometro';
import { ComparacionSectores, Sectores } from '../../../../core/servicios/sectores';
import { SimuladorGpsService, VELOCIDADES } from '../../../../core/servicios/simulador-gps.service';
import { ErrorCarreraInvalida } from '../../../../compartido/utilidades/validar-carrera';
import { RelojInicio } from '../../reloj-inicio/reloj-inicio';

/**
 * Demo del reloj para el proyector (PS-80/PS-81, /reloj/demo).
 *
 * Enseña el reloj en modo demo (marco grande de reloj) y reproduce con el simulador (PS-41) la
 * carrera de ejemplo `carreras/ejemplo-parque.json`, sin necesidad de salir a correr ni de
 * tener GPS ni backend:
 *  - La sombra se genera a partir de la misma carrera con un ritmo distinto en cada tercio
 *    (más lenta, más rápida, más lenta), así se ven los destellos verde, rojo y verde.
 *  - Cada punto del simulador se pasa a `Carrera.registrar()`, igual que haría el GPS.
 *  - Al cruzar cada sector se compara con la sombra (PS-48) y se lanza el aviso (PS-49).
 *
 * La carrera se prepara escribiendo directamente en las signals de `Carrera` en lugar de llamar a
 * `iniciar()`, porque `iniciar()` enciende el GPS real y pediría permiso de ubicación en la demo.
 */
@Component({
  imports: [RelojInicio],
  selector: 'app-reloj-demo',
  styleUrl: './reloj-demo.css',
  templateUrl: './reloj-demo.html',
})
export class RelojDemo implements OnDestroy {
  protected readonly carrera = inject(Carrera);
  private readonly cronometro = inject(Cronometro);
  private readonly simulador = inject(SimuladorGpsService);
  private readonly sectores = inject(Sectores);
  private readonly avisos = inject(AvisoSector);

  protected readonly velocidades = VELOCIDADES;
  /** Velocidad del simulador: x10 hace que la vuelta de ~9 minutos dure unos 57 s */
  protected readonly velocidad = signal<number>(10);
  protected readonly error = signal<string | null>(null);

  private suscripcion?: Subscription;
  private comparacion: ComparacionSectores | null = null;

  /** Prepara la carrera de ejemplo y la reproduce desde el principio */
  protected async empezar(): Promise<void> {
    this.parar();
    this.error.set(null);
    try {
      const respuesta = await fetch('carreras/ejemplo-parque.json');
      if (!respuesta.ok) {
        throw new Error('No se encontró la carrera de ejemplo.');
      }
      this.simulador.cargarJson(await respuesta.text());
    } catch (e) {
      this.error.set(
        e instanceof ErrorCarreraInvalida ? e.message : 'No se pudo cargar la carrera de ejemplo.',
      );
      return;
    }

    const grabada = this.simulador.carrera()!;
    const factor = this.velocidad();
    this.simulador.cambiarVelocidad(factor);

    const puntos: PuntoGps[] = grabada.puntos.map(({ latitud, longitud, tiempoSegundos }) => ({
      latitud,
      longitud,
      tiempoSegundos,
    }));
    const ruta: Ruta = {
      id: 'demo',
      nombre: grabada.nombre,
      fecha: new Date().toISOString(),
      puntos,
    };
    const sombra = this.crearSombra(puntos, factor);
    this.comparacion = this.sectores.comparar(ruta.puntos, sombra.puntos);

    // Carrera en curso sin pasar por el GPS real (ver la explicación de la clase)
    this.cronometro.reiniciar();
    this.cronometro.iniciar();
    this.carrera.ruta.set(ruta);
    this.carrera.sombra.set(sombra);
    this.carrera.puntos.set([{ ...puntos[0], tiempoSegundos: 0 }]);
    this.carrera.estado.set('en-curso');

    this.suscripcion = this.simulador.puntos$.subscribe((p) => {
      this.carrera.registrar({
        latitud: p.latitud,
        longitud: p.longitud,
        precision: p.precision ?? 5,
      });
      this.comprobarSectores();
    });
    this.simulador.reproducir();
  }

  protected cambiarVelocidad(factor: number): void {
    this.velocidad.set(factor);
  }

  ngOnDestroy(): void {
    this.parar();
  }

  /** Para el simulador y deja el reloj sin carrera */
  private parar(): void {
    this.suscripcion?.unsubscribe();
    this.suscripcion = undefined;
    this.simulador.detener();
    this.carrera.descartar();
    this.comparacion = null;
  }

  /** Lanza el destello verde o rojo por cada sector que se acaba de terminar */
  private comprobarSectores(): void {
    if (!this.comparacion) return;
    // Si la carrera se da por terminada con unos metros de margen, se cuenta la meta exacta
    const metros = this.carrera.completada()
      ? this.carrera.distanciaRutaMetros()
      : this.carrera.distanciaMetros();
    for (const resultado of this.comparacion.actualizar(metros, this.carrera.segundos())) {
      this.avisos.avisar(resultado.color === 'verde' ? 'mejor' : 'peor');
    }
  }

  /**
   * Sombra de la demo: la misma carrera, con los tiempos adaptados a la velocidad del simulador y
   * un ritmo distinto en cada tercio (1,08 / 0,90 / 1,08 veces el del corredor), de modo que el
   * corredor gana el primer y el último sector y pierde el del medio.
   */
  private crearSombra(puntos: PuntoGps[], factor: number): Sombra {
    const tramos = puntos.length - 1;
    let tiempo = 0;
    const sombra = puntos.map((p, i) => {
      if (i > 0) {
        const delta = (p.tiempoSegundos - puntos[i - 1].tiempoSegundos) / factor;
        const tercio = Math.floor(((i - 1) * 3) / tramos);
        tiempo += delta * (tercio === 1 ? 0.9 : 1.08);
      }
      return { latitud: p.latitud, longitud: p.longitud, tiempoSegundos: tiempo };
    });
    return {
      rutaId: 'demo',
      tipo: 'MEJOR',
      carreraId: null,
      tiempoTotalSegundos: Math.round(tiempo),
      puntos: sombra,
      sectores: [],
    };
  }
}
