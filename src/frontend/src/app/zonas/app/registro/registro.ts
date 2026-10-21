import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ErrorApi } from '../../../core/modelos/error-api';
import { Auth } from '../../../core/servicios/auth';

/** Longitud mínima de la contraseña */
export const MIN_PASSWORD = 6;

/** Validador del formulario: las dos contraseñas tienen que ser iguales */
function passwordsIguales(grupo: AbstractControl): ValidationErrors | null {
  const { password, confirmar } = grupo.value as { password: string; confirmar: string };
  return confirmar && password !== confirmar ? { noCoinciden: true } : null;
}

/** Pantalla de registro de un usuario nuevo (/app/registro) */
@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-registro',
  styleUrls: ['../../../compartido/estilos/formulario.css'],
  templateUrl: './registro.html',
})
export class Registro {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  protected readonly minPassword = MIN_PASSWORD;

  protected readonly formulario = inject(NonNullableFormBuilder).group(
    {
      nombre: ['', [Validators.required, Validators.maxLength(40)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(MIN_PASSWORD)]],
      confirmar: ['', Validators.required],
    },
    { validators: passwordsIguales },
  );

  protected readonly enviando = signal(false);
  protected readonly errorServidor = signal<string | null>(null);

  protected enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.errorServidor.set(null);

    // "confirmar" solo sirve en el formulario: no se envía al servidor
    const { nombre, email, password } = this.formulario.getRawValue();
    this.auth.registrar({ nombre: nombre.trim(), email, password }).subscribe({
      next: () => this.router.navigateByUrl('/app'),
      error: (error: ErrorApi) => {
        this.errorServidor.set(error.mensaje);
        this.enviando.set(false);
      },
    });
  }

  protected mostrarError(campo: 'nombre' | 'email' | 'password' | 'confirmar'): boolean {
    const control = this.formulario.controls[campo];
    return control.invalid && control.touched;
  }

  /** true si las contraseñas no coinciden y ya se ha escrito la confirmación */
  protected noCoinciden(): boolean {
    return this.formulario.hasError('noCoinciden') && this.formulario.controls.confirmar.touched;
  }
}
