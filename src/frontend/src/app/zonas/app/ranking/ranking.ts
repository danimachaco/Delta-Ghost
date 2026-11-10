import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { formatearDuracion, formatearFecha } from '../../../compartido/utilidades/rutas';
import { ErrorApi } from '../../../core/modelos/error-api';
import { RankingRuta } from '../../../core/modelos/ranking';
import { Auth } from '../../../core/servicios/auth';
import { Ranking } from '../../../core/servicios/ranking';

/** Fila del ranking ya preparada para pintarla */
interface FilaRanking {
  posicion: number;
  nombre: string;
  /** true si esta fila es la del usuario que ha iniciado sesión */
  esTuya: boolean;
  tiempo: string;
  /** Diferencia con el primero ("+0:12"), o "líder" en la primera fila */
  diferencia: string;
  fecha: string;
}

/** Estados posibles de la pantalla */
type Estado = 'cargando' | 'error' | 'listo';

/**
 * Pantalla del ranking de una ruta (PS-65, /app/ranking/:rutaId).
 *
 * Enseña la mejor carrera de cada corredor en la ruta, del más rápido al más lento, con la
 * diferencia respecto al primero, y destaca tu puesto. Los datos vienen de
 * GET /api/rutas/{id}/ranking (PS-64). Se llega desde el enlace "Ranking" de cada ruta en "Mis rutas".
 */
@Component({
  imports: [RouterLink],
  selector: 'app-ranking',
  styleUrl: './ranking.css',
  templateUrl: './ranking.html',
})
export class RankingPantalla implements OnInit {
  private readonly servicio = inject(Ranking);
  private readonly auth = inject(Auth);
  protected readonly rutaId = inject(ActivatedRoute).snapshot.paramMap.get('rutaId') ?? '';

  protected readonly estado = signal<Estado>('cargando');
  protected readonly mensajeError = signal('');
  private readonly ranking = signal<RankingRuta | null>(null);

  protected readonly nombreRuta = computed(() => this.ranking()?.rutaNombre ?? '');

  /** Filas ordenadas por puesto, con los textos ya formateados */
  protected readonly filas = computed<FilaRanking[]>(() => {
    const entradas = [...(this.ranking()?.entradas ?? [])].sort((a, b) => a.posicion - b.posicion);
    const lider = entradas[0]?.tiempoTotalSegundos ?? 0;
    const yo = this.auth.usuario()?.id;
    return entradas.map((entrada, i) => ({
      posicion: entrada.posicion,
      nombre: entrada.usuario.nombre,
      esTuya: yo !== undefined && entrada.usuario.id === yo,
      tiempo: formatearDuracion(entrada.tiempoTotalSegundos),
      diferencia: i === 0 ? 'líder' : `+${formatearDuracion(entrada.tiempoTotalSegundos - lider)}`,
      fecha: formatearFecha(entrada.fecha),
    }));
  });

  /** Frase con tu puesto: "Vas 2.º de 5 corredores", o que aún no has corrido la ruta */
  protected readonly resumen = computed(() => {
    const filas = this.filas();
    const mia = filas.find((fila) => fila.esTuya);
    if (!mia) {
      return 'Todavía no has corrido esta ruta.';
    }
    const total = filas.length === 1 ? '1 corredor' : `${filas.length} corredores`;
    return `Vas ${mia.posicion}.º de ${total}.`;
  });

  /** Tarjetas grises que se ven mientras carga */
  protected readonly esqueletos = [1, 2, 3];

  ngOnInit(): void {
    this.cargar();
  }

  /** Pide el ranking al backend (también se usa en el botón "Reintentar") */
  protected cargar(): void {
    this.estado.set('cargando');
    this.servicio.deRuta(this.rutaId).subscribe({
      next: (ranking) => {
        this.ranking.set(ranking);
        this.estado.set('listo');
      },
      error: (error: ErrorApi) => {
        // 404: la ruta no existe o el servidor todavía no tiene el ranking (PS-64)
        this.mensajeError.set(
          error.estado === 404 ? 'Esta ruta todavía no tiene ranking.' : error.mensaje,
        );
        this.estado.set('error');
      },
    });
  }
}
