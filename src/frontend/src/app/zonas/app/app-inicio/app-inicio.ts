import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Pantalla principal de la app móvil: lista de rutas del corredor. */
@Component({
  imports: [RouterLink],
  selector: 'app-app-inicio',
  styleUrl: './app-inicio.css',
  templateUrl: './app-inicio.html',
})
export class AppInicio {}
