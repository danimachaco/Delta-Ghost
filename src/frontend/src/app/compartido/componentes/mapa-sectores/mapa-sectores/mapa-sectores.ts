import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import * as L from 'leaflet';
import { Sector } from '../../../../core/modelos/sector';
import { formatearDiferencia, formatearTiempo } from '../../../utilidades/formato-tiempo';

/**
 * Mapa (Leaflet + OpenStreetMap) con la ruta coloreada por sectores:
 * verde si el sector es mejor que la sombra y rojo (trazo discontinuo) si es peor.
 * Al tocar un sector se abre un popup con su tiempo.
 */
@Component({
  selector: 'app-mapa-sectores',
  styleUrl: './mapa-sectores.css',
  templateUrl: './mapa-sectores.html',
})
export class MapaSectores {
  /** Sectores a dibujar */
  readonly sectores = input.required<Sector[]>();

  /** Se emite al tocar un sector (para sincronizar con la lista del resumen) */
  readonly sectorSeleccionado = output<Sector>();

  private readonly contenedor = viewChild.required<ElementRef<HTMLDivElement>>('mapa');
  // Es un signal: la app no usa zone.js y el effect debe reaccionar cuando el mapa exista
  private readonly mapa = signal<L.Map | null>(null);
  private capa: L.LayerGroup | null = null;

  constructor() {
    // El mapa necesita el DOM ya pintado
    afterNextRender(() => {
      const mapa = L.map(this.contenedor().nativeElement);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      }).addTo(mapa);
      this.mapa.set(mapa);
    });

    inject(DestroyRef).onDestroy(() => this.mapa()?.remove());

    effect(() => {
      const mapa = this.mapa();
      const sectores = this.sectores();
      if (mapa) this.dibujar(mapa, sectores);
    });
  }

  private dibujar(mapa: L.Map, sectores: Sector[]): void {
    this.capa?.remove();
    const capa = L.layerGroup().addTo(mapa);
    this.capa = capa;

    // Los colores salen de las variables CSS globales (única fuente de colores)
    const estilos = getComputedStyle(document.documentElement);
    const colores = {
      mejor: estilos.getPropertyValue('--color-mejor').trim() || '#2ecc71',
      peor: estilos.getPropertyValue('--color-peor').trim() || '#e74c3c',
    };

    const limites = L.latLngBounds([]);
    for (const sector of sectores) {
      const coords = sector.puntos.map((p) => L.latLng(p.latitud, p.longitud));
      const linea = L.polyline(coords, {
        color: colores[sector.resultado],
        weight: 6,
        // Los sectores peores van discontinuos: no dependen solo del color (historia 58)
        dashArray: sector.resultado === 'peor' ? '10 8' : undefined,
      }).addTo(capa);
      linea.bindPopup(this.crearPopup(sector));
      linea.on('click', () => this.sectorSeleccionado.emit(sector));
      for (const c of coords) limites.extend(c);
    }
    if (limites.isValid()) mapa.fitBounds(limites, { padding: [24, 24] });
  }

  /** Contenido del popup, construido con textContent (sin innerHTML). */
  private crearPopup(sector: Sector): HTMLElement {
    const div = document.createElement('div');
    const linea = (texto: string, negrita = false) => {
      const el = document.createElement(negrita ? 'strong' : 'div');
      el.textContent = texto;
      div.appendChild(el);
    };
    linea(`Sector ${sector.numero}`, true);
    linea(`Tiempo: ${formatearTiempo(sector.tiempoSegundos)}`);
    linea(`Diferencia: ${formatearDiferencia(sector.diferenciaSegundos)}`);
    linea(sector.resultado === 'mejor' ? 'Mejor que la sombra' : 'Peor que la sombra');
    return div;
  }
}
