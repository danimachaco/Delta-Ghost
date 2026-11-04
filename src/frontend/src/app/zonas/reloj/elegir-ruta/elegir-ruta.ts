import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  distanciaKm,
  duracionSegundos,
  formatearDuracion,
  formatearKm,
} from '../../../compartido/utilidades/rutas';
import { ErrorApi } from '../../../core/modelos/error-api';
import { Ruta } from '../../../core/modelos/ruta';
import { Sombra } from '../../../core/modelos/sombra';
import { Carrera } from '../../../core/servicios/carrera';
import { ErrorGps, Gps } from '../../../core/servicios/gps';
import { Rutas } from '../../../core/servicios/rutas';

/** Ruta ya preparada para pintarla en la lista */
interface FilaRuta {
  id: string;
  nombre: string;
  distancia: string;
  /** Tiempo de la sombra formateado (mm:ss) */
  sombra: string;
}

/** Estados de la carga de la lista de rutas */
type EstadoLista = 'cargando' | 'error' | 'listo';

/** Mensajes cortos para cada error del GPS (caben en la pantalla del reloj) */
const ERRORES_GPS: Record<ErrorGps, string> = {
  'permiso-denegado': 'Activa el permiso de ubicación y recarga',
  'no-disponible': 'No hay señal GPS',
  'tiempo-agotado': 'El GPS tarda en responder…',
  'no-soportado': 'Este navegador no permite usar la ubicación',
};

/**
 * Pantalla del reloj para elegir contra qué sombra correr (PS-44, /reloj/elegir).
 * Sigue el mockup "1 · Elegir ruta": tarjetas con nombre, tiempo de la sombra y km, y botón Empezar.
 *
 * 1. Carga las rutas del usuario. 2. Al tocar una, descarga su sombra (API de la PS-36).
 * 3. Con la sombra lista y señal GPS fiable, Empezar inicia la carrera y abre el reloj.
 */
@Component({
  imports: [RouterLink],
  selector: 'app-elegir-ruta',
  styleUrl: './elegir-ruta.css',
  templateUrl: './elegir-ruta.html',
})
export class ElegirRuta implements OnInit, OnDestroy {
  private readonly rutas = inject(Rutas);
  private readonly gps = inject(Gps);
  private readonly router = inject(Router);
  private readonly rutaActiva = inject(ActivatedRoute);
  protected readonly carrera = inject(Carrera);

  protected readonly estado = signal<EstadoLista>('cargando');
  protected readonly mensajeError = signal('');
  private readonly lista = signal<Ruta[]>([]);

  /** Id de la ruta elegida, o null si aún no se ha tocado ninguna */
  protected readonly elegida = signal<string | null>(null);
  /** Sombra de la ruta elegida (null mientras se descarga o si falló) */
  protected readonly sombra = signal<Sombra | null>(null);
  protected readonly cargandoSombra = signal(false);
  protected readonly errorSombra = signal<string | null>(null);
  private peticionSombra: Subscription | null = null;

  /** Rutas de la más reciente a la más antigua, con los datos ya formateados */
  protected readonly filas = computed<FilaRuta[]>(() =>
    [...this.lista()]
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .map((ruta) => {
        // Si ya se ha descargado la sombra se enseña su tiempo real (puede ser una carrera mejor)
        const sombra = this.sombra();
        const segundos =
          sombra?.rutaId === ruta.id ? sombra.tiempoTotalSegundos : duracionSegundos(ruta.puntos);
        return {
          id: ruta.id,
          nombre: ruta.nombre,
          distancia: formatearKm(distanciaKm(ruta.puntos)),
          sombra: formatearDuracion(segundos),
        };
      }),
  );

  protected readonly senalLista = computed(() => this.gps.posicionValida() !== null);

  /** Solo se puede empezar con la sombra descargada, señal GPS fiable y sin otra carrera en marcha */
  protected readonly puedeEmpezar = computed(
    () => this.sombra() !== null && this.senalLista() && this.carrera.estado() !== 'en-curso',
  );

  /** Línea de estado bajo la lista: qué falta para poder empezar */
  protected readonly aviso = computed(() => {
    const errorSombra = this.errorSombra();
    const errorGps = this.gps.error();
    if (errorSombra) return errorSombra;
    if (errorGps) return ERRORES_GPS[errorGps];
    if (this.elegida() === null) return 'Toca una ruta para elegirla';
    if (this.cargandoSombra()) return 'Cargando tu sombra…';
    if (!this.senalLista()) return 'Buscando señal GPS…';
    return 'Señal GPS lista';
  });

  /** true si el aviso es un problema (se pinta en rojo y se anuncia como alerta) */
  protected readonly avisoEsError = computed(
    () => this.errorSombra() !== null || this.gps.error() !== null,
  );

  ngOnInit(): void {
    this.gps.iniciar();
    this.cargar();
  }

  ngOnDestroy(): void {
    this.peticionSombra?.unsubscribe();
    // Si se sale sin empezar, se apaga el GPS para no gastar batería.
    // Si la carrera ha empezado, el GPS sigue encendido: ahora lo usa la carrera.
    if (this.carrera.estado() !== 'en-curso') {
      this.gps.detener();
    }
  }

  /** Pide las rutas al backend (también se usa en el botón "Reintentar") */
  protected cargar(): void {
    this.estado.set('cargando');
    this.rutas.listar().subscribe({
      next: (rutas) => {
        this.lista.set(rutas);
        this.estado.set('listo');
        // /reloj/elegir?ruta=ID deja elegida esa ruta (por ejemplo, al venir desde "Mis rutas")
        const pedida = this.rutaActiva.snapshot.queryParamMap.get('ruta');
        if (pedida && rutas.some((r) => r.id === pedida)) {
          this.elegir(pedida);
        }
      },
      error: (error: ErrorApi) => {
        this.mensajeError.set(error.mensaje);
        this.estado.set('error');
      },
    });
  }

  /** Marca una ruta y descarga su sombra (si se toca otra antes de que llegue, se cancela la anterior) */
  protected elegir(id: string): void {
    if (this.elegida() === id && (this.sombra() !== null || this.cargandoSombra())) {
      return;
    }
    this.elegida.set(id);
    this.sombra.set(null);
    this.errorSombra.set(null);
    this.cargandoSombra.set(true);
    this.peticionSombra?.unsubscribe();
    this.peticionSombra = this.rutas.sombra(id).subscribe({
      next: (sombra) => {
        this.cargandoSombra.set(false);
        if (sombra.puntos.length < 2) {
          this.errorSombra.set('Esta ruta no tiene puntos suficientes para correrla');
          return;
        }
        this.sombra.set(sombra);
      },
      error: (error: ErrorApi) => {
        this.cargandoSombra.set(false);
        this.errorSombra.set(error.mensaje);
      },
    });
  }

  /** Empieza la carrera contra la sombra elegida y abre la pantalla del reloj */
  protected empezar(): void {
    const sombra = this.sombra();
    const ruta = this.lista().find((r) => r.id === this.elegida());
    if (!this.puedeEmpezar() || !sombra || !ruta) {
      return;
    }
    if (this.carrera.iniciar(ruta, sombra)) {
      this.router.navigateByUrl('/reloj');
    }
  }
}
