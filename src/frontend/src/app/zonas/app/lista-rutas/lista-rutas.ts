import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  distanciaKm,
  duracionSegundos,
  formatearDuracion,
  formatearFecha,
  formatearKm,
} from '../../../compartido/utilidades/rutas';
import { ErrorApi } from '../../../core/modelos/error-api';
import { Ruta } from '../../../core/modelos/ruta';
import { Rutas } from '../../../core/servicios/rutas';

/** Datos de una ruta ya preparados para pintarlos en la lista */
interface FilaRuta {
  id: string;
  nombre: string;
  fecha: string;
  distancia: string;
  /** Tiempo de la sombra (la duración de esa carrera) */
  sombra: string;
}

/** Estados posibles de la pantalla */
type Estado = 'cargando' | 'error' | 'listo';

/** Pantalla con la lista de rutas guardadas (/app) */
@Component({
  selector: 'app-lista-rutas',
  styleUrl: './lista-rutas.css',
  templateUrl: './lista-rutas.html',
})
export class ListaRutas implements OnInit {
  private readonly servicio = inject(Rutas);

  protected readonly estado = signal<Estado>('cargando');
  protected readonly mensajeError = signal('');
  private readonly rutas = signal<Ruta[]>([]);

  /** Rutas ordenadas de la más reciente a la más antigua y con los datos ya formateados */
  protected readonly filas = computed<FilaRuta[]>(() =>
    [...this.rutas()]
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .map((ruta) => ({
        id: ruta.id,
        nombre: ruta.nombre,
        fecha: formatearFecha(ruta.fecha),
        distancia: formatearKm(distanciaKm(ruta.puntos)),
        sombra: formatearDuracion(duracionSegundos(ruta.puntos)),
      })),
  );

  /** Tarjetas grises que se ven mientras carga */
  protected readonly esqueletos = [1, 2, 3];

  ngOnInit(): void {
    this.cargar();
  }

  /** Pide las rutas al backend (también se usa en el botón "Reintentar") */
  protected cargar(): void {
    this.estado.set('cargando');
    this.servicio.listar().subscribe({
      next: (rutas) => {
        this.rutas.set(rutas);
        this.estado.set('listo');
      },
      error: (error: ErrorApi) => {
        this.mensajeError.set(error.mensaje);
        this.estado.set('error');
      },
    });
  }
}
