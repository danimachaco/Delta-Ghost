import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { formatearDuracion } from '../../../compartido/utilidades/rutas';
import { ErrorApi } from '../../../core/modelos/error-api';
import { Ruta } from '../../../core/modelos/ruta';
import { Sombra, TipoSombra } from '../../../core/modelos/sombra';
import { Carrera } from '../../../core/servicios/carrera';
import { ErrorGps, Gps } from '../../../core/servicios/gps';
import { Rutas } from '../../../core/servicios/rutas';

/** Tipos de sombra en el orden en que se enseñan, con su nombre en pantalla */
export const TIPOS_SOMBRA: readonly { tipo: TipoSombra; nombre: string }[] = [
  { tipo: 'MEJOR', nombre: 'Mejor marca' },
  { tipo: 'ULTIMA', nombre: 'Última carrera' },
  { tipo: 'ORIGINAL', nombre: 'Grabación original' },
];

/** Cómo está cada tipo de sombra: descargándose, lista para correr o no disponible */
type OpcionSombra =
  | { estado: 'cargando' }
  | { estado: 'lista'; sombra: Sombra }
  | { estado: 'no-disponible'; motivo: string };

/** Fila ya preparada para pintarla */
interface FilaSombra {
  tipo: TipoSombra;
  nombre: string;
  /** Tiempo de la sombra ("25:00"), "…" mientras carga o el motivo por el que no se puede elegir */
  detalle: string;
  disponible: boolean;
}

/** Estados de la carga de la ruta */
type EstadoRuta = 'cargando' | 'error' | 'listo';

/** Mensajes cortos para cada error del GPS (caben en la pantalla del reloj) */
const ERRORES_GPS: Record<ErrorGps, string> = {
  'permiso-denegado': 'Activa el permiso de ubicación y recarga',
  'no-disponible': 'No hay señal GPS',
  'tiempo-agotado': 'El GPS tarda en responder…',
  'no-soportado': 'Este navegador no permite usar la ubicación',
};

const OPCIONES_CARGANDO: Record<TipoSombra, OpcionSombra> = {
  MEJOR: { estado: 'cargando' },
  ULTIMA: { estado: 'cargando' },
  ORIGINAL: { estado: 'cargando' },
};

/**
 * Pantalla previa a la carrera para elegir contra qué sombra correr (PS-71, /reloj/sombra?ruta=ID).
 *
 * Se llega desde "Elige ruta". Descarga las tres sombras de la ruta (mejor marca, última
 * carrera y grabación original) con GET /api/rutas/{id}/sombra?tipo=… (PS-70) y enseña el
 * tiempo de cada una. Con una sombra elegida y señal GPS fiable, Empezar inicia la carrera.
 *
 * Si un tipo no está disponible (no hay carreras todavía, o el servidor aún no tiene la PS-70)
 * su tarjeta sale desactivada; la mejor marca funciona siempre.
 */
@Component({
  imports: [RouterLink],
  selector: 'app-elegir-sombra',
  styleUrl: './elegir-sombra.css',
  templateUrl: './elegir-sombra.html',
})
export class ElegirSombra implements OnInit, OnDestroy {
  private readonly rutas = inject(Rutas);
  private readonly gps = inject(Gps);
  private readonly router = inject(Router);
  private readonly rutaActiva = inject(ActivatedRoute);
  protected readonly carrera = inject(Carrera);

  protected readonly estado = signal<EstadoRuta>('cargando');
  protected readonly mensajeError = signal('');
  protected readonly ruta = signal<Ruta | null>(null);

  private readonly opciones = signal<Record<TipoSombra, OpcionSombra>>(OPCIONES_CARGANDO);
  /** Tipo de sombra elegido. Empieza en la mejor marca, que es contra la que se corría hasta ahora. */
  protected readonly elegida = signal<TipoSombra>('MEJOR');
  private readonly peticiones: Subscription[] = [];

  /** Las tres opciones con sus textos */
  protected readonly filas = computed<FilaSombra[]>(() =>
    TIPOS_SOMBRA.map(({ tipo, nombre }) => {
      const opcion = this.opciones()[tipo];
      return {
        tipo,
        nombre,
        detalle:
          opcion.estado === 'lista'
            ? formatearDuracion(opcion.sombra.tiempoTotalSegundos)
            : opcion.estado === 'cargando'
              ? '…'
              : opcion.motivo,
        disponible: opcion.estado === 'lista',
      };
    }),
  );

  /** Sombra del tipo elegido, o null si aún no ha llegado o no está disponible */
  private readonly sombraElegida = computed(() => {
    const opcion = this.opciones()[this.elegida()];
    return opcion.estado === 'lista' ? opcion.sombra : null;
  });

  protected readonly senalLista = computed(() => this.gps.posicionValida() !== null);

  /** Solo se puede empezar con la sombra descargada, señal GPS fiable y sin otra carrera en marcha */
  protected readonly puedeEmpezar = computed(
    () =>
      this.sombraElegida() !== null && this.senalLista() && this.carrera.estado() !== 'en-curso',
  );

  /** Línea de estado bajo la lista: qué falta para poder empezar */
  protected readonly aviso = computed(() => {
    const errorGps = this.gps.error();
    const opcion = this.opciones()[this.elegida()];
    if (errorGps) return ERRORES_GPS[errorGps];
    if (opcion.estado === 'cargando') return 'Cargando tu sombra…';
    if (opcion.estado === 'no-disponible') return 'Elige otra sombra';
    if (!this.senalLista()) return 'Buscando señal GPS…';
    return 'Señal GPS lista';
  });

  /** true si el aviso es un problema (se pinta en rojo y se anuncia como alerta) */
  protected readonly avisoEsError = computed(() => this.gps.error() !== null);

  ngOnInit(): void {
    this.gps.iniciar();
    this.cargar();
  }

  ngOnDestroy(): void {
    this.cancelarPeticiones();
    // Si se sale sin empezar, se apaga el GPS para no gastar batería.
    // Si la carrera ha empezado, el GPS sigue encendido: ahora lo usa la carrera.
    if (this.carrera.estado() !== 'en-curso') {
      this.gps.detener();
    }
  }

  /** Descarga la ruta y sus tres sombras (también se usa en el botón "Reintentar") */
  protected cargar(): void {
    const id = this.rutaActiva.snapshot.queryParamMap.get('ruta');
    if (!id) {
      this.mensajeError.set('Primero tienes que elegir una ruta.');
      this.estado.set('error');
      return;
    }
    this.cancelarPeticiones();
    this.estado.set('cargando');
    this.opciones.set(OPCIONES_CARGANDO);
    this.elegida.set('MEJOR');

    this.peticiones.push(
      this.rutas.obtener(id).subscribe({
        next: (ruta) => {
          this.ruta.set(ruta);
          this.estado.set('listo');
        },
        error: (error: ErrorApi) => {
          this.mensajeError.set(error.mensaje);
          this.estado.set('error');
        },
      }),
    );
    for (const { tipo } of TIPOS_SOMBRA) {
      this.peticiones.push(
        this.rutas.sombra(id, tipo).subscribe({
          next: (sombra) => this.poner(tipo, this.revisar(tipo, sombra)),
          error: (error: ErrorApi) =>
            this.poner(tipo, {
              estado: 'no-disponible',
              // 404: el servidor no tiene una sombra de ese tipo (por ejemplo, aún no hay carreras)
              motivo: error.estado === 404 ? 'sin carreras todavía' : 'no disponible',
            }),
        }),
      );
    }
  }

  /** Marca un tipo de sombra (solo si está disponible) */
  protected elegir(tipo: TipoSombra): void {
    if (this.opciones()[tipo].estado === 'lista') {
      this.elegida.set(tipo);
    }
  }

  /** Empieza la carrera contra la sombra elegida y abre la pantalla del reloj */
  protected empezar(): void {
    const sombra = this.sombraElegida();
    const ruta = this.ruta();
    if (!this.puedeEmpezar() || !sombra || !ruta) {
      return;
    }
    if (this.carrera.iniciar(ruta, sombra)) {
      void this.router.navigateByUrl('/reloj');
    }
  }

  /** Decide si la sombra que ha devuelto el servidor sirve para correr contra ella */
  private revisar(tipo: TipoSombra, sombra: Sombra): OpcionSombra {
    if (sombra.puntos.length < 2) {
      return { estado: 'no-disponible', motivo: 'sin puntos suficientes' };
    }
    // Un servidor anterior a la PS-70 ignora ?tipo= y devuelve siempre la mejor marca (sin `tipo`).
    // Enseñarla como "última carrera" sería engañar, así que esos tipos quedan desactivados.
    if (tipo !== 'MEJOR' && sombra.tipo !== tipo) {
      return { estado: 'no-disponible', motivo: 'no disponible' };
    }
    return { estado: 'lista', sombra };
  }

  private poner(tipo: TipoSombra, opcion: OpcionSombra): void {
    this.opciones.update((opciones) => ({ ...opciones, [tipo]: opcion }));
  }

  private cancelarPeticiones(): void {
    this.peticiones.splice(0).forEach((peticion) => peticion.unsubscribe());
  }
}
