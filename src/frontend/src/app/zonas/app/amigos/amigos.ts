import { Component, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { formatearFecha } from '../../../compartido/utilidades/rutas';
import { Amistad } from '../../../core/modelos/amigo';
import { ErrorApi } from '../../../core/modelos/error-api';
import { Amigos } from '../../../core/servicios/amigos';

/** Estados posibles de la carga de la pantalla */
type Estado = 'cargando' | 'error' | 'listo';

/**
 * Pantalla de amigos (/app/amigos, PS-57): añadir un amigo por email, aceptar las
 * solicitudes recibidas y ver la lista de amigos. Usa la API de amigos (PS-56).
 */
@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-amigos',
  styleUrl: './amigos.css',
  templateUrl: './amigos.html',
})
export class AmigosPantalla implements OnInit {
  private readonly servicio = inject(Amigos);

  protected readonly estado = signal<Estado>('cargando');
  protected readonly mensajeError = signal('');

  protected readonly amigos = signal<Amistad[]>([]);
  protected readonly recibidas = signal<Amistad[]>([]);
  protected readonly enviadas = signal<Amistad[]>([]);

  protected readonly formulario = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
  });

  /** true mientras se envía una solicitud */
  protected readonly enviando = signal(false);
  /** Ids de las solicitudes que se están aceptando (para desactivar su botón) */
  protected readonly aceptando = signal<ReadonlySet<string>>(new Set());

  /** Mensaje de confirmación tras enviar o aceptar ("Solicitud enviada a Luis") */
  protected readonly aviso = signal<string | null>(null);
  /** Error al enviar o aceptar (email sin cuenta, ya sois amigos…) */
  protected readonly errorAccion = signal<string | null>(null);

  protected readonly fecha = formatearFecha;

  /** Tarjetas grises que se ven mientras carga */
  protected readonly esqueletos = [1, 2, 3];

  ngOnInit(): void {
    this.cargar();
  }

  /** Pide amigos y solicitudes a la vez (también se usa en el botón "Reintentar") */
  protected cargar(): void {
    this.estado.set('cargando');
    forkJoin({
      amigos: this.servicio.listar(),
      solicitudes: this.servicio.solicitudes(),
    }).subscribe({
      next: ({ amigos, solicitudes }) => {
        this.amigos.set(amigos);
        this.recibidas.set(solicitudes.recibidas);
        this.enviadas.set(solicitudes.enviadas);
        this.estado.set('listo');
      },
      error: (error: ErrorApi) => {
        this.mensajeError.set(error.mensaje);
        this.estado.set('error');
      },
    });
  }

  protected enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.limpiarMensajes();

    this.servicio.enviar(this.formulario.getRawValue().email.trim()).subscribe({
      next: (amistad) => {
        if (amistad.estado === 'ACEPTADA') {
          // Esa persona ya te había enviado una solicitud: el backend la ha aceptado directamente
          this.hacerAmigo(amistad);
          this.aviso.set(`${amistad.usuario.nombre} ya te había invitado: ahora sois amigos.`);
        } else {
          this.enviadas.update((lista) => [amistad, ...lista]);
          this.aviso.set(`Solicitud enviada a ${amistad.usuario.nombre}.`);
        }
        this.formulario.reset();
        this.enviando.set(false);
      },
      error: (error: ErrorApi) => {
        this.errorAccion.set(error.mensaje);
        this.enviando.set(false);
      },
    });
  }

  protected aceptar(solicitud: Amistad): void {
    this.limpiarMensajes();
    this.aceptando.update((ids) => new Set(ids).add(solicitud.id));

    this.servicio.aceptar(solicitud.id).subscribe({
      next: (amistad) => {
        this.hacerAmigo(amistad);
        this.aviso.set(`Ahora eres amigo de ${amistad.usuario.nombre}.`);
        this.dejarDeAceptar(solicitud.id);
      },
      error: (error: ErrorApi) => {
        this.errorAccion.set(error.mensaje);
        this.dejarDeAceptar(solicitud.id);
      },
    });
  }

  /** true si el campo email tiene errores y el usuario ya lo ha tocado */
  protected mostrarErrorEmail(): boolean {
    const control = this.formulario.controls.email;
    return control.invalid && control.touched;
  }

  /** Pasa una amistad aceptada a la lista de amigos y la quita de las solicitudes */
  private hacerAmigo(amistad: Amistad): void {
    this.recibidas.update((lista) => lista.filter((s) => s.id !== amistad.id));
    this.amigos.update((lista) => [amistad, ...lista]);
  }

  private dejarDeAceptar(id: string): void {
    this.aceptando.update((ids) => {
      const copia = new Set(ids);
      copia.delete(id);
      return copia;
    });
  }

  private limpiarMensajes(): void {
    this.aviso.set(null);
    this.errorAccion.set(null);
  }
}
