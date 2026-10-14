import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Página principal de la web pública: presenta el producto. */
@Component({
  imports: [RouterLink],
  selector: 'app-web-inicio',
  styleUrl: './web-inicio.css',
  templateUrl: './web-inicio.html',
})
export class WebInicio {
  /** Características principales que se muestran en la portada */
  protected readonly caracteristicas = [
    {
      titulo: 'Corre contra tu sombra',
      texto: 'Tu mejor marca aparece como un segundo punto en la pantalla del reloj.',
    },
    {
      titulo: 'Sectores como en la F1',
      texto: 'Avisos en verde si vas mejor y en rojo si vas peor en cada tramo.',
    },
    {
      titulo: 'Tus rutas guardadas',
      texto: 'Consulta tus recorridos y tus mejores tiempos desde el móvil.',
    },
  ];
}
