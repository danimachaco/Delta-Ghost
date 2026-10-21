import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Auth } from '../../../core/servicios/auth';

/**
 * Marco de la app móvil: cabecera con la sesión, menú inferior y,
 * en medio, la pantalla hija que toque (lista de rutas…).
 */
@Component({
  imports: [RouterLink, RouterOutlet],
  selector: 'app-app-inicio',
  styleUrl: './app-inicio.css',
  templateUrl: './app-inicio.html',
})
export class AppInicio {
  protected readonly auth = inject(Auth);
}
