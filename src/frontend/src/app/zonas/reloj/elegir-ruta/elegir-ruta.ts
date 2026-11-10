import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  distanciaKm,
  duracionSegundos,
  formatearDuracion,
  formatearKm,
} from '../../../compartido/utilidades/rutas';
import { ErrorApi } from '../../../core/modelos/error-api';
import { Ruta } from '../../../core/modelos/ruta';
import { Carrera } from '../../../core/servicios/carrera';
import { Rutas } from '../../../core/servicios/rutas';

/** Ruta ya preparada para pintarla en la lista */
interface FilaRuta {
  id: string;
  nombre: string;
  distancia: string;
  /** Duración de la grabación de la ruta, formateada (mm:ss) */
  sombra: string;
}

/** Estados de la carga de la lista de rutas */
type EstadoLista = 'cargando' | 'error' | 'listo';

/**
 * Pantalla del reloj para elegir qué ruta correr (PS-44, /reloj/elegir).
 * Sigue el mockup "1 · Elegir ruta": tarjetas con nombre, tiempo y km.
 *
 * 1. Carga las rutas del usuario. 2. Se toca una. 3. "Siguiente" abre la pantalla
 * "Elige sombra" (PS-71), donde se elige contra qué sombra correr y se empieza la carrera.
 */
@Component({
  imports: [RouterLink],
  selector: 'app-elegir-ruta',
  styleUrl: './elegir-ruta.css',
  templateUrl: './elegir-ruta.html',
})
export class ElegirRuta implements OnInit {
  private readonly rutas = inject(Rutas);
  private readonly router = inject(Router);
  private readonly rutaActiva = inject(ActivatedRoute);
  protected readonly carrera = inject(Carrera);

  protected readonly estado = signal<EstadoLista>('cargando');
  protected readonly mensajeError = signal('');
  private readonly lista = signal<Ruta[]>([]);

  /** Id de la ruta elegida, o null si aún no se ha tocado ninguna */
  protected readonly elegida = signal<string | null>(null);

  /** Rutas de la más reciente a la más antigua, con los datos ya formateados */
  protected readonly filas = computed<FilaRuta[]>(() =>
    [...this.lista()]
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .map((ruta) => ({
        id: ruta.id,
        nombre: ruta.nombre,
        distancia: formatearKm(distanciaKm(ruta.puntos)),
        sombra: formatearDuracion(duracionSegundos(ruta.puntos)),
      })),
  );

  ngOnInit(): void {
    this.cargar();
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
          this.elegida.set(pedida);
        }
      },
      error: (error: ErrorApi) => {
        this.mensajeError.set(error.mensaje);
        this.estado.set('error');
      },
    });
  }

  /** Marca una ruta */
  protected elegir(id: string): void {
    this.elegida.set(id);
  }

  /** Pasa a elegir la sombra de la ruta marcada (PS-71) */
  protected siguiente(): void {
    const ruta = this.elegida();
    if (ruta !== null) {
      void this.router.navigate(['/reloj/sombra'], { queryParams: { ruta } });
    }
  }
}
