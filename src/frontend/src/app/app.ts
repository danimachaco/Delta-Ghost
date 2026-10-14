import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Componente raíz. Solo contiene el router-outlet: cada zona
 * (/reloj, /app, /web) tiene su propio diseño y su propia navegación.
 */
@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {}
