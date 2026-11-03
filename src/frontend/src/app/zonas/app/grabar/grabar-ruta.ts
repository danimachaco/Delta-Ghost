import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  formatearDuracion,
  formatearFecha,
  formatearKm,
  formatearRitmo,
} from '../../../compartido/utilidades/rutas';
import { ErrorApi } from '../../../core/modelos/error-api';
import { Grabacion } from '../../../core/servicios/grabacion';
import { ErrorGps, Gps } from '../../../core/servicios/gps';
import { Rutas } from '../../../core/servicios/rutas';

/** Longitud máxima del nombre (la misma que valida el backend) */
export const MAX_NOMBRE = 60;

/** Mensajes cortos para cada error del GPS (la ayuda completa está en la pantalla GPS) */
const ERRORES_GPS: Record<ErrorGps, string> = {
  'permiso-denegado': 'Necesitamos permiso de ubicación para grabar. Actívalo en el navegador y recarga.',
  'no-disponible': 'No hay señal GPS. Comprueba que la ubicación está activada.',
  'tiempo-agotado': 'El GPS tarda en responder. Seguimos intentándolo…',
  'no-soportado': 'Este navegador no permite usar la ubicación.',
};

/**
 * Pantalla para grabar una ruta (PS-34, /app/grabar).
 * 1. Espera a tener señal GPS fiable → 2. graba mientras corres → 3. resumen y guardar con un nombre.
 */
@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-grabar-ruta',
  styleUrl: './grabar-ruta.css',
  templateUrl: './grabar-ruta.html',
})
export class GrabarRuta implements OnInit, OnDestroy {
  private readonly gps = inject(Gps);
  private readonly rutas = inject(Rutas);
  private readonly router = inject(Router);
  protected readonly grabacion = inject(Grabacion);

  protected readonly maxNombre = MAX_NOMBRE;
  protected readonly descartadas = this.gps.descartadas;

  // Datos de la grabación ya formateados para la pantalla
  protected readonly tiempo = computed(() => formatearDuracion(this.grabacion.segundos()));
  protected readonly distancia = computed(() =>
    formatearKm(this.grabacion.distanciaMetros() / 1000),
  );
  protected readonly ritmo = computed(() => formatearRitmo(this.grabacion.ritmo()));
  protected readonly numeroPuntos = computed(() => this.grabacion.puntos().length);
  /** El backend necesita al menos 2 puntos para guardar una ruta */
  protected readonly demasiadoCorta = computed(() => this.numeroPuntos() < 2);

  /** Estado del GPS antes de empezar */
  protected readonly errorGps = computed(() => {
    const error = this.gps.error();
    return error ? ERRORES_GPS[error] : null;
  });
  protected readonly senalLista = computed(() => this.gps.posicionValida() !== null);
  protected readonly precision = computed(() => {
    const p = this.gps.posicion()?.precision;
    return p === undefined ? null : `${Math.round(p)} m`;
  });

  protected readonly formulario = inject(NonNullableFormBuilder).group({
    // pattern(/\S/): no vale un nombre solo con espacios
    nombre: ['', [Validators.required, Validators.maxLength(MAX_NOMBRE), Validators.pattern(/\S/)]],
  });

  protected readonly enviando = signal(false);
  protected readonly errorServidor = signal<string | null>(null);

  ngOnInit(): void {
    this.grabacion.descartar();
    this.gps.iniciar();
  }

  ngOnDestroy(): void {
    // Salir de la pantalla cancela la grabación y apaga el GPS para no gastar batería
    this.grabacion.descartar();
    this.gps.detener();
  }

  protected empezar(): void {
    this.errorServidor.set(null);
    this.grabacion.empezar();
  }

  protected terminar(): void {
    this.grabacion.terminar();
    // Nombre propuesto: "Ruta del 3 nov 2026" (el corredor puede cambiarlo)
    this.formulario.setValue({ nombre: `Ruta del ${formatearFecha(new Date().toISOString())}` });
  }

  protected descartar(): void {
    this.grabacion.descartar();
    this.errorServidor.set(null);
    this.formulario.reset();
  }

  protected guardar(): void {
    if (this.formulario.invalid || this.demasiadoCorta()) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.errorServidor.set(null);

    const nombre = this.formulario.getRawValue().nombre.trim();
    this.rutas.crear({ nombre, puntos: this.grabacion.puntos() }).subscribe({
      next: () => {
        this.grabacion.descartar();
        this.router.navigateByUrl('/app');
      },
      error: (error: ErrorApi) => {
        this.errorServidor.set(error.mensaje);
        this.enviando.set(false);
      },
    });
  }

  protected nombreInvalido(): boolean {
    const control = this.formulario.controls.nombre;
    return control.invalid && control.touched;
  }
}
