import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../../../core/servicios/auth';

/** Pantalla principal de la app móvil: lista de rutas del corredor. */
@Component({
  imports: [RouterLink],
  selector: 'app-app-inicio',
  styleUrl: './app-inicio.css',
  templateUrl: './app-inicio.html',
})
export class AppInicio {
  protected readonly auth = inject(Auth);
}
